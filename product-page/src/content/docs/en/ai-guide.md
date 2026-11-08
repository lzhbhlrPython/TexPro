---
slug: ai-guide
title: A guide to AI-assisted development
group: AI 协作
order: 16
summary: To have a model change code in this repository, it needs three things: the boundaries it may change, the constraints it must not touch, and how to verify its work afterwards. This page is those three things.
---

## Why a separate page

TeXPro is not a large codebase, but its coupling is concentrated: `App.tsx` orchestrates everything, `tex.cjs` carries most of the services, and the visual layer rescans the whole document on every keystroke. If any of these three is "refactored along the way", features break silently — no error, just one link in the chain that stops updating.

So an instruction to a model cannot just say "implement X"; it must also state clearly what not to touch and how to prove afterwards that nothing broke. The rest of this page follows that order.

## Read these four first

| File | Purpose |
| --- | --- |
| `docs/architecture.md` | Module boundaries and key mechanisms (generations, decoration priority, SyncTeX semantics) |
| `PRODUCT.md` | Product positioning and hard constraints, deciding what should and should not be done |
| `README.md` | Feature list and usage; confirm a feature already exists before changing it |
| `electron/services/tex.cjs` | The real implementation of most capabilities; work backwards from the export table at the end of the file |

Do not start reading at the first line of `App.tsx` — it is the orchestration layer; first learn which services exist, then come back and see how it calls them.

## Repository map

| Path | Contents | Change frequency |
| --- | --- | --- |
| `electron/main.cjs` | Window, menu, 87 IPC handlers, path gate | Medium |
| `electron/preload.cjs` | The 90 methods exposed by `contextBridge` | Medium |
| `electron/services/` | 12 services: projects, compiling, history, Git, collaboration, MCP client, Paper API… | High |
| `src/App.tsx` | State orchestration, generations, mounting dialogs and panels | High (with care) |
| `src/editor/` | CodeMirror configuration, completion, decorations, collaboration binding | High |
| `src/components/` | UI components and the various studio panels | High |
| `src/i18n.ts` | All UI copy, keyed by the English source string | With features |
| `src/styles/app.css` | Site-wide styles (divided into blocks by comments) | With features |
| `mcp/server.mjs` | Standalone stdio MCP server | Low |
| `tests/` | `node --test` cases | With the services layer |
| `electron/smoke.cjs` + `scripts/` | UI smoke tests and packaging verification | With the process |

## Constraints that must not move

- **No glassmorphism**: `PRODUCT.md` has explicitly rejected it; do not reintroduce it in the name of being "more modern"
- **No state library**: cross-component state stays in `App.tsx`; no Redux / Zustand / Jotai
- **No second UI library**: icons only from Lucide, components only the existing panels and atoms
- **Never bypass preload**: the renderer cannot read files directly, cannot use `require`, cannot enable `nodeIntegration`
- **Never bypass the path gate**: any new IPC must go through `isAllowed()` first, and compare with `realpath` when symlinks are involved
- **No destructive writes**: snapshot before rewriting a file; compute impact before deleting or moving
- **No `any`**: the repository has zero `any` today, and new code does not make an exception
- **No hard-coded copy**: all UI copy goes through `t()`, with both English and Chinese complete

## Four invariants you must understand

### Generations

Each kind of async operation has an incrementing ref; after `await` it is compared first, and stale results are dropped. `runCompile`, `synctexForward`, `synctexInverse`, opening a project, and navigation all follow this pattern.

```ts
const run = ++compileRunId.current;
const result = await window.texpro.compile(project.root, file);
if (run !== compileRunId.current) return; // a result from the old project, drop it
setCompileResult(result);
```

Reuse the same pattern for new async flows: **take a number first, check the number on return**. Do not paper over a race with `setTimeout`.

### Decorations do not overlap

The visual layer uses an `occupied` interval table to guarantee one decoration per position; the interval holding the cursor falls back to source. A new kind of visual element has to be inserted into the queue by priority, with its nesting against tables, math, and TikZ handled.

The only caches are math HTML (LRU 800) and TikZ request deduplication. Rescanning the whole document is known performance debt; do not make it more expensive while making changes (for example by issuing requests inside it).

### Root file policy

`configured` takes precedence over `detected`; when detection cannot find a unique root file it is marked `ambiguous` — do not pick one on your own. Once the user chooses manually it is written to the project config, and the config wins from then on.

