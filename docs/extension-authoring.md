# 多语言插件与主题构建

作者优先通过[qwertysay 引导](qwertysay.md)选择语言、类型与操作；下面的精确配置和参数用于维护及自动化。

本文对应 SDK `0.3.0` / API 1 和 qwertysay `0.4.1`，API 版本仍为 1。`0.1.0` 只提供原有 TS／JS／CSS 脚手架。本轮工作不新增桌面页面：语言与样式在开发时编译，安装仍使用既有扩展管理。

## 使用 npm 工具

使用固定版本的 CLI 创建工程：

```sh
npx --package @texpro/qwertysay@0.4.1 qwertysay
```

进入生成目录，安装模板声明的依赖后构建：

```sh
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

维护源码时可在 TeXPro 检出中运行 `npm ci`，再使用本地 CLI；生成工程中以一次 `npm install --save-dev` 同时安装两个本地包路径，避免混用检出版本和注册表版本。初始化不安装依赖；`check`、`pack`、安装包检查和 MCP 检查都不执行构建代码。只有明确执行 `build` 才启动开发者信任的编译器及工程配置；工具链可能下载 npm、PureScript、Elm、Maven 或 Go 依赖。不要构建不可信的来源。

## 插件语言与后缀

`--language` 的值如下。宿主不包含这些语言的解释器；用户安装的 `.tpp` 只需自包含的 `.cjs`／`.mjs` 入口及其包内资源，不需要作者的编译器。

| 语言 | 参数 | 开发源码 | 构建前提 |
| --- | --- | --- | --- |
| TypeScript | `ts` | `.cts` | TypeScript 5.9.3 |
| JavaScript | `js` | `.cjs` | Node.js；也经过打包构建 |
| CoffeeScript | `coffee` | `.coffee` | CoffeeScript 2.7.1 |
| PureScript | `purs` | `.purs` | PureScript 0.15.16、Spago 1.0.5；Node ≥22.5 |
| ReScript | `rescript` | `.res` | ReScript 12.3.1 |
| ClojureScript | `cljs` | `.cljs` | shadow-cljs 3.5.13、Java 21+；首次解析 Maven 依赖 |
| Elm | `elm` | `.elm` | Elm 0.19.3；JSON ports 桥接 |
| Scala.js | `scala` | `.scala` | Java、sbt 1.11.7、Scala 2.13.17、Scala.js 1.20.2 |
| GopherJS | `go` | `.go` | GopherJS 1.21.0、匹配的 Go 1.21.x；先执行 `go mod tidy` |

模板展示选区大写转换，保留 UTF-16 偏移与用户确认修改流程。多数模板将本语言的 `String → String` 函数交给 `defineTextTransform`，这只是起点；完整上下文、异步服务和事件使用 `defineJsonExtension`，或通过对应语言的 JavaScript 互操作调用 API 1。Elm 使用无 DOM 的 `Platform.worker` 和 ports，不伪装成普通 JavaScript 对象调用。

## 主题语言与后缀

创建主题时使用 `--type theme --style <值>`。开发源码不是安装包：`.scss`、`.tcss` 等不能直接导入 TeXPro；最终统一为 `.tpt`。CSS-in-JS 只在构建时求值，主题安装与启用不会执行 JavaScript。

| 样式 | 参数 | 开发源码 | 构建方式 |
| --- | --- | --- | --- |
| CSS | `css` | `.css` | 复制后执行共用校验 |
| SCSS | `scss` | `.scss` | Dart Sass 1.108.2 |
| Sass | `sass` | `.sass` | Dart Sass 缩进语法 |
| Less | `less` | `.less` | Less 4.9.1；关闭内嵌 JavaScript |
| Stylus | `stylus` | `.styl` | Stylus 0.64.0 |
| CSS-in-JS | `css-in-js` | `.css.ts` | vanilla-extract + esbuild 提取静态 CSS |
| Thematic CSS | `tcss` | `.tcss` | 官方 tcss-cli 1.0.0 |

SCSS／Sass 当前编译器需要 Node ≥20.19。TCSS 是 [Thematic CSS](https://docs.rs/crate/tcss-cli/1.0.0)，不是 Textual 的终端样式。先通过 `cargo install tcss-cli --version 1.0.0 --locked` 安装官方编译器，使 `tcss` 在 PATH 中可用；其文档提及的 `tcss-js` 当前不可从 npm 获取，脚手架不引用它。TCSS 在作者机器上构建，不把 Rust 工具链引入桌面运行时。

CSS-in-JS 使用 [vanilla-extract 的 esbuild 集成](https://vanilla-extract.style/documentation/integrations/esbuild/)。只把提取的 CSS 放入分发目录，求值 JavaScript 留在开发输出中。所有样式仍经过同一主题校验，不放宽远程 URL、`@import`、路径逃逸或资源大小限制。构建时的 Sass／TCSS 导入可被编译器展开；最终 CSS 仍存在的 `@import` 会拒绝。

## 构建与分发目录

`qwertysay.build.json` 声明开发类型和语言。`qwertysay build <源码目录>` 编译到临时目录，校验成功后生成 `dist/package`，包含清单、作者 LICENSE、必要入口或 CSS、`assets/` 和版权说明。开发源码、package.json、构建脚本、缓存及 node_modules 不进入分发包。自定义本地资源放在 `assets/`，CSS 使用 `url("assets/...")`。

通过原项目路径执行 `check`／`pack` 时会检查源码指纹；修改源码后必须重建，失败的重建使旧输出失效。指纹不代表完整依赖锁定或作者认证；隐藏文件、工具缓存和外部依赖不是完整的重现构建证明。直接指定 `dist/package` 是检查已生成的快照，不核对开发源码。没有构建配置的原有自包含目录仍可直接校验与打包。

开发时加载 `dist/package`，然后检查、安装停用快照并明确启用。分发用 `.tpp`（插件）和 `.tpt`（纯主题），二者内部是受限 ZIP；`.zip` 不是安装后缀。将可执行包重命名为 `.tpt` 会拒绝。源码的 `.go`、`.elm`、`.tcss` 和运行入口的 `.cjs` 都不能与这两个分发后缀混用。两种后缀都不代表安全认证。

## JSON 桥接 v1

SDK 的 `defineJsonExtension({ actions, start })` 返回 API 1 扩展。`start(receive)` 创建语言运行实例并返回 `{ send(json), dispose?() }`；两端传递 JSON 字符串。SDK 的类型定义给出完整判别联合。

- 宿主向语言发送 `init`（API 版本与配置）、`invoke`（数字 id、action、上下文与 input）、`cancel`、`event`、`service-result` 和 `dispose`。
- 语言返回 `result`（同一 id 及 result 或 error）、`service`（调用 id、唯一 callId、受控服务名及 args）或 `log`。
- 服务为 `storage.get`、`storage.set`、`project.readFile`、`project.symbols`；实际能力仍由宿主检查。磁盘服务看不到未保存的缓冲区。
- 每消息上限 4 MiB、最多四个并行调用、每调用最多十六个在途服务和六十四次服务请求；9.5 秒未响应取消调用。宿主自身还有独立的超时与结果校验。
- 取消、超时和停用后忽略旧结果，不再为该调用启动新服务。已经交给宿主的服务不等于被操作系统撤回。卸载清理监听与语言实例；最终编辑仍走宿主的提案、状态校验与撤销。

这层协议解耦语言的值表示和 TeXPro 的运行时对象，不授予额外权限，也不是沙箱。

## 跨平台与版权

CLI 使用路径 API、Node 启动脚本及参数数组。Windows 上 Elm 走其 npm 包的 Node 包装器；Scala.js 可设置 `TEXPRO_SBT_LAUNCHER` 为 sbt-launch.jar 的路径，并使 `java` 在 PATH 中可用，避免依赖 `.bat` 的 shell 引用规则。路径含空格时，终端命令中的路径应使用引号。

GopherJS 与 Go 的版本必须匹配。在本次较新的 macOS 环境中，Go 1.21 默认内部链接的工具缺少 LC_UUID；外部链接后还需修复本机签名才能运行。使用匹配工具链执行 `go install -ldflags=-linkmode=external github.com/gopherjs/gopherjs@v1.21.0` 后，可对自己构建的工具执行本机 ad hoc 签名。该路径需要系统 C 链接工具；不是 TeXPro 应用签名或发布步骤。其他平台按上游工具链要求安装，不把本机通过宣称为三平台原生验收。

SDK 与 qwertysay 自有代码为 Baolin Liu（gardenialiu）MIT。生成工程的 LICENSE 属于作者；编译后嵌入的标准库与第三方代码保留其原协议。构建器收集可识别的依赖许可证、PureScript 包集许可证，并附带 Elm、Scala／Scala.js、Go／GopherJS、ClojureScript／Closure 的上游通知；作者新增依赖仍需自行审核并通过 `THIRD_PARTY_NOTICES.md` 补充。不要把所有编译产物称为“仅 MIT”。

## MCP 与验证

`texpro_extension_capabilities` 返回开发格式、工具链、后缀和边界；无需打开工程。`texpro_inspect_extension` 校验当前工程内的已构建目录或 `.tpp`／`.tpt`，返回清单、摘要、大小和风险提示，不导入入口、不构建、不安装、不启用。拒绝越界与符号链接逃逸。现有 `mcp` 动作类型仍不会自动注册到外部 stdio；后续可在明确授权与工具白名单下深化调用协议，而不能直接开放任意脚本。

完整基线继续要求零失败、零跳过、零 TODO。语言／样式编译矩阵另外验证真实编译器、归档、Unicode 选区与实际宿主；缺失工具是失败，不用模板字符串测试冒充编译通过。构建开发工具不等于完成应用打包、Windows／Linux 原生交互或 npm 发布。

真实矩阵入口为 `npm run test:extensions:authoring -- --tools /absolute/compiler-prefix`。Node 编译器依赖按生成模板固定版本安装在该 prefix，Java／sbt／GopherJS／TCSS 需在 PATH 中准备；缺失工具会失败，不跳过。可附加单项名称进行诊断，完整验收仍需默认全部运行。
