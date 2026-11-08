---
slug: dev-renderer
title: The renderer
group: 开发
order: 12
summary: No router and no state library: one App.tsx orchestrates all state, the editor is CodeMirror 6, the visual layer projects through decorations, and studio panels lazy-load on demand. Learn these four layers first when reading the code.
---

## What this layer is

The renderer is a single-page React app with entry `src/main.tsx`, mounting `src/App.tsx`. There is no router, no Redux or Zustand, and no data-fetching layer — all cross-component state is orchestrated in `App.tsx` with `useState` and `useRef`, and every interaction with disk, compiling, and Git goes through `window.texpro` over IPC.

The UI has four parts: `components/Sidebar.tsx` on the left (file tree, symbols, search), `editor/EditorPane.tsx` in the middle (CodeMirror), `components/PdfPane.tsx` on the right (PDF.js), and 29 studio panels opened on demand. Themes and typography all live in `src/styles/app.css`.

## File table

| File | Lines | Role |
| --- | --- | --- |
| `src/App.tsx` | 2846 | Top-level state, effects, compile and close orchestration, keyboard shortcuts |
| `src/editor/EditorPane.tsx` | 939 | CodeMirror instance, per-file EditorState cache, change write-back |
| `src/editor/visual.ts` | 1174 | Visual-layer decorations: math, tables, TikZ, scores, sections |
| `src/components/PdfPane.tsx` | 885 | PDF.js rendering, zoom, inverse lookup |
| `src/components/Sidebar.tsx` | 721 | File tree, assets, symbols, search |
| `src/i18n.ts` | 1845 | English-and-Chinese dictionary keyed by the English source string |
| `src/app/lazyTools.tsx` | 70 | Lazy loading and crash isolation for 29 studios |
| `src/styles/app.css` | 9602 | Three themes, editor and panel styles |

`src/lib/` holds another 36 pure-logic modules (latex, pdfSync, lineDiff, templates, importers and so on) that do not depend on React and can be covered directly by `node --test`.

## Concurrency: drop late results with generations

At any moment a project switch, a recompile, a forward lookup, an inverse lookup, or reopening the same file may overlap, and by the time those async results come back the context may no longer hold. The approach is one incrementing ref per kind of operation, compared right after `await`:

```ts
const run = ++compileRunId.current;
const result = await window.texpro.compile({ ...args });
if (run !== compileRunId.current) return;        // this round is already stale
if (generation !== projectGeneration.current) return;
```

One incrementing ref per async domain: `compileRunId` for compiling, `projectGeneration` for project switches, `syncGeneration` and `inverseGeneration` for the two SyncTeX directions, `navigationGeneration` for outline and search jumps, and `openRequest` for repeated opens of the same file. Copy this pattern for new async flows; do not use a "cancelled" flag or a bare `setState`.

## The save queue

Writes to disk are serialized. The comment on `SaveQueue` in `src/app/saveQueue.ts` puts it plainly: make it impossible for an older write to finish after a newer one. `saveDoc()` first waits for an in-flight file operation, rewrites the path with `movedPath`, and then enters the queue:

```ts
await fileOperation.current;                     // wait for the move/rename to settle
const target = movedPath(path, operation);
await saveQueue.current.run(() => window.texpro.writeFile(target, content));
```

`saveAll()` loops at most 5 rounds collecting dirty documents, then does one more pass after `await saveQueue.current.idle()`. It is called before closing a window, switching projects, and compiling — any new code that bypasses the queue and writes to disk directly reintroduces the "old content overwrites new content" problem.

## The compiler only orchestrates here

The order inside `runCompile()` is worth remembering: when busy, park the request in `pendingCompile`; generate a runId of `run-<timestamp>`; call `saveAll()` first; then `openProject(root)` to re-read the root file configuration (if the root file changed, clear the PDF, diagnostics and hot spots, and increment the generation); then send `compile`; and before writing results back, verify that both the project generation and the runId still match.

Compile output is streamed; `onCompileOutput` filters on `output.runId === compileRunId.current`, handles `stream === 'meta'` separately, and keeps only the last 90000 characters of the log. After the window closes the main process skips `sender.send`, and the renderer discards by generation.

## The editor: five compartments

`EditorPane` does not rebuild the EditorState; runtime switching goes through `Compartment.reconfigure()`:

| Compartment | What it switches |
| --- | --- |
| `visual` | Mutual exclusion between visual-layer decorations and source mode |
| `focus` | Focus on the current paragraph, everything else dimmed |
| `typewriter` | Typewriter scrolling |
| `lineNumbers` | Line number gutter |
| `collab` | Yjs collaboration extension |

The notable entries in the extension list are `history`, `writingTargets`, `stableViewport`, `writingReview`, `bracketMatching`, `closeBrackets`, `autocompletion` (which overrides the completion sources, with `maxRenderedOptions: 80` and `defaultKeymap: false`), and `foldGutter`. In the keymap, `Mod-z` / `Mod-Shift-z` / `Mod-y` bypass CodeMirror history and call back into `onProjectHistory` for project-level undo; Tab accepts a completion only when `!view.composing`; `ArrowUp` / `ArrowDown` go through `moveLogicalLine` so the cursor moves by logical line when crossing visual blocks.

Each file's `EditorState` lives in a `sessions: Map`; on switching back it is reused — scroll position included — when `cached.state.doc.toString() === props.value`, and otherwise `EditorState.create()` runs again. On a project switch, `App` replaces the whole Map instead of clearing entries one by one.

## Visual layer: one scan, first come first served

`buildDecorations()` in `visual.ts` rescans the whole document on every document or selection change, and an `occupied` interval table guarantees a single decoration per position. The scan order is fixed (top to bottom), and where a new block-level element is inserted decides whether earlier blocks swallow it:

- Score blocks (`musicWidget`)
- Tables (`writingTable` / `tableWidget`)
- Heading lines
- Inline and display math, including `equation`, `align`, `gather`, `multline`, `eqnarray`
- Figures, tables, code blocks
- Labels and references
- Wrap-up (section badges, writing targets, and so on)

Math renders through KaTeX with `throwOnError: true`, `strict: 'ignore'`, `trust: false`, `maxExpand: 500`, plus five macros: `\R`, `\N`, `\Z`, `\C`, `\dd`. Results go into `mathHtmlCache`, keyed by `d:` or `i:` plus the TeX source, with LRU eviction beyond 800 entries. A failed render returns an empty string and the UI falls back to source.

Clicking a visual block returns to source: `bind()` on `LatexWidget` intercepts mousedown and puts the cursor at the start of the block. TikZ and diagram previews additionally deduplicate through `tikzRequests` and then fetch the image with `rasterizeTexPdf`.

## Lazy loading and crash isolation

`deferredTool()` in `src/app/lazyTools.tsx` does three things: it returns `null` when the tool has never been opened (not even issuing `import()`); it calls `lazy(load)` only on first open; and an outer `RecoveryBoundary` catches render exceptions so only that one panel fails. `generation` serves as the key, which allows a single panel to be rebuilt without refreshing the whole page.

The path for a new panel: register in `lazyTools.tsx` → write the panel in `components/` → add a block in `app.css` → add both languages in `i18n.ts`. Panels load only when the user opens them; never statically `import` one at the top level of `App.tsx`.

## Making changes

Adding a visual element: define the interval and `WidgetType` in `visual.ts`, insert it at the right place in `buildDecorations()`, make sure the `overlaps()` logic covers it, then add the styles in `theme.ts`. Do not start a second ViewPlugin in `EditorPane` for the same kind of work.

Adding a setting: add the default to `defaultSettings` in `src/app/settings.ts`, handle migration of old values in `loadSettings`, then wire it into the state and UI in `App.tsx`. The persistence key is `texpro.settings.v1`, and `aiApiKey` is deliberately stripped so it never reaches localStorage.

Adding an async flow: first decide which generation it belongs to, capture the current value of the matching ref, and compare on return; anything that writes to disk goes through `SaveQueue` first.

## Pitfalls

- Calling `setState` directly on the result of an `await`: with no generation check, old data lands in the new view after a project switch
- Editing the doc of an `EditorState` by hand instead of going through the `textChange` diff: replacing the whole document sends the cursor to the top
- Doing heavy computation in decorations: `buildDecorations` runs on every keystroke, so heavy work belongs in a cache or in the main process
- Statically importing heavy dependencies (PDF.js, KaTeX) in a panel: it bloats the main bundle and defeats lazy loading

## Verification

```bash
npm run typecheck
npm run build && npm run smoke
```

The smoke run walks through real interactions and screenshots into `artifacts/`; look at `smoke-*.png` to see the effect of a visual-layer change. The test matrix is in `/docs/dev-testing`, and the boundary between the editor and the main process is in `/docs/dev-arch`.
