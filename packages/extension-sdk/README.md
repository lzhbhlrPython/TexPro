# @gardenialiu/texpro-extension-sdk

Independent TeXPro API 1 TypeScript contracts, authoring helpers and package validation core. **Baolin Liu (gardenialiu), MIT, Node.js 20+.** No Electron or React dependency.

[简体中文](README.zh-CN.md)

## Install and author

```sh
npm install --save-dev @gardenialiu/texpro-extension-sdk
```

```ts
import type { Extension } from '@gardenialiu/texpro-extension-sdk';
export const activate: Extension['activate'] = ctx => {
  ctx.handle('uppercase', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

Declare actions and capabilities in `texpro.extension.json`, and compile to a self-contained `.cjs` or `.mjs` entry before packaging. Type-only imports need no runtime dependency. `defineExtension(activate)` optionally wraps a function as an extension object; `API_VERSION` is 1.

The `index.d.ts` contracts cover UTF-16 edit proposals, diagnostics, completions, hover, text previews, import/export, bibliography, assets, build requests, configuration, saved project reads and storage. Use `onDispose` for cleanup. TeXPro verifies identity/expiry and applies accepted changes in one undoable transaction. Advanced providers and UI contributions remain experimental; arbitrary React/HTML and editor internals are not exposed.

## qwertysay scaffold

The CLI is a separate package, **[@gardenialiu/qwertysay](https://www.npmjs.com/package/@gardenialiu/qwertysay)**:

```sh
npx --package @gardenialiu/qwertysay qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

Default: TypeScript; `--language js`: JavaScript without a build step; `--type theme`: theme. Plugin artifacts use `.tpp`, theme-only artifacts `.tpt`. Packages are shared manually, without a public plugin marketplace or automatic updates.

## Shared tooling

`require('@gardenialiu/texpro-extension-sdk/package-tools')` exposes `validateManifest`, `readPackage`, `validatePackageType`, `pack`, `unpack` and theme parsing helpers. qwertysay and the desktop use this same validation core. It checks API compatibility, portable paths, archives and theme resources; it never installs dependencies, makes network requests or executes extension code. Checks cannot prove handler correctness. Normal non-hidden source files are packaged; keep secrets out of the tree.

## Trust and recovery

**Code plugins retain the current user's Node file, network and process permissions. Capability declarations and process isolation are not an OS sandbox. Themes can conceal controls, impersonate trusted UI or harm accessibility. Enable only trusted authors.** CSS restrictions, suffixes and integrity digests do not certify safety or authenticate authors.

Recover via native **View → Reset Appearance and Disable Extensions**, or launch TeXPro with `--safe-mode`. Test actual artifacts in a temporary profile, including stale requests, project changes, IME, undo, both languages, three base themes and recovery. CLI checks do not replace native or packaged-app acceptance.

## Source and licenses

[Source](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/packages/extension-sdk), [authoring contracts](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-development.md), [examples](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/examples/extensions), [developer Skill](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/skills/texpro-extension-development).

Koishi inspired the disposable lifecycle and service organization. This is original TeXPro code, not a Koishi-compatible runtime; no Koishi source or console is included. MIT (LICENSE); PostCSS and postcss-value-parser retain their own MIT notices in their npm distributions. Third-party extensions and assets need their own attribution.
