---
slug: dev-setup
title: Development setup
group: 开发
order: 10
summary: One repository, two runtimes: the renderer is bundled by Vite into ES modules, while the main process and the services layer run as plain CommonJS. With Node 22 and npm installed you can start the UI; TeX is needed only for compiling and previewing.
---

## What this layer is

`npm run dev` starts two processes, not two halves of one process. Vite serves only the renderer; `electron .` loads `electron/main.cjs`, which then opens the window, attaches the menu, and registers IPC and the services layer. Production takes a different path: `npm run build` emits the renderer into `dist/`, and the main process reads it with `loadFile`.

The only switch between the two paths is `VITE_DEV_SERVER_URL`. `electron/main.cjs:15` decides dev mode with `Boolean(process.env.VITE_DEV_SERVER_URL)`, and that same value decides whether DevTools opens, who supplies the CSP, and what the `texpro-asset` protocol writes into its CORS headers.

## Prerequisites

| Dependency | Version | Notes |
| --- | --- | --- |
| Node.js | 22 | The repository has no `engines` field; CI pins `node-version: 22`, so matching CI locally is recommended |
| npm | Bundled with Node | The committed lockfile is `package-lock.json` |
| TeX distribution | TeX Live or MacTeX, with `latexmk` and at least one engine | Required for compiling, SyncTeX forward and inverse lookup, and template previews |
| OS | macOS 13+ / Windows 10+ / Linux | Smoke tests and packaging are verified most thoroughly on macOS |

TeX paths are not hard-coded: `resolveTexBinary` in `electron/services/tex.cjs` probes the distribution and engines at runtime, so moving an installation requires no code change.

## First launch

```bash
npm install
npm run dev
```

`dev` expands to this command:

```bash
concurrently -k -n VITE,ELECTRON -c cyan,magenta \
  "vite --host 127.0.0.1" \
  "wait-on tcp:5173 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron ."
```

Three details are worth knowing up front: Vite sets `strictPort: true`, so a busy 5173 fails outright instead of shifting ports; `wait-on tcp:5173` keeps Electron from starting before the dev server; and `-k` takes the other side down when either side exits. Renderer changes go through HMR; any change under `electron/` needs a restart.

## Common scripts

| Script | Actual command | Purpose |
| --- | --- | --- |
| `npm run typecheck` | `tsc --noEmit` | Whole-repo type check, strict |
| `npm run build` | `vite build` | Emits `dist/`; the production CSP is injected at this step |
| `npm start` | `npm run build && electron .` | Runs the production build |
| `npm run smoke` | `npm run build && cross-env TEXPRO_SMOKE=1 electron .` | Drives the UI once automatically and screenshots into `artifacts/` |
| `npm run smoke:welcome` | adds `TEXPRO_SMOKE_WELCOME=1` | Runs the welcome screen scenario only |
| `npm run test:regression` | `node --test tests/*.test.cjs` | Unit tests, 13 files and 80 cases |
| `npm run test:ui` | `node scripts/test-ui.cjs` | Launches real Electron to run the UI regression |

Neither `test:ui` nor `test:flow:ui` runs a build; run `npm run build` first. See `/docs/dev-testing` for the full matrix.

## Environment variables

Smoke tests and regressions are switched entirely through environment variables; learn this set first when reading the code:

| Variable | Effect |
| --- | --- |
| `VITE_DEV_SERVER_URL` | When set, loadURL and open DevTools; when unset, loadFile `dist/index.html` |
| `TEXPRO_SMOKE=1` | Enters smoke mode: adds Chromium fallback switches and mounts `electron/smoke.cjs` |
| `TEXPRO_SMOKE_WELCOME=1` | Runs the welcome screen only, together with `smoke:welcome` |
| `TEXPRO_USER_DATA` | Overrides userData; tests isolate themselves with a temporary directory |
| `TEXPRO_ARTIFACTS` | Screenshot directory, defaulting to `artifacts/` at the repository root |
| `TEXPRO_EXIT_REPORT` | Exit report JSON, used by `scripts/test-ui.cjs` to judge whether the app exited cleanly |
| `TEXPRO_PERF=1` | Adds one performance sample to the smoke run |

Regression script selection is mutually exclusive; `electron/main.cjs:371-380` takes the first hit in a fixed order: `TEXPRO_FLOW_REGRESSION`, `TEXPRO_CONTINUITY_REGRESSION`, `TEXPRO_ASSETS_REGRESSION`, `TEXPRO_WRITING_REGRESSION`, `TEXPRO_MUSIC_REGRESSION`, `TEXPRO_REGRESSION`, and falls back to the default smoke run only when none is set.

## Directory map

| Directory | Contents |
| --- | --- |
| `src/` | Renderer: `App.tsx` orchestration, 17 files under `editor/`, `components/`, 36 modules under `lib/`, `app/lazyTools.tsx` |
| `electron/` | Main process `main.cjs` and `preload.cjs`, 11 services under `services/`, smoke and regression scripts |
| `mcp/` | Standalone stdio MCP server, `server.mjs` at 409 lines |
| `scripts/` | Integration tests, UI regression, release verification, nightly versioning — 12 scripts total |
| `tests/` | `node --test` cases and helpers |
| `demo/` | Demo project, opened by default by the smoke run |
| `docs/` | Architecture, reliability, interaction audit and related notes |
| `artifacts/` | Screenshot output, not shipped in the package |

## Machines without TeX

The UI, editor, visual layer, import and export, and version history do not depend on a local TeX installation, so development and debugging work normally. What fails is compiling, bidirectional SyncTeX lookup, template previews, and PDF font coverage checks — those requests return structured errors from the services layer and appear as notices in the UI rather than as crashes.

When writing tests, note that cases involving compilation should skip rather than fail hard. `tests/` already contains this conditional pattern; follow it.

## Code conventions

- TypeScript `strict` is on throughout; new code introduces no `any` escape hatch
- UI strings live in `src/i18n.ts`, keyed by the English source string; both English and Chinese must be added
- Icons come only from `lucide-react`; no second icon library
- No state management library; global state is orchestrated in `App.tsx` and pure logic sinks into `src/lib/`
- `electron/` and `mcp/` are CommonJS; do not write ESM syntax there
- `dist/` is build output and is never edited by hand; style changes go in `src/styles/`

## Common problems

- **5173 won't start**: with `strictPort` there is no automatic port switch; first check what is holding 5173
- **Electron shows a blank window**: neither was `VITE_DEV_SERVER_URL` injected nor `dist/index.html` built
- **Compile button is unavailable**: the root file is undetermined; check whether `Project.rootSource` is `ambiguous` or `missing`
- **Native dependency won't install**: `@napi-rs/canvas` is optional and already excluded from `files`; missing it does not affect the main flow
- **Main process changes have no effect**: there is no hot reload under `electron/`; restart `npm run dev`
- **Path errors appear only after packaging**: modules that must be loaded by path at runtime have to be in `asarUnpack`; miss one and the installed package reports a missing module, see `/docs/dev-release`

## Verification commands

```bash
npm run typecheck
npm run test:regression
npm run build && npm run smoke
```

All three must pass before committing. When you touch the UI, also run the matching UI regression from the table in `/docs/dev-testing`.
