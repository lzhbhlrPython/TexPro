---
slug: dev-renderer
title: Renderer and continuous writing
group: 开发
order: 12
summary: Understand editing state, source projections, asynchronous identity and optional tools.
---

## Responsibilities

| Entry | Responsibility |
| --- | --- |
| src/App.tsx, src/app/ | Project, buffers, saving, compilation and close coordination |
| src/editor/EditorPane.tsx | CodeMirror instances, per-file sessions and input propagation |
| src/editor/visual.ts | Source projections for math, tables, headings and figures |
| src/editor/writingTargets.ts | Source-range mapping and invalidation for assistance |
| src/editor/writingSession.ts | Editing state and position restoration |
| src/components/PdfPane.tsx | PDF.js reading and bidirectional navigation |
| src/app/lazyTools.tsx | Deferred optional tools and error isolation |
| src/styles/, src/i18n.ts | Themes, surface styles and bilingual copy |

App.tsx still coordinates substantial state. Extract along existing boundaries rather than replacing the state architecture at once. Styles are split across writing, PDF, artwork, music and other surfaces; do not append everything to app.css.

## Source and projections

CodeMirror transactions edit source and enter history; decorations display visual results. Range scanners must handle balanced braces, nesting, comments and verbatim content. Keep a source fallback for complex input. Preview updates must not rebuild the whole document or interrupt IME composition.

Simple tables support direct cell editing; complex tables remain editable TeX. Music, circuits and structural formulas belong to the same writing flow. Tool panels are optional helpers, not prerequisites for ordinary composition.

## Saving and asynchronous writes

saveQueue.ts orders writes; input entered during saving remains dirty until saved. Compilation saves relevant buffers before resolving the project main file again.

Validate project, file, request identity and source ranges before applying results. writingTargets maps surrounding edits but rejects results after the target text changes. Cancellation does not replace receiver-side validation. Preserve active projections during IME composition.

## Preview and themes

KaTeX handles supported math. Full TeX, figures and music use local compilation and PDF.js display paths. Main compilation and auxiliary previews have separate cancellation, caching and result identities. Publish preview caches only after successful compilation.

Studio combines dark chrome with light paper; night also darkens the writing surface; paper is light. Monochrome previews can adapt to the theme while author colors and final PDFs retain their meaning. See [design language](/docs/dev-design).

## Verify

```sh
npm run typecheck
npm run test:regression
npm run build
```

Add relevant native UI regressions for input, selection, focus, scrolling and undo. Check project switching, closure, IME, asynchronous failures and tool cancellation. A normal screenshot alone does not verify continuous writing.

## Frontend implementation rules

The repository's docs/frontend.md is the implementation contract; DESIGN.md is its visual reference. Both apply.

- Keep project coordination, editor transactions, optional tools and pure logic in their existing modules. Native access goes through typed preload APIs.
- Reuse each surface's theme tokens, typography, states and icons. Check desktop paper/studio/night separately from website light/dark.
- Preserve source, selection, IME, undo and scroll. Routine content edits must not require a studio or completion dialog.
- Validate project, file, request and source identity before applying asynchronous results. Cancellation alone is insufficient.
- Desktop dialogs use the shared focus hook; website dialogs use Ant Design focus management. Check keyboard names, Tab, Escape and focus return.
- Express loading, empty, error and applicable selection states. Failure must retain source and provide a useful next step.
- Reuse lazy loading and caches; avoid unbounded work on input. Support reduced motion and long bilingual text.
- Maintain both languages and design documentation with code changes. Choose native interaction checks for input behavior; builds alone do not verify it.

Continue on the same task branch, commit verified work promptly and push when authorized. Merging main and publishing releases remain separate actions.

## Project-aware engine and extension boundaries

Source scanning, project context, pure projection providers and the CodeMirror adapter are maintained separately. Shared implementations live in `electron/services/tex-source-core.mjs`, `writing-path-core.mjs` and `writing-context-core.mjs`, with `.d.mts` declarations. Native previews, the renderer and MCP reuse these implementations. File readers are injected: the desktop prefers unsaved buffers, while MCP reads disk only. Automatic native reads validate real paths, file types and sizes; input expansion has depth, count and total-size limits.

