# @gardenialiu/texpro-extension-sdk

Authored by **Baolin Liu (gardenialiu)**; original code is MIT. Requires Node.js 20+, without Electron or TeX. This checkout is **`0.2.0-dev.0`, unreleased**. The verified npm `0.1.0` release retains the original TS/JS/CSS scaffolds and does not include the new build features below. Publication, deployment and publication authentication are paused.

[简体中文](README.zh-CN.md)

## Use the source checkout

Run `npm ci` in TeXPro, then use the local CLI:

```sh
node packages/qwertysay/bin/qwertysay.cjs init /absolute/my-plugin --id author.example --language coffee
```

In the generated directory, install both matching local packages together so npm does not request an unpublished development version:

```sh
npm install --save-dev /absolute/TeXPro/packages/extension-sdk /absolute/TeXPro/packages/qwertysay
npm run build
npm run check:extension
npm run pack:extension
```

The default is `--type plugin --language ts`. For a theme, use e.g. `--type theme --style tcss`. Load **`dist/package`** for development, inspect, install disabled, then explicitly enable. Distribute plugins as `.tpp` and themes as `.tpt`. Source and runtime entry suffixes are different from installable package suffixes. Both artifacts are restricted ZIP containers; `.zip` is not an installable suffix.

## Languages and styles

| Plugin language | `--language` | Author source |
| --- | --- | --- |
| TypeScript / JavaScript | `ts` / `js` | `.cts` / `.cjs` |
| CoffeeScript / PureScript | `coffee` / `purs` | `.coffee` / `.purs` |
| ReScript / ClojureScript | `rescript` / `cljs` | `.res` / `.cljs` |
| Elm / Scala.js / GopherJS | `elm` / `scala` / `go` | `.elm` / `.scala` / `.go` |

| Theme style | `--style` | Author source |
| --- | --- | --- |
| CSS / SCSS / Sass | `css` / `scss` / `sass` | `.css` / `.scss` / `.sass` |
| Less / Stylus | `less` / `stylus` | `.less` / `.styl` |
| Static CSS-in-JS | `css-in-js` | `.css.ts` |
| Thematic CSS | `tcss` | `.tcss` |

Generated projects pin compiler versions. PureScript's Spago requires Node ≥22.5; the current SCSS/Sass compiler requires Node ≥20.19. ClojureScript needs Java 21+; Scala.js needs Java and sbt. GopherJS needs matching Go 1.21.x; explicitly run `go mod tidy` first. Install Thematic CSS with `cargo install tcss-cli --version 1.0.0 --locked`; this is not Textual CSS and does not depend on the unavailable npm `tcss-js`. CSS-in-JS uses vanilla-extract and esbuild to extract static CSS; themes do not inject runtime JavaScript.

On Windows, set `TEXPRO_SBT_LAUNCHER` to sbt-launch.jar and put Java on PATH for Scala.js. Older Go tools on recent macOS may require external linking and local ad hoc signing. See the [toolchain and cross-platform reference](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-authoring.md). Local validation is not native acceptance on all three platforms.

## Build and package boundaries

`init` never installs dependencies. `check` and `pack` never build, access the network or execute package entries. **Explicit `build` runs trusted developer tools and project configuration; toolchains may download dependencies.** New JS and CSS projects also build. Output is an isolated `dist/package` containing the manifest, LICENSE, entry or static CSS, assets and notices. Author sources, build scripts and node_modules do not enter the artifact.

Checking or packing a source directory verifies its source fingerprint; changed sources require a rebuild, and a failed rebuild invalidates old output. Passing the built directory checks that snapshot without comparing sources. Existing self-contained directories without build configuration remain compatible. Output must be outside the supplied source directory and must not exist. The 16 MiB / 300-file limits, portable paths, symlink/native binary rejection and theme validation still apply. `.tpt` rejects JavaScript/HTML and executable contributions; renaming code cannot bypass validation.

## SDK and JSON bridge

`index.d.ts` defines API 1 `ExtensionContext`, `InvocationContext` and `ExtensionResult`. The typed public `package-tools` export shares validation and read-only inspection. Source offsets use UTF-16. Edits are proposals: the host checks identity, expiry and capabilities, then applies explicitly accepted edits in one undoable transaction. Disk services do not see unsaved buffers.

```js
const { defineTextTransform } = require('@gardenialiu/texpro-extension-sdk');
module.exports = defineTextTransform(text => text.toUpperCase());
```

This is author source that requires bundling the SDK, not a self-contained runtime entry. `defineJsonExtension({ actions, start })` provides a string-message transport for asynchronous languages: init, invoke, result, cancel, event, service, service-result and dispose. Elm uses Platform.worker ports. Controlled storage/project services, four concurrent invocations, 4 MiB messages and cancellation cleanup are supported. See the [protocol and limits](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-authoring.md).

## Trust, licenses and MCP

**Build tools run with developer permissions. Node plugins have the current user's file, network and process permissions; process isolation is not an OS sandbox. Themes can hide controls, impersonate trusted UI or harm accessibility. Enable only trusted authors.** Validation, digests and suffixes do not certify safety. Recover using native **View → Reset Appearance and Disable Extensions** or `--safe-mode`, restoring the built-in paper and disabling all extensions.

The generated MIT LICENSE belongs to the author. SDK/qwertysay MIT does not replace licenses of embedded third-party runtimes. The builder collects identifiable dependency licenses and bundled runtime notices; authors must review added dependencies and supplement `THIRD_PARTY_NOTICES.md`. Koishi inspired lifecycle/service organization; its runtime, console source and plugin format are not copied.

External MCP adds read-only `texpro_extension_capabilities` and `texpro_inspect_extension` for format information and built packages inside the project. Neither builds, installs, enables nor invokes plugins. Manifest `mcp` actions still do not register automatically with external stdio clients. Packages remain manually distributed, without a public marketplace or updater.

Verify real compilation, archives, host invocation, stale requests, disable, undo, IME, themes and recovery as applicable. CLI checks do not replace native interaction acceptance. See the [authoring reference](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-authoring.md) and the repository development Skill.
