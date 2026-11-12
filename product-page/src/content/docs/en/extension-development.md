---
slug: extension-development
title: "Plugin SDK: API 1 development"
group: 开发
order: 65
summary: Install the SDK and understand manifests, handlers, services, lifecycle, JSON bridges, permissions and acceptance.
---

## Choose the right guide

This guide covers **@gardenialiu/texpro-extension-sdk 0.2.0 / API 1**, by Baolin Liu (gardenialiu), with MIT original code. It provides public types, helpers, a JSON bridge and shared validation without Electron, React or TeX. Use [guided qwertysay](/docs/qwertysay) to create projects and choose toolchains; use the [development Skill](/docs/extension-skill) for AI-assisted work.

```sh
npm install --save-dev @gardenialiu/texpro-extension-sdk@0.2.0
```

Installing the SDK does not install a plugin into TeXPro. The host consumes finished, self-contained entries and resources; it does not install npm dependencies or compile author sources. Bundle runtime SDK helpers into the entry. A direct `activate(ctx)` export needs no runtime SDK import.

## Manifest, entry and distribution format

Every package root includes `texpro.extension.json` and LICENSE. Declare a lowercase namespaced ID, bilingual names, author, version, license, API version and minimum capabilities, matching the actual actions.

```json
{
  "id": "author.uppercase",
  "name": { "zh": "选区大写", "en": "Uppercase selection" },
  "version": "1.0.0",
  "apiVersion": 1,
  "author": "Your name",
  "license": "MIT",
  "entry": "index.cjs",
  "capabilities": ["document.read", "document.write"],
  "contributes": {
    "actions": [{ "id": "uppercase", "title": { "zh": "转换为大写", "en": "Uppercase" }, "kind": "transform", "level": "L2" }]
  }
}
```

Plugin runtime entries are self-contained `.cjs` or `.mjs`. TypeScript, CoffeeScript, PureScript, ReScript, ClojureScript, Elm, Scala.js and GopherJS must compile first. Distribute **`.tpp`** plugins or **`.tpt`** themes. Themes cannot have executable entries or plugin actions. Source, runtime and installer suffixes are distinct; renaming ZIP or disguising code as `.tpt` does not bypass checks.

## Propose one undoable edit

```js
exports.activate = ctx => {
  ctx.handle('uppercase', context => {
    if (context.signal.aborted) return {};
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

Declare the handler ID in the manifest. Source and selection belong to one invocation snapshot. Offsets use JavaScript **UTF-16 code units**, not bytes or code points. A permitted snapshot can contain unsaved text; disk services cannot.

Edits are proposals. On explicit acceptance, the host checks project, file, document identity, ranges, capabilities and extension state, then applies one CodeMirror transaction. Editing and undoing back to identical text still invalidates old identity. Never mutate the DOM, use internal editor objects or overwrite source files to bypass proposals.

## Capabilities, services and results

| Capability | Meaning and limit |
| --- | --- |
| `document.read` | Permitted source snapshot; not arbitrary filesystem authorization |
| `document.write` | Propose edits; acceptance and fresh identity still required |
| `project.read` | Controlled saved project text and disk symbols |
| `build.request` | Request compilation through save and real root resolution |
| `storage` | Up to 1 MiB JSON per plugin; not a credential store |
| `network` | Declare network intent honestly; this does not sandbox Node |
| `theme.styles` | Controlled package CSS; unnecessary for token-only themes |

`context.services.call` supports `storage.get({key})`, `storage.set({key,value})`, `project.readFile({path})` and `project.symbols()`. Project services read disk and enforce project paths. `ctx.config` exposes declared string, boolean and number settings, not secure credentials.

`ExtensionResult` can contain edits, diagnostics, completions, plain-text content, text output, a project creation proposal or `action: 'compile'`. Text previews do not interpret HTML. Export, import and compile retain explicit host flows. Arbitrary React/HTML injection, custom native TeX processes and binary asset results are unavailable.

## Lifecycle and cancellation

Register handlers with `ctx.handle()` and events with `ctx.on('projectChanged' | 'buildFinished', listener)`. Retain cleanup callbacks, use `ctx.onDispose()`, or return a disposer from activate to release timers, connections and external state. Loading is limited to five seconds and invocations to ten; failures, crashes and timeouts disable the extension.

Observe `context.signal` during asynchronous work. Cancellation, project switches, reload and disable must not write stale results. Cancellation cannot promise to reverse side effects already sent to the system or network. Avoid direct file mutations before returning proposals.

## Cross-language JSON bridge

Use `defineTextTransform()` for a compiled string transform; use `defineJsonExtension({actions,start})` for full messages and controlled services. Host messages are init, invoke, cancel, event, service-result and dispose; plugin messages are result, service and log. Elm uses DOM-free Platform.worker ports.

Limits: four concurrent invocations, 4 MiB per message, 9.5-second timeout, sixteen outstanding services and sixty-four service requests per invocation. API 1 permissions, UTF-16 offsets and expiry checks remain authoritative. See `index.d.ts` for types and repository `docs/extension-authoring.md` for build contracts.

## Validation, trust and handoff

The public `package-tools` export shares validation, archives and read-only inspection across host, MCP and CLI. Archives are limited to 16 MiB and 300 files; traversal, symlinks, duplicate paths and native binaries are rejected. Validation and digests establish format and identity, not safety.

**Node plugins have current-user file, network and process permissions. Process isolation is not an OS sandbox. Themes may hide controls, imitate trusted UI or harm accessibility.** Enable trusted sources only. Recover through native View → Reset Appearance and Disable Extensions, or `--safe-mode`. See [themes](/docs/themes) for style contracts.

Install the actual artifact in a temporary profile; verify enable, disable, reload, configuration, errors, stale results, IME, undo, themes and recovery. Host changes require the full regression baseline with zero failures, skips and TODOs. Preserve the author's LICENSE and third-party notices; SDK MIT does not replace bundled runtime licenses.

Handoff includes source, API/package versions, capabilities, artifact, digest, test evidence and limits. Advanced providers and UI contributions remain experimental. Manifest `mcp` actions do not automatically register externally. `texpro_extension_capabilities` and `texpro_inspect_extension` are read-only and never build, execute, install or enable plugins.
