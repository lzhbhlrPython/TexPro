# 实时 TeX 预览与 rtex-ts 嵌入

## L0：使用原来的 PDF 预览

实时排版是既有预览的内部增强，没有独立页面、引擎开关或模式标签。打开 PDF 预览、启用原有自动编译且编译模式不是手动时，符合条件的 LuaLaTeX 工程自动使用内置 [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts)。关闭自动编译时不会启动实时会话；不支持或加速失败时沿用原有编译策略。无需 VS Code、插件或 Rust 程序，本机仍需 LuaLaTeX、宏包和字体。

引擎判定由纯模块 `electron/services/tex-engine.mjs` 同时服务正式编译和预览：主文件 magic comment 优先，其次文档特征，再参考设置。CTeX/fontspec 默认判为 XeLaTeX；作者确认模板兼容后，可在实际主文件声明 `% !TeX program = lualatex`。应用不自动修改字体、模板或声明，也不会仅为预览改变引擎。

段落和行内数学可以先更新；标题、环境、未知宏和不可靠结果等待完整排版。段落高度、分页和引用可能暂定。Type 1 字体、PDF literals、矩阵等无法准确绘制的内容整页使用匹配 PDF，不增加回退角标。首屏准备沿用排版等待，已有页面更新时不遮挡正文或移动焦点；TeX 错误与加速失败进入已有诊断。

## 一套预览操作

页码、缩放、适宽、滚动、双页与演示复用 `PdfPane`，不因内部绘制路径更换而重置。实时字形没有正式 PDF 文本层，不能把旧 PDF 的文字或 SyncTeX 坐标叠到新画面上。

搜索、缩略图、复制、对比、打开和显示 PDF，以及区域定位，在需要时先保存相关缓冲区、完成正式编译，再使用匹配 PDF；等待与失败沿用既有反馈。编译失败或等待期间源文变化时，不执行过期的工具操作。手动编译也自然显示正式结果，继续输入后自动恢复实时更新。工具操作可能保存源文件，实时更新本身不保存源文件。

正文到 PDF 的显式定位先确保正式构建有效。实时页面上的修饰键点击先准备正式 PDF 并进入区域定位，再选择目标区域；不把暂定画面的点击坐标猜测成正式排版坐标。自动跟随光标只使用与当前缓冲区匹配的正式结果。

实时会话工作时暂停重复普通自动编译，关闭预览、禁用自动编译或失败后恢复既有策略。rtex-ts 不自动运行文献和索引工具；最终导出和投稿继续使用完整构建链。

## 模块与数据流

- `src/hooks/useRealtimePreview.ts` 管理自动资格、会话身份和未保存缓冲区，组合输入期间延后更新；不修改 CodeMirror 文档或撤销历史。
- `electron/main.cjs`、preload 与 `src/api.ts` 仅暴露 start/update/stop/event，核对 sender、工程授权与会话 ID，不提供任意 shell 或文件读取入口。
- `electron/services/realtime-tex.cjs` 在 worker 内创建 `rtex-ts.Session`，共用 `project-root.cjs` 解析主文件。主进程合并变更，每次确认后再发送下一批，繁忙期间只保留最新缓冲区。
- `electron/services/realtime-scene.cjs` 用 fontkit 读取实际 TeX 字形轮廓，按 glyph ID 与 sp 坐标输出 SVG。不用浏览器文字重新塑形；不支持的字体或绘制整页回退 PDF。
- `src/components/PdfPane.tsx` 统一预览工具、缩放和滚动；`RealtimePageView.tsx` 只绘制纸页，不拥有独立工具栏或状态 UI。PDF 专业操作验证正式结果与源文快照一致后再执行。

当前使用 `rtex-ts@0.1.11`。库内计算最小 UTF-8 字节编辑，宿主传完整未保存缓冲区，避免把 CodeMirror 的 UTF-16 偏移当成字节。后台在不可变快照中编译，不保存工程源文件。普通自动保存仍是独立功能，沿用保存队列。

## 顺序、资源与生命周期

所有事件先核对会话 ID。worker 核对修订，场景层按源码版本保留晚于后台快照的覆盖层；通过 placements 的坐标替换旧段落，不能把 capture UID 当作宿主段落 ID。全局布局更新后移除已吸收的覆盖层和多余页。

