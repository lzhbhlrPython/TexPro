# @gardenialiu/texpro-extension-sdk

作者 **Baolin Liu（gardenialiu）**，自有代码以 MIT 开源。Node.js 20+，无需 Electron／TeX。**`0.2.0`** 加入多语言插件构建、静态主题编译与 API 1 JSON 桥接；`0.1.0` 为原有 TS／JS／CSS 脚手架。

[English](README.md)

## 创建扩展

使用固定版本的 qwertysay：

```sh
npx --package @gardenialiu/qwertysay@0.2.0 qwertysay init my-plugin --id author.example --language coffee
```

进入生成目录，安装依赖并明确执行构建：

```sh
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

维护源码时，在 TeXPro 中执行 `npm ci`，使用本地 CLI，并在生成工程中同时安装同一检出的 SDK 与脚手架路径。

默认 `--type plugin --language ts`。主题示例：`--type theme --style tcss`。开发时加载 **`dist/package`**，检查、安装停用快照并明确启用。插件分发为 `.tpp`，主题分发为 `.tpt`；源码后缀和运行入口后缀不等于安装包后缀，两种安装包内部均为受限 ZIP，不能直接使用 `.zip` 安装。

## 语言与样式

| 插件语言 | `--language` | 开发源码 |
| --- | --- | --- |
| TypeScript / JavaScript | `ts` / `js` | `.cts` / `.cjs` |
| CoffeeScript / PureScript | `coffee` / `purs` | `.coffee` / `.purs` |
| ReScript / ClojureScript | `rescript` / `cljs` | `.res` / `.cljs` |
| Elm / Scala.js / GopherJS | `elm` / `scala` / `go` | `.elm` / `.scala` / `.go` |

| 主题样式 | `--style` | 开发源码 |
| --- | --- | --- |
| CSS / SCSS / Sass | `css` / `scss` / `sass` | `.css` / `.scss` / `.sass` |
| Less / Stylus | `less` / `stylus` | `.less` / `.styl` |
| CSS-in-JS（静态提取） | `css-in-js` | `.css.ts` |
| Thematic CSS | `tcss` | `.tcss` |

各编译器与版本由生成工程声明。PureScript 的 Spago 需要 Node ≥22.5；SCSS／Sass 的当前编译器需要 Node ≥20.19。ClojureScript 需要 Java 21+，Scala.js 需要 Java 与 sbt；GopherJS 需要匹配的 Go 1.21.x，构建前明确执行 `go mod tidy`。TCSS 通过 `cargo install tcss-cli --version 1.0.0 --locked` 安装官方编译器；不是 Textual CSS，不引用 npm 上不可获取的 `tcss-js`。CSS-in-JS 通过 vanilla-extract + esbuild 提取静态 CSS，不在主题运行时注入 JavaScript。

Windows 的 Scala.js 构建可将 `TEXPRO_SBT_LAUNCHER` 设为 sbt-launch.jar 的路径，并将 Java 加入 PATH。较新 macOS 上的旧 Go 链接器可能需要外部链接和本机 ad hoc 签名；详见[完整工具链、版权与跨平台说明](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-authoring.md)。本机验证不等于三平台原生验收。

## 构建与打包边界

`init` 不安装依赖，`check`／`pack` 不构建、不联网、不执行作者入口。**明确执行 `build` 会运行可信开发工具和工程配置，工具链可能下载依赖。** 新工程即使使用 JS 或纯 CSS 也要构建。构建器生成独立 `dist/package`，只收录清单、LICENSE、入口或静态 CSS、assets 与版权通知；源码、开发脚本和 node_modules 不进入分发包。

对源码目录执行 `check`／`pack` 会核对源码指纹，变更后需重建，失败的重建使旧输出失效。直接指定构建目录是检查快照，不核对源码。无构建配置的原有自包含目录仍兼容直接打包。输出须位于所传源码目录外，且不能覆盖已有文件；16 MiB、300 文件、路径、符号链接、原生二进制与主题限制仍适用。`.tpt` 不接受 JavaScript／HTML 或可执行贡献，改名不能绕过校验。

## SDK 与 JSON 桥接

API 1 的 `ExtensionContext`、`InvocationContext`、`ExtensionResult` 位于 `index.d.ts`，共用校验与只读检查从 `package-tools` 导出，并提供对应类型。源码偏移是 UTF-16，修改是提案，由宿主检查身份、过期与能力后明确应用，保留单次撤销。磁盘服务看不到未保存的缓冲区。

```js
const { defineTextTransform } = require('@gardenialiu/texpro-extension-sdk');
module.exports = defineTextTransform(text => text.toUpperCase());
```

这是需要构建器打包 SDK 的作者源码，不是自包含的分发入口。`defineJsonExtension({ actions, start })` 为异步语言提供字符串消息桥接：init、invoke、result、cancel、event、service、service-result、dispose。Elm 模板使用 Platform.worker ports。支持受控的存储与工程读取服务、四个并行调用、4 MiB 消息上限和取消清理。完整协议与限制见[作者指南](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-authoring.md)。

## 信任、版权与 MCP

**构建工具拥有开发者权限。Node 插件具有用户的文件、网络、进程权限，进程隔离不是操作系统沙箱。主题可隐藏控件、伪装可信提示或损害可访问性；仅启用可信来源。** 校验、摘要、文件后缀都不是安全认证。使用原生「视图 → 重置外观并停用扩展」或 `--safe-mode` 可恢复内置纸面并停用全部扩展。

生成工程的 MIT LICENSE 归作者；SDK／qwertysay 的 MIT 不覆盖编译后嵌入的第三方运行时。构建器保留可识别的依赖许可证与随附运行时通知，作者新增依赖还需补充 `THIRD_PARTY_NOTICES.md`。Koishi 只提供生命周期和服务组织的设计灵感，没有复制其运行时、控制台源码或插件格式。

外部 MCP 新增只读的 `texpro_extension_capabilities` 与 `texpro_inspect_extension`，查询格式或检查工程内已构建包，不构建、不安装、不启用、不执行插件。清单中的 `mcp` 动作仍不自动对外注册。包依然自行分发，没有公开市场或自动更新。

实际验收包含编译、归档、宿主调用、过期请求、停用、撤销、IME、三主题及恢复等适用路径；CLI 校验不代替原生交互验收。参阅[作者指南](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-authoring.md)与仓库开发 Skill。
