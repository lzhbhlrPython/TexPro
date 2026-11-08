---
slug: export
title: Exporting and arXiv
group: 参考
order: 7
summary: PDFs come from builds; Export Document turns the current file into Markdown / Typst / HTML; the arXiv package gathers source and assets into an uploadable zip.
---

## Three exits, each with its own purpose

TeXPro does not re-typeset your content, and sends no file to any server. When you finish writing, there are three artifacts you can take away:

| Artifact | Comes from | Location |
| --- | --- | --- |
| PDF | A build (`⌘↩`) | `<project>/.texpro/build/<main file name>.pdf` |
| Markdown / Typst / HTML | File → Export Document… | The browser's download folder, or the clipboard |
| arXiv source package | File → Create arXiv Package… | `<project>/.texpro/exports/arxiv-<timestamp>.zip` |

None replaces another: the PDF is for readers, exported documents are for collaborators who do not write LaTeX, and the arXiv package is for the submission system.

## PDF: an artifact of building

There is deliberately no Export PDF item in the menu. latexmk writes the PDF into the build directory during a build; for the latest version, press ⌘↩ first, then go to the PDF panel.

- The default output directory is `.texpro/build`; `directories.build` in `.texpro/project.json` can point elsewhere
- The file name comes from the project's main file, not from whichever chapter is currently open
- The view menu in the top right of the PDF panel offers Open in Default Viewer and Reveal in Finder
- A failed build produces no new PDF; the panel may still hold the previous file, so do not mistake it for the latest result

> Log, aux and synctex files live in the same build directory. To clean up, delete that directory; the source is unaffected.

## Export Document: one file at a time

The entry point is `File → Export Document…`. It reads the current editor buffer, unsaved changes included; the export covers that one file and never expands the whole project along `\input`.

The panel picks a format on the left and previews it live on the right; copy it to the clipboard or download it. The download keeps the original file's stem, swapping `.tex` / `.ltx` for the target extension.

| LaTeX | Markdown | Typst | HTML |
| --- | --- | --- | --- |
| `\section` / `\subsection` (same level) | `##` | `==` | `<h2>` |
| `\chapter` / `\part` | `#` | `=` | `<h1>` |
| `itemize` / `enumerate` | `-` / `1.` | `-` / `+` | `<ul>` / `<ol>` |
| `equation`, `align` and friends | `$$ … $$` | `$ … $` | Only `equation` renders as a KaTeX block |
| `verbatim` / `lstlisting` | Fenced code block | Fenced code block | Verbatim text, no code block |
| `figure` + `\includegraphics` | An image reference | `#image(...)` | An HTML `img` element |
| `tabular` | Pipe table | Not converted | Not converted |
| `\textbf`, `\emph`, `\texttt` | Bold, italic, monospace | `*…*`, `_…_`, backticks | `<strong>`, `<em>`, `<code>` |
| `\cite`, `\ref`, `\eqref` | `[@key]`, `[key](#key)`, `(key)` | `@key` | `\cite` becomes a citation marker; `\ref` / `\eqref` are not converted |

Markdown output gets a YAML front matter block (`title`, `author`, `date`) and an H1 at the top; Typst output uses `= Title` and `#set document(...)`; HTML is a standalone document whose formulas KaTeX renders into static markup at export time.

### Where conversion stops

- Only the body between `\begin{document}` and `\end{document}` is taken; the preamble plays no part
- Section levels are flattened: `\section` and `\subsection` come out as the same heading level, so adjust by hand when you need finer structure
- In Markdown and Typst output, a whole line that starts with a backslash and has no conversion rule is dropped; `\newcommand`, custom macros and conditionals are not expanded
- Environments such as `tikz`, `minted` and `algorithm` are not in the mapping table, so check the preview before exporting
- The HTML formula stylesheet points at KaTeX CSS on jsDelivr; opened offline the structure survives, but the styling may be missing
- Tables are split on `&` and `\\`; `\multicolumn` and `\multirow` degrade to plain text

> The preview is the final result: the text shown in the panel is exactly what you copy or download.

## The arXiv package: source and assets

The entry point is `File → Create arXiv Package…`. Before creating the package, the app saves every unsaved change, then writes a zip into `<project>/.texpro/exports/`.

Packaging is the whole project minus what should not be uploaded, not only the files that take part in the build:

| Rule | Contents |
| --- | --- |
| Skipped directories | `.texpro`, `.git`, `.hg`, `.svn`, `node_modules`, `build`, `out`, `dist` |
| Skipped files | Entries starting with `.`, plus intermediate artifacts such as `aux`, `log`, `toc`, `synctex`, `bcf`, `run.xml`, `blg`, `nav`, `snm`, `vrb` |
| Kept as-is | `.tex`, `.bib`, images, fonts, `sty` / `cls`, the subdirectory structure |

Relative paths inside the package match the project; no `\input` path is rewritten just to flatten things. A `README.txt` at the root records the main file's relative path, a suggested latexmk command, the detected engine and the creation time.

Engine detection runs in this order: a `% !TEX program` magic comment in the source → packages such as `ctex` / `fontspec` implying xelatex → `luatexja` / `ltjs` implying lualatex → pdflatex by default. It reads only the main file, not the whole project.

### Before uploading

- The panel shows the file count, the engine and the zip size, but does not judge arXiv's size and file-count quotas for you
- If the main file sits in a subdirectory, the structure is preserved; enter the real path when submitting, and do not expect it to be moved to the root
- Unreferenced images, old drafts and experiment data get packed too; cleaning the project first is less work than pruning the zip afterwards
- When packaging finishes, check the archive with Reveal or Open zip before uploading

> Implementation note: packaging calls the system `/usr/bin/zip`, and SVG-to-PNG calls `sips`. Both ship with macOS; Windows has no equivalent, and those buttons report errors there.

## SVG and arXiv

LaTeX cannot read SVG directly. When you insert an `.svg` asset, TeXPro first converts it with `sips` to a PNG 1800 px wide, caches it in `.texpro/svg-cache/`, then writes the `\includegraphics`.

SVG references in an existing project can be handled in one pass: `Project → Convert SVG Assets…` scans text files in the project (six levels at most), rewrites `\includegraphics` / `\includesvg` pointing at an existing `.svg` to the matching PNG, and keeps optional arguments. `.bib` files are not scanned.

- The conversion really edits `.tex` files; commit to Git or take a project snapshot first
- Only `.svg` references that resolve to a real file are handled; remote images and paths produced by macro expansion stay as they are
- The PNGs land in `.texpro/svg-cache/`, which packaging skips; before uploading a project with SVG figures to arXiv, copy the PNGs into an asset folder inside the project and fix the paths
- The scan has a depth limit, so references in deep directories can be missed; trust the preview and the build result

> Getting `.svg` straight into a PDF needs extra TeX packages and a conversion chain; TeXPro does not install or configure those components for you.
