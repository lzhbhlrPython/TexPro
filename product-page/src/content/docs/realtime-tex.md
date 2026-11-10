---
slug: realtime-tex
title: 实时 TeX 预览
group: 使用
order: 3.5
summary: 使用内置 rtex-ts 和本机 LuaLaTeX 预览未保存段落，了解完整版面回退、正式 PDF 和当前边界。
---

## 开始使用

实时 TeX 预览是可选实验功能，默认关闭。TeXPro 已内置独立开源包 [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts)，不需要 VS Code、插件或 Rust 程序。请先安装本机 LuaLaTeX，以及文档使用的宏包和字体。

- 确认工程主文件。多候选时先在工程结构中指定入口。
- 在实际主文件添加 `% !TeX program = lualatex`，由作者确认模板支持该引擎。CTeX/fontspec 的自动判断通常优先 XeLaTeX，仅修改默认引擎设置不足以覆盖这一判断。
- 打开设置 → 构建，启用「实时 TeX 预览（实验性）」。
- 打开 PDF 预览，在侧栏选择「实时 TeX 预览」。首个版面准备期间可以继续写作。

应用不会自动改写已有字体、模板或引擎声明。LuaLaTeX 会以你的权限执行文档代码；只对可信工程启用，不能把它当成沙箱。

## 写作与排版如何配合

普通段落和行内数学通过上下文与旧段落探针验证后，可以先更新字形；后台编译随后校正全局分页和引用。标题、表格、TikZ 等环境、未知宏和不可靠的结果等待完整排版。字体或绘制无法准确显示时，整页回退到对应 PDF。

实时预览接收未保存缓冲区，不为预览强制保存源文件。普通自动保存仍由自己的设置控制。输入法组合期间延后发送更新，预览不接管正文焦点或撤销历史。编辑子文件不会把它改成编译主文件。

| 状态 | 含义 |
| --- | --- |
| 实时预览已就绪 | 常驻 LuaLaTeX 已准备好 |
| 段落已更新 | 已取得局部排版结果 |
| 正在更新分页和引用 | 局部位置暂定，等待完整布局 |
| 正在等待完整排版 | 该修改需要后台编译 |
| 引用尚未收敛 | 达到轮次上限等情况，不能视为最终结果 |
| 实时预览暂不可用 | 检查引擎、宏包或诊断，修正后重试 |

## 使用正式 PDF

切到「编译后的 PDF」继续使用搜索、文本选择、对比和 SyncTeX。实时画面没有这些正式 PDF 的定位能力。手动编译始终可用，会先保存相关缓冲区，再走既有构建链。

实时模式运行时暂停重复的普通自动编译；退出或失败后恢复原有策略。rtex-ts 不自动调用 BibTeX、Biber 或索引工具，正式投稿与导出请使用原有完整构建。段落变长、变短后的位置也需要等待后台校正。

## 出错与重试

找不到 LuaLaTeX 时先安装 TeX 发行版并确认程序可用；宏包或字体缺失时按 TeX 诊断补齐依赖。上次可用画面会保留。可以点击「重试实时预览」，或切回编译后的 PDF 检查完整日志。

关闭侧栏、切回正式 PDF 或关闭工程会停止实时会话。缓存与正式构建隔离在 `.texpro/realtime/`；会话结束后尝试清理自己的目录，锁定文件可能导致残留。外部程序修改已加载源码或同路径依赖后，请重试预览；当前不承诺自动监视全部外部改动。

## 开发嵌入与来源

TeXPro 用 Node worker 承载 rtex-ts，经受限 IPC 传递缓冲区和预览，不把 Node 权限交给编辑器。fontkit 读取实际字形轮廓；PDF.js 负责不支持页面的回退。安装包将 Lua/TeX 支持文件放在 ASAR 外，并校验其上游文件哈希。

TypeScript 改写高度参考 [Henry Yang 的 realtime-tex](https://github.com/HenryXiaoYang/realtime-tex)，Lua/TeX 支持文件原样保留；两者采用 MIT，保留原作者声明。研究灵感来自 Clemens Lode 的 [TUG 2026 论文](https://www.tug.org/tug2026/preprints/lode-realtime.pdf)。这是独立改写，不是官方移植，也没有承诺完整 API 或性能等价。上游约 1 ms 数据不是 TeXPro 的测量结果。

库 API、UTF-8 编辑、事件版本、坐标与许可见 [rtex-ts 嵌入指南](https://github.com/lzhbhlrPython/rtex-ts/blob/main/docs/embedding.zh-CN.md)；宿主实现和打包契约见 [TeXPro 仓库说明](https://github.com/lzhbhlrPython/TexStudioPro/blob/codex/realtime-tex/docs/realtime-tex.md)。独立包跨平台 CI 不代表 TeXPro 已在全部平台完成真实安装包验收，MiKTeX 与 Windows 真实 TeX 集成仍需单独核对。

相关说明：[编译与诊断](/docs/compile)、[PDF 双向定位](/docs/synctex)、[版权与许可](/docs/copyright)。