### SyncTeX semantics

Forward means "source line → page + coordinates"; inverse means "PDF point → file + line"; multiple hits return a list rather than a single point. Read `tests/pdf-sync.test.cjs` before changing canvas coordinates.

## Four common change paths

### Adding an IPC channel

```text
electron/main.cjs     ipcMain.handle('thing:do', async (_e, path) => {
                        if (!isAllowed(path)) throw new Error('File is outside the open project');
                        ...
                      })
electron/preload.cjs  thingDo: (path) => ipcRenderer.invoke('thing:do', path)
src/api.ts            thingDo(path: string): Promise<Result>
```

The channel name must be identical, character for character, in all three places. After the change, compare the two channel sets (87 each in preload and main, matching one to one); missing one yields an `undefined` at runtime.

### Adding a kind of visual element

Add a scan round inside `buildDecorations()` in `src/editor/visual.ts`, producing intervals shaped like existing decorations (with priority), then:

- reserve space in `occupied` so later rounds do not swallow it
- fall back to source when the cursor enters it
- when rendering has to be async (TikZ, scores), reuse the existing request deduplication instead of sending on every change

### Adding a studio panel

```text
src/components/ThingStudio.tsx      the panel itself (using existing atoms and tokens)
src/app/lazyTools.tsx               register deferredTool + RecoveryBoundary
src/styles/app.css                  add classes in the matching comment block
src/i18n.ts                         English and Chinese copy
```

Lazy loading is the default: `import()` happens on first open, state is kept after closing, and a crash is isolated by `RecoveryBoundary`.

### Adding a setting

Change all four together; miss one and you get "it can be changed but is lost after restart":

- Add the field to `Settings` in `src/types.ts`
- Add the default in `src/App.tsx` and persistence under `SETTINGS_KEY` (localStorage)
- Add the control in the settings panel
- Add both English and Chinese copy in `src/i18n.ts`

Secrets must not go into localStorage: encrypt with `safeStorage` and go through the main process.

## Debugging tools

| Goal | Approach |
| --- | --- |
| Renderer issue | `npm run dev`, then `Cmd/Ctrl+Shift+I` to open DevTools |
| Main process issue | Watch stdout / stderr in the terminal; the main process's `console.log` is directly visible in the foreground |
| IPC not working | Compare the channel names in all three places first, then check whether `isAllowed` threw "outside the open project" |
| Compile is wrong | Read the full `CompileOutput` log instead of only counting errors |
| Regression | `npm run smoke`; screenshots land in `artifacts/` |

## Verification checklist

```bash
npm run typecheck        # must be zero errors
npm run test:regression  # all 68 cases must be green
npm run smoke            # run when the UI changed; check the new screenshots in artifacts/
```

Once all three pass, write the change note: what changed, why it changed this way, and how far verification went. Do not hand in "it should work".

## Anti-pattern list

- Editing `dist/` directly — the next build overwrites it
- Building file paths in the renderer and handing them to the main process — the main process must resolve and validate them
- Using `setTimeout` to hide a race — use generations
- Round-tripping a whole document between React and CodeMirror through `setState` — it loses the cursor; go through the `textChange` diff
- Turning `sandbox` on "while you're at it" — first confirm the dependency surface of the main process services layer
- Rewriting `App.tsx` or `tex.cjs` in a single pass — the untested window is too large; change in steps
- Writing i18n copy with a Chinese key — the key is the English source string, and Chinese goes in the table

## A task template you can hand to an AI

```text
Scope: change only <file/directory>; do not touch other modules.
Goal: <one sentence describing the behaviour change>
Constraints: follow PRODUCT.md; add no dependencies; i18n complete in both languages; keep zero any.
Verify: npm run typecheck && npm run test:regression, plus npm run smoke if the UI changed.
Output: a change list + the reason for each change + verification results. If you find issues outside the scope, report them without modifying them.
```

## How to describe state when handing off

Three sentences more useful than "fixed":

- **What changed**: file + function, not just the module name
- **Why this way**: the constraint or the failure symptom, so the next person can judge whether the approach still holds
- **Verification boundary**: what was run and what was not (for example, "did not run the smoke test in an environment with TeX")

> This page is itself suitable as part of a prompt: paste the "constraints that must not move" and the "four invariants" sections to the model wholesale — more reliable than letting it summarise on its own.
