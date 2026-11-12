# 扩展架构与 API 1

本轮建立本地插件包和主题包机制，尚无公开市场。实现借鉴 Koishi 的生命周期与服务组织思路，使用 TeXPro 自有协议；不兼容 Koishi 插件，不包含其运行时或控制台源码。TeXPro 新增实现遵循仓库 MIT 许可，分发包须声明作者、版本、许可证并包含 LICENSE。

## 模块与依赖

- `packages/extension-sdk/`：独立 npm 包 `@gardenialiu/texpro-extension-sdk`，包含公开 TypeScript 契约、作者辅助函数与共用校验核心；CLI 独立为 `packages/qwertysay/` 的 `@gardenialiu/qwertysay`；不依赖 React、Electron 或编辑器实现。
- `packages/extension-sdk/lib/schema.cjs`：纯数据校验和 API 兼容边界；Electron 同名模块仅转发到此核心。
- SDK 的 `lib/archive.cjs` / `lib/packages.cjs` / `lib/theme.cjs`：有大小限制的 ZIP 子集、目录读取、完整性摘要与文件安装；不运行安装脚本或安装依赖。
- `manager.cjs`：安装记录、配置、授权启用、停用、回退、服务调用与插件数据。
- `process.cjs` / `worker.cjs`：独立进程协议、加载超时、调用超时、停止和注册清理。

包根目录包含 `texpro.extension.json`、`LICENSE`，可选自包含 `.cjs` / `.mjs` 入口。清单的 `apiVersion` 必须为 1；包 id 使用 `作者.名称` 小写命名。依赖必须随包提供，拒绝原生二进制、符号链接及安装脚本。ZIP 最大 16 MiB、300 文件，展开总大小同样受限，文件名兼容 Windows。目录开发模式复制经过校验的快照；修改后重新加载并检查、启用。

## 生命周期与恢复

安装前展示清单及 SHA-256 摘要，安装时重新检查，拒绝检查后改变的包。安装和更新后默认停用；可执行代码需要明确确认信任再启用。`activate(ctx)` 注册清单中声明的处理器；返回的函数及 `ctx.onDispose()` 在关闭时清理，强制结束作为兜底。加载上限 5 秒，单次调用上限 10 秒，崩溃后禁用并显示错误。

更新保留旧包记录，可显式回退；回退后仍需启用。卸载保留插件存储，以便重装恢复；存储每插件最多 1 MiB。配置按 schema 验证，重新配置会重启宿主。手工分发和更新，不自动联网或检查远端版本。

## 能力与信任

可声明 `document.read`、`document.write`、`project.read`、`build.request`、`storage`、`network`、`theme.styles`。SDK 服务验证声明；正文修改由宿主验证结果并通过编辑器事务应用。`project.readFile` 只读已保存的磁盘文本，不代表编辑器缓冲区，校验真实路径及符号链接越界。

可执行插件是受信任 Node 代码，具有当前用户进程的能力。独立进程用于故障隔离，能力声明不是对恶意 Node 代码的安全沙箱；网络声明也不能阻止插件绕过 SDK 使用 Node。不要加载来源不可信的代码包。主题无需执行 JavaScript，但 CSS／字体／资源可改变或伪装界面，不能当作天然安全内容。自定义样式需要明确确认信任。参见 [主题契约与恢复](extension-development.md#主题包)。

## 提供器契约

API 1 提供命令、检查、转换、补全、文本悬浮信息、预览、导入、导出、文献、素材和 MCP 数据提供器。所有处理器接收快照及输入，返回可序列化结果；不传输 DOM、React 实例或 CodeMirror 对象。实际编辑器适配、工具入口、实验性边界和示例见 [开发指南](extension-development.md#能力与接入状态)，不能把类型名称视为所有 UI 均已接入。

稳定边界是包校验、生命周期与基础数据结构。高级提供器为实验性，宿主适配范围以使用文档和真实测试为准。编译请求必须回到现有保存与编译编排，不能由插件宿主绕过脏缓冲区直接编译。

## 验证与交接

`node --test tests/extensions.test.cjs` 验证实际子进程生命周期、崩溃、声明校验、存储、更新回退和包完整性。渲染层接入另验快照过期、撤销、IME、焦点、主题、原生安装和实际包内运行。主入口不得导入渲染层；SDK 不得引用内部组件。新增能力先修改公开契约和真实服务测试，再接入 UI 和中英文文档。

## 渲染层归属

`src/app/commands/` 提供菜单与命令面板共用目录；`src/app/writingPort.ts` 隔离源码修改；`src/app/extensions/` 处理贡献、过期检查与提供器；`src/app/themes/` 管理基础模式、包 token 和 CSS 的应用及撤销。`WorkspaceFrame` 复用专业画布的导航和焦点恢复；`src/app/inspection.ts` 共用工程检查。渲染层没有 Node 或任意 IPC 入口。

分发扩展名为 `.tpp`（插件）与 `.tpt`（主题），底层均为 ZIP 归档。`.tpt` 只接受主题配置、CSS 与资源，不接受可执行入口、动作或其他插件贡献；将代码包改名为 `.tpt` 会拒绝，扩展名不代表安全认证。

## 多语言开发与静态主题构建（未发布）

源码开发版本的 qwertysay 支持多种编译到 JavaScript 的语言和静态 CSS 编译工具，详见[作者指南](extension-authoring.md)。TeXPro 用户仍安装 `.tpp` 插件或 `.tpt` 主题，不能直接导入 `.purs`、`.elm`、`.scss`、`.tcss` 等作者源码。`.tpt` 中没有样式生成器 JavaScript；这不消除 CSS 隐藏控件或伪装界面的风险。npm `0.1.0` 不包含本轮构建扩展，发布工作暂停。
