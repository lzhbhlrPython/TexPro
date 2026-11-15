---
slug: writing
title: Writing modes and themes
group: 使用
order: 5
summary: One .tex file has several screen projections. The visual layer draws its structure, focus, typewriter and zero interface decide how much of the screen stays, and themes only change interface colours.
---

The content is always the same `.tex`. The visual layer changes how it is displayed, writing modes change how much is displayed, themes change what colour it is displayed in. All three act on the interface alone: none touches the source, and none takes part in a build.

## Visual mode

On by default; `⇧⌘M` or More → View → Switch to source mode / Switch to visual mode toggles it. While it is on, the editor renders headings, formulas, tables, images, code blocks and quote environments as near-typeset components, and the syntax noise recedes.

- Click any rendered result and the caret lands at its source position; the object unfolds into source, ready to edit.
- A block the caret or selection enters falls back to source for the moment; it re-renders once you leave.
- The preamble collapses into a card showing the document class, package count and hidden line count; click Reveal to expand it.
- Links appear as ordinary text in the body; hold `⌘` (`Ctrl` on Windows / Linux) and click to open one in the system browser.

The visual layer is a set of semantic components, not a typesetting engine: line breaks, float placement and font metrics come from the PDF alone. Judge the final result by the PDF, not by the editor.

## Focus, typewriter and zero interface

| Mode | Behaviour | Toggle |
| --- | --- | --- |
| Focus mode | Everything outside the current paragraph fades out; sidebar, PDF and format bar hide, the body becomes a single column, and the maximum width is the smaller of the reading width and 720 px | `⇧⌘F` |
| Typewriter scrolling | Centres the caret after the selection changes; the viewport scrolls as you write | `⇧⌘T` |
| Zero interface | Hides the title bar, sidebar, PDF, status bar, problems panel and format bar; the body is at most 820 px wide and an Exit focus button stays in the top-right corner | `⌘⇧0`, `Esc` exits |

Focus mode treats a paragraph as a run of consecutive non-empty lines: only a blank line between two of them makes two paragraphs. Typewriter mode scrolls the caret to the middle of the viewport 20 milliseconds after the selection changes, and does nothing while the editor is unfocused.

The three modes stack. Focus plus typewriter suits long stretches of writing; zero interface suits presenting, screen recording, or simply not wanting to see any toolbars.

## Themes

| Theme | Feel |
| --- | --- |
| Paper | Default. Warm white paper, dark text; the toolbar folds into a More menu in the top right |
| Night | A dark interface for writing at night |
| Studio | A dark sidebar beside a light editing area |

`⇧⌘L` only toggles between Paper and Night: from Studio one press returns to Paper. Each theme has its own command in the command palette (Theme: Paper, Theme: Night, Theme: Studio), more direct than cycling.

Themes only change interface CSS variables. They do not affect the source, the PDF or exports; switching themes never re-typesets the document.

## Typography settings

| Setting | Range | Default |
| --- | --- | --- |
| Font size | 13 to 22 px | 17 px |
| Reading width | 620 to 980 px | 760 px |

The reading width is also the width cap in focus mode, and the smaller of the two wins. These settings live in local preferences, independent of any project, and switching projects does not reset them.

## Input aids

Markdown input shortcuts only fire while you type in the body; the preamble, comments, math, verbatim and command arguments keep their literal text.

- A line starting `# ` through `###### ` becomes `\section` through `\subparagraph`.
- A leading `-`, `+` or `*` becomes an itemize skeleton, `1.` becomes enumerate, and `>` becomes quote.
- A trailing `**bold**`, `*italic*` or backtick-wrapped code becomes `\textbf`, `\emph`, `\texttt`.
- Undo restores the syntax you actually typed rather than undoing the conversion character by character.

Smart paste inspects what it is pasting: if the clipboard already holds TeX commands it pastes verbatim; HTML from a web page becomes bold, italic, monospace, links and lists, falling back to plain text when it meets merged cells; a TSV with consistent column counts becomes tabular; Markdown becomes headings, lists, quotes, code blocks and tables. `⌘⇧V` always pastes as plain text.

