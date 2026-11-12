# @texpro/qwertysay

Authored by **Baolin Liu (gardenialiu)**; original code is MIT. Requires Node.js 20+, without Electron or TeX. Version **`0.4.1`** adds language packs, npm/Yarn authoring and reviewed package-manager synchronization. The former scope’s `0.3.0` added bilingual guided workflows and minimal accent themes; `0.2.0` adds multilingual plugin builds, static theme compilation and the API 1 JSON bridge. Version `0.1.0` contains the original TS/JS/CSS scaffolds.

[简体中文](README.zh-CN.md)

## Guided usage

Since 0.3.0, start without arguments and choose create, build, check or pack step by step:

```sh
npx --package @texpro/qwertysay@0.4.1 qwertysay
```

Choose Simplified Chinese/English, operation, plugin/theme, destination, ID, author and language/style. Review paths/configuration before confirmation. Enter cancels by default; Ctrl+C/EOF cancels an operation that has not started. The first theme option is accent-only: select a base and accent to generate just the manifest and LICENSE, without CSS, scripts or compilation.

Creation never installs dependencies: run npm install explicitly. For ordinary sources, return to the guide to build and load dist/package in TeXPro. Minimal token themes check/pack directly. Pack suggests a new .tpp/.tpt outside source and refuses overwrite. Build executes trusted tools/configuration and may download dependencies; check/pack execute no code. Noninteractive startup fails instead of waiting. Complete legacy init/build/check/pack arguments remain for CI; see --help.

