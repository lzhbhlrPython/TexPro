---
slug: dev-arch
title: Processes and trust boundaries
group: 开发
order: 11
summary: The main process touches the filesystem, preload forwards only allowlisted channels, and the renderer never gets Node. 87 IPC channels, one path gate, and a tightened CSP make up the entire trust boundary of this application.
---

## Three processes

| Process | Entry point | Responsibility |
| --- | --- | --- |
| Main process | `electron/main.cjs` (921 lines) | Window, menu, 87 IPC handlers, services layer calls, shutdown cleanup |
| preload | `electron/preload.cjs` (108 lines) | `contextBridge` exposes `window.texpro`; every method is a one-line invoke with a hard-coded channel name |
| Renderer | `src/main.tsx` → `src/App.tsx` (2846 lines) | React 19 UI, CodeMirror, PDF.js, all state orchestration |

Window options are centralized in `createWindow()` (`electron/main.cjs:286-311`):

```js
webPreferences: {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
  spellcheck: false,
  backgroundThrottling: false,
}
```

`sandbox: false` lets preload use Node's `require`, while the services layer always runs in the main process. `contextIsolation: true` still isolates preload from the page, so the page only gets the `window.texpro` surface. `backgroundThrottling: false` keeps compiling and previewing in a background window from being throttled.

## How the 87 IPC channels are distributed

`ipcMain.handle` and `ipcRenderer.invoke` in `preload.cjs` both appear 87 times, matching one to one; there are also 4 subscriptions (`compile:output`, `mcp:elicitation`, `menu:action`, `window:prepare-close`) and 1 one-way send, `ipcRenderer.send('window:close-ready')`.

| Domain | Count | Representative channels |
| --- | --- | --- |
| `project:` | 19 | `open`, `symbols`, `impact`, `move-dir`, `graph`, `diagnose` |
| `mcp:` | 8 | `client-call`, `configs`, `respond-elicitation` |
| `git:` | 7 | `status`, `commit`, `overleaf-clone` |
| `history:` | 6 | `list`, `restore`, `clear` |
| `assets:` | 5 | `list`, `import`, `save-buffer`, `rasterize-svg` |
| `file:` / `templates:` | 8 | `stat`, `read`, `write`, `exists`, `preview`, `save` |
| 3 each | 18 | `shell:`, `secret:`, `collab:`, `zotero:`, `paper-api:`, `tex:` |
| 2 each | 10 | `compile:`, `sync:`, `app:`, `dialog:`, `bib:` |
| Singletons | 6 | `pdf:read`, `music:preview`, `tikz:render`, `backup:run`, `spell:words`, `menu:set-language` |

Name new channels after their domain; `invoke` only forwards, and business logic always lands in `electron/services/`.

## The path gate

The main process keeps an `allowedRoots` set (`electron/main.cjs:27`) and records the project root when a project is opened. Every handler that touches files first goes through `isAllowed()`:

```js
function isAllowed(file) {
  const resolved = path.resolve(file);
  for (const root of allowedRoots) {
    if (resolved === root || resolved.startsWith(root + path.sep)) return true;
  }
  return false;
}
```

The prefix check blocks `../` escapes; symlink escapes are caught separately wherever a service calls `realpath`. The error strings are part of the contract, because the renderer uses them to tell "no project open" from "out of bounds": `Project is not open`, `File is outside the open project`, `Asset is outside the project`, `Directory is outside the project`, `Invalid project path`.

## Custom protocol

To display project images and PDF preview thumbnails, the renderer uses `texpro-asset://` rather than `file://`. `protocol.handle` is registered inside `app.whenReady()`; a missing `path` parameter returns 400, a failing `isAllowed()` returns 403, and everything else is handed to `net.fetch` with CORS headers written differently for dev and production.

The renderer is never given path-building power: `app:assetUrl` goes through `isAllowed()` first and returns the encoded URL only on success, otherwise `null`. Images, PDF thumbnails, and TikZ previews all share this route.

## The 11 services files

