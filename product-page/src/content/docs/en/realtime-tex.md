---
slug: realtime-tex
title: Realtime TeX preview
group: 使用
order: 3.5
summary: Preview unsaved paragraphs with bundled rtex-ts and local LuaLaTeX, with full-layout fallback, formal PDF output and explicit limits.
---

## Open the existing PDF preview

Realtime TeX rendering is an L0 enhancement inside the existing PDF preview. There is no experimental switch or preview mode to select. With automatic compilation enabled and the compile mode set to something other than manual, compatible LuaLaTeX projects automatically use the bundled [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts). Disabling automatic compilation also disables realtime sessions. No VS Code, extension or Rust executable is required. Local LuaLaTeX, document packages and fonts are still needed.

- Confirm the project main file; select it explicitly if multiple candidates exist.
- Keep the author's engine choice. CTeX/fontspec detection usually selects XeLaTeX. After checking template compatibility, the author can declare `% !TeX program = lualatex` in the actual main file.
- Open PDF preview and keep writing. Page preparation, zoom, navigation and scrolling use the existing preview surface.

TeXPro does not rewrite fonts, templates or engine declarations. Unsupported projects use the existing compilation workflow. Like regular compilation, LuaLaTeX executes document code with your permissions; this is not a sandbox. No cloud document transfer is added.

## Writing and layout

Validated prose and inline mathematics can update glyphs before background layout corrects pagination and references. Headings, tables, TikZ, unknown macros and unreliable results wait for full layout. Unsupported fonts or drawing operations use the matching PDF page without extra fallback badges or a list of engine states.

Live updates accept unsaved buffers without forcing a save. Autosave keeps its existing setting. Composition defers synchronization without taking editor focus or undo history. Editing a child file preserves the project main file. Paragraph positions, pagination and references can remain provisional until full layout; formal PDF output remains authoritative.

## One toolbar, PDF preparation when needed

Zoom, fit width, page navigation, spreads and presentation share the existing toolbar and scroll state. Search, thumbnails, copying, comparison, opening or revealing the PDF, and region navigation prepare a formal PDF when needed: relevant buffers are saved and compiled before the operation continues. No manual mode switch is required. Failed builds or source changes during preparation prevent actions on stale results.

Manual compilation also displays the formal PDF. The next source edit resumes live updates automatically. PDF inspection may save files; live glyph updates themselves do not. A running realtime session suppresses duplicate automatic compilation. Closing it or an acceleration failure restores the existing policy. Bibliography, indexes, export and submission still use the full build chain.

Explicit source-to-PDF navigation prepares a current formal result. Holding ⌘ / Ctrl and clicking a live page first prepares the formal PDF and enables region selection; then select the target region. Provisional coordinates are never guessed against a different layout. Automatic cursor following uses only a formal result matching the current buffers.

## Errors and recovery

Acceleration failures and TeX diagnostics use the existing problems panel, without a separate engine panel or persistent success messages. Available pages remain until regular compilation replaces them. Install missing LuaLaTeX, packages or fonts, or use normal formal compilation. Close and reopen PDF preview after fixing dependencies to rebuild the session.

Closing preview, disabling automatic compilation or closing the project stops the session. Caches live in `.texpro/realtime/`, separate from formal builds. Teardown attempts to remove its own session directory; locked files may remain. External editor changes and dependencies replaced at the same path are not comprehensively watched; reopen preview or compile formally.

## Embedding and attribution

TeXPro hosts rtex-ts in a Node worker through restricted IPC. Fontkit draws actual glyph outlines; PDF.js renders fallback pages. `PdfPane` owns the shared tools, zoom and scrolling. Live pages never reuse an old PDF text layer or SyncTeX map. A pure engine policy is shared with compilation. Workers, dependencies and Lua/TeX support files are unpacked from ASAR, and upstream hashes are verified.

The TypeScript implementation closely references [Henry Yang's realtime-tex](https://github.com/HenryXiaoYang/realtime-tex). Lua/TeX support files are retained unchanged. Both use MIT with original notices preserved. Research inspiration comes from Clemens Lode's [TUG 2026 paper](https://www.tug.org/tug2026/preprints/lode-realtime.pdf). This is an independent adaptation, not an official port or a promise of API or performance equivalence. Upstream's approximately 1 ms figure is not a TeXPro measurement.

See the [rtex-ts embedding guide](https://github.com/lzhbhlrPython/rtex-ts/blob/main/docs/embedding.md) for library APIs, versions, coordinates and licensing, and the [TeXPro host contract](https://github.com/lzhbhlrPython/TexStudioPro/blob/codex/realtime-tex/docs/realtime-tex.md) for integration boundaries. This TeXPro native validation runs on macOS; package CI does not replace real TeX application testing on Windows and Linux. MiKTeX still needs separate verification.

Related: [Compilation and diagnostics](/docs/compile), [Bidirectional PDF navigation](/docs/synctex), [Copyright and licenses](/docs/copyright).