The registry in `src/lib/writingEngine/` validates ranges, orders providers, isolates failures and caches by source and context. Math, graphics, text formatting, tables and diagram providers return original TeX UTF-16 ranges and semantic data; they do not edit source or manage the DOM or focus. `src/editor/visual.ts` owns selections, revisions and specialized-object conflicts; `src/editor/projection/widgets.ts` owns DOM and asynchronous artwork lifecycles. Prose and tables share bounded math rendering, and macro changes invalidate the cache.

Implement a pure provider first, register it explicitly, then add adapter support. Test nesting, comments, verbatim content, unfinished input, exact offsets and fallback. The registry is internal, not a new executable plugin entry point or a way around SDK capabilities. The repository's `docs/writing-engine.md` documents responsibilities and extension steps.

## MCP, SyncTeX and compatibility

Plugin API 1, existing commands, and existing MCP tool names and arguments remain compatible. The additive read-only `texpro_writing_context` tool describes the disk main file, static preamble and dependencies. It does not save, compile or access editor memory. SyncTeX has a separate service while retaining the existing `tex.cjs` exports. Numeric and real-path validation is centralized in `electron/services/synctex.cjs`; PDF.js viewport transforms remain in `pdfSync.ts`.

There is no known breaking plugin or MCP migration in this change. Invalid numeric values and outside paths are rejected explicitly. Graphics paths previously generated relative to a child file may need correction to the project working directory; guessing a different path would disagree with TeX. Any unavoidable future break must document affected versions, interfaces, migration and recovery in developer and release notes.

Context handling is L0 and inline projection is L1, with no new mode or page. The AI assistant expansion remains a separate deferred proposal and is not an engine dependency.

From the repository root, run `node scripts/test-flow-ui.cjs --project-writing` for the native multi-file flow, alongside the complete regression baseline, types, build, MCP stdio and actual package dependency verification. Validate imported projects in temporary copies; local success does not establish cross-platform verification.


## Maintain native typesetting and source editing independently

`writingEngine/native.ts` discovers opaque environments, unknown macro paragraphs and failed formulas; `useNativeWriting.ts` owns debounce, composition and result identity. `electron/services/native-writing.cjs` creates immutable temporary project copies, overlays unsaved buffers, and reuses the original class, packages, fonts and compiler. Unknown configuration fields are retained; only the copy’s build directory is redirected. Author files are not saved. Matching disk manifests and buffer contents can reuse completed PDFs. New requests cancel old processes and wait before cleanup. A temporary copy is not a TeX execution sandbox.

Literal chapter inputs use `includes.ts`, `useWritingComposition.ts` and `projection/includeWidget.ts` to compose a continuous flow while retaining each child’s independent UTF-16 source ranges. `WritingSurface` mounts the complete `EditorPane` into included projections through React portals. Each file retains its buffer, UTF-16 ranges and undo history. `composedEditing.ts` routes focused commands and file-identified asynchronous edits; external buffer refreshes do not enter ordinary undo. Repeated inputs receive one writable view, and collaboration keeps projections read-only. Opaque blocks use native SyncTeX boxes; reliable prose returns to host typography through `nativeText.ts`, while geometry remains artwork. Full PDF pages are not embedded in the document. PDF, source mapping and source text belong to the same snapshot. Unreliable mappings, resource limits and failures retain source and report through the existing problems list. `projection/nativeWidget.ts` owns visible-region loading, display density, viewport coordinates, authored colors and neutral-ink theming, keyboard/mouse source entry and resource cleanup. Pure providers must not acquire DOM or filesystem dependencies.

Syntax highlighting does not substitute for WYSIWYG. Source mode and inline source reveal retain `latexLanguage.ts`, `theme.ts`, completion and diagnostics; CodeMirror continues to own source and undo. Snapshot preload calls are desktop-only, preserve plugin `apiVersion: 1`, and do not expose editor memory to external MCP. The MCP disk-context tool remains read-only and the formal compilation interface stays unchanged.

Run `node scripts/test-flow-ui.cjs --native-writing` to separately check native pixels, arbitrary custom macros/environments, unsaved snapshots, source entry, syntax highlighting, undo, three themes and narrow windows. `--project-writing` covers static context and immediate projections; the complete regression baseline must also pass independently. Resource limits and cache contracts are documented in repository `docs/writing-engine.md`.