Spell check only looks at Latin-script words, with commands, math, verbatim, URLs and email addresses masked out first; it does not judge Chinese wording. `Show line numbers` controls the line-number gutter.

The middle of the status bar shows three things: Ln/Col, the selected character count, and `n words`. Words are counted after comments, environment markers and commands are stripped; Latin text splits on whitespace, Chinese counts per character, so a mixed-language draft shows a rather large number.

## Interface language and the command palette

Settings switch the interface between Chinese and English, and menus, command palette and hints follow. Searching themes, modes or panel names in `⌘K` runs them directly, which beats memorising shortcuts; the palette doubles as a discovery surface, since plenty of studio panels appear only there.

## Common pitfalls

- Focus mode splits on runs of non-empty lines: without a blank line between paragraphs, they count as one.
- Zero interface is not full screen: it only hides interface elements, the PDF and builds keep running, and `Esc` or the top-right button exits.
- Typewriter mode depends on editor focus and does not scroll when you click into the sidebar.
- Typing `*` inside math is not converted to emph, deliberately; conversion resumes once you leave the math.
- Turning visual mode off also takes click-to-source on rendered objects with it.
- Studio is not the default theme; a fresh install or a settings reset gives you Paper.
- Focus mode collapses the PDF panel; to check layout while writing, leave focus first and open the PDF separately with `⌘⌥P`.
- The word count is not submission-ready: Chinese counts per character, the title and author in the preamble are included, and only the trend is meaningful.

## Related pages

- Two-way PDF and source navigation: `/docs/synctex`
- Compiling and diagnostics: `/docs/compile`
- Shortcuts: `/docs/shortcuts`
- Projects and files: `/docs/project`

The More menu no longer duplicates the Insert group. Use the corresponding studios for professional diagrams; direct insertion commands remain searchable in the command palette. View labels reflect the current state: Enter focus mode / Leave focus mode and Enable typewriter scrolling / Disable typewriter scrolling.

## Inline previews in multi-file projects

When you open a chapter from the file tree, visual previews load the selected project main file and statically included preamble files. The main file does not need to remain open. Unsaved edits to the main or style files also participate in previews; composition input is preserved.

Graphics paths follow the regular compiler's project working directory and literal `\graphicspath` declarations. If `images/实验.png` is under the project root, use this even while editing `sections/chapter.tex`:

```tex
\includegraphics{images/实验.png}
```

Common graphics extensions may be omitted. PDF graphics show their first page through PDF.js. Inserting an image from the asset flow also uses the project working directory; existing image commands are not rewritten automatically.

Simple required-argument macros can render in formulas, and simple text style wrappers can be inherited. For example, define `\newcommand{\unit}[1]{\,\mathrm{#1}}` in the preamble. Click a formula or image to continue in its source with editor focus and undo preserved. Table formulas use the same macro context.

Macro paragraphs, custom environments, complex tables and formulas beyond the fast projection path use the project’s own local TeX toolchain. Literal chapter inputs compose a continuous reading flow; clicking content enters the actual child file. Reliable native prose uses the editor’s fonts and line spacing, while geometry retains its original drawing. Full PDF pages stay in the preview pane. Ordinary prose, simple formulas and tables retain their immediate editing path.

Install the project’s required TeX tools, fonts and packages, and select its main file. In settings, enable **Visual mode** and **Auto compile**, and choose a **Compile strategy** other than **Manual only**. Pause typing and allow actual typesetting to complete; the first preview of a large project takes real compilation time. Native previews use temporary project copies with unsaved buffers and do not save author files themselves. Existing auto-save and formal auto-compile save behavior is unchanged. No additional workspace or engine mode is required.

Click a native block to reveal its TeX, or use Enter/Space. Revealed source and **Source** mode retain syntax highlighting, completion and diagnostics independently of WYSIWYG. Changes and undo go through the editor; stale results cannot replace newer input.

