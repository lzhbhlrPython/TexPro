---
slug: start
title: 安装与第一个工程
group: 开始
order: 1
summary: TeXPro 是桌面应用，不依赖服务端。这一节只讲四件事：装好、打开、编译、看结果。
---

## 准备环境

- macOS 13 及以上：下载 `.dmg`，分 Apple 芯片与 Intel 两种
- Windows 10 及以上：下载 `.exe` 安装包
- Linux：下载 AppImage，赋予执行权限后直接运行
- 另外，本机需要已安装 TeX Live 或 MacTeX（`pdflatex` / `xelatex` / `lualatex` 任一即可）

## 打开工程

用「文件 → 打开文件夹」（⌘O / Ctrl+O）选一个目录。TeXPro 会扫描其中的 `.tex`、`.bib`、图片与子目录，据此推断主文件；推断不出来时，用左侧「主文件」下拉手动指定一次，选择会写进工程配置。

> 工程目录下的 `.texpro/` 保存工程配置与内容快照。它是否进版本库由你决定，但对共享工程来说，通常和 `.gitignore` 一起处理更省事。

## 第一次编译

按 ⌘↩（Windows / Linux 为 Ctrl+Enter）编译。底部状态栏会依次出现「排版中」与「PDF 就绪 · 耗时」；出错时右侧显示问题数量，点开就是诊断面板。

```
main.tex  →  latexmk（-synctex=1）  →  main.pdf
```

## 界面地图

| 位置 | 作用 |
| --- | --- |
| 左侧栏 | 文件树、素材库、符号与全文搜索 |
| 中间 | 编辑器。源码与可视层是同一份内容的两面 |
| 右侧 | PDF 预览，可整块收起（⌘⌥P） |
| 底部 | 状态栏、编译耗时与诊断面板 |
