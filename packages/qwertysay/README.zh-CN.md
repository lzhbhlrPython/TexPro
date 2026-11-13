# @texpro/qwertysay

当前源码 **0.6.0** 的语言脚手架采用第 2 版语义消息键，依赖 SDK 0.5.0。0.5.0 加入直接发布 npm 源码与显式信任后的本地构建。

作者 **Baolin Liu（gardenialiu）**，自有代码以 MIT 开源。Node.js 20+，无需 Electron／TeX。**`0.4.1`** 加入语言包、npm／yarn 作者环境及经过审核的包管理同步。旧作用域的 `0.3.0` 加入中英文引导和最简配色主题；`0.2.0` 加入多语言插件构建、静态主题编译与 API 1 JSON 桥接；`0.1.0` 为原有 TS／JS／CSS 脚手架。

[English](README.md)

## 引导式使用

0.3.0 起，直接启动即可按步骤选择创建、构建、校验或打包，无需记住参数：

```sh
npx --package @texpro/qwertysay@0.6.0 qwertysay
```

选择简体中文／English、操作、插件／主题、目录、包标识、作者和开发语言／样式。输入路径及配置预览后确认，默认回车取消，Ctrl+C／EOF 取消尚未开始的操作。主题的第一项是“仅修改主题色”：选择基础模式与强调色，只生成 manifest 和 LICENSE，无需 CSS、脚本或构建。

创建不会安装依赖；需明确执行 npm install。普通源码再进入引导选择构建，开发时加载 dist/package；最简 token 主题直接校验／打包。打包默认选择目录外的新 .tpp／.tpt，拒绝覆盖。构建执行可信工具和工程配置并可能联网，校验／打包不执行代码。非交互启动明确失败而不等待输入，旧 init/build/check/pack 完整参数保留给 CI；--help 查看兼容用法。

