---
slug: extension-development
title: 插件 SDK、qwertysay 与开发 Skill
group: 开发
order: 65
summary: 使用 API 1 开发和分发本地插件包、工具和主题，理解契约、测试与当前边界。
---

## 开发入口

独立 npm 包 `@gardenialiu/texpro-extension-sdk` 提供 API 1 类型与共用核心，`@gardenialiu/qwertysay`（命令 `qwertysay`）提供脚手架、离线校验与打包，作者为 Baolin Liu（gardenialiu），MIT。无需 Electron／TeX；要求 Node.js 20+。源码位于仓库 `packages/extension-sdk/`，类型在 `index.d.ts`。`examples/extensions/writing-kit` 展示处理器与服务，`quiet-paper` 展示无代码资源。配套 `skills/texpro-extension-development/` 可整体安装到你的 AI 工具技能目录；应用不会自动安装全局 Skill。

机制借鉴 Koishi 的生命周期与服务组织思路，使用 TeXPro 自有实现与协议，不复用其运行时、控制台源码或市场服务，也不兼容 Koishi 插件格式。TeXPro 新增代码及示例为 MIT；第三方内容保留各自许可。

```sh
npx --package @gardenialiu/qwertysay@0.2.0 qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

默认生成 TypeScript；`--language js` 创建 JavaScript 工程，`--type theme` 生成主题，均显式构建。输出到源码目录外，拒绝覆盖。`init`／`check`／`pack` 不自动安装依赖、联网或执行扩展代码；明确的 `build` 执行可信编译器及工程配置，可能下载依赖；`npx` 可能下载工具。也可使用 `qwertysay check` 校验目录／归档，或 `qwertysay pack` 打包。

## npm 发行版

2026-11-12 首次发布 0.1.0；当前 0.2.0 增加多语言构建，两包均以 Baolin Liu（gardenialiu）名义按 MIT 提供：

| npm 包 | 版本 | 职责 |
| --- | --- | --- |
| [@gardenialiu/texpro-extension-sdk](https://www.npmjs.com/package/@gardenialiu/texpro-extension-sdk) | 0.2.0 | API 1 类型与共用校验核心 |
| [@gardenialiu/qwertysay](https://www.npmjs.com/package/@gardenialiu/qwertysay) | 0.2.0 | qwertysay 脚手架、校验与打包 |

发布验收核对注册表版本及完整性摘要，并从注册表独立安装，验证 TypeScript／JavaScript／主题脚手架、编译、归档及拒绝路径。npm 开发工具的发布不等于公开插件市场；插件包继续自行分发。

## 包格式与处理器

包根包含 `texpro.extension.json` 与 LICENSE，清单声明 namespaced id、作者、版本、许可证、`apiVersion: 1`、能力和贡献项。自包含入口为 `.cjs` 或 `.mjs`；TypeScript 需先编译。没有安装脚本、运行时依赖安装或原生二进制加载。ZIP 最大 16 MiB、300 文件，拒绝越界、符号链接、重复路径和损坏内容。

```js
exports.activate = ctx => {
  ctx.handle('rewrite', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

动作须在清单声明；偏移使用 UTF-16。用户接受提案后，宿主校验工程代数、文件、文档身份和包状态，经编辑器事务修改，保留撤销与输入法。处理器可以返回诊断、补全、纯文本、导出文件、工程创建提案或编译请求；编译仍使用原有保存与主文件流程。

## 能力与生命周期

可声明读取文档、提出正文修改、读取工程、请求构建、本地存储、网络和自定义主题样式。调用快照包含获准的未保存内容；`project.readFile` 与符号服务读取磁盘。存储每插件最多 1 MiB，配置不是密钥存储。

使用 `ctx.handle`、`ctx.on`、`ctx.onDispose` 和返回的清理函数。加载上限 5 秒，调用上限 10 秒；失败、崩溃和超时使扩展停用。关闭或换工程后不接受旧结果。代码插件仍具有当前用户的 Node 权限，可能读取文件、联网或启动进程，SDK 声明不是安全沙箱。主题样式也可能隐藏控件或伪装界面；仅启用可信来源。

静态资源、生命周期和基础结果为 API 1 稳定边界；高级提供器及界面贡献为实验性。动态补全和悬浮信息有编辑器适配；检查器接入问题面板；其余提供器在显式工具中调用。MCP 数据不会自动注册到外部 stdio MCP。主题支持语义色、字体、尺寸与受控包内 CSS／资源，具体契约见[主题包](/docs/themes)；内容预览为纯文本。首期不开放任意 React/HTML、二进制素材结果或自定义 TeX 引擎进程。

## 验证与分发

```sh
npm run test:extensions
npm run typecheck
npm run test:extensions:ui
node scripts/pack-extension.cjs examples/extensions/quiet-paper /tmp/quiet-paper.tpt
```

输出文件须不存在。在临时用户目录实际安装打包结果，验证启停、配置、错误、过期结果、IME、撤销、主题和卸载。修改宿主需重跑完整回归基线：零失败、零跳过、零 TODO。不能用定向补跑代替整套通过。

开发目录修改后重新加载会安装停用快照，需要重新检查和启用。包通过文件自行分发；手动更新可恢复上一版本，卸载保留插件数据。交接包含源码、包、许可证、API 版本、测试命令、实际证据和限制。完整宿主边界见仓库 `docs/extensions.md`、`docs/extension-development.md` 与[接手指南](/docs/dev-handoff)。

L3 工作台复用系统标题栏与焦点恢复。macOS 顶部避让原生窗口按钮，Windows／Linux 保持各自标题栏布局；插件内容不应覆盖宿主导航。

分发扩展名为 `.tpp`（插件）与 `.tpt`（主题），底层均为 ZIP 归档。`.tpt` 只接受主题配置、CSS 与资源，不接受可执行入口、动作或其他插件贡献；将代码包改名为 `.tpt` 会拒绝，扩展名不代表安全认证。

## 多语言与主题编译

SDK／qwertysay `0.2.0` 提供以下构建能力，API 版本保持 1；`0.1.0` 只包含原有 TS／JS／CSS 脚手架。

```sh
npx --package @gardenialiu/qwertysay@0.2.0 qwertysay init my-plugin --id author.example --language coffee
```

进入新工程，安装依赖并明确构建：

```sh
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

| 插件语言 | 参数 | 源码后缀 |
| --- | --- | --- |
| TypeScript / JavaScript | `--language ts` / `js` | `.cts` / `.cjs` |
| CoffeeScript / PureScript | `--language coffee` / `purs` | `.coffee` / `.purs` |
| ReScript / ClojureScript | `--language rescript` / `cljs` | `.res` / `.cljs` |
| Elm / Scala.js / GopherJS | `--language elm` / `scala` / `go` | `.elm` / `.scala` / `.go` |

| 主题样式 | 参数 | 源码后缀 |
| --- | --- | --- |
| CSS / SCSS / Sass | `--type theme --style css` / `scss` / `sass` | `.css` / `.scss` / `.sass` |
| Less / Stylus | `--style less` / `stylus` | `.less` / `.styl` |
| CSS-in-JS 静态提取 | `--style css-in-js` | `.css.ts` |
| Thematic CSS | `--style tcss` | `.tcss` |

源码后缀、运行产物和安装包是不同层次：插件编译并打包为自包含 `.cjs` 入口，再分发 `.tpp`；主题编译为静态 `.css`，再分发 `.tpt`。不能直接导入 `.purs`、`.elm`、`.scss`、`.tcss` 或 `.zip`。开发时在扩展管理中加载 `dist/package`；源码根目录的 `check`／`pack` 会检查构建是否过期。旧版自包含目录仍可直接打包。

`init`、`check`、`pack` 不安装依赖、不联网、不执行作者代码。明确执行 `build` 才运行编译器与可信工程配置，工具链可能下载依赖。分发目录只保留清单、作者 LICENSE、入口或 CSS、assets 和版权通知；源码、构建脚本、node_modules、CSS-in-JS 求值脚本都不进入主题包。构建失败使旧输出失效，输出拒绝覆盖无归属的文件。

PureScript 的 Spago 需要 Node ≥22.5；当前 Sass 编译器需要 Node ≥20.19。ClojureScript 需要 Java 21+，Scala.js 需要 Java 与 sbt，GopherJS 需要匹配的 Go 1.21.x 并先执行 `go mod tidy`。Windows 上可设置 `TEXPRO_SBT_LAUNCHER` 为 sbt-launch.jar 的路径；较新 macOS 的旧 Go 工具可能需要外部链接和本机签名，不能把一台机器的通过当成三平台原生验收。

TCSS 是 [Thematic CSS](https://github.com/tosiiko/TCSS)，不是 Textual CSS。先执行 `cargo install tcss-cli --version 1.0.0 --locked` 并使 `tcss` 可用；脚手架不引用 npm 上不可获取的 `tcss-js`。CSS-in-JS 使用 vanilla-extract + esbuild，在构建时提取静态 CSS。所有最终 CSS 仍遵守同一资源和样式校验；主题仍可能隐藏控件或伪装界面。

## JSON 桥接、版权与 MCP

`defineTextTransform` 为编译后的字符串变换提供起点；完整语言适配使用 `defineJsonExtension`。Elm 模板采用无 DOM 的 Platform.worker ports，通过 JSON 传递调用、结果、取消、事件、配置、服务与销毁。偏移保留 UTF-16，宿主仍检查修改提案、文档身份和过期。桥接最多四个并行调用、单消息 4 MiB、9.5 秒超时；每调用最多十六个在途服务和六十四次服务请求。取消后丢弃旧结果；已交给宿主执行的操作不代表可被撤回。

SDK／qwertysay 自有代码为 MIT，生成工程的 LICENSE 属于作者。编译嵌入的 Elm、Scala／Scala.js、Go／GopherJS、ClojureScript／Closure、PureScript 等运行时保留各自协议。构建器收集已知许可证和通知；新增依赖与资源仍由作者核对，不能把所有产物称为仅 MIT。构建工具和 Node 插件拥有用户权限，进程隔离不是安全沙箱；仅构建、安装和启用可信来源。

外部 MCP 新增只读 `texpro_extension_capabilities`（格式、工具链、后缀与边界）和 `texpro_inspect_extension`（当前工程内已构建包的清单、摘要、大小与风险）。两者都不构建、不执行、不安装、不启用插件。清单中的实验性 `mcp` 动作仍不会自动对外注册。后续受控调用需要明确启用、工具白名单、稳定 schema 与取消／过期契约，本轮未开放自动执行。

完整构建、协议和测试入口见仓库 `docs/extension-authoring.md`。语言编译与归档测试补充完整零跳过基线，不代替 IME、撤销、恢复和跨平台原生验收；本轮没有新增桌面页面或模式。
