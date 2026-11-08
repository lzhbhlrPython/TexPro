---
slug: writing-aids
title: Placeholders and revision memos
group: 使用
order: 5.5
summary: Keep writing when material is missing and leave a revision clue in the paragraph itself; the content stays in the TeX, so it can be found, undone and handed over.
---

## Placeholders: keep writing first

When a figure, table, citation or piece of data is not ready yet, press `⌘⇧H` in the body (`Ctrl+Shift+H` on Windows / Linux). The editor inserts a placeholder and selects its description, so you can type what is still to be supplied straight away. Then carry on with the body; there is no need to open a studio.

The Placeholders list on the left offers five types: body text, figure, table, citation and data. Clicking an entry selects the whole command in the source file, ready to be replaced with the real content. `F4` / `Shift+F4` cycles through the placeholders in the current file. The command palette (`⌘K`) finds these actions too.

```tex
\texproplaceholder[figure]{补一张实验装置示意图}
\texproplaceholder[data]{核对最终样本量}
```

Inserting the command puts the compatibility macros it needs into the project's actual root file, while the body stays in the current child file; the two edits undo as one group. If a custom macro of the same name already exists, the author's definition is kept. Any ordinary LaTeX distribution can compile it, with no extra external program.

## Drafts and the final submission

Figure and table placeholders keep their box and description in the draft PDF; the other types show an inline box. None of them produces a real image, reference or data set on its own. The compile problems panel reports where the outstanding items are, and source export flags them as well. Before building an arXiv submission package, clear every placeholder from the project, so a to-do item is never submitted as finished work.

The placeholder list covers the project's `.tex` / `.ltx` files; hidden directories, build directories and symbolic links are not scanned. Drafts that the root file never includes still show up in the project inventory, so deal with them or move them out of the project before packaging. If you type the command by hand, you must keep the macro definition in the root file yourself; the insert action, which installs the support automatically, is the recommended way.

## Revision memos: carry on from here next time

Press `⌘⇧N` in the current paragraph to leave a memo, typing the content straight into a comment in the source file; press `⌘⇧U` to open the revision memo list. A memo lives in an ordinary comment: it never reaches the PDF and does not depend on the application's database.

```tex
这一段先保留现有论证。
% MEMO: check next time that paragraph 3 agrees with the conclusion of Figure 2
% MEMO-DONE: experimental conditions added
```

When you reopen the file, the editor shows a notice above it naming the file's last unfinished memo. Click the notice to return to the nearby paragraph; you can mark the memo done or dismiss the notice for this time. Dismissing it does not delete the comment, and once the memo is finished you can still reopen it from the list. The existing `% TODO:`, `% FIXME:`, `% NOTE:` and `% DONE:` comments keep working.

## Working over MCP

`texpro_writing_aids` returns the placeholders and memos found in saved files, together with their UTF-16 offsets and SHA-256. `texpro_edit_writing_aid` inserts, replaces, adds a memo, and completes or reopens one. An edit must submit the hash of the file as just read; inserting a placeholder also needs the root file's hash, so external changes are not overwritten.

MCP operations read and write the disk directly and cannot see an unsaved editor buffer. Save before handing work to an external client, and check for external changes after coming back to the editor. Do not repeat a request with a stale offset.
