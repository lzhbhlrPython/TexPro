---
slug: realtime-tex
title: 实时 TeX 预览
group: 使用
order: 3.5
summary: 使用内置 rtex-ts 和本机 LuaLaTeX 预览未保存段落，了解完整版面回退、正式 PDF 和当前边界。
---

## 打开原来的 PDF 预览

实时 TeX 排版是 L0 无感增强：只有原来的 PDF 预览，不需要选择模式或开启实验开关。启用现有自动编译、编译模式不是手动时，兼容的 LuaLaTeX 工程自动使用内置 [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts)。关闭自动编译则不会启动实时会话。无需 VS Code、插件或 Rust 程序，本机仍需安装 LuaLaTeX、文档宏包和字体。

- 确认真实工程主文件；多候选时先指定入口。
- 保留作者选择的引擎。CTeX/fontspec 默认通常使用 XeLaTeX；确认模板兼容后，可在实际主文件声明 `% !TeX program = lualatex`。
- 打开 PDF 预览，继续写作。版面准备、缩放、翻页和滚动沿用原来的预览操作。

应用不会自动更改已有字体、模板或引擎声明。不支持加速的工程沿用原有编译流程。与普通编译一样，LuaLaTeX 以你的权限执行文档代码；实时预览不是沙箱，不增加云端文档传输。

## 写作与排版如何配合

普通段落和行内数学通过上下文验证后可先更新字形；后台排版随后校正分页和引用。标题、表格、TikZ、未知宏及不可靠结果等待完整排版。字体或绘制无法准确显示时，整页使用匹配 PDF，不再显示额外的回退角标或运行状态列表。

实时更新接收未保存缓冲区，不为预览强制保存。自动保存仍由自己的设置控制。输入法组合期间延后发送内容，不接管正文焦点和撤销历史；编辑子文件不会更换工程主文件。段落变高、分页和引用在完整排版前可能暂定，最终输出仍以正式 PDF 为准。

## 同一个工具栏，按任务准备 PDF

缩放、适宽、翻页、双页和演示共用原来的工具栏与滚动状态。搜索、缩略图、复制、对比、打开 PDF、显示文件位置及区域定位需要完整 PDF 时，先保存相关内容并按需正式编译，然后继续该操作；无需手动切换预览。编译失败或源文在等待中变化时，不使用过期结果。

手动编译同样显示正式 PDF；下一次正文修改自动恢复实时更新。专业 PDF 操作可能触发保存，实时字形更新本身不会保存。实时会话运行时暂停重复的普通自动编译，关闭或失败后恢复原有策略。文献、索引、导出和投稿仍使用完整构建链。

正文到 PDF 的显式定位先准备有效的正式结果。实时页面上按住 ⌘ / Ctrl 点击，会先准备正式 PDF 并进入区域定位，再选择需要定位的区域，避免将暂定画面的坐标套到正式排版。自动跟随光标只使用与当前源文匹配的正式结果。

## 出错与恢复

加速失败和 TeX 诊断进入已有问题面板，不新增引擎面板或持续成功提示；已有有效页面保留到正常编译替换。找不到 LuaLaTeX、宏包或字体时补齐本机依赖，也可直接使用原有正式编译。修复后关闭再打开 PDF 预览可重建会话。

关闭预览、禁用自动编译或关闭工程会结束会话。缓存与正式构建隔离在 `.texpro/realtime/`，结束后尝试清理本次会话目录；锁定文件可能残留。同路径外部依赖和外部编辑器改动不保证自动监视，可重开预览或正式编译。

## 开发嵌入与来源

TeXPro 用 Node worker 承载 rtex-ts，经受限 IPC 传递缓冲区和预览；fontkit 绘制实际字形，PDF.js 绘制回退页面。`PdfPane` 统一工具、缩放与滚动，实时页面不复用旧 PDF 文本层或 SyncTeX。共享纯引擎判定同时用于编译和预览；安装包将 worker、依赖与 Lua/TeX 支持文件放在 ASAR 外并核验上游哈希。

TypeScript 改写高度参考 [Henry Yang 的 realtime-tex](https://github.com/HenryXiaoYang/realtime-tex)，Lua/TeX 支持文件原样保留；两者采用 MIT 并保留原作者声明。研究灵感来自 Clemens Lode 的 [TUG 2026 论文](https://www.tug.org/tug2026/preprints/lode-realtime.pdf)。这是独立适配，不是官方移植，不承诺完整 API 或性能等价；上游约 1 ms 不是 TeXPro 的测量结果。

库 API、版本、坐标与许可见 [rtex-ts 嵌入指南](https://github.com/lzhbhlrPython/rtex-ts/blob/main/docs/embedding.zh-CN.md)，宿主边界见 [TeXPro 嵌入说明](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/realtime-tex.md)。TeXPro 本轮原生验证在 macOS 进行；独立包跨平台 CI 不能代替 Windows、Linux 真实 TeX 安装包验收，MiKTeX 仍需核对。

相关说明：[编译与诊断](/docs/compile)、[PDF 双向定位](/docs/synctex)、[版权与许可](/docs/copyright)。
