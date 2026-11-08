---
slug: export
title: 导出与 arXiv
group: 参考
order: 7
summary: PDF 来自编译；导出文档把当前文件转成 Markdown / Typst / HTML；arXiv 包收集源码与素材，生成可上传的 zip。
---

## 三条出口，各有各的用途

TeXPro 不重新排版内容，也不把文件传到任何服务器。写完之后，能拿走的产物有三种：

| 产物 | 从哪里来 | 位置 |
| --- | --- | --- |
| PDF | 编译（⌘↩） | `<工程>/.texpro/build/<主文件名>.pdf` |
| Markdown / Typst / HTML | 文件 → 导出文档… | 浏览器下载目录，或剪贴板 |
| arXiv 源码包 | 文件 → 创建 arXiv 包… | `<工程>/.texpro/exports/arxiv-<时间戳>.zip` |

三者不能互相替代：PDF 给读者，导出文档给不写 LaTeX 的合作者，arXiv 包给投稿系统。

## PDF：编译的产物

菜单里没有「导出 PDF」这一项，这是有意的。PDF 由 latexmk 在编译时写进构建目录；要最新版本，先按 ⌘↩，再去 PDF 面板。

- 默认输出目录是 `.texpro/build`，可以在 `.texpro/project.json` 的 `directories.build` 里改成别的路径
- 文件名取自工程主文件，不是当前打开的那个章节文件
- PDF 面板右上角的视图菜单提供「用默认阅读器打开」与「在 Finder 中显示」
- 编译失败不会生成新的 PDF；面板里可能还留着上一次的旧文件，不要把它当成最新结果

> 日志、aux、synctex 都在同一个构建目录里。要清理时删这个目录即可，不会影响源码。

## 导出文档：一次一个文件

入口是 `文件 → 导出文档…`。它读的是当前编辑器缓冲区的内容，未保存的修改也会被包含；导出的范围只有这一个文件，不会沿着 `\input` 展开整个工程。

面板左侧选格式，右侧是实时预览，可以复制到剪贴板，也可以下载。下载名沿用原文件的主干名，`.tex` / `.ltx` 换成目标扩展名。

| LaTeX 写法 | Markdown | Typst | HTML |
| --- | --- | --- | --- |
| `\section` / `\subsection`（同级） | `##` | `==` | `<h2>` |
| `\chapter` / `\part` | `#` | `=` | `<h1>` |
| `itemize` / `enumerate` | `-` / `1.` | `-` / `+` | `<ul>` / `<ol>` |
| `equation`、`align` 等 | `$$ … $$` | `$ … $` | 只有 `equation` 渲染为 KaTeX 块 |
| `verbatim` / `lstlisting` | 围栏代码块 | 围栏代码块 | 原样文本，不生成代码块 |
| `figure` + `\includegraphics` | 图片引用 | `#image(...)` | HTML 的 `img` 元素 |
| `tabular` | 管道表格 | 不转换 | 不转换 |
| `\textbf`、`\emph`、`\texttt` | 加粗、斜体、等宽 | `*…*`、`_…_`、反引号 | `<strong>`、`<em>`、`<code>` |
| `\cite`、`\ref`、`\eqref` | `[@key]`、`[key](#key)`、`(key)` | `@key` | `\cite` 转成引用标记，`\ref` / `\eqref` 不转换 |

Markdown 结果会在顶部补一段 YAML front matter（`title`、`author`、`date`）和一级标题；Typst 结果用 `= 标题` 与 `#set document(...)`；HTML 是一份独立文档，公式在导出时就由 KaTeX 渲染成静态标记。

### 转换的边界

- 只取 `\begin{document}` 与 `\end{document}` 之间的正文，导言区不参与
- 章节层级会被压平：`\section` 与 `\subsection` 输出为同一级标题，需要更细层级时手动调整
- Markdown 与 Typst 输出里，以反斜杠开头、又没有对应转换规则的整行会被丢掉；`\newcommand`、自定义宏、条件编译都不展开
- `tikz`、`minted`、`algorithm` 等环境不在映射表里，导出前先看一眼预览
- HTML 的公式样式表指向 jsDelivr 上的 KaTeX CSS；离线打开时结构还在，但排版样式可能缺失
- 表格靠 `&` 与 `\\` 切分，`\multicolumn`、`\multirow` 会退化成普通文本

> 预览就是最终结果：面板里显示的文本，就是复制或下载得到的内容。

## arXiv 包：源码与素材

入口是 `文件 → 创建 arXiv 包…`。点「创建包」之前，应用会先保存所有未落盘的修改，然后在 `<工程>/.texpro/exports/` 生成一个 zip。

打包规则是「整个工程减掉不该上传的东西」，不是「只挑参与编译的文件」：

| 处理 | 内容 |
| --- | --- |
| 跳过目录 | `.texpro`、`.git`、`.hg`、`.svn`、`node_modules`、`build`、`out`、`dist` |
| 跳过文件 | 以 `.` 开头的条目，以及 `aux`、`log`、`toc`、`synctex`、`bcf`、`run.xml`、`blg`、`nav`、`snm`、`vrb` 等中间产物 |
| 原样保留 | `.tex`、`.bib`、图片、字体、`sty` / `cls`、子目录结构 |

包内的相对路径与工程一致，不会为了「平铺」而改写 `\input` 路径。根目录会多一个 `README.txt`，写明主文件的相对路径、建议的 latexmk 命令、检测到的引擎与创建时间。

引擎的检测顺序是：源码里的 `% !TEX program` 魔数注释 → `ctex` / `fontspec` 等宏包推断 xelatex → `luatexja` / `ltjs` 推断 lualatex → 默认 pdflatex。它只读主文件，不扫描整个工程。

### 上传之前

- 面板会显示文件数、引擎与 zip 体积，但不会替你判断 arXiv 的大小与文件数配额
- 主文件在子目录里时，包内保留同样的结构；提交时按实际路径填写，不要指望它被移到根目录
- 未被引用的图片、旧稿、实验数据也会被一起打包；先清理工程，比事后删 zip 更省事
- 打包完成后用「Reveal」或「打开 zip」检查一遍，再上传

> 实现说明：打包调用系统的 `/usr/bin/zip`，SVG 转 PNG 调用 `sips`。两者都是 macOS 自带的命令；在 Windows 上没有对应实现，这些按钮会报错。

## SVG 与 arXiv

LaTeX 不能直接读 SVG。插入 `.svg` 素材时，TeXPro 会先用 `sips` 把它转成 1800 px 宽的 PNG，缓存在 `.texpro/svg-cache/`，再写入 `\includegraphics`。

已有工程里的 SVG 引用可以一次性处理：`项目 → 转换 SVG 素材…` 会扫描工程内（最多 6 层）的文本文件，把指向已存在 `.svg` 的 `\includegraphics` / `\includesvg` 改成对应的 PNG，并保留可选参数。`.bib` 不扫描。

- 转换会真实修改 `.tex` 文件，建议先提交一次 Git，或做一次工程快照
- 只处理能解析到文件的 `.svg`；远程图片与宏展开后的路径不动
- PNG 落在 `.texpro/svg-cache/`，而打包会跳过 `.texpro`；带 SVG 插图的工程在上传 arXiv 前，要把 PNG 复制进工程内的素材目录并改好路径
- 转换扫描有深度上限，深层目录里的引用可能被漏掉；以预览和编译结果为准

> 想让 `.svg` 直接进 PDF，需要额外的 TeX 宏包与转换链路，TeXPro 不替你安装或配置这些组件。
