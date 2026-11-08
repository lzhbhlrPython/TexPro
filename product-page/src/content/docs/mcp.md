---
slug: mcp
title: MCP：把工程交给 AI
group: AI 协作
order: 15
summary: TeXPro 自带一个 MCP server，让外部的 AI 客户端能读工程、查符号、跑编译、定位 PDF。这一页讲怎么接、接上之后能做什么、以及它被限制在哪里。
---

## 两个方向，别搞混

**TeXPro → 别的 MCP server**：应用内的 MCP 面板可以挂载外部 server（文件系统、数据库、搜索……），把它们的能力带进 TeXPro。配置写在用户数据目录的 `mcp-servers.json`。

**别的 AI 客户端 → TeXPro**：`mcp/server.mjs` 是一个独立的 stdio server，暴露编译、检索、定位这些工程能力。Claude Desktop、Cursor、Codex、任何支持 MCP 的客户端都能接。

这一页主要讲第二个方向。

## 它是什么

`mcp/server.mjs` 是普通 Node 脚本，不依赖 Electron 窗口，也不需要应用在运行。协议是 MCP 的 stdio 传输：一行一条 JSON-RPC，日志写到 stderr，不污染协议流。

启动参数：

```bash
node /path/to/mcp/server.mjs --project /path/to/your-paper
```

也可以用环境变量 `TEXPRO_PROJECT_ROOT` 指定初始工程。不指定时 server 照样能起来，只是第一次调用需要先 `texpro_open_project`。

## 接进客户端

以 Claude Desktop 为例，配置文件里加一条：

```json
{
  "mcpServers": {
    "texpro": {
      "command": "node",
      "args": [
        "/Applications/TeXPro.app/Contents/Resources/app.asar.unpacked/mcp/server.mjs",
        "--project",
        "/Users/you/papers/paper-1"
      ]
    }
  }
}
```

路径分两种：

| 场景 | server.mjs 路径 |
| --- | --- |
| 开发仓库 | `<仓库>/mcp/server.mjs` |
| 安装后的应用 | `<应用>/Contents/Resources/app.asar.unpacked/mcp/server.mjs`（Linux / Windows 在 `resources/app.asar.unpacked/mcp/`） |

`--project` 指向你的工程目录，不是单个 `.tex` 文件。改完配置重启客户端，工具列表里应当出现 `texpro_*` 一族。

## 能做什么

### 读工程

| 工具 | 作用 |
| --- | --- |
| `texpro_open_project` | 打开 / 切换工程根目录 |
| `texpro_project_info` | 主文件、编译根、引擎、模块与目录结构 |
| `texpro_list_files` | 列目录（可递归，深度上限 8） |
| `texpro_read_file` | 读文本文件 |
| `texpro_search` | 全工程文本检索（大小写可选，结果上限 200） |
| `texpro_project_symbols` | 章节、标签、引用、命令等符号索引 |
| `texpro_bib_lookup` | 按 key 或模糊词查 bib 条目 |

### 写工程

`texpro_write_file` 会真正落盘，单次内容上限 2 MB，只允许文本文件。写之前建议先 `texpro_read_file`，让模型看到当前内容再改，避免整段覆盖。

### 编译与诊断

`texpro_compile` 接受文件、引擎（`pdflatex` / `xelatex` / `lualatex`）与构建目录，返回耗时、页码、警告与错误的完整输出。`texpro_diagnose` 跑静态检查（缺图、缺包、未定义引用等）。`texpro_cancel_compile` 用来中断慢编译。

### 定位与绘图

`texpro_synctex_forward(file, line, column)` 从源码行拿到页号与坐标；`texpro_synctex_inverse(page, x, y)` 从 PDF 坐标反查文件与行。`texpro_render_tikz` 把 TikZ 片段渲染成图片，`texpro_template_preview` 渲染模板预览。

## 资源和提示词

除了工具，server 还提供两类 MCP 能力：

- **resources**：以 `texpro://project/<相对路径>` 的形式暴露工程里的文本文件（`.tex` `.ltx` `.bib` `.md` `.txt` `.sty` `.cls`），客户端可以把它们挂成上下文
- **prompts**：`fix-latex-error`（拿日志修错）、`summarize-project`（按结构写摘要）、`write-section`（按大纲写一节）

