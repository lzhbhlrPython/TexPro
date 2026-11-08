---
slug: synctex
title: Two-way PDF and source navigation
group: 使用
order: 4
summary: SyncTeX maps PDF coordinates back to source lines. Every TeXPro build passes -synctex=1, and both forward following and reverse clicking rest on that mapping.
---

Every build passes `-synctex=1`, so there is no extra switch to find. A forward query asks where a given source line sits in the PDF; a reverse query asks which line a PDF coordinate came from. Both are answered by the local `synctex` binary, at the precision TeX itself line-breaks with.

## The full path of one lookup

- After a successful build, the build directory gains a `.synctex.gz` named after the main file.
- A forward query reads it, turning file, line and column into a page and a rectangle; the PDF panel highlights and scrolls from that.
- A reverse query reads the same file, turning page, x and y into a source file and line; the editor selects it.
- The mapping is replaced wholesale after each successful build — never accumulated, never patched incrementally.

To check by hand, call the command line directly; the arguments match what TeXPro uses internally:

```bash
synctex view -i 128:1:main.tex -o .texpro/build/main.pdf
synctex edit -o 3:210:420:.texpro/build/main.pdf
```

`view` prints Page, x, y, h, v, W, H; `edit` prints Input, Line, Column. TeXPro additionally checks that the real path returned by `edit` lies inside the project, and refuses to jump otherwise.

## Source → PDF

- Caret resting somewhere, the PDF panel open, and PDF follows cursor left on in settings: it locates automatically after a 650-millisecond pause.
- To locate right away: `⇧⌘J`, or `Build → Forward Search`.
- With no PDF open, a manual locate opens the panel; with nothing built yet you get "Compile first to enable SyncTeX".
- On a hit the PDF scrolls there, and a banner at the top reads `Synced to page 3 · line 128`.

Automatic following fires only when nothing is building, a PDF exists and there is an active file. Both scroll only when the target is outside the viewport, and park it around 40% down the viewport; the difference is that manual locating scrolls smoothly while automatic following jumps, so the view does not drift continuously as you type.

## PDF → Source

Hold `⌘` (`Ctrl` on Windows / Linux) and click in the PDF, and the editor jumps to the matching line. For a reverse selection, hold `⌘` and drag a rectangle, or click Select PDF region in the toolbar first to enter region mode.

- The hint at the bottom reads: `Hold ⌘ / Ctrl and click or drag to locate source`.
- Region mode reads: `Drag to select a PDF region and locate its source. Esc cancels.`, and `Esc` leaves it.
- A region samples at most 7 points, looked up in parallel.
- Results are grouped by file; the file covering the most lines wins, and the range from its lowest to highest line is selected.
- When the points land in different files you get "Region crosses source files. Showing the largest matching range.".
- When nothing is found: "No source location at this point".

After a successful reverse lookup, automatic forward following pauses for 1800 milliseconds; otherwise the same action would immediately be overwritten by cursor following.

## The PDF panel

| Control | What it does |
| --- | --- |
| Previous / next page | Page through; the title shows the current page and the total |
| Zoom | 35% to 180% in 10% steps, 90% by default |
| Fit page width | Fits one page to the panel width |
| Thumbnails | Page thumbnails in the sidebar; click one to go there |
| Search | Two characters minimum, shows n/m hits; Enter and Shift-Enter jump |
| Select PDF region | Enters region reverse lookup; Esc leaves |
| Compare with previous compile | Overlays the previous PDF at 15% to 90% opacity |
| Two-page spread | Two pages side by side |
| Presentation mode | The panel full screen |
| Copy page text | Copies the current page's text |
| Open PDF in default viewer | Hands off to the system reader |
| Reveal PDF in Finder | Locates the artifact in the file manager |

The panel's empty state says "No PDF yet"; its button builds right away, with the hint `⌘↩ compile · ⌘-click PDF to jump back`.

## Precision and limits

- Granularity is the line, not the character. Several formulas on one line all point at the same line number; reverse clicks land on lines too.
- The mapping comes from the last successful build. Edit without rebuilding and lookups drift, by as many lines as you changed.
- Reverse lookups require the source's real path to be inside the project; an `\input` reaching outside is refused with "SyncTeX source is outside the project".
- A cancelled or failed build does not update the mapping; the old PDF and old mapping stay paired, so the UI never shows half a new page with old line numbers.
- A PDF copied from elsewhere has no usable mapping: latexmk writes it at build time, valid only for the PDF from that same build.

## Common pitfalls

- It only matters while the PDF panel is open; with the panel collapsed automatic following stops, but `⇧⌘J` still locates by hand.
- No following during a build: if you type while it compiles, wait for the status bar to go from Typesetting back to PDF ready.
- With automatic builds and cursor following together, jumping right after a save can land on the previous version; pausing a beat before locating is steadier.
- A cross-file region lookup returns one file's range, not a merged multi-file result.
- Two-page and presentation modes only change how pages are displayed, never the coordinate maths.
- Zoom does not change the mapping: clicks are converted in page coordinates at any zoom level.

## Working with automatic builds

Automatic builds fire 2.2 seconds after typing stops, and the PDF and mapping only update when the build finishes. When writing a long paragraph that opens a window: the PDF on screen is still the previous version, and cursor following matches old positions too. The Typesetting spinner on the left of the status bar is the only reliable signal; read the PDF once it stops and nothing will be out of place.

If you just want to write quietly, switch the build strategy to Manual only, or turn off PDF follows cursor in settings and locate on demand with `⇧⌘J`.

## Related pages

- Compiling and diagnostics: `/docs/compile`
- Writing modes and themes: `/docs/writing`
- Projects and files: `/docs/project`
- Shortcuts: `/docs/shortcuts`
