---
slug: realtime-tex
title: Realtime TeX preview
group: 使用
order: 3.5
summary: Preview unsaved paragraphs with bundled rtex-ts and local LuaLaTeX, with full-layout fallback, formal PDF output and explicit limits.
---

## Get started

Realtime TeX preview is an optional experimental feature, disabled by default. TeXPro bundles the independent open-source [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts) package. No VS Code, extension or Rust executable is required. Install LuaLaTeX and the packages/fonts your document needs separately.

- Confirm the project's main file. Select it in Project Structure if there are multiple candidates.
- Add `% !TeX program = lualatex` to the actual main file after checking that your template supports LuaLaTeX. CTeX/fontspec detection normally prefers XeLaTeX; changing only the default engine setting does not override that detection.
- Open Settings → Build and enable “Realtime TeX preview (experimental)”.
- Open PDF preview and select “Realtime TeX preview” in the sidebar. You can keep writing while the first layout is prepared.

The application does not automatically change existing fonts, templates or engine declarations. LuaLaTeX executes document code with your permissions. Enable it for trusted projects; this is not a sandbox.

## Writing and layout

Ordinary paragraphs and inline mathematics can update after context and old-paragraph probe validation. Background compilation then corrects global pagination and references. Headings, tables, TikZ and other environments, unknown macros and uncertain results wait for full layout. Pages with unsupported fonts or drawing operations fall back to the matching PDF.

The preview receives unsaved buffers without forcing source files to be saved. Normal autosave remains controlled by its own setting. Updates are deferred during input composition, and preview updates do not take editor focus or replace undo history. Editing a child file does not make it the compilation main file.

| Status | Meaning |
| --- | --- |
| Realtime preview ready | Persistent LuaLaTeX is ready |
| Paragraph updated | A local typesetting result is available |
| Updating pagination and references | Placement is provisional until full layout |
| Waiting for full layout | This edit needs background compilation |
| References have not converged | A pass limit or similar boundary was reached; this is not a final result |
| Realtime preview unavailable | Check the engine, packages or diagnostics, correct the issue and retry |

## Use the compiled PDF

Switch to “Compiled PDF” for search, text selection, comparison and SyncTeX. The live view does not offer the formal PDF's positioning tools. Manual compilation remains available: it saves relevant buffers and uses the existing build pipeline.

While realtime mode runs, duplicate normal automatic compilation is paused; leaving it or a failure restores your previous policy. rtex-ts does not automatically invoke BibTeX, Biber or index tools. Use the existing complete build for submission and export. Paragraph growth or shrinkage also needs background layout correction.

## Errors and retry

If LuaLaTeX is missing, install a TeX distribution and confirm the executable is available. Install missing packages or fonts according to TeX diagnostics. The last usable view is retained. Select “Retry realtime preview”, or switch to the compiled PDF to inspect the complete build log.

Hiding the pane, switching to the formal PDF or closing the project stops the realtime session. Its cache is isolated from formal builds in `.texpro/realtime/`. Each session attempts to remove its own directory after closing; locked files may remain. Retry after external programs modify already-loaded source or dependencies at the same path: this version does not promise automatic watching of every external change.

## Embedding and attribution

TeXPro runs rtex-ts in a Node worker, passing buffers and previews through restricted IPC without giving Node access to the editor. fontkit reads actual glyph outlines; PDF.js renders unsupported pages. Packaging keeps Lua/TeX support outside ASAR and verifies its upstream hashes.

The TypeScript adaptation closely follows [Henry Yang's realtime-tex](https://github.com/HenryXiaoYang/realtime-tex), retaining its Lua/TeX support files unchanged. Both use MIT with original copyright notices preserved. Research inspiration comes from Clemens Lode's [TUG 2026 paper](https://www.tug.org/tug2026/preprints/lode-realtime.pdf). This is an independent adaptation, not an official port or a promise of complete API/performance equivalence. Upstream's approximately 1 ms figures are not TeXPro measurements.

See the [rtex-ts embedding guide](https://github.com/lzhbhlrPython/rtex-ts/blob/main/docs/embedding.md) for the library API, UTF-8 edits, event versions, geometry and licenses, and the [TeXPro repository guide](https://github.com/lzhbhlrPython/TexStudioPro/blob/codex/realtime-tex/docs/realtime-tex.md) for host implementation and distribution contracts. The standalone package's cross-platform CI does not establish end-to-end validation of TeXPro installers on every platform. MiKTeX and real Windows TeX integration require separate verification.

Related guides: [Compilation and diagnostics](/docs/compile), [PDF source navigation](/docs/synctex), [Copyright and license](/docs/copyright).
