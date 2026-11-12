# @texpro/extension-sdk

By **Baolin Liu (gardenialiu)**, with MIT original code. Current **0.3.0 / API 1** requires Node.js 20+, without Electron, React or TeX.

[简体中文](README.zh-CN.md)

## SDK responsibilities

API 1 TypeScript types, defineExtension, defineTextTransform, defineJsonExtension and public package-tools validation/archive/read-only inspection are independent of the host. The SDK never installs plugins, invokes compilers or provides a permissions sandbox.

```sh
npm install --save-dev @texpro/extension-sdk@0.3.0
```

## Separate guides

- [Plugin SDK](https://texpro.pyliubaolin.top/docs/extension-development): manifests, handlers, capabilities, services, lifecycle, JSON bridge and acceptance.
- [qwertysay](https://texpro.pyliubaolin.top/docs/qwertysay): independent 0.4.1 guided creation, language/style selection, build, check and pack without memorized flags.
- [Development Skill](https://texpro.pyliubaolin.top/docs/extension-skill): AI skill installation, invocation, boundaries and handoff.

## Runtime entry

```js
exports.activate = ctx => {
  ctx.handle('uppercase', context => {
    if (context.signal.aborted) return {};
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

Declare actions/capabilities in the manifest. Offsets are UTF-16. Edits are proposals checked for document identity and enablement after user acceptance, then applied in one undoable transaction. Observe cancellation and reject work after disable/project switches. project.readFile reads disk, not unsaved buffers. JSON storage is limited to 1 MiB per plugin and must not hold credentials.

A direct activate export needs no runtime SDK import. Bundle helpers and bridges into a self-contained .cjs/.mjs entry. Distribute .tpp plugins or .tpt themes. Themes cannot execute code; accent-only themes need just manifest and LICENSE. Source, runtime and installation suffixes are distinct.

## Bridge and inspection

See index.d.ts for exact contracts. defineJsonExtension carries init/invoke/result/cancel/event/service/service-result/dispose string messages, controlled services and cleanup. defineTextTransform starts a simple compiled string transformation. Limits: four concurrent invocations, 4 MiB messages, 9.5-second timeout. Host permissions and expiry checks remain authoritative.

Public package-tools shares the host/MCP core: 16 MiB, 300 files, no traversal, symlinks, native binaries or disguised theme code. Read-only inspection imports no compiler or entry. External MCP inspection never builds/installs/enables; manifest mcp actions do not automatically become external tools.

## Trust and attribution

**Node plugins have current-user file, network and process permissions. Process isolation is not an OS sandbox. Themes can hide controls or impersonate trusted UI.** Enable trusted sources only; native View recovery and --safe-mode remain available. Digests and suffixes do not certify safety.

MIT covers SDK original code, not every compiled language runtime, font or dependency. The builder collects identifiable notices; authors still review added dependencies and THIRD_PARTY_NOTICES.md. Koishi inspired lifecycle/service organization without copying its runtime, console or package format.

Maintenance requires package tests and the full zero-skip baseline, plus actual npm tarball installation, compilation, archives and rejection paths. Report publication and native runtime acceptance separately; source symlinks or local PASS are not publication evidence.

## Language packs and npm/Yarn / 语言包与包管理

SDK 0.3.0 / API 1 and qwertysay 0.4.1 use the @texpro scope. Historical @gardenialiu packages remain immutable; install the new package names and update imports. / 使用新作用域并更新依赖与 import，旧版本不覆盖。

- [Language packs / 语言包](https://texpro.pyliubaolin.top/docs/language-packs): declarative .tpp, placeholder checks, missing-key fallback and preinstalled @texpro/extension-translate-zh-cn. / 声明式语言插件、变量校验、英文回退及预装简中。
- [npm/Yarn management / 包管理](https://texpro.pyliubaolin.top/docs/extension-package-management): one lockfile, node_modules, texpro.package wrappers, reviewed synchronization and removal with plugin data retained. / 单锁文件、分发包、逐项审核与卸载保留数据。

Language packs never contain code or styles, but translations may impersonate instructions. npm/Yarn changes dependencies; sync asks the host to install/update/remove its snapshots. It never auto-enables extensions. / 语言包没有代码或样式，文案仍可能误导用户。包管理器修改依赖，宿主另行审核同步，不自动启用。

## Independent i18n for functional plugins

Each functional plugin owns its i18n library and translation resources. Host language packs translate TeXPro, not plugin business messages. Manifest labels use Localized objects with an en fallback. Runtime messages, diagnostics and previews select the plugin catalog from each invocation's `context.language`; JSON bridges receive invoke.context.language. Match exact locale, base language and the plugin's English catalog, then fall back per missing message. Do not cache the language during activate.

For an independent `i18n/messages.json` with en and fr catalogs, select `messages[context.language] || messages[context.language.split('-')[0]] || messages.en`, then use `table[key] || messages.en[key]` for missing messages. Keep plugin-owned keys and placeholders out of the host catalog. `contributes.locales` is reserved for declarative host translations and cannot be mixed with functional entries.

Use npm/Yarn to install your chosen language's i18n library. Bundle its runtime and include every referenced JSON/resource in the final self-contained `.tpp`; do not depend on host node_modules, private dictionaries or runtime downloads. Test target locales, regional and missing-message fallback, and language changes between two invocations in the same plugin process. Treat translations as text, never executable code or HTML.