缓存位于 `.texpro/realtime/<session ID>`，与正式构建隔离，逐层检查真实路径。限制单文件 4 MiB、一次同步 100 个缓冲区和合计 16 MiB；包另有工程和快照限制。资源必须位于工程、会话缓存或明确查到的字体根目录。SVG 使用转义的轮廓数据，不嵌入源码脚本。

切换主文件、引擎、打开缓冲区集合或工程文件集合会重建会话。隐藏 PDF 预览、禁用自动编译、关闭工程、重载页面及渲染进程退出会停止旧会话，旧结果不能回写新工程。会话关闭先终止 TeX 进程，再结束 worker，并尝试删除自己的 UUID 缓存目录；锁定文件清理失败时可能留下缓存。POSIX 使用进程组，Windows 使用 taskkill 进程树。

本版本不自动监视外部编辑器对已加载源码的改动；同路径外部依赖更新后可关闭再打开 PDF 预览以重建会话，或使用正式编译。任意绝对路径引用和文档 Lua 代码仍由 TeX 执行，本功能不是沙箱。这里只增加本地预览，不新增云服务或远程文档传输。

## 安装包分发契约

rtex-ts 为 ESM Node 包，外部 LuaLaTeX 必须读取其 Lua/TeX 支持文件。因此 `asarUnpack` 保留 worker、场景和共享引擎模块、`node_modules/rtex-ts/**` 与 fontkit 的依赖闭包。worker 从 `app.asar.unpacked` 启动，使模块与支持文件可直接读取。

`scripts/verify-release.cjs` 同时核验开发目录与实际 ASAR：worker、包入口、完整上游 manifest 哈希、版权文件和绘制依赖必须存在。发布前还应从实际安装包运行真实会话，不能用源码 require 成功代替包内启动。

再分发保留根 `THIRD_PARTY_NOTICES.md`、rtex-ts LICENSE/UPSTREAM/第三方声明、`vendor/realtime-tex/LICENSE` 和 manifest。TypeScript 层高度参考 Henry Yang 的 realtime-tex；Lua/TeX 代码原样保留，基点 `fcff7a5c7f33a288ecf40db886843754c62bbdfd`，MIT。研究灵感来自 Clemens Lode 的 TUG 2026 论文。不得宣称官方移植、完整功能兼容，或将上游毫秒级指标当作 TeXPro 实测性能。TeX 发行版和字体不随本包分发，仍遵循各自许可。

## 验证入口

```sh
npm run typecheck
npm run test:regression
npm run build
npm run test:realtime
npm run test:realtime:ui
npm run verify:release
```

`test:realtime` 使用临时中文／数学与普通段落工程，验证真实字形、未保存编辑的新修订、PDF 快照及进程清理。中文工程允许有效的段落或完整布局更新；独立普通段落用例严格要求 ParagraphUpdate，避免回退掩盖快路径故障。原生界面测试单独验证主题、语言、输入、撤销、统一工具栏、PDF 搜索衔接和组合事件同步门控；合成 composition 事件不等同于手工验收操作系统输入法候选窗。独立包的三平台单元/安装包 CI 与 Linux 真实 TeX 成功，不等于 TeXPro 三平台安装包均已验收。最新验证范围以本次交付记录为准。

普通 Node 嵌入示例与库契约见 [rtex-ts 中英文嵌入说明](https://github.com/lzhbhlrPython/rtex-ts/tree/main/docs)。外部 MCP 仍只看到磁盘；实时预览的未保存缓冲区没有通过 MCP 对外暴露。

当前精确依赖 0.1.11，包含上游宏／环境识别与字体缓存复用改进。宿主继续使用原有会话 API、版本过滤与 PDF 回退，不将上游性能数据视为 TeXPro 测量结果；Poppler 对照为上游可选验证工具，不新增应用运行时依赖。

Worker 使用 `trackUnmanagedFds: false`：rtex-ts 的 POSIX FIFO 描述符从 `fs.openSync` 转交给 `net.Socket`，由套接字负责关闭；Worker 默认的 fs 追踪不能看到这种所有权转移，退出时可能再次关闭已被主线程复用的句柄。会话关闭、TeX 进程组清理和 worker 终止仍执行。真实会话测试在 worker 终止前打开 64 个宿主文件句柄，验证它们全部保留有效。Node 的默认追踪语义见 [Worker 文档](https://nodejs.org/download/release/latest/docs/api/worker_threads.html)。
