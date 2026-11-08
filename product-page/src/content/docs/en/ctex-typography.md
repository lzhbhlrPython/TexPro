---
slug: ctex-typography
title: CTeX Chinese typesetting
group: 使用
order: 6.5
summary: Reading Chinese on paper and the real PDF are handled separately, preserving the author's fonts, document class and root file.
---

## How the editor and the PDF divide the work

Visual mode recognises the root file's CTeX configuration and, at the start of an ordinary Chinese paragraph, shows a two-character indent, a line spacing suited to reading and the Chinese line-breaking rules. Formulas, code, tables and headings keep their own presentation. The on-screen preview helps continuous writing; final line breaks, pagination and glyphs come from the PDF built by the local TeX.

Themes change only the on-screen colours, never the PDF. Placeholders take the body colour of the current Paper, Studio or Night theme, so no interface darkness is written into the document.

## Applying Chinese writing typography

Search the command palette for "Apply CTeX Chinese writing typography", or press `⌘⌥⇧C` in the editor (`Ctrl+Alt+Shift+C` elsewhere). The action works on the actual root file, keeps your place in the child file you are writing, and can be undone.

The configuration covers a two-character first-line indent, full-width punctuation, spacing around Chinese text, paragraph spacing and a 1.3× baseline line spacing. An existing CTeX class or package is reused rather than loaded twice; a plain document has CTeX added. Only the typography block TeXPro marks itself is replaced; the author's original font and heading settings are left alone.

```tex
% TeXPro Chinese typography begin
\ctexset{autoindent=2, punct=quanjiao, space=auto}
\setlength{\parskip}{0pt plus 1pt}
\linespread{1.3}
% TeXPro Chinese typography end
```

This is an on-demand action: opening an old project never rewrites its typography automatically. When a school, journal or publisher template already has its own rules, follow the template and skip this generic configuration.

## Fonts and engines

New Chinese articles and Chinese imports use `ctexart` with `fontset=fandol`, defaulting to XeLaTeX, which reduces cross-platform failures caused by relying on system Song font names. An existing `fontset`, `fontspec` or Chinese font command is not replaced by this action. If a custom font is missing, you still have to install it or pick a substitute yourself.

The template designer and page layout keep the line spacing you set and do not stack the generic spacing on top. A Chinese class keeps its Unicode engine even when the Chinese language is not selected again. Switching layout no longer treats `ctexart` as a plain `article` and loads `ctex` a second time.

## MCP

`texpro_ctex_typography` reads the actual root file and returns a preview of the typeset source; `saved: false` means it has not been written to disk yet. Review it first, then apply it with an explicit file write. An external client should keep the project's existing LuaLaTeX setup and must not treat the returned XeLaTeX suggestion as an engine setting that has to be overwritten.
