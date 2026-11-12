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
npx --package @gardenialiu/qwertysay@0.1.0 qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

TypeScript is the default. Use `--language js` to omit the build step, or `--type theme` for themes. Output is outside the source directory and never overwrites files. The CLI does not install dependencies, access networks or execute extensions; `npx` may download the SDK. Use `qwertysay check` for directories/archives and `qwertysay pack` to package them.

## npm releases

Both packages were first published on 2026-11-12 by Baolin Liu (gardenialiu), under MIT:

| npm package | Version | Responsibility |
| --- | --- | --- |
| [@gardenialiu/texpro-extension-sdk](https://www.npmjs.com/package/@gardenialiu/texpro-extension-sdk) | 0.1.0 | API 1 types and shared validation core |
| [@gardenialiu/qwertysay](https://www.npmjs.com/package/@gardenialiu/qwertysay) | 0.1.0 | qwertysay scaffolding, validation and packaging |

Registry versions and integrity digests match the tested tarballs. Independent registry installs verified TypeScript, JavaScript and theme scaffolds, compilation, archives and rejection paths. Published developer tooling does not imply a public plugin marketplace; extension artifacts are still shared manually.

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
