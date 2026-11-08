---
slug: dev-testing
title: Testing and smoke runs
group: 开发
order: 13
summary: Unit tests use node --test, integration scripts exercise the real services, and UI regressions launch real Electron and leave screenshots in artifacts/. Each of the three layers covers its own span; pass at least the first two before committing.
---

## Three layers of verification

| Layer | Command | What it runs | Duration |
| --- | --- | --- | --- |
| Types | `npm run typecheck` | `tsc --noEmit` across the whole repo, strict | A few seconds |
| Unit | `npm run test:regression` | `node --test tests/*.test.cjs`, 13 files and 80 cases | About 2.5 seconds |
| UI | `npm run smoke` and `test:*:ui` | Launches real Electron, drives real interactions, takes screenshots | Tens of seconds and up |

Unit tests are pure Node and never load Electron, so they run on any machine with Node 22. UI regressions need `npm run build` first; the scripts do not build by themselves.

## Unit tests

13 files under `tests/`, using `node:test` + `node:assert` with no extra framework:

| File | Coverage |
| --- | --- |
| `project-root.test.cjs` | Root file detection: a single `\documentclass`, ambiguity, broken configuration |
| `pdf-sync.test.cjs` | SyncTeX coordinates round-tripping under zoom, crop, and rotation |
| `reliability.test.cjs` | The API after service extraction, pre-release checks, Git and history working together |
| `writing-flow.test.cjs` | Writing input: format detection, Markdown shortcuts, font and package selection |
| `writing-reliability.test.cjs` | Citation rewriting, rollback on failure, save queue ordering |
| `writing.test.cjs` | Writing blocks: page layout, figure and table ranges, table cells |
| `continuity.test.cjs` | Whole-block moves, revision rebuilding, comment and reference indexes |
| `music.test.cjs` | Scores: Unicode round-trips, durations across bars, part sharing |
| `nightly.test.cjs` | Change detection: time zone boundaries, empty commits, future timestamps, merges |
| `quit-watchdog.test.cjs` | The fallback arms only once and really does kill a wedged parent process |
| `inline.test.cjs` | Nested tables, escaped delimiters, inline preview fallback |
| `assets.test.cjs` | Assets and project deletion share the trash and stay out of the index |
| `artwork.test.cjs` | Illustration rendering and opacity under theme ink colors |

When writing cases, assert on output structure rather than on on-screen text: the former is stable, while the latter shatters with copy changes. Asserting on a thrown error message is more valuable than asserting a boolean, because a failure then shows exactly where it diverged.

## Adding a case

```js
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveProjectRoot } = require('../electron/services/project-root.cjs');

test('configured root wins over detection', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-root-'));
  fs.writeFileSync(path.join(root, 'main.tex'), '\\documentclass{article}');
  fs.mkdirSync(path.join(root, '.texpro'));
  fs.writeFileSync(path.join(root, '.texpro', 'project.json'), '{"rootFile":"main.tex"}');
  const project = resolveProjectRoot(root);
  assert.equal(project.rootSource, 'configured');
  assert.ok(project.rootFile.endsWith('main.tex'));
});
```

The services layer exports pure functions that can be required directly; do not launch Electron just to test something — that belongs to the smoke layer.

## Integration scripts

Each of the three scripts carries its own dependencies; check the environment before running:

| Command | Coverage | Output shape |
| --- | --- | --- |
| `npm run test:compile` | The compile chain: engines, diagnostic parsing, artifacts, cleanup | PASS / FAIL per item |
| `npm run test:import` | Round-trips of Markdown and Typst imports | PASS / FAIL per item, with a check summary at the end |
| `npm run test:mcp` | Starts the stdio MCP server and runs initialize, tools, resources, prompts | One check per item, requiring at least 12 tools |

`test:compile` compiles the `demo/` project in the repository directly, and build output lands in its own build directory; `test:import` creates a project in a temporary directory and cleans up afterwards. `test:mcp` accepts `TEXPRO_MCP_SERVER` pointing at another server entry point, defaulting to `mcp/server.mjs`.

## Smoke

`npm run smoke` builds first and then starts with `TEXPRO_SMOKE=1`. In this mode the main process does three things: add Chromium fallback switches (`no-sandbox`, `disable-gpu` and so on), point userData at `.texpro-userdata`, and load `electron/smoke.cjs`.