| File | Lines | Responsibility |
| --- | --- | --- |
| `services/tex.cjs` | 2013 | Projects, compiling, SyncTeX, symbols, search, assets, TikZ, arXiv, templates, Zotero |
| `services/history.cjs` | 174 | Content-addressed snapshots: list, read, restore, prune |
| `services/mcp-client.cjs` | 132 | Connects to MCP servers from inside the app, including the elicitation callback |
| `services/project-operations.cjs` | 119 | Reference impact analysis and rewriting before a rename or move |
| `services/git.cjs` | 98 | Status, read file, init, commit, pull, push, Overleaf clone |
| `services/collab.cjs` | 87 | LAN collaboration: Yjs over WebSocket |
| `services/project-root.cjs` | 76 | Root file policy: configured, then detected, then ambiguous |
| `services/paper-api.cjs` | 56 | Read-only HTTP API, bound to loopback plus a token |
| `services/` remaining 3 | 51 | `font-report` font coverage, `project-files` text detection, `music` score source |

At the end of `tex.cjs`, the exports of `history` and `git` are spread into the same namespace: `module.exports = { parseDiagnostics, renderMusicPreview, ...history, ...git, openProject, ... }`. Callers require a single module, at the cost of the module boundary disappearing at the export layer — check that new function names do not collide.

## Network surface

- **Paper API**: binds to loopback only; a bearer token is generated at startup with `randomBytes(18)` and every request checks `Authorization`
- **Collaboration**: `WebSocketServer({ port: 4177, host: '0.0.0.0' })`; room IDs are 4-byte hex, and only room existence is checked — there is no passphrase and no roles — and it starts only when enabled manually
- **AI**: keys live in the system secure storage; requests are made from the renderer only once configured
- **MCP**: stdio, no network; path validation reuses the same rules

## Content Security Policy

The production CSP is not written in `index.html`; it is injected at build time by the `texpro-production-csp` custom plugin in `vite.config.ts`:

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: texpro-asset:; font-src 'self' data:; worker-src 'self' blob:;
connect-src 'self' ws: http: https:; frame-src 'self' texpro-asset:;
media-src 'self' texpro-asset: data:; object-src 'none'; base-uri 'self'; form-action 'none'
```

`style-src` allows `unsafe-inline` because of inline styles; `connect-src` is broadened to reach the local compile service and user-configured AI endpoints; `worker-src blob:` is needed by the PDF.js worker. When changing the CSP, also check the artifact verification described in `/docs/dev-release`.

## The close protocol

Closing a window is not an immediate exit but a three-round negotiation: `electron/window-close.cjs` intercepts `close`, generates a `randomUUID` as pending state, and notifies the renderer; the renderer replies with `window:close-ready` after `saveAll()`, and the main process accepts only when the sender matches and the id agrees; after 15 seconds without a reply it shows a native confirmation dialog, and `finish()` re-enters teardown through `setImmediate` so the window is not torn down inside an IPC callback.

On macOS there is also `electron/quit-watchdog.cjs`: on quit it spawns a detached child process, and if the parent is still alive after 5 seconds the child runs `kill -KILL`, catching a wedged Chromium native shutdown.

## Making changes

Adding an IPC channel touches three places:

- `registerIpc()` in `electron/main.cjs`: `ipcMain.handle('channel', ...)`, with path validation on the first line
- `electron/preload.cjs`: add an invoke wrapper for the same channel, plus `subscribe()` if a subscription is needed
- `src/api.ts`: add the method signature to `TexProApi`

Skipping preload yields an `undefined` at runtime; skipping the type is a compile-time error. Four numbers must change together: the handler count in main, the invoke count in preload, the method count in `api.ts`, and the 87 in this page.

Adding a service touches four places:

- Write a `.cjs` in `electron/services/`, using named exports and no side effects
- Add the path to `asarUnpack` in `package.json` (when the service is spawned or loaded by path)
- Add a line to the required list in `scripts/verify-release.cjs`, or the packaging check will not know about it
- Require it at the top of `main.cjs` and call it from the handler

Steps 2 and 3 are the easiest to miss: everything works in local development, and only the installed package reports the error.

## Pitfalls

- Building paths in the renderer and passing them in: always pass absolute paths and let the main process make the `isAllowed` decision
- Putting business logic in preload: preload has no Node privileges, and it widens the injection surface
- Calling `window.open` or navigating in-app directly: `setWindowOpenHandler` only lets http(s) through to the system browser and denies the rest
- Sending streaming output back without checking `sender.isDestroyed()`: `compile:output` throws after the window closes

## Verification

```bash
grep -c "ipcMain.handle" electron/main.cjs && grep -c "ipcRenderer.invoke" electron/preload.cjs
npm run typecheck
```

Both grep counts should be 87. After changing the services layer or the packaging config, also run `npm run verify:release`; details in `/docs/dev-release`.
