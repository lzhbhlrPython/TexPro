---
slug: ctex-typography
title: CTeX 中文写作排版
group: 使用
order: 6.5
summary: 中文纸面阅读与正式 PDF 分别处理，保留作者字体、文档类和工程主文件。
---

## 编辑器与 PDF 的分工

可视模式会识别主文件的 CTeX 配置，在普通中文段落的起始处显示两字缩进、适合阅读的行距和中文换行规则。公式、代码、表格、标题仍按各自结构呈现。屏幕预览帮助连续写作；正式断行、分页和字形以本地 TeX 编译得到的 PDF 为准。

界面主题只改变屏幕配色，不改变 PDF。占位符在纸面、工作室和夜间主题中使用相应的正文颜色，不把界面深色写入文档。

## 应用中文写作排版

在命令面板搜索「应用 CTeX 中文写作排版」，或在编辑器按 `⌘⌥⇧C`（其他平台为 `Ctrl+Alt+Shift+C`）。操作作用于实际主文件，保留当前正在写的子文件位置，可撤销。

配置包括两字首行缩进、全角标点处理、中文间空格处理、段间距和 1.3 倍基准行距。已有 CTeX 类／宏包会继续使用，不重复加载；普通文档会补入 CTeX。仅替换 TeXPro 自己标记的排版块，保留作者原有字体和标题设置。

```tex
% TeXPro Chinese typography begin
\ctexset{autoindent=2, punct=quanjiao, space=auto}
\setlength{\parskip}{0pt plus 1pt}
\linespread{1.3}
% TeXPro Chinese typography end
```

这是按需操作，不会在打开旧工程时自动重写排版。学校、期刊或出版社模板已有规范时，以模板为准，不必应用这份通用配置。

## 字体与引擎

新建中文文章与中文导入使用 `ctexart` 和 `fontset=fandol`，默认 XeLaTeX，减少依赖系统宋体名称造成的跨平台失败。已存在的 `fontset`、`fontspec` 和中文字体命令不会被这项操作替换。缺少自定义字体时，仍需安装对应字体或自行选择替代字体。

模板设计器和页面布局保留用户设置的行距，不额外叠加通用行距。中文类即使没有再次选择中文语言，也保持 Unicode 编译引擎。切换布局时不会再把 `ctexart` 当成普通 `article` 重复加载 `ctex`。

## MCP

`texpro_ctex_typography` 读取实际主文件并返回排版后的源文件预览，`saved: false` 表示尚未落盘。先审阅，再用明确的文件写入操作应用。外部客户端应保留工程现有 LuaLaTeX 设置，不把返回的 XeLaTeX 建议当作必须重写的引擎配置。
