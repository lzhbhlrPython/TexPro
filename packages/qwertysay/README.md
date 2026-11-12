# @gardenialiu/qwertysay

qwertysay, an independent offline CLI for scaffolding, checking and packaging local extensions. Published by **Baolin Liu (`gardenialiu`)**, under MIT. Requires Node.js 20+; no Electron or TeX installation is needed for these tools.

[简体中文](README.zh-CN.md)

## Start a plugin

```sh
npx --package @gardenialiu/qwertysay qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

The default TypeScript scaffold compiles `src/index.cts` to `dist/index.cjs`. Use `--language js` for JavaScript with type annotations and no build step. Output: `../gardenialiu.example.tpp`. Install through TeXPro Extensions, review and enable. Dependencies are installed explicitly by the developer; the CLI never installs, requests network access or executes extension code. `npx` may download the SDK from npm.

## Start a theme

```sh
npx --package @gardenialiu/qwertysay qwertysay init my-theme --id gardenialiu.paper --author "Baolin Liu" --type theme
cd my-theme
npm install
npm run check:extension
npm run pack:extension
```

Output: `../gardenialiu.paper.tpt`. Themes contain configuration, optional CSS and local assets, with no executable entry, actions or other plugin contributions. Plugins use `.tpp`; both are ZIP containers. Renaming code to `.tpt` is rejected. Suffixes do not certify safety. Packages are shared manually; there is no public plugin marketplace or automatic updater.

## CLI

```sh
qwertysay init <directory> [--id author.name] [--author "Your name"] [--type plugin|theme] [--language ts|js]
qwertysay check <directory|file.tpp|file.tpt>
qwertysay pack <directory> <new-output.tpp|new-output.tpt>
```

Scaffolding requires a new or empty directory. Build TypeScript before checking or packing. Output must be outside the source directory and must not exist. Checks share TeXPro's manifest, API, portable-path, archive, integrity, size and theme validation core; they do not execute handlers or prove correctness. Normal non-hidden files are packaged; dotfiles and `node_modules` are omitted. Keep secrets out of the source tree.

Entries must be self-contained `.cjs` or `.mjs`; bundle runtime dependencies yourself and retain their licenses. The host never installs dependencies or runs install scripts. Archives are limited to 16 MiB compressed/expanded and 300 files; symlinks, traversal, corrupt data and native binaries are rejected.

## SDK

```ts
import type { Extension } from '@gardenialiu/texpro-extension-sdk';
export const activate: Extension['activate'] = ctx => {
  ctx.handle('uppercase', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

Declare actions and capabilities in `texpro.extension.json`. `defineExtension(activate)` optionally wraps the function as an extension object. Type-only imports require no SDK runtime. Contracts are in the SDK’s `index.d.ts`: UTF-16 edit proposals, diagnostics, completion, hover, text previews, import/export, bibliography, assets, build requests, configuration, saved project reads and storage. Use `onDispose` for cleanup. TeXPro checks identity/expiry and applies accepted edits in one undoable transaction. Advanced providers and UI contributions remain experimental; arbitrary React/HTML and editor internals are not exposed.

## Trust and verification

**Code plugins retain the current user's Node file, network and process permissions. Capability declarations and process isolation are not an OS sandbox. Themes can conceal controls, impersonate trusted UI or harm accessibility. Enable only trusted authors.** CSS restrictions and SHA-256 integrity checks do not authenticate authors.

Recover using native **View → Reset Appearance and Disable Extensions** or `--safe-mode`: all extensions are disabled before code loads and the built-in paper theme is restored. Review packages individually before enabling them again.

Install actual artifacts in a temporary TeXPro profile. Test lifecycle, configuration, stale requests, project changes, IME, undo, both languages, three base themes and recovery. CLI checks do not replace native or packaged-app acceptance.

## Source and licenses

[Source](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/packages/qwertysay), [authoring contracts](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-development.md), [examples](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/examples/extensions), [developer Skill](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/skills/texpro-extension-development).

Koishi inspired the disposable lifecycle and service organization. This is original TeXPro code, not a compatible Koishi runtime; no Koishi source or console is included. This package is MIT (LICENSE). PostCSS and postcss-value-parser retain their own MIT licenses in their npm distributions. Third-party extensions and assets require their own attribution.
