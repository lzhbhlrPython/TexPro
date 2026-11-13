---
slug: qwertysay
title: "qwertysay：引导式插件与主题开发"
group: 开发
order: 66
summary: 直接启动后选择创建、构建、校验或打包；语言与样式工具链、最简主题、取消和错误恢复。
---

## 启动引导，不必记参数

`@texpro/qwertysay` **0.5.0** 是独立 Node 工具，作者 Baolin Liu（gardenialiu），MIT。它不依赖 Electron 或 TeX；基础要求 Node.js 20+，具体编译器可能要求更高版本。SDK 为 0.4.0 / API 1，见[SDK 指南](/docs/extension-development)。AI 协作另见[开发 Skill](/docs/extension-skill)。

在普通交互终端执行一次：

```sh
npx --package @texpro/qwertysay@0.5.0 qwertysay
```

也可以全局安装后直接运行 `qwertysay`。npx／npm 可能下载工具，但 qwertysay 创建、校验和打包不会替你安装依赖。Windows PowerShell、macOS 和 Linux 终端使用相同的数字选择与回车，不依赖 shell 特有语法、彩色控制或外部菜单程序。

先选简体中文或 English，再选「创建插件或主题」「构建可信源码」「校验目录或安装包」「打包分发」。同一菜单也提供从 npm 获取扩展、创建 npm 分发包、创建 npm／yarn 扩展管理环境和同步依赖。每项操作显示路径和配置预览，只有明确输入 y／yes／是才开始；直接回车取消。Ctrl+C 或输入结束取消尚未开始的操作。非交互管道不会等待问题，明确失败并提示自动化入口。

## 创建插件

引导依次询问：扩展类型、新建目录、包标识、作者、开发语言、包管理器（npm／yarn）。默认 TypeScript，包标识示例 `author.example`。作者写入生成的 MIT LICENSE；请改成真实署名，并核对第三方归属。

新目录必须不存在或为空，已有文件与符号链接目录会拒绝；ID、颜色和选择错误可重新填写。最终预览确认前不创建目录。确认只生成源码，不执行 npm install，也不启动编译器或扩展。

| 引导中的语言 | 作者源码 | 工具链前提 |
| --- | --- | --- |
| TypeScript | `.cts` | Node.js、TypeScript |
| JavaScript | `.cjs` | Node.js |
| CoffeeScript | `.coffee` | CoffeeScript |
| PureScript | `.purs` | PureScript、Spago；Node ≥22.5 |
| ReScript | `.res` | ReScript |
| ClojureScript | `.cljs` | Java 21+、shadow-cljs |
| Elm | `.elm` | Elm、Platform.worker JSON ports |
| Scala.js | `.scala` | Java、sbt、Scala.js |
| GopherJS | `.go` | GopherJS 1.21、匹配的 Go 1.21.x |

生成的 package.json 固定所需工具版本。先进入生成目录，按所选包管理器明确执行 `npm install` 或 `yarn install`，只保留对应锁文件；yarn 使用 node_modules。按生成的 README 准备非 npm 工具，再重新运行 qwertysay，选择「构建可信源码」并填写该目录。构建后在 TeXPro 扩展管理中加载 `dist/package`，不是源码根目录。语言包没有构建步骤，见[语言包教程](/docs/language-packs)。

## 创建主题：简单配色或高级样式

选择主题后，开发方式的第一项是「仅修改主题色，无需编译」。再选 paper／studio／night 和六位或八位十六进制强调色，生成 **仅 `texpro.extension.json` 与 LICENSE** 的目录；没有入口、CSS、构建配置或 node_modules。其他 token 继承基础主题，可直接校验和打包 `.tpt`，不需要构建。

需要更自由的排版、字体、布局和资源时，在引导中选择样式工具链：

| 选择 | 源码 | 编译方式 |
| --- | --- | --- |
| CSS | `.css` | 校验与复制静态样式 |
| SCSS／Sass | `.scss`／`.sass` | Dart Sass；Node ≥20.19 |
| Less | `.less` | Less |
| Stylus | `.styl` | Stylus |
| CSS-in-JS (static) | `.css.ts` | vanilla-extract + esbuild，构建时提取 CSS |
| Thematic CSS | `.tcss` | 官方 tcss-cli，不是 Textual CSS |

