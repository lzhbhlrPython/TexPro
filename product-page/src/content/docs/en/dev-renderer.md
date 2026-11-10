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