## 典型用法

### 让 AI 修一个编译错误

```text
1. texpro_compile            → 拿到错误日志
2. 读 prompts/fix-latex-error → 按提示定位
3. texpro_read_file          → 看上下文
4. texpro_write_file         → 改最小的那一段
5. texpro_compile            → 复验
```

关键在于第 5 步：改完必须重编译，否则模型只是在猜。

### 让 AI 按大纲补一节

先 `texpro_project_symbols` 拿到现有结构与编号，再 `texpro_read_file` 读相邻章节的写法（人称、时态、公式排版习惯），然后写。写完 `texpro_diagnose` 检查引用是否闭合。

### 让 AI 找到「图 3 是哪段源码画的」

`texpro_synctex_inverse(3, x, y)` 直接给出文件与行号，比让模型全文搜索可靠得多。

## 安全边界

- **路径闸门**：所有带路径的参数都先 `path.resolve` 再做前缀比对，必须落在当前工程根之内。越界报 `Path is outside the project: …`
- **符号链接**：额外用 `realpath` 比对真实根，防止用软链接跳出工程，报 `Path escapes the project through a symlink: …`
- **忽略目录**：`.git`、`.texpro`、`node_modules`、`dist`、`build`、`out` 不参与检索与列举
- **无网络**：server 只读写本地文件、调本地 TeX，不发任何网络请求
- **无窗口**：它不需要应用在运行，也不受界面状态影响

## 排查

| 现象 | 原因 |
| --- | --- |
| 工具列表是空的 | 客户端没连上：确认 `node` 在 PATH 里，或写绝对路径 |
| `No project is open` | 没传 `--project`，且还没调 `texpro_open_project` |
| 编译报找不到 latexmk | 运行 server 的环境没有 TeX 发行版；MCP server 不随应用打包 TeX |
| 写入被拒 | 路径不在工程内，或文件不是文本，或超过 2 MB |
| 中文乱码 | 文件不是 UTF-8；server 按 UTF-8 读写 |

> 调试时可以直接 `node mcp/server.mjs --project .` 然后在终端里手敲一行 JSON-RPC，比在客户端里猜快。

## 和内置 AI 助手的区别

TeXPro 里也有一个可选的 AI 助手（设置里填密钥才启用），它和 MCP 是两条不同的路：

| | 内置 AI 助手 | MCP server |
| --- | --- | --- |
| 谁来调用 | 应用自己，写作用时面板里 | 外部客户端（Claude Desktop、Cursor、Codex…） |
| 上下文 | 你选中的文本与当前工程摘要 | 由客户端决定，可以读整个工程 |
| 密钥 | 存在系统钥匙串，只有你配置的模型 | 与 TeXPro 无关，用客户端自己的模型 |
| 能改文件 | 需要你确认才插入正文 | 可以用 `texpro_write_file` 直接落盘 |

两者可以同时开；不喜欢外部客户端就不配 MCP，其它功能不受影响。

## 手敲一条请求

排查「客户端连不上」时，最快的方式是自己在终端里跑：

```bash
node mcp/server.mjs --project /path/to/paper
```

然后按协议一行一行输入 JSON。先握手，再列工具，再调用：

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"texpro_project_info","arguments":{}}}
```

日志走 stderr，不会混进响应。响应里的 `content` 是文本块，`isError` 标出调用失败——CLI 里看这两个字段就够了。

## 并发与性能

- **无状态会话**：每次调用都重新解析路径，不缓存文件内容；连续读同一个文件会重复读盘
- **编译是重操作**：一次 `texpro_compile` 会起 `latexmk`，全量构建可能十几秒；批量改稿时建议改完再编译一次，而不是每改一行编译一次
- **取消**：`texpro_cancel_compile` 只取消当前工程正在跑的那一次
- **大工程**：`texpro_search` 与 `texpro_list_files` 会遍历目录，深度上限 8；检索结果上限 200 条，超过的部分要缩小查询范围

## 版本与兼容

server 与客户端按 MCP 协议版本协商；客户端过旧时会握手失败，表现为「工具列表为空」或连接立即断开。升级客户端通常就能解决。

`texpro_*` 工具的参数名是稳定接口，改参数名等于破坏兼容；新增工具或新增可选参数则是安全的。
