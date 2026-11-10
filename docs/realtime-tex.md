# 实时 TeX 预览与 rtex-ts 嵌入

## 使用入口与边界

TeXPro 内置独立 npm 包 [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts)，在现有 PDF 侧栏提供可选的「实时 TeX 预览」。设置 → 构建中显式开启实验功能，然后打开 PDF 预览。默认关闭，不需要 VS Code、插件或 Rust rtex 程序；本机仍需安装 LuaLaTeX 和文档所需宏包、字体。

引擎判定复用 `tex.cjs`：主文件 magic comment 优先，其次文档特征，再参考设置。CTeX/fontspec 文档默认会判为 XeLaTeX；需要实时预览时，由作者在实际主文件声明 `% !TeX program = lualatex`，应用不自动修改模板、字体或引擎。只有判定为 LuaLaTeX 时才启动实时会话。

段落及行内数学可以先更新；标题、环境、未知宏、图示和不可靠的结果等待完整排版。段落变高、变短时，位置和分页可能暂定。引用未收敛、TeX 错误与等待完整排版均有状态反馈。Type 1 字体、PDF literals、矩阵变换及宿主无法准确绘制的页面使用匹配 PDF 的 PDF.js 回退，不静默丢弃绘制内容。

实时画面不带正式 PDF 的文本层、搜索、对比或 SyncTeX。切到「编译后的 PDF」使用原有功能；手动编译仍保存相关缓冲区并走原有构建动作。实时模式运行时暂停重复的普通自动编译，退出或失败后恢复用户原有策略。包本身不会自动运行文献或索引工具，正式输出继续使用 TeXPro 的构建链。

## 模块与数据流

- `src/hooks/useRealtimePreview.ts` 管理 UI 会话身份、未保存缓冲区和重试，组合输入期间延后更新；不修改 CodeMirror 文档或撤销历史。
- `electron/main.cjs`、preload 与 `src/api.ts` 仅暴露 start/update/stop/event，核对 sender、工程授权与会话 ID，不提供任意 shell 或文件读取入口。
- `electron/services/realtime-tex.cjs` 在 worker 内创建 `rtex-ts.Session`，共用 `project-root.cjs` 解析主文件。主进程合并变更，每次确认后再发送下一批，繁忙期间只保留最新缓冲区。
- `electron/services/realtime-scene.cjs` 用 fontkit 读取实际 TeX 字形轮廓，按 glyph ID 与 sp 坐标输出 SVG。不用浏览器文字重新塑形；不支持的字体或绘制整页回退 PDF。
- `src/components/RealtimePane.tsx` 懒加载预览，按需绘制回退页；显示最近有效画面和可重试错误，工具栏使用既有主题和 Lucide。

当前使用 `rtex-ts@0.1.0`。库内计算最小 UTF-8 字节编辑，宿主传完整未保存缓冲区，避免把 CodeMirror 的 UTF-16 偏移当成字节。后台在不可变快照中编译，不保存工程源文件。普通自动保存仍是独立功能，沿用保存队列。

## 顺序、资源与生命周期

所有事件先核对会话 ID。worker 核对修订，场景层按源码版本保留晚于后台快照的覆盖层；通过 placements 的坐标替换旧段落，不能把 capture UID 当作宿主段落 ID。全局布局更新后移除已吸收的覆盖层和多余页。

缓存位于 `.texpro/realtime/<session ID>`，与正式构建隔离，逐层检查真实路径。限制单文件 4 MiB、一次同步 100 个缓冲区和合计 16 MiB；包另有工程和快照限制。资源必须位于工程、会话缓存或明确查到的字体根目录。SVG 使用转义的轮廓数据，不嵌入源码脚本。

切换主文件、引擎、打开缓冲区集合或工程文件集合会重建会话。隐藏实时预览、关闭工程、重载页面及渲染进程退出会停止旧会话，旧结果不能回写新工程。会话关闭先终止 TeX 进程，再结束 worker，并尝试删除自己的 UUID 缓存目录；锁定文件清理失败时可能留下缓存。POSIX 使用进程组，Windows 使用 taskkill 进程树。

本版本不自动监视外部编辑器对已加载源码的改动；同路径外部依赖更新后请重试实时预览，或使用正式编译。任意绝对路径引用和文档 Lua 代码仍由 TeX 执行，本功能不是沙箱。这里只增加本地预览，不新增云服务或远程文档传输。

## 安装包分发契约

rtex-ts 为 ESM Node 包，外部 LuaLaTeX 必须读取其 Lua/TeX 支持文件。因此 `asarUnpack` 保留 worker、场景模块、`node_modules/rtex-ts/**` 与 fontkit 的依赖闭包。worker 从 `app.asar.unpacked` 启动，使模块与支持文件可直接读取。

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

`test:realtime` 使用临时中文/数学工程，验证真实字形、未保存编辑、PDF 快照及进程清理。原生界面测试单独验证主题、输入、撤销、模式切换和组合事件同步门控；合成 composition 事件不等同于手工验收操作系统输入法候选窗。独立包的三平台单元/安装包 CI 与 Linux 真实 TeX 成功，不等于 TeXPro 三平台安装包均已验收。最新验证范围以本次交付记录为准。

普通 Node 嵌入示例与库契约见 [rtex-ts 中英文嵌入说明](https://github.com/lzhbhlrPython/rtex-ts/tree/main/docs)。外部 MCP 仍只看到磁盘；实时预览的未保存缓冲区没有通过 MCP 对外暴露。
