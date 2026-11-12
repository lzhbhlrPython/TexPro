---
slug: extension-development
title: Extension SDK, qwertysay and development Skill
group: Development
order: 65
summary: Develop and distribute local API 1 extensions, tools and themes with explicit contracts and verification.
---

## Entry points

The independent npm SDK `@gardenialiu/texpro-extension-sdk` provides API 1 contracts and validation. The separate `@gardenialiu/qwertysay` package provides the `qwertysay` scaffold, check and pack CLI. It is authored by Baolin Liu (gardenialiu), under MIT, and requires Node.js 20+, without Electron or TeX. Source lives in `packages/extension-sdk/`; types are in `index.d.ts`. `examples/extensions/writing-kit` demonstrates handlers and services; `quiet-paper` contains data-only resources. Install the whole `skills/texpro-extension-development/` directory into your AI tool's skill directory if desired. TeXPro never installs global Skills automatically.

The design draws on Koishi's disposable lifecycle and service organization. TeXPro implements its own protocol and includes no Koishi runtime, console source or market service. Koishi plugin formats are not compatible. New TeXPro code and examples are MIT; third-party materials retain their own licenses.

```sh
npx --package @gardenialiu/qwertysay@0.2.0 qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

TypeScript is the default. Use `--language js` for JavaScript or `--type theme` for themes; all new projects build explicitly. Output is outside the source directory and never overwrites files. Init/check/pack do not install dependencies, access networks or execute extensions. Explicit build runs trusted compiler/project code and may download dependencies; `npx` may download tools. Use `qwertysay check` for directories/archives and `qwertysay pack` to package them.

## npm releases

Version 0.1.0 was first published on 2026-11-12. Current version 0.2.0 adds multilingual builds; both packages are authored by Baolin Liu (gardenialiu), under MIT:

| npm package | Version | Responsibility |
| --- | --- | --- |
| [@gardenialiu/texpro-extension-sdk](https://www.npmjs.com/package/@gardenialiu/texpro-extension-sdk) | 0.2.0 | API 1 types and shared validation core |
| [@gardenialiu/qwertysay](https://www.npmjs.com/package/@gardenialiu/qwertysay) | 0.2.0 | qwertysay scaffolding, validation and packaging |

Release verification checks registry versions and integrity digests against tested tarballs, then independently installs the registry packages to verify TypeScript, JavaScript and theme scaffolds, compilation, archives and rejection paths. Published developer tooling does not imply a public plugin marketplace; extension artifacts are still shared manually.

## Format and handlers

Packages contain `texpro.extension.json` and LICENSE. The manifest declares a namespaced id, author, version, license, `apiVersion: 1`, capabilities and contributions. Executable entries are self-contained `.cjs` or `.mjs`; compile TypeScript before packaging. No install scripts, runtime dependency installation or native binaries are supported. ZIPs are limited to 16 MiB and 300 files; traversal, symlinks, duplicate paths and corrupt data are rejected.

```js
exports.activate = ctx => {
  ctx.handle('rewrite', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

Declare actions in the manifest. Offsets are UTF-16. Accepted edits are checked against project generation, file, document identity and package state, then applied through an editor transaction with undo and IME protection. Handlers may return diagnostics, completions, text, export files, project proposals or build requests. Builds retain the existing save and main-file workflow.

## Capabilities and lifecycle

Capabilities cover document reads, edit proposals, project reads, build requests, local storage, network access and custom theme styles. Invocation snapshots contain permitted unsaved source; project file and symbol services read disk. Storage is limited to 1 MiB per extension. Configuration is not credential storage.

Use `ctx.handle`, `ctx.on`, `ctx.onDispose` and returned disposers. Activation is limited to five seconds and calls to ten seconds. Failures, crashes and timeouts disable the extension. Old results are rejected after closing or changing projects. Executable packages retain your user-level Node permissions; SDK declarations are not a security sandbox: code can read files, access networks or start processes. Themes can conceal controls or impersonate trusted UI. Enable only trusted packages.

Package lifecycle and basic results form the stable API 1 boundary. Advanced providers and UI contributions remain experimental. Dynamic completions and hover have editor adapters; checkers feed Problems; other providers use explicit tools. MCP data is not automatically registered with external stdio MCP. Themes support semantic colors, font families, dimensions and constrained package CSS/assets; see [theme packs](/docs/themes). Content previews are plain text. Arbitrary React/HTML injection, binary asset output and custom TeX engine processes are not exposed in this release.

## Verify and distribute

```sh
npm run test:extensions
npm run typecheck
npm run test:extensions:ui
node scripts/pack-extension.cjs examples/extensions/quiet-paper /tmp/quiet-paper.tpt
```

Choose a new output filename. Install the built artifact in a temporary profile and verify lifecycle, configuration, failures, expired results, IME, undo, themes and uninstall. Host changes require the complete regression baseline with zero failures, skips and TODOs; targeted reruns do not replace it.

Reloading a development directory installs a disabled snapshot for review and re-enabling. Packages are shared manually. Updates retain the previous package for rollback; uninstall retains plugin data. Handoff includes source, artifact, license, API version, exact checks, actual evidence and limitations. See repository `docs/extensions.md`, `docs/extension-development.md` and the [handoff guide](/docs/dev-handoff).

L3 workspaces share host navigation and focus recovery. macOS navigation reserves space for native window controls; Windows/Linux retain their native titlebar layout. Contributions should not cover host navigation.

Packages use `.tpp` for plugins and `.tpt` for themes (both are ZIP containers). A `.tpt` contains only theme configuration, CSS and assets, with no executable entry, actions or other plugin contributions. Renaming a code package to `.tpt` is rejected; file suffixes are not a safety certification.

## Language and theme compilation

SDK/qwertysay `0.2.0` provides the following build features while retaining API version 1. Version `0.1.0` contains the original TS/JS/CSS scaffolds.

```sh
npx --package @gardenialiu/qwertysay@0.2.0 qwertysay init my-plugin --id author.example --language coffee
```

In the generated project, install dependencies and build explicitly:

```sh
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

| Plugin language | Option | Source suffix |
| --- | --- | --- |
| TypeScript / JavaScript | `--language ts` / `js` | `.cts` / `.cjs` |
| CoffeeScript / PureScript | `--language coffee` / `purs` | `.coffee` / `.purs` |
| ReScript / ClojureScript | `--language rescript` / `cljs` | `.res` / `.cljs` |
| Elm / Scala.js / GopherJS | `--language elm` / `scala` / `go` | `.elm` / `.scala` / `.go` |

| Theme style | Option | Source suffix |
| --- | --- | --- |
| CSS / SCSS / Sass | `--type theme --style css` / `scss` / `sass` | `.css` / `.scss` / `.sass` |
| Less / Stylus | `--style less` / `stylus` | `.less` / `.styl` |
| Static CSS-in-JS | `--style css-in-js` | `.css.ts` |
| Thematic CSS | `--style tcss` | `.tcss` |

Source suffixes, runtime files and installable artifacts are distinct. Plugins compile and bundle to a self-contained `.cjs` entry and distribute as `.tpp`. Themes compile to static `.css` and distribute as `.tpt`. Do not import `.purs`, `.elm`, `.scss`, `.tcss` or `.zip` directly. Load `dist/package` in Extensions for development; checking/packing from the source root detects stale builds. Existing self-contained directories remain compatible.

`init`, `check` and `pack` do not install, access the network or execute author code. Explicit `build` runs trusted compilers/project configuration and toolchains may download dependencies. Staging contains only the manifest, author LICENSE, entry or CSS, assets and notices. Sources, build scripts, node_modules and CSS-in-JS evaluation scripts never enter a theme artifact. Failed rebuilds invalidate old output; unrelated output files are not overwritten.

PureScript's Spago requires Node ≥22.5; the current Sass compiler needs Node ≥20.19. ClojureScript requires Java 21+; Scala.js needs Java/sbt. GopherJS needs matching Go 1.21.x and an explicit `go mod tidy`. On Windows, `TEXPRO_SBT_LAUNCHER` can point to sbt-launch.jar. Older Go tools on recent macOS may need external linking and local ad hoc signing. One local machine does not establish native acceptance on all platforms.

TCSS means [Thematic CSS](https://github.com/tosiiko/TCSS), not Textual CSS. Install `cargo install tcss-cli --version 1.0.0 --locked` and put `tcss` on PATH. The scaffold does not use the unavailable npm `tcss-js`. CSS-in-JS uses vanilla-extract and esbuild to extract static CSS at build time. All output still passes the same style/resource validation; themes can still hide controls or impersonate UI.

## JSON bridge, licenses and MCP

`defineTextTransform` is a starter for compiled string transforms; `defineJsonExtension` provides the complete language transport. Elm uses DOM-free Platform.worker ports for JSON invocation, result, cancellation, events, configuration, services and disposal. UTF-16 offsets remain intact, and host edit proposals, identity and expiry checks still apply. The bridge allows four concurrent invocations, 4 MiB messages and a 9.5-second timeout; each invocation allows sixteen in-flight service calls and sixty-four total service requests. Late results are discarded after cancellation; already-started host operations are not automatically undone.

Original SDK/qwertysay code is MIT; generated LICENSE files belong to extension authors. Embedded Elm, Scala/Scala.js, Go/GopherJS, ClojureScript/Closure and PureScript runtimes retain their own licenses. The builder collects known notices; authors must review added dependencies/assets. Do not describe every generated artifact as MIT-only. Build tools and Node plugins have user permissions; process isolation is not a security sandbox. Build, install and enable trusted sources only.

External MCP adds read-only `texpro_extension_capabilities` for formats/toolchains/suffixes/limits and `texpro_inspect_extension` for manifests, digests, sizes and risks of built packages inside the project. Neither builds, executes, installs nor enables plugins. Experimental manifest `mcp` actions still do not register automatically. Future controlled invocation needs explicit enabling, tool allowlists, stable schemas and cancellation/expiry contracts; automatic execution is not part of this change.

See repository `docs/extension-authoring.md` for the full protocol and test entry points. Real compiler/archive tests supplement the complete zero-skip baseline, without replacing IME, undo, recovery or cross-platform native acceptance. This work adds no desktop page or mode.
