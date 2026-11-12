---
slug: qwertysay
title: "qwertysay: guided plugin and theme development"
group: 开发
order: 66
summary: Start without arguments to create, build, check or pack; choose toolchains, preserve minimal themes and recover safely.
---

## Start the guide without memorizing flags

**@gardenialiu/qwertysay 0.3.0** is an independent Node tool by Baolin Liu (gardenialiu), with MIT original code. It needs Node.js 20+, not Electron or TeX; some compilers need newer versions. The SDK remains 0.2.0 / API 1: see the [SDK guide](/docs/extension-development). For AI workflows, see the [development Skill](/docs/extension-skill).

```sh
npx --package @gardenialiu/qwertysay@0.3.0 qwertysay
```

Alternatively install globally and run `qwertysay`. npm/npx may download tools, but qwertysay create/check/pack never installs dependencies for you. Windows PowerShell, macOS and Linux use the same numbered choices and Enter; no shell-specific syntax, color control or external menu tool is required.

Choose Simplified Chinese or English, then create, build, check or pack. Review paths and configuration before execution. Only y, yes or 是 starts the operation; Enter cancels. Ctrl+C or EOF cancels an operation that has not started. Noninteractive input fails clearly instead of waiting for prompts or accepting defaults.

## Create a plugin

The guide asks for package type, destination, package ID, author and language. TypeScript is the default; an example ID is `author.example`. The author is written into the MIT LICENSE. Use a real attribution and review bundled dependencies separately.

The destination must be new or empty. Occupied and symlink directories are rejected. Invalid choices, IDs and colors can be corrected. Nothing is created before final confirmation. Creation generates source only: no npm install, compiler or extension execution.

| Language choice | Source | Prerequisites |
| --- | --- | --- |
| TypeScript | `.cts` | Node.js, TypeScript |
| JavaScript | `.cjs` | Node.js |
| CoffeeScript | `.coffee` | CoffeeScript |
| PureScript | `.purs` | PureScript, Spago; Node ≥22.5 |
| ReScript | `.res` | ReScript |
| ClojureScript | `.cljs` | Java 21+, shadow-cljs |
| Elm | `.elm` | Elm, Platform.worker JSON ports |
| Scala.js | `.scala` | Java, sbt, Scala.js |
| GopherJS | `.go` | GopherJS 1.21, matching Go 1.21.x |

Generated package.json pins tools. Enter the directory and explicitly run `npm install`, then install non-npm prerequisites from its README. Run qwertysay again, choose build and supply the source directory. Load **dist/package** in TeXPro, not the author source root.

## Choose a minimal or advanced theme

The first theme option is **Accent only, no compilation**. Choose paper, studio or night and a six/eight-digit hex accent. The result contains exactly `texpro.extension.json` and LICENSE: no entry, CSS, build configuration or node_modules. Other tokens inherit the base. Check and pack it directly as `.tpt`; no build is needed.

For layout, typography, fonts and assets, choose a style toolchain:

| Choice | Source | Compilation |
| --- | --- | --- |
| CSS | `.css` | Validate/copy static styles |
| SCSS / Sass | `.scss` / `.sass` | Dart Sass; Node ≥20.19 |
| Less | `.less` | Less |
| Stylus | `.styl` | Stylus |
| CSS-in-JS (static) | `.css.ts` | vanilla-extract + esbuild static extraction |
| Thematic CSS | `.tcss` | Official tcss-cli, not Textual CSS |

Install TCSS with `cargo install tcss-cli --version 1.0.0 --locked` and put `tcss` on PATH. The unavailable npm `tcss-js` is not used. CSS-in-JS evaluation scripts never enter `.tpt`. Finished themes contain static configuration, CSS and resources, subject to [theme safety rules](/docs/themes).

## Build, check and pack are distinct

| Operation | Input and result | Executes developer code? |
| --- | --- | --- |
| Create | New/empty directory → source, or directly packageable minimal theme | No |
| Build | Configured source → dist/package | Yes; trust compilers/configuration; dependencies may download |
| Check | Source, built directory, .tpp or .tpt → validation and digest | No |
| Pack | Source or distribution directory → new .tpp/.tpt | No |

Pack infers the suffix from the manifest and suggests an output outside source. Existing output, output inside source and mismatched suffixes are rejected. The container is restricted ZIP, but installation requires `.tpp`/`.tpt`.

Source-root check/pack verifies the source fingerprint. Changed sources require a rebuild; a failed build invalidates old output. Checking dist/package verifies that snapshot only. Minimal token themes and older self-contained directories have no build configuration and can be checked/packed directly.

## Errors and cancellation

Install actual missing tools from the generated README; never fabricate compiler output. GopherJS requires explicit `go mod tidy` before building. On Windows, Scala.js can use `TEXPRO_SBT_LAUNCHER` pointing to sbt-launch.jar with Java on PATH. Older Go on newer macOS may need external linking and local signing; see repository `docs/extension-authoring.md`.

Dependency-download failures are build failures. Check proxy, caches and toolchains, then retry. The guide does not delete source or unknown output. Cancellation prevents an operation from starting; it does not promise transactional rollback of an already running compiler, filesystem write or download. CLI checks are not native acceptance on three OSes.

## Existing commands and CI

Normal authoring needs only the guide. Existing arguments remain for scripts, CI and npm scripts; see `--help`. Init/build/check/pack without their paths also open the corresponding guide. CI must pass complete arguments; piped input never silently accepts defaults.

```sh
qwertysay build ./my-plugin
qwertysay check ./my-plugin
qwertysay pack ./my-plugin ./author.example.tpp
```

Build tools and Node plugins have user privileges; themes may impersonate UI. Checks and suffixes do not certify safety. Review sources/licenses and test actual artifacts for enable/disable, undo, IME, stale results, themes and recovery. There is no public marketplace or automatic publication of author plugins.
