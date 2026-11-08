---
slug: compile
title: 编译与诊断
group: 使用
order: 3
summary: 编译是一层薄壳：定位主文件、挑引擎、跑 latexmk、把日志读成可跳转的诊断。理解这四步，「为什么没出 PDF」大多能自己回答。
---

TeXPro 不实现 TeX，它调用本机的 latexmk。一次编译真正做的事只有四件：把改动写盘、决定编译谁、决定用哪个引擎、把日志翻译成界面上的信号。知道这四步，报错就不再是黑箱。

## 一次编译的四个阶段

- 保存：编译前把所有脏缓冲区写盘，并重读一次主文件，确保 latexmk 看到的是磁盘上的最新版本。
- 定位：按 `.texpro/project.json` 的 `rootFile`，或工程内唯一的 `\documentclass` 文件，决定主文件。
- 选引擎：读主文件里的魔法注释与宏包特征，再参考设置里的默认引擎。
- 运行与解析：调 latexmk，读 `.log`，把错误、警告、排版溢出拆成诊断，最后确认 PDF 真的生成。

## 引擎怎么定

优先级从高到低：

- 主文件里的魔法注释，如 `% !TeX program = xelatex`。
- 文档特征：`ltjs`、`luatexja` 走 lualatex；`ctex`、`xeCJK`、`fontspec`、`polyglossia`、`\setCJKmainfont` 走 xelatex。
- 设置里的 Default engine。
- 兜底 pdflatex。

| 引擎 | latexmk 参数 | 适用 |
| --- | --- | --- |
| pdfLaTeX | `-pdf` | 纯西文、传统 Type1 字体 |
| XeLaTeX | `-xelatex` | ctex、fontspec、系统字体 |
| LuaLaTeX | `-lualatex` | luatexja、需要 Lua 的宏包 |

同样的判断也用于 TikZ、图表等预览，所以主文件里写对魔法注释，预览与正式编译不会用两个引擎。

## 构建目录与产物

默认构建目录是 `.texpro/build`，可以在 `Project → Project Structure…` 里改 `directories.build`，但必须留在工程内，否则报 "Build directory must stay inside the project"。PDF 与 log 都以主文件 basename 命名。

```bash
latexmk -pdf -synctex=1 -interaction=nonstopmode -file-line-error \
  -outdir=.texpro/build main.tex
```

工程在 Git 管理下时，记得把构建目录写进 `.gitignore`；它每轮都会被重写。

## 编译策略

| 策略 | 行为 |
| --- | --- |
| After idle（默认） | 停止输入 2.2 秒后编译，正在编译时不重入 |
| Only when PDF is open | 只有 PDF 面板开着才自动编译 |
| Manual only | 只认 `⌘↩` 与菜单里的 Compile |

自动保存是独立开关，关掉自动编译不影响保存。`⌘↩` 随时可以手动编译，代价是先保存全部改动。

编译中按钮变成 Cancel，菜单里也有 Cancel Compile。取消先对整个进程组发 SIGTERM，2.5 秒后补 SIGKILL。单次编译默认超时 180 秒，超时报 "Compilation timed out after 180s"。

## 诊断怎么读

| 来源 | 处理 |
| --- | --- |
| `main.tex:42: Undefined control sequence` | 直接给出文件与行号 |
| `! LaTeX Error: ...` 加 `l.42` | 从错误块里补出行号 |
| `LaTeX Warning:`、`Package ... Warning:` | 记为警告 |
| Overfull / Underfull `\hbox` | 排版溢出，归为提示（info） |
| `File 'x' not found` | 当作错误 |

诊断上限 250 条，按行号排序。点一条跳到对应行，编辑器 gutter 同时标出；状态栏右侧的 `n problems` 是错误加警告的计数，点开是问题面板。

命令面板（`⌘K`）里的 Compile theater 把一次编译拆成 Engine and root file、LaTeX compilation、Diagnostics、PDF handoff 四段，附流式日志。需要看 latexmk 原始输出时用它，比状态栏耐心得多。

## 工具链检查

`Project → Project Doctor…` 检查 latexmk、pdflatex、xelatex、lualatex、biber、bibtex、synctex、kpsewhich、dvisvgm。硬性要求只有 latexmk 与 pdflatex；其余缺了只影响对应功能：xelatex 模板、biber 参考文献、SyncTeX 跳转、SVG 转换。

Doctor 还会列孤立 `.tex`、缺包、断链、缺图、未定义引用、缺 bib key 与重复 label，并可以清理构建目录。

## 常见坑

- 找不到主文件：报 "No LaTeX root file found. Add a file containing \documentclass or a % !TeX root comment."。让工程里只有一个含 `\documentclass` 的 `.tex`，或在 Project Structure 里指定主文件。
- 配了主文件但内容被改坏：不会自动回退，报 "Project main file configuration is invalid: ..."。修好文件或重新选主文件。
- 多个候选：报 "Multiple main files found. Choose the project main file."，必须显式选一个。
- exit 0 却没有 PDF：报 "latexmk finished but no PDF was produced."，通常是 `\end{document}` 之前就中断，或构建目录被外部清理。
- 字体缺失：ctex 配 xelatex 在没装中文字体的机器上会失败；Doctor 的字体覆盖能提前看出来。
- minted 一类需要 shell-escape 的宏包：主编译不传 `-shell-escape`，这类内容要在外部编译或改造。
- 编译中切换或关闭工程：会先取消当前编译，旧结果直接丢弃。

## 相关页面

- PDF 与源码双向定位：`/docs/synctex`
- 工程与文件：`/docs/project`
- 导入、模板与素材：`/docs/import`
- 快捷键：`/docs/shortcuts`
- 编译实现细节：`/docs/dev-arch`
