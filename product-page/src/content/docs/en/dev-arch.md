---
slug: dev-arch
title: Architecture and trust boundaries
group: 开发
order: 11
summary: Understand files, compilation and packaging through the main process, preload, renderer and external MCP server.
---

## Process boundaries

| Layer | Source | Responsibility |
| --- | --- | --- |
| Main process | electron/main.cjs, electron/services/ | Files, compilation, windows, system access and validation |
| Bridge | electron/preload.cjs | Explicit IPC wrappers and subscription cleanup |
| Renderer | src/App.tsx, src/editor/, src/components/ | Writing state, projections, interaction and feedback |
| Types | src/api.ts, src/types.ts | API contracts and shared data |
| External MCP | mcp/server.mjs | Ordinary Node stdio server with disk access |

Keep contextIsolation enabled and nodeIntegration disabled. The renderer must not call Node directly. The current Electron sandbox setting is not a complete sandbox guarantee; validate paths, inputs, senders, protocols and commands separately.

## Projects and files

project-root.cjs resolves the main file: explicit rootFile first, otherwise a unique uncommented documentclass candidate. Invalid configuration and ambiguity do not silently fall back. The active tab does not change the compilation entry.

project-files.cjs defines file boundaries. project-operations.cjs coordinates path-reference edits and failure rollback. src/app/fileOperations.ts updates open buffers so later saves do not restore old paths. This does not guarantee recovery from power loss.

## Add a capability

Update the main handler, preload wrapper, src/api.ts and src/types.ts together. Validate real paths, input, sender and asynchronous writes after closure. Equal handler counts do not prove matching interfaces.

For services loaded by external Node, check asarUnpack in package.json, scripts/verify-release.cjs and actual startup outside ASAR. MCP stdout carries protocol messages only; use stderr for logs. Unsaved editor content is not automatically visible to external MCP.

## Close and quit

window-close.cjs negotiates saving with the renderer; failures keep the window open. Quit follows successful saving and cleanup. On macOS, quit-watchdog.cjs arms only after irrevocable quit to handle native shutdown stalls. It does not replace saving or run for ordinary window closure.

## Network and permissions

AI, backups, LAN collaboration, MCP clients and the local read-only API have distinct trust boundaries. Optional networking does not imply automatic project upload; local-first does not mean every capability is offline. Inspect the actual CSP, protocols and allowed paths in main.cjs rather than copying an old policy string.

## Verify

```sh
npm run typecheck
npm run test:regression
npm run build
npm run verify:release
```

Add `npm run test:mcp` for MCP changes and relevant native regressions for save and close changes. See docs/technical-contracts.md in the repository and [release guidance](/docs/dev-release).
