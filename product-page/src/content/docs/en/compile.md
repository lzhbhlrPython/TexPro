---
slug: compile
title: Compiling and diagnostics
group: 使用
order: 3
summary: "Compiling is a thin shell: locate the main file, pick an engine, run latexmk, turn the log into jumpable diagnostics. Understand those four steps and most questions about a missing PDF answer themselves."
---

TeXPro does not implement TeX; it drives the local latexmk. A build really only does four things: write the changes to disk, decide what to build, decide which engine to use, and translate the log into signals on screen. Know those four steps and errors stop being a black box.

## The four stages of a build

- Save: every dirty buffer is written to disk before compiling, and the main file is read again, so latexmk sees the latest version on disk.
- Locate: the main file comes from `rootFile` in `.texpro/project.json`, or failing that from the single file in the project that contains `\documentclass`.
- Choose an engine: magic comments and package signals in the main file come first, then the default engine in settings.
- Run and parse: invoke latexmk, read the `.log`, split errors, warnings and overfull boxes into diagnostics, and finally confirm that a PDF was really produced.

## How the engine is chosen

In descending priority:

- A magic comment in the main file, such as `% !TeX program = xelatex`.
- Document signals: `ltjs` and `luatexja` mean lualatex; `ctex`, `xeCJK`, `fontspec`, `polyglossia` and `\setCJKmainfont` mean xelatex.
- The Default engine in settings.
- pdflatex as the fallback.

| Engine | latexmk flag | Use when |
| --- | --- | --- |
| pdfLaTeX | `-pdf` | Latin-only text, classic Type1 fonts |
| XeLaTeX | `-xelatex` | ctex, fontspec, system fonts |
| LuaLaTeX | `-lualatex` | luatexja, packages that need Lua |

The same logic drives TikZ and figure previews, so getting the magic comment right in the main file keeps previews and real builds on the same engine.

## Build directory and artifacts

The build directory defaults to `.texpro/build`; `directories.build` can be changed in `Project → Project Structure…`, but it must stay inside the project, otherwise you get "Build directory must stay inside the project". PDF and log are both named after the main file's basename.

```bash
latexmk -pdf -synctex=1 -interaction=nonstopmode -file-line-error \
  -outdir=.texpro/build main.tex
```

When the project is under Git, remember to add the build directory to `.gitignore`; it is rewritten on every build.

## Build strategy

| Strategy | Behaviour |
| --- | --- |
| After idle (default) | Compiles 2.2 seconds after typing stops; never re-enters while a build is running |
| Only when PDF is open | Builds automatically only while the PDF panel is open |
| Manual only | Only `⌘↩` and Compile in the menu |

Autosave is a separate switch; turning off automatic builds does not affect saving. `⌘↩` builds by hand at any time, at the cost of saving all changes first.

While building, the button becomes Cancel, and the menu carries Cancel Compile. Cancelling sends SIGTERM to the whole process group, then SIGKILL 2.5 seconds later. A single build times out after 180 seconds by default, reporting "Compilation timed out after 180s".

## Reading diagnostics

| Source | Handling |
| --- | --- |
| `main.tex:42: Undefined control sequence` | File and line given directly |
| `! LaTeX Error: ...` plus `l.42` | Line number recovered from the error block |
| `LaTeX Warning:`, `Package ... Warning:` | Recorded as a warning |
| Overfull / Underfull `\hbox` | Typesetting overflow, filed as info |
| `File 'x' not found` | Treated as an error |

Diagnostics are capped at 250 and sorted by line. Click one to jump to its line, which the editor gutter marks as well; `n problems` on the right of the status bar counts errors plus warnings, and opens the problems panel.

Compile theater in the command palette (`⌘K`) splits a build into four stages — Engine and root file, LaTeX compilation, Diagnostics, PDF handoff — with a streaming log. Use it when you need latexmk's raw output; it has far more patience than the status bar.

## Toolchain checks

`Project → Project Doctor…` checks latexmk, pdflatex, xelatex, lualatex, biber, bibtex, synctex, kpsewhich and dvisvgm. Only latexmk and pdflatex are hard requirements; anything else missing only affects its own feature — xelatex templates, biber bibliographies, SyncTeX jumps, SVG conversion.

Doctor also lists orphan `.tex` files, missing packages, broken links, missing images, undefined references, missing bib keys and duplicate labels, and can clean the build directory.

## Common pitfalls

- No main file: you get "No LaTeX root file found. Add a file containing \documentclass or a % !TeX root comment.". Keep exactly one `.tex` containing `\documentclass`, or point at the main file in Project Structure.
- A configured main file that breaks: there is no silent fallback, just "Project main file configuration is invalid: ...". Fix the file or pick the main file again.
- Several candidates: "Multiple main files found. Choose the project main file." You must choose one explicitly.
- Exit 0 but no PDF: "latexmk finished but no PDF was produced." Usually the document stops before `\end{document}`, or the build directory was cleaned from outside.
- Missing fonts: ctex with xelatex fails on machines without Chinese fonts; Doctor's font coverage shows it in advance.
- Packages such as minted that need shell-escape: the main build does not pass `-shell-escape`, so that content has to be built outside or reworked.
- Switching or closing the project mid-build: the running build is cancelled first, and its results are dropped.

## Related pages

- Two-way PDF and source navigation: `/docs/synctex`
- Projects and files: `/docs/project`
- Import, templates and assets: `/docs/import`
- Shortcuts: `/docs/shortcuts`
- Compiling internals: `/docs/dev-arch`

## Realtime paragraph preview

Compatible LuaLaTeX projects receive live updates inside the existing PDF preview, following automatic compilation settings without a separate mode. PDF inspection prepares formal output when needed. See [Realtime TeX preview](/docs/realtime-tex) for requirements, embedding and limitations.