TCSS 先执行 `cargo install tcss-cli --version 1.0.0 --locked` 并使 `tcss` 在 PATH 中可用；不使用 npm 上不可获取的 `tcss-js`。CSS-in-JS 的求值脚本不会放入 `.tpt`。最终主题都是静态配置、CSS 和资源，仍遵守[主题安全与样式规则](/docs/themes)。

## 构建、校验、打包的区别

| 操作 | 输入与结果 | 是否执行开发代码 |
| --- | --- | --- |
| 创建 | 新建或空目录，生成源码；最简主题生成可直接打包的目录 | 否 |
| 构建 | 有构建配置的源码目录 → `dist/package` | 是，需信任源码和编译器；可能下载依赖 |
| 校验 | 源码根、已构建目录、`.tpp` 或 `.tpt` → 清单、摘要、格式检查 | 否 |
| 打包 | 源码根或可分发目录 → 新 `.tpp`／`.tpt` 文件 | 否 |

打包引导按清单自动判断后缀，建议源码目录之外的输出路径。拒绝覆盖已有文件、输出到源码内，以及后缀与包类型不符。安装包内部虽是受限 ZIP，分发仍必须用 `.tpp`／`.tpt`。

源码根的校验／打包检查源码指纹：修改源码后需重新构建；构建失败使旧输出失效。直接检查 `dist/package` 只检查那个快照，不证明它仍匹配源码。最简 token 主题和旧版自包含目录没有构建配置，可直接检查／打包。

## 出错与取消后怎么办

缺少编译器时按生成 README 安装真实工具链，不能伪造编译产物。GopherJS 在构建前明确运行 `go mod tidy`；Windows Scala.js 可设置 `TEXPRO_SBT_LAUNCHER` 为 sbt-launch.jar 并使 Java 可用。较新 macOS 使用旧 Go 工具时可能需外部链接和本机签名，详见仓库 `docs/extension-authoring.md`。

网络依赖下载失败属于构建失败；检查代理、缓存和工具链后重试。引导不删除作者源码或不明输出。取消只阻止尚未开始的操作，不宣称已经开始的编译器、写入或外部下载可事务回滚。CLI 校验不是三平台原生交互验收。

## 旧参数与 CI

日常工作直接运行引导即可。旧命令保留用于脚本、CI 和 npm scripts；`--help` 查看完整参数，缺少全部路径的 init／build／check／pack 也进入相应引导。CI 必须传完整参数，非交互输入不会隐式接受默认值。

```sh
qwertysay build ./my-plugin
qwertysay check ./my-plugin
qwertysay pack ./my-plugin ./author.example.tpp
```

构建工具与 Node 插件拥有用户权限；主题也可能伪装界面。校验与后缀不是安全证书。只运行可信源码并审查许可证，安装实际包后验证启停、撤销、IME、过期结果、主题和安全恢复。没有公开插件市场或自动发布作者插件的功能。

## 语言插件与包管理环境

[语言包教程](/docs/language-packs)说明声明式模板、预装 @texpro/extension-translate-zh-cn、占位符校验与英文恢复。[npm／yarn 管理](/docs/extension-package-management)说明作者配置、分发包与经过审核的安装／更新／卸载同步。SDK 0.4.0 与 qwertysay 0.5.0 使用 @texpro；旧 @gardenialiu 版本保留独立历史。

功能插件生成后，在作者工程维护独立 i18n 库与资源；使用每次调用的 context.language 选择插件自身词典，并将依赖和资源一起构建到 .tpp。不要把功能插件误建为宿主语言包。清单多语种展示与运行消息是两条独立路径，详细示例见 SDK 指南。

## 源码发布 npm 与构建安全

源码可直接发布 npm，texpro.source 指向目录（省略为包根），不必先内嵌 .tpp／.tpt。SDK 0.4.0、qwertysay 0.5.0 和对应宿主支持此路径；旧归档分发继续兼容。可运行 JS／静态文件安装后直接同步；需要编译的包在 qwertysay 选择「构建已安装的源码扩展」，单独确认信任后再同步到 TeXPro 审核。构建配置和编译器拥有用户权限；禁用安装脚本和临时目录都不是沙箱。完整的作者发布、用户安装／升级／卸载、工具链限制与风险见 [npm／yarn 管理扩展](/docs/extension-package-management)。