If the problems list reports unavailable native typesetting or incomplete mapping, editable source is retained. Check that the original project compiles, install missing fonts/packages, repair TeX errors, then edit or reopen the file to retry. For incomplete preamble dependencies, check the references and reopen the project. Oversized snapshots, very long individual blocks or missing SyncTeX may retain source; native regions are not guaranteed to refresh on every keystroke. Arbitrary HTML in `.tex` is not executed as a web page. The compiled PDF remains authoritative for fonts, floats and pagination. XeLaTeX projects retain their compiler.

## Common geometry and drawing packages

Keep the project’s package declarations and local TeX installation. Enter ordinary source in the document and click the rendered object to edit it. No separate workspace is required. Install missing packages in your local TeX distribution; the editor does not silently substitute packages in the project.

| Content | Packages / syntax |
| --- | --- |
| Euclidean geometry, triangles, circles and construction lines | TikZ, tkz-euclide; project coordinate, intersection and angle libraries are retained |
| Spatial geometry and 3D coordinates | tikz-3dplot, PGFPlots addplot3; Lua graphdrawing requires LuaLaTeX |
| Function plots, logarithmic/polar axes and plot groups | PGFPlots axis, semilogxaxis, semilogyaxis, loglogaxis, polaraxis, groupplot |
| Basic line drawings | picture, pict2e |
| Trees, commutative and relation diagrams | Forest, qtree, tikz-qtree, tikz-cd, Xy-pic |
| Proof trees | bussproofs, ebproof, logicproof |
| Circuits, quantum circuits and chemistry | Circuitikz, Quantikz, QCircuit, Chemfig |
| Sets, flows and schedules | venndiagram, smartdiagram, pgfgantt |
| PostScript geometry and 3D | PSTricks, pst-eucl, pst-3dplot; inline artwork uses XeLaTeX and its driver dependencies |
| Particle interaction diagrams | tikz-feynman; automatic layouts may additionally require LuaLaTeX |

For example, load `tkz-euclide` in the main preamble, then enter:

```tex
\begin{tikzpicture}
  \tkzDefPoints{0/0/A,3/0/B,1/2/C}
  \tkzDrawPolygon(A,B,C)
  \tkzLabelPoints(A,B,C)
\end{tikzpicture}
```

Load TikZ before tikz-3dplot. qtree versus tikz-qtree and bussproofs versus ebproof follow actual project declarations rather than loading conflicting packages. Project macros, libraries and styles enter artwork compilation. If rendering fails, inspect the inline error/log and check the original project compiles. Complex or unfinished syntax remains source. This describes covered syntax families, not every package version, layout option or draggable visual editing operation.

tkz-elements and luadraw require compatible local packages and LuaLaTeX; real compilation acceptance for these two packages is not complete in this iteration. Asymptote, MetaPost, externally generated files and shell-escape workflows are not automatically executed. Continue using the project’s configured build actions and formal PDF.

## Open handwritten content in a studio

Handwritten circuits, geometry and complete MusiXTeX passages need neither studio generation nor metadata. Use **Studio** on an inline drawing, or the corresponding studio command with the caret inside the block, to open its original source. Music’s **Studio** opens **Music studio**. Source retains highlighting and undo; pausing input updates the real typeset preview. Cancel leaves the document intact. **Apply changes** replaces the original block and supports one document undo.

Neutral lines follow light/dark themes; authored colors remain intact without whole-image inversion. When complex source cannot be recovered losslessly as draggable nodes/notes, continue with source and live preview. Circuit tools offer **Source and live preview**; code differing from the generated model cannot switch directly back to the old model and overwrite changes. Chart source is editable and takes precedence over generated data output.


### Two modes in one studio

Open the object’s Studio, then switch between Source editor and Visual editor. Both modes share one draft and live preview. There is no separate source studio. Visual controls can edit literal coordinates, selected MusiXTeX pitches/meters/key signatures, and simple PGFPlots expressions without rebuilding surrounding code. Source edits refresh these controls. Unknown syntax remains intact; an old generated model never replaces handwritten changes. Cancel keeps the document unchanged; Apply changes replaces the original block with document undo support.