```js
module.exports = function installSmoke(mainWindow, { app, isSmokeWelcome }) { ... }
```

The smoke script takes over the window and, in order, opens the demo project, compiles, pages through, searches, and opens each studio, capturing a screenshot to disk with `webContents.capturePage()` at every step. The screenshot directory comes from `TEXPRO_ARTIFACTS`, defaulting to `artifacts/` at the repository root; a packaged app writes to `artifacts/` under userData.

Common artifacts: `smoke-welcome.png`, `smoke.png`, `smoke-lower.png`, `smoke-table.png`, `smoke-inline.png`, `smoke-math.png`, `smoke-compiled.png`, `smoke-pdf-search.png`, `smoke-pdf-thumbs.png`, `smoke-pdf-diff.png`, `smoke-templates.png`, `smoke-chart.png`, `smoke-layout.png`, `smoke-packages.png`, `smoke-commands.png`, `smoke-completions.png`. With `TEXPRO_PERF=1`, an extra performance sample is taken.

> Screenshots are evidence rather than snapshot comparisons: the smoke run checks key DOM states and filesystem results, and leaves the images for a human to look at.

## UI regression

`scripts/test-ui.cjs` and `scripts/test-flow-ui.cjs` are two entry points to the same thing, each only about twenty lines, with very thin logic:

- `mkdtemp` a temporary userData, setting `TEXPRO_SMOKE=1`, `TEXPRO_REGRESSION=1`, `TEXPRO_USER_DATA`, `TEXPRO_ARTIFACTS`, and `TEXPRO_EXIT_REPORT`
- `delete env.ELECTRON_RUN_AS_NODE`, then `spawn(require('electron'), ['.'])` with `stdio: 'inherit'`
- After exit, read the exit report: if the signal is `SIGKILL` but the report has `quit: true` with a matching pid and exit code 0, it is a PASS (the normal path where the quit watchdog did its job); otherwise judge by exit code

`test-ui` times out at 120 seconds; `test-flow-ui` at 180 seconds and forces `TEXPRO_FLOW_REGRESSION=1`. Branch switches: `--music`, `--writing`, `--assets`, `--continuity`, matching npm scripts such as `test:music:ui`. `TEXPRO_CLOSE_ONLY=1` tests closing only, and `TEXPRO_QUIT_METHOD=quit` uses `app.quit()` instead of `window.close()`.

Both `test-ui` and `test-flow-ui` assume `dist/` is up to date. Run them right after changing the renderer, and if you see a blank window, first ask whether you forgot to build.

## The exit path

The close protocol and the quit fallback each have a test surface: `electron/window-close.cjs` is covered end to end by the flow regression (real input is flushed to disk on `window.close()`, and a confirmation appears when there are unsaved changes), while `electron/quit-watchdog.cjs` is verified by `tests/quit-watchdog.test.cjs` for arming timing and the SIGKILL path. At minimum, run `npm run test:flow:ui` once when changing either.

## Pre-commit checklist

- `npm run typecheck` with zero errors
- `npm run test:regression` fully green (80 cases, skips allowed)
- If you touched the UI, run the matching smoke test and look at the new screenshots in `artifacts/`
- If you touched compiling, import, or MCP, run the matching integration script
- For copy changes, confirm both English and Chinese are present
- `dist/`, `artifacts/`, and `.texpro-userdata/` are not part of the commit

## Pitfalls

- The smoke run does not build automatically: running `npm run test:ui` directly exercises stale artifacts
- Screenshots looking unchanged does not mean nothing ran: check the file timestamps and counts
- Requiring Electron-related modules in a unit test: it drags in native dependencies, making tests slow and non-portable
- Running several UI regressions concurrently: they share the `artifacts/` directory and overwrite each other's filenames

## Verification

```bash
npm run typecheck && npm run test:regression
npm run build && npm run smoke
npm run test:flow:ui
```

Run the first before every commit; the second when you touch the renderer or the compile chain; the third when you touch closing, saving, or collaboration. CI's nightly runs only typecheck, test:regression, and build — UI acceptance still has to happen locally, see `/docs/dev-release`.
