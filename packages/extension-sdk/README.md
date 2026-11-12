# @gardenialiu/texpro-extension-sdk

By **Baolin Liu (gardenialiu)**, with MIT original code. Current **0.2.0 / API 1** requires Node.js 20+, without Electron, React or TeX.

[简体中文](README.zh-CN.md)

## SDK responsibilities

API 1 TypeScript types, defineExtension, defineTextTransform, defineJsonExtension and public package-tools validation/archive/read-only inspection are independent of the host. The SDK never installs plugins, invokes compilers or provides a permissions sandbox.

```sh
npm install --save-dev @gardenialiu/texpro-extension-sdk@0.2.0
```

## Separate guides

- [Plugin SDK](https://texpro.pyliubaolin.top/docs/extension-development): manifests, handlers, capabilities, services, lifecycle, JSON bridge and acceptance.
- [qwertysay](https://texpro.pyliubaolin.top/docs/qwertysay): independent 0.3.0 guided creation, language/style selection, build, check and pack without memorized flags.
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