源码维护：根目录 npm ci 后运行 node packages/qwertysay/bin/qwertysay.cjs；生成项目需要同时安装匹配的本地 SDK 和 CLI 路径。详细指南：[qwertysay](https://texpro.pyliubaolin.top/docs/qwertysay)、[SDK](https://texpro.pyliubaolin.top/docs/extension-development)、[开发 Skill](https://texpro.pyliubaolin.top/docs/extension-skill)。

## 语言与样式

| 插件语言 | 引导选项 | 开发源码 |
| --- | --- | --- |
| TypeScript / JavaScript | `ts` / `js` | `.cts` / `.cjs` |
| CoffeeScript / PureScript | `coffee` / `purs` | `.coffee` / `.purs` |
| ReScript / ClojureScript | `rescript` / `cljs` | `.res` / `.cljs` |
| Elm / Scala.js / GopherJS | `elm` / `scala` / `go` | `.elm` / `.scala` / `.go` |

| 主题样式 | 引导选项 | 开发源码 |
| --- | --- | --- |
| CSS / SCSS / Sass | `css` / `scss` / `sass` | `.css` / `.scss` / `.sass` |
| Less / Stylus | `less` / `stylus` | `.less` / `.styl` |
| CSS-in-JS（静态提取） | `css-in-js` | `.css.ts` |
| Thematic CSS | `tcss` | `.tcss` |

各编译器与版本由生成工程声明。PureScript 的 Spago 需要 Node ≥22.5；SCSS／Sass 的当前编译器需要 Node ≥20.19。ClojureScript 需要 Java 21+，Scala.js 需要 Java 与 sbt；GopherJS 需要匹配的 Go 1.21.x，构建前明确执行 `go mod tidy`。TCSS 通过 `cargo install tcss-cli --version 1.0.0 --locked` 安装官方编译器；不是 Textual CSS，不引用 npm 上不可获取的 `tcss-js`。CSS-in-JS 通过 vanilla-extract + esbuild 提取静态 CSS，不在主题运行时注入 JavaScript。

Windows 的 Scala.js 构建可将 `TEXPRO_SBT_LAUNCHER` 设为 sbt-launch.jar 的路径，并将 Java 加入 PATH。较新 macOS 上的旧 Go 链接器可能需要外部链接和本机 ad hoc 签名；详见[完整工具链、版权与跨平台说明](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/extension-authoring.md)。本机验证不等于三平台原生验收。

## 构建与打包边界

`init` 不安装依赖，`check`／`pack` 不构建、不联网、不执行作者入口。**明确执行 `build` 会运行可信开发工具和工程配置，工具链可能下载依赖。** 新工程即使使用 JS 或纯 CSS 也要构建。构建器生成独立 `dist/package`，只收录清单、LICENSE、入口或静态 CSS、assets 与版权通知；源码、开发脚本和 node_modules 不进入分发包。

对源码目录执行 `check`／`pack` 会核对源码指纹，变更后需重建，失败的重建使旧输出失效。直接指定构建目录是检查快照，不核对源码。无构建配置的原有自包含目录仍兼容直接打包。输出须位于所传源码目录外，且不能覆盖已有文件；16 MiB、300 文件、路径、符号链接、原生二进制与主题限制仍适用。`.tpt` 不接受 JavaScript／HTML 或可执行贡献，改名不能绕过校验。

## SDK 与 JSON 桥接

API 1 的 `ExtensionContext`、`InvocationContext`、`ExtensionResult` 位于 `index.d.ts`，共用校验与只读检查从 `package-tools` 导出，并提供对应类型。源码偏移是 UTF-16，修改是提案，由宿主检查身份、过期与能力后明确应用，保留单次撤销。磁盘服务看不到未保存的缓冲区。

```js
const { defineTextTransform } = require('@texpro/extension-sdk');
module.exports = defineTextTransform(text => text.toUpperCase());
```

这是需要构建器打包 SDK 的作者源码，不是自包含的分发入口。`defineJsonExtension({ actions, start })` 为异步语言提供字符串消息桥接：init、invoke、result、cancel、event、service、service-result、dispose。Elm 模板使用 Platform.worker ports。支持受控的存储与工程读取服务、四个并行调用、4 MiB 消息上限和取消清理。完整协议与限制见[作者指南](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/extension-authoring.md)。

## 信任、版权与 MCP

**构建工具拥有开发者权限。Node 插件具有用户的文件、网络、进程权限，进程隔离不是操作系统沙箱。主题可隐藏控件、伪装可信提示或损害可访问性；仅启用可信来源。** 校验、摘要、文件后缀都不是安全认证。使用原生「视图 → 重置外观并停用扩展」或 `--safe-mode` 可恢复内置纸面并停用全部扩展。

生成工程的 MIT LICENSE 归作者；SDK／qwertysay 的 MIT 不覆盖编译后嵌入的第三方运行时。构建器保留可识别的依赖许可证与随附运行时通知，作者新增依赖还需补充 `THIRD_PARTY_NOTICES.md`。Koishi 只提供生命周期和服务组织的设计灵感，没有复制其运行时、控制台源码或插件格式。

外部 MCP 新增只读的 `texpro_extension_capabilities` 与 `texpro_inspect_extension`，查询格式或检查工程内已构建包，不构建、不安装、不启用、不执行插件。清单中的 `mcp` 动作仍不自动对外注册。包依然自行分发，没有公开市场或自动更新。

实际验收包含编译、归档、宿主调用、过期请求、停用、撤销、IME、三主题及恢复等适用路径；CLI 校验不代替原生交互验收。参阅[作者指南](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/extension-authoring.md)与仓库开发 Skill。

## Language packs and npm/yarn / 语言包与包管理

SDK 0.4.0 / API 1 and qwertysay 0.5.0 use the @texpro scope. Historical @gardenialiu packages remain immutable; install the new package names and update imports. / 使用新作用域并更新依赖与 import，旧版本不覆盖。

- [Language packs / 语言包](https://texpro.pyliubaolin.top/docs/language-packs): declarative .tpp, placeholder checks, missing-key fallback and preinstalled @texpro/extension-translate-zh-cn. / 声明式语言插件、变量校验、英文回退及预装简中。
- [npm/yarn management / 包管理](https://texpro.pyliubaolin.top/docs/extension-package-management): one lockfile, node_modules, texpro.source directories or texpro.package archives, reviewed synchronization and removal with plugin data retained. / 单锁文件、分发包、逐项审核与卸载保留数据。

Language packs never contain code or styles, but translations may impersonate instructions. npm/yarn changes dependencies; sync asks the host to install/update/remove its snapshots. It never auto-enables extensions. / 语言包没有代码或样式，文案仍可能误导用户。包管理器修改依赖，宿主另行审核同步，不自动启用。

功能插件生成后，在作者工程维护独立 i18n 库与资源；使用每次调用的 context.language 选择插件自身词典，并将依赖和资源一起构建到 .tpp。不要把功能插件误建为宿主语言包。清单多语种展示与运行消息是两条独立路径，详细示例见 SDK 指南。

## npm source distribution / npm 源码分发

Source imports require SDK 0.4.0, qwertysay 0.5.0 and the matching host. Publish texpro.extension.json, LICENSE and self-contained JS/static files directly; texpro.source selects a package directory and defaults to root. Do not combine it with texpro.package. Compiled sources include qwertysay.build.json, src, configuration and devDependencies; generated templates supply metadata and a files list, but stay private until the author deliberately changes the npm name and removes private: true. Inspect npm pack --dry-run --ignore-scripts and test the actual tgz before publishing.

源码导入需要 SDK 0.4.0、qwertysay 0.5.0 和对应宿主。源码可直接发布 npm，无需内嵌 .tpp／.tpt；包含清单、LICENSE 和可运行 JS／静态资源，以 texpro.source 指向目录（默认根目录）。需要编译时保留 qwertysay.build.json、src、工具链配置和 devDependencies；模板默认私有，发布前由作者修改包名、移除 private: true 并核查实际 tgz。

In an extension environment, install with lifecycle scripts disabled. Ready-to-run source can sync immediately. For compiled source, run the wizard and choose Prepare installed source, review author/version and explicitly confirm trust, then sync and review Install disabled in TeXPro. Automation: qwertysay prepare <environment> <npm-name> --trust-build. No implicit compilation during check/sync/MCP. Missing external or installer-dependent compilers require separate trusted installation. Runtime dependencies must be bundled; node_modules is not copied.

扩展环境中禁用安装脚本。可运行源码安装后直接同步；需编译时在引导选择「构建已安装的源码扩展」，核对作者与版本、确认风险后再构建，随后同步到 TeXPro，选择「安装并保持停用」。check／sync／MCP 不隐式编译；缺失或依赖安装脚本的工具链须另行审核安装，运行时依赖需打包，不复制 node_modules。

Security: compilation executes compilers, project configuration and source generators with user file/network/process permissions. Temporary directories, hashes and a later enable prompt do not undo those effects or certify safety. Themes can hide controls; language packs can impersonate instructions. Trust install, build and enable separately. / 安全：构建执行编译器、工程配置和源码生成器，拥有用户权限；临时目录、摘要及后续启用确认不是安全隔离，无法撤销构建的外部影响。主题可隐藏界面，语言包可误导操作；分别判断安装、构建与启用的信任。

编译依赖安装脚本默认禁用。需要此类安装器时，qwertysay prepare 引导提供独立的、默认拒绝的信任选择；自动化须同时传 --trust-build 与 --trust-install-scripts。允许后第三方编译依赖安装脚本以用户权限运行，仅作用于本次临时构建，不改扩展环境的脚本禁用设置。缺少外部 Java／Go 等工具仍须自行安装。不得把同意构建等同于同意安装脚本。

Compiler dependency lifecycle scripts are disabled by default. The prepare wizard offers a separate, default-deny trust choice; automation requires both --trust-build and --trust-install-scripts. Allowing them executes third-party dependency installers with user permissions for this temporary build only, without changing extension environment settings. External Java/Go tools still require installation. Build trust alone never grants installer-script trust.

## 语言目录第 2 版与长文本

宿主语言贡献声明 `catalogVersion: 2`，JSON 使用 `app.save` 等稳定语义键。SDK 0.5.0、qwertysay 0.6.0、中文包 2.0.0 需要配套宿主。旧正文键词典明确拒绝，不保留兼容层。重新生成 `reference/en.json`，按语义键填写译文并保留占位符，递增包版本后校验、打包；只改清单版本不够。缺译回退内置英文，未知语义键按当前 SDK 参考目录报告。

文档、长信和教程按语言保存完整 Markdown、共用渲染器，不逐段建立 UI 键。功能插件保留自己的词典并按每次调用选择语言；技术 ID、路径与作者内容不参与翻译。固定英文恢复命令不能覆盖。源码版本、注册表发布与桌面 Release 分别核验，详见[迁移教程](https://texpro.pyliubaolin.top/docs/language-packs)。
