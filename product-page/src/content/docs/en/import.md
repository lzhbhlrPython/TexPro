---
slug: import
title: Import, templates and assets
group: 使用
order: 2
summary: Three jobs — turning Markdown and Typst drafts into LaTeX, starting a new project from a template, and pulling images into the asset folder — each with its own entry point and its own limits.
---

Import, templates and assets solve three different problems: changing formats, starting a new project, and adding images to an existing one. None of them touches the original files. The generated `.tex` lands in the project and behaves like ordinary source from then on, ready for hand edits.

## Turning Markdown into LaTeX

With a project open, `File → Import Markdown / Typst…` opens the import panel; you can also press `⌘K` and search for Import. The source sits on the left, and `Generated LaTeX` on the right updates as you type.

- Choose Markdown, paste the draft into the left pane, or use Choose file to pick a `.md`, `.markdown`, `.mdown` or `.txt` file.
- Fill in Title, Author, Date, Document class and File name. Date defaults to `\today`; leave it blank and the output gets an empty date.
- **Insert body** drops only the body in at the caret; **Create .tex file** writes a complete document, preamble included, at the project root.

The conversion rules are fixed, not heuristic guesses:

| Source | Output |
| --- | --- |
| `#` through `######` | `\section` through `\paragraph`, four levels at most |
| `-`, `*`, `+` and `1.` | itemize, enumerate |
| A leading `>` | quote |
| Inline bold, italic, inline code | `\textbf`, `\emph`, `\texttt` |
| `$...$` and `$$...$$` | Kept as math, unchanged |
| Fenced code blocks | verbatim |
| Tables | table with tabular, all columns left-aligned |
| `![alt](path)` | figure with `\includegraphics`, 0.8 `\linewidth` wide |
| Horizontal rule `---` | A horizontal line |
| Raw HTML | Escaped as text, plus a warning |

If the file starts with front matter, its title, author and date prefill the form; the body does not repeat those fields in the output.

## Chinese text and the preamble

If the body contains any Chinese at all, the generated document always uses `ctexart`, whether article or ctexart is selected in the dropdown. Encoding is UTF8, the font set is fandol, and the engine is marked as xelatex. Only pure Latin text gets article and pdflatex.

```latex
\documentclass[UTF8,fontset=fandol,11pt]{ctexart}
\usepackage{amsmath,amssymb,graphicx}
\usepackage[margin=2.5cm]{geometry}
\usepackage{booktabs,xcolor}
\usepackage[colorlinks=true,linkcolor=blue,urlcolor=blue]{hyperref}
\begin{document}
\maketitle
\section{引言}
...
\end{document}
```

Both preambles carry amsmath, amssymb, graphicx, geometry (2.5 cm margins), booktabs, xcolor and hyperref. With no Title, no `\maketitle` is written; a blank date becomes `\date{}`.

## Importing from Typst

Switch the same panel to Typst and it recognises title and author in `#set document(...)`, the levels of `= Heading`, lists, `*bold*` and `_italic_`, `$formula$`, `#link`, `#image` and `#figure`. Typst is functional typesetting with no one-to-one counterpart for everything; anything it cannot recognise is not silently dropped — it goes into the warning list.

## Templates

`File → Template Library…` lists 11 built-in templates in four categories:

| Category | Template | Engine |
| --- | --- | --- |
| Basics | Article, Letter | pdflatex |
| Academic | Report, Chinese article (ctex), two-column article, Thesis | pdflatex or xelatex |
| Teaching | Beamer slides, Problem set | pdflatex |
| Languages | Japanese article | lualatex |
| Languages | Arabic and Russian article | xelatex |

After picking a template, name the project and choose a parent folder; TeXPro creates `<parent folder>/<project name>`. Illegal characters in the name become `-`, and duplicates get `-2`, `-3`; `{{title}}`, `{{author}}` and `{{projectName}}` in the template are filled from the form, and the generated `main.tex` opens with the engine that template uses.

`File → Template Workshop…` assembles page, font, structure and packages from a blank base class (article, report, ctexart, beamer); a layout you like can be saved as a personal template. With a template selected, the preview pane builds one page with that template's engine as a first-page thumbnail. Personal templates live in a JSON file in the app data directory, with a 2,000,000-character cap per template.

## Assets

`Project → Asset Library` scans the current project six levels deep, up to 500 files, newest first. Only `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.pdf` and `.eps` count.

To insert an image:

- Drag an image from Finder into the editor, or click one in the asset library.
- The image is first copied into the project's configured asset folder (`assets` by default); duplicates get `-2`, `-3`.
- The editor inserts `figure[htbp]`, `\centering`, `\includegraphics[width=0.8\linewidth]`, `\caption{}` and `\label{fig:...}`, leaving the caret inside the caption.
- If the main file's preamble lacks `graphicx`, it is added automatically.

Paths are written relative to the current `.tex` file; the label comes from the file name, with `-2` appended for duplicates. SVG is rasterised into `.texpro/svg-cache/` before insertion, leaving the source file untouched. Placement follows rules: an image never lands inside another float, and if the caret is inside a figure it moves after that environment; in the main file it never lands in the preamble.

## Common pitfalls

- Import does not copy images: relative paths from Markdown go into `\includegraphics` verbatim, so images left outside the project end up missing.
- Remote images (`http(s)://`) are not downloaded; they become `\href` and are named in a warning.
- When a code block contains `\end{verbatim}`, that block is downgraded to quote so the environment does not end early.
- Tables take their column count from the widest row and are always left-aligned; use Table Studio or write merged cells and long tables by hand.
- Picking article in the dropdown can still yield ctexart: any Chinese in the body is enough.
- With no project open, Create .tex file is unavailable, but Insert body still works.
- The warning panel shows at most 4 entries; the rest appear only in the count.

## Related pages

- Compiling and diagnostics: `/docs/compile`
- Projects and files: `/docs/project`
- Writing modes and themes: `/docs/writing`
- Exporting and arXiv: `/docs/export`
