---
slug: import
title: 导入、模板与素材
group: 使用
order: 2
summary: 把 Markdown 与 Typst 稿子译成 LaTeX、用模板起一个新工程、把图片收进素材目录，这三件事各有入口和边界。
---

导入、模板与素材解决三个不同的问题：换格式、起新工程、给已有工程添图。三者都不修改原始文件；生成的 `.tex` 直接落在工程里，之后就是普通源码，可以继续手改。

## 把 Markdown 翻成 LaTeX

打开工程后，用 `文件 → 导入 Markdown / Typst…` 打开导入面板；也可以按 `⌘K` 搜 Import 进入。面板左侧是原文，右侧 `Generated LaTeX` 随输入实时更新。

- 选 Markdown，把稿子粘进左侧，或用 Choose file 选 `.md`、`.markdown`、`.mdown`、`.txt`。
- 填 Title、Author、Date、Document class 与 File name。Date 默认 `\today`，留空则生成空日期。
- 按 **Insert body** 只把正文插到当前光标处；按 **Create .tex file** 则在工程根生成完整文档，含导言区。

转换规则是固定的，不是启发式猜测：

| 原文 | 生成 |
| --- | --- |
| `#` 到 `######` | `\section` 到 `\paragraph`，最多四级 |
| `-`、`*`、`+` 与 `1.` | itemize、enumerate |
| `>` 起头 | quote |
| 行内粗体、斜体、行内代码 | `\textbf`、`\emph`、`\texttt` |
| `$...$` 与 `$$...$$` | 原样保留为数学 |
| 围栏代码块 | verbatim |
| 表格 | table 加 tabular，全部左对齐 |
| `![alt](path)` | figure 加 `\includegraphics`，宽 0.8 `\linewidth` |
| 分隔线 `---` | 一条横线 |
| 原始 HTML | 转义为文本，并记一条警告 |

文件开头若带 front matter，其中的 title、author、date 会填进表单；正文不会重复输出这些字段。

## 中文与导言区

正文里只要出现中文，生成的文档一律用 `ctexart`，无论下拉里选的是 article 还是 ctexart。编码 UTF8、字体 fandol，引擎标记为 xelatex。纯西文才用 article 与 pdflatex。

```latex
\documentclass[UTF8,fontset=fandol,11pt]{ctexart}
\usepackage{amsmath,amssymb,graphicx}
\usepackage[margin=2.5cm]{geometry}
\usepackage{booktabs,xcolor}
\usepackage[colorlinks=true,linkcolor=blue,urlcolor=blue]{hyperref}
\begin{document}
\maketitle
\section{引言}
...
\end{document}
```

两种导言区都带 amsmath、amssymb、graphicx、geometry（2.5 cm 边距）、booktabs、xcolor 与 hyperref。没有 Title 时不写 `\maketitle`，日期留空时写成 `\date{}`。

## 从 Typst 导入

同一面板切到 Typst，能识别 `#set document(...)` 里的 title 与 author、`= 标题` 的层级、列表、`*粗体*` 与 `_斜体_`、`$公式$`、`#link`、`#image` 与 `#figure`。Typst 是函数式排版，没有逐个对应物；认不出的写法不会静默丢掉，而会进警告列表。

## 模板

`文件 → Template Library…` 列出 11 个内置模板，分四类：

| 分类 | 模板 | 引擎 |
| --- | --- | --- |
| Basics | Article、Letter | pdflatex |
| Academic | Report、中文 article（ctex）、双栏 article、Thesis | pdflatex 或 xelatex |
| Teaching | Beamer slides、Problem set | pdflatex |
| Languages | 日文 article | lualatex |
| Languages | 阿拉伯文、俄文 article | xelatex |

选模板后填工程名并选父目录，TeXPro 建 `<父目录>/<工程名>`。名字里的非法字符换成 `-`，重名自动加 `-2`、`-3`；模板里的 `{{title}}`、`{{author}}`、`{{projectName}}` 由表单替换，生成的 `main.tex` 以模板对应的引擎打开。

`文件 → Template Workshop…` 从空白基础类（article、report、ctexart、beamer）拼页面、字体、结构与宏包，满意的版式可以保存成个人模板。选中模板后，预览区会用该模板的引擎编译一页，作为首页缩略图。个人模板存在应用数据目录的 JSON 里，单份内容上限 2,000,000 字符。

## 素材

`Project → Asset Library` 扫描当前工程，深度 6 层、最多 500 个文件，按修改时间倒序。只认 `.png`、`.jpg`、`.jpeg`、`.gif`、`.webp`、`.svg`、`.pdf`、`.eps`。

插入一张图：

- 从 Finder 拖图片进编辑器，或在素材库里点一张。
- 图片先存进工程配置的素材目录（默认 `assets`），重名加 `-2`、`-3`。
- 编辑器插入 `figure[htbp]`、`\centering`、`\includegraphics[width=0.8\linewidth]`、`\caption{}`、`\label{fig:...}`，光标停在 caption 里。
- 主文件导言区缺 `graphicx` 时会自动补上。

路径写成相对当前 `.tex` 的路径；label 由文件名生成，重名追加 `-2`。SVG 在插入前先栅格化到 `.texpro/svg-cache/`，源文件不动。落点有规则：图片不会插进另一个浮动体内部，光标在 figure 里时会挪到该环境之后；在主文件里则不会落进导言区。

## 常见坑

- 导入不复制图片：Markdown 里的相对路径原样写进 `\includegraphics`，图没跟着进工程就会缺图。
- 远程图片（`http(s)://`）不会下载，改写成 `\href` 并在警告里点名。
- 代码块里出现 `\end{verbatim}` 时，该块降级成 quote，避免环境提前结束。
- 表格按最宽一行定列数，所有列都是左对齐；合并单元格与长表请改用 Table Studio 或手写。
- 下拉里选 article 也可能得到 ctexart：只要正文含中文。
- 没打开工程时不能 Create .tex file，但 Insert body 仍可用。
- 警告面板最多显示 4 条，剩余条数只在计数里体现。

## 相关页面

- 编译与诊断：`/docs/compile`
- 工程与文件：`/docs/project`
- 写作模式与主题：`/docs/writing`
- 导出与 arXiv：`/docs/export`