For source maintenance, run npm ci at the repository root, then node packages/qwertysay/bin/qwertysay.cjs; generated projects need both matching local SDK/CLI paths installed together. Detailed guides: [qwertysay](https://texpro.pyliubaolin.top/docs/qwertysay), [SDK](https://texpro.pyliubaolin.top/docs/extension-development), [development Skill](https://texpro.pyliubaolin.top/docs/extension-skill).

## Languages and styles

| Plugin language | Guide choice | Author source |
| --- | --- | --- |
| TypeScript / JavaScript | `ts` / `js` | `.cts` / `.cjs` |
| CoffeeScript / PureScript | `coffee` / `purs` | `.coffee` / `.purs` |
| ReScript / ClojureScript | `rescript` / `cljs` | `.res` / `.cljs` |
| Elm / Scala.js / GopherJS | `elm` / `scala` / `go` | `.elm` / `.scala` / `.go` |

| Theme style | Guide choice | Author source |
| --- | --- | --- |
| CSS / SCSS / Sass | `css` / `scss` / `sass` | `.css` / `.scss` / `.sass` |
| Less / Stylus | `less` / `stylus` | `.less` / `.styl` |
| Static CSS-in-JS | `css-in-js` | `.css.ts` |
| Thematic CSS | `tcss` | `.tcss` |

Generated projects pin compiler versions. PureScript's Spago requires Node ≥22.5; the current SCSS/Sass compiler requires Node ≥20.19. ClojureScript needs Java 21+; Scala.js needs Java and sbt. GopherJS needs matching Go 1.21.x; explicitly run `go mod tidy` first. Install Thematic CSS with `cargo install tcss-cli --version 1.0.0 --locked`; this is not Textual CSS and does not depend on the unavailable npm `tcss-js`. CSS-in-JS uses vanilla-extract and esbuild to extract static CSS; themes do not inject runtime JavaScript.

On Windows, set `TEXPRO_SBT_LAUNCHER` to sbt-launch.jar and put Java on PATH for Scala.js. Older Go tools on recent macOS may require external linking and local ad hoc signing. See the [toolchain and cross-platform reference](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/extension-authoring.md). Local validation is not native acceptance on all three platforms.

## Build and package boundaries

`init` never installs dependencies. `check` and `pack` never build, access the network or execute package entries. **Explicit `build` runs trusted developer tools and project configuration; toolchains may download dependencies.** New JS and CSS projects also build. Output is an isolated `dist/package` containing the manifest, LICENSE, entry or static CSS, assets and notices. Author sources, build scripts and node_modules do not enter the artifact.

Checking or packing a source directory verifies its source fingerprint; changed sources require a rebuild, and a failed rebuild invalidates old output. Passing the built directory checks that snapshot without comparing sources. Existing self-contained directories without build configuration remain compatible. Output must be outside the supplied source directory and must not exist. The 16 MiB / 300-file limits, portable paths, symlink/native binary rejection and theme validation still apply. `.tpt` rejects JavaScript/HTML and executable contributions; renaming code cannot bypass validation.

## SDK and JSON bridge

`index.d.ts` defines API 1 `ExtensionContext`, `InvocationContext` and `ExtensionResult`. The typed public `package-tools` export shares validation and read-only inspection. Source offsets use UTF-16. Edits are proposals: the host checks identity, expiry and capabilities, then applies explicitly accepted edits in one undoable transaction. Disk services do not see unsaved buffers.

```js
const { defineTextTransform } = require('@texpro/extension-sdk');
module.exports = defineTextTransform(text => text.toUpperCase());
```

This is author source that requires bundling the SDK, not a self-contained runtime entry. `defineJsonExtension({ actions, start })` provides a string-message transport for asynchronous languages: init, invoke, result, cancel, event, service, service-result and dispose. Elm uses Platform.worker ports. Controlled storage/project services, four concurrent invocations, 4 MiB messages and cancellation cleanup are supported. See the [protocol and limits](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/extension-authoring.md).

## Trust, licenses and MCP

**Build tools run with developer permissions. Node plugins have the current user's file, network and process permissions; process isolation is not an OS sandbox. Themes can hide controls, impersonate trusted UI or harm accessibility. Enable only trusted authors.** Validation, digests and suffixes do not certify safety. Recover using native **View → Reset Appearance and Disable Extensions** or `--safe-mode`, restoring the built-in paper and disabling all extensions.

The generated MIT LICENSE belongs to the author. SDK/qwertysay MIT does not replace licenses of embedded third-party runtimes. The builder collects identifiable dependency licenses and bundled runtime notices; authors must review added dependencies and supplement `THIRD_PARTY_NOTICES.md`. Koishi inspired lifecycle/service organization; its runtime, console source and plugin format are not copied.

External MCP adds read-only `texpro_extension_capabilities` and `texpro_inspect_extension` for format information and built packages inside the project. Neither builds, installs, enables nor invokes plugins. Manifest `mcp` actions still do not register automatically with external stdio clients. Packages remain manually distributed, without a public marketplace or updater.

Verify real compilation, archives, host invocation, stale requests, disable, undo, IME, themes and recovery as applicable. CLI checks do not replace native interaction acceptance. See the [authoring reference](https://github.com/lzhbhlrPython/TexPro/blob/main/docs/extension-authoring.md) and the repository development Skill.

## Language packs and npm/Yarn / 语言包与包管理

SDK 0.3.0 / API 1 and qwertysay 0.4.1 use the @texpro scope. Historical @gardenialiu packages remain immutable; install the new package names and update imports. / 使用新作用域并更新依赖与 import，旧版本不覆盖。

- [Language packs / 语言包](https://texpro.pyliubaolin.top/docs/language-packs): declarative .tpp, placeholder checks, missing-key fallback and preinstalled @texpro/extension-translate-zh-cn. / 声明式语言插件、变量校验、英文回退及预装简中。
- [npm/Yarn management / 包管理](https://texpro.pyliubaolin.top/docs/extension-package-management): one lockfile, node_modules, texpro.package wrappers, reviewed synchronization and removal with plugin data retained. / 单锁文件、分发包、逐项审核与卸载保留数据。

Language packs never contain code or styles, but translations may impersonate instructions. npm/Yarn changes dependencies; sync asks the host to install/update/remove its snapshots. It never auto-enables extensions. / 语言包没有代码或样式，文案仍可能误导用户。包管理器修改依赖，宿主另行审核同步，不自动启用。

After scaffolding a functional plugin, maintain its own i18n library and resources. Use each invocation context.language to select its catalog and bundle runtime dependencies/resources into the .tpp. Do not create a host language pack for plugin business messages. Manifest localization and runtime messages are separate paths; see the SDK guide.