## Extending geometry adapters

The shared `electron/services/geometry-core.mjs` describes environment/command grammars, dependencies, necessary wrappers and driver restrictions. `texDocument.diagramBlocks` balances ranges and merges nested objects; `tex.cjs` resolves ambiguous grammars using the project preamble. Do not create a page for every package or duplicate parsers in UI components. Bare PGFPlots axes require a TikZ wrapper; nested drawings retain the outer object. Xy-pic/QCircuit spacing modifiers and qtree bracket trees remain intact. Proof trees distinguish bussproofs from ebproof using project declarations.

For each adapter, verify dependencies, engines, source locations, cancellation/staleness, authored colors and three themes. Run real PDF compilation through `node scripts/test-geometry.mjs`; recognition alone is not toolchain acceptance. This registry is internal and does not change the public extension SDK. External programs, shell-escape and unverified Lua packages must not be described as automatically supported. See repository `docs/writing-engine.md` and `docs/geometry-compatibility.md` for contracts and limits.

Source modes in existing studios share `TexSourceEditor` and `useDiagramPreview`. Local editing retains highlighting, IME and undo; cancel/close discards stale results. Unmarked scores retain original source ranges; complex constructs are not forced into recovered models. `--source-studio` checks inline recognition, source previews, exact replacement and undo.


### Source and visual modes inside the studio

`texVisualEdits.ts` returns UTF-16 ranges for recognized literals. `TexVisualEditor` validates the original text and replacement type/range, and edits only that span. Source and visual modes share a draft and preview; the source CodeMirror stays mounted to preserve local undo. Handwritten circuits, chemistry and PGFPlots open their existing studios, without a parallel source tool. A generated node model remains writable only while it still describes the current source.

## File ownership in a continuous paper

The selected tab owns the outer paper, writing focus owns command targets, and the shared root resolver still owns the project main file. Never merge included chapters into a fabricated source file. Input transactions verify the project, file and original buffer text; stale views reject edits. The existing save queue covers all dirty buffers, and project label transactions rebase every mounted view.

Preserve chapter views during composition input. Preamble refreshes and background discovery must not recreate the active editor. Embedded editors share the outer scroll container, preventing competing scroll anchors; they do not add gutters or indent the prose further. Ordinary undo is per file; cross-file continuous selection and chronological project-wide typing undo are not implemented.

From the repository root, run `node scripts/test-flow-ui.cjs --composed-writing` for nested chapter input, file save/autosave, separate undo, select-all confinement, keyboard boundaries, composition, project label changes, repeated projections, three themes and narrow windows. Pure range and command-routing coverage lives in `tests/composed-editing.test.cjs`. Plugin API 1, MCP and SyncTeX receive no breaking interface changes. External MCP still reads disk and must not claim access to unsaved in-place editor buffers.

## Text arguments and syntax boundaries

Heading and format projections track their prefix, text argument and suffix separately. Input and selection inside the argument preserve formatting; command/brace boundaries reveal source, and reviews still reveal the complete affected projection. Original UTF-16 offsets, CodeMirror transactions, IME and undo remain authoritative. There is no second editable HTML document. Once projections are assigned, visible syntax determines whether digits use prose colors; unknown or incomplete TeX retains source highlighting.

From the repository root, run `node scripts/test-flow-ui.cjs --inline-writing` for mouse input, Chinese composition, nested formatting, exact saved source, undo, heading source entry and three themes. Run the complete regression baseline as well. Plugin APIs and MCP are unchanged and require no migration. Arbitrary complex macros may still require source entry; this does not establish universal direct text editing.

Block projections share the margin-free flow-root container in `projection/blockWidget.ts`. It includes the original component spacing in CodeMirror’s measured height map. Forward updates and destruction to preserve chapter nodes, events and asynchronous resources. Do not compensate for omitted margins with coordinate constants. The native UI journey checks exact typing positions after the preamble, title, equation and table blocks.

When the native fallback expands an unknown macro to its surrounding paragraph, it stops at `\input` or `\include` on its own line. Page breaks and headings keep their source ranges in the parent file, and each child keeps its own editor and SyncTeX mapping. The imported-project test waits for both chapter expansion and a rendered native fragment before checking the result in the master file.
