---
slug: shortcuts
title: Shortcuts
group: 参考
order: 9
summary: The shortcuts actually bound in menus and the editor. macOS uses ⌘; on Windows / Linux ⌘ becomes Ctrl and ⌥ becomes Alt.
---

## How to read this

The tables list only real bindings, grouped by scope. An action with no shortcut is reachable from the menu or the command palette alone.

- macOS: ⌘ Command, ⌥ Option, ⇧ Shift, ↩ Return, Esc
- Windows / Linux: ⌘ becomes Ctrl, ⌥ becomes Alt, everything else unchanged
- Current file means the behaviour while the editor has focus; with focus in the PDF or a text field, some combinations land elsewhere

## Files and projects

| Shortcut | Action |
| --- | --- |
| ⌘O | Open a folder as the project |
| ⌘S | Save the current file |
| ⇧⌘W | Close the project and return to the welcome page |
| ⌘K | Open the command palette |

The command palette finds every menu action, including those without shortcuts; it is also the fastest way to confirm that a feature exists.

## Building, PDF and navigation

| Shortcut | Action |
| --- | --- |
| ⌘↩ | Build the project |
| ⇧⌘J | Forward Search: jump from source to the matching spot in the PDF |
| ⌘-click | Hold ⌘ and click the PDF text layer to look up the source line |
| ⌥⌘P | Collapse / expand the PDF preview |
| ⌘F | Find within the current file |
| Enter / ⇧Enter | Jump to the next / previous match in the find bar |
| Esc | Close the find bar or a floating layer |

Cancelling a build has no default shortcut; it lives only under `Build → Cancel Build`. It terminates the whole build process group, not just latexmk itself.

> Reverse navigation does not require Forward Search first: a plain ⌘-click in the PDF is already a lookup.

## Interface and views

| Shortcut | Action |
| --- | --- |
| ⌘\\ | Collapse / expand the left sidebar |
| ⇧⌘M | Toggle visual mode |
| ⇧⌘F | Toggle focus mode |
| ⇧⌘T | Toggle typewriter mode |
| ⇧⌘L | Toggle the Paper / Night theme |
| ⇧⌘0 | Enter zero interface mode |
| Esc | Leave zero interface mode |
| ⌘0 | Reset interface zoom |

Zero interface mode hides most interface elements, leaving the body and one exit button. It is not full screen; press Esc or click the button to come back.

## Writing modes

| Shortcut | Action |
| --- | --- |
| ⌘⌥← | Go back to the previous writing position |
| Esc | Leave the current visual block and return to the source position |
| ⌥↩ | Same as above, for when Esc is taken elsewhere |
| ⌘⌥P | Toggle the PDF preview (works while writing too) |

Go back to the previous writing position uses a per-session position stack: outline jumps, searches, SyncTeX and visual-block jumps all push onto it, and one press returns to the file, caret and scroll position from before the jump. The stack holds 80 positions at most.

> In visual mode, formulas, tables and images are all editable blocks; Esc leaves only that one block and never turns visual mode off.

## Editor

| Shortcut | Action |
| --- | --- |
| ⌘B | Wrap the selection or caret in `\textbf{}` |
| ⌘I | Wrap the selection or caret in `\textit{}` |
| F2 | Rename a label and update references across the project |
| ⌥F12 | Preview the source of the reference / label at the caret |
| Tab | Accept the suggestion when completion is open, otherwise indent two spaces |
| ⌘⇧V | Paste as plain text |
| ⌘Z | Undo; when the last step was a cross-file label rename, the whole rename is rolled back |
| ⇧⌘Z | Redo |
| ⌘Y | Redo (Windows habit) |
| ⌥⇧↑ / ⌥⇧↓ | Move the current block up / down |

The paste-as-plain-text window is short: the next paste within 1.5 seconds of pressing ⌘⇧V is treated as plain text and will not trigger rich-text or image pasting. To paste plain text repeatedly, press it again each time.

> Undo in the editor handles cross-file operations such as label renames first; with no rename to roll back, it falls through to the editor's own undo stack.

## Insert and tools

| Shortcut | Action |
| --- | --- |
| ⇧⌘E | Open the formula editor |

Other inserters (tables, images, TikZ, circuits, scores and so on) have no global shortcut; reach them from the `Insert` menu or the command palette. In visual mode the toolbar is quicker.

## The handful you will use most

- ⌘K: forgot where a feature lives? Open the command palette first
- ⌘↩: build, then read the result in the PDF panel
- ⇧⌘J: finished a paragraph? Jump over and check the typesetting
- ⌘-click: see a problem in the PDF and go back to its source
- ⇧⌘0: clear the distractions when you need to write straight through

## Conflicts and exceptions

- ⌘0 resets zoom, ⇧⌘0 is zero interface mode; they do not conflict, but are easy to mix up
- ⌘Z in a text field is up to the system; only the editor follows project history
- ⌘F only affects the current editor; searching the PDF uses the PDF panel's own search box
- On Windows / Linux the Ctrl standing in for ⌘ can collide with system or input-method shortcuts; when it does, trust the combination shown in the app's menus
- On some keyboard layouts `⌘\\` depends on the physical backslash key; if it will not fire, search the command palette for Toggle sidebar

> Shortcuts do not change with custom settings. The most reliable place to confirm a binding is the hint on the right of the menu item.

## Placeholders and revision notes

| Action | macOS | Windows / Linux |
| --- | --- | --- |
| Insert a body placeholder | `⌘⇧H` | `Ctrl+Shift+H` |
| Next / previous placeholder in the current file | `F4` / `⇧F4` | `F4` / `Shift+F4` |
| Leave a revision note | `⌘⇧N` | `Ctrl+Shift+N` |
| Open the revision note list | `⌘⇧U` | `Ctrl+Shift+U` |
| Apply CTeX writing typography to the main file | `⌘⌥⇧C` | `Ctrl+Alt+Shift+C` |

All of these are also in the command palette. See [Placeholders and revision memos](/docs/writing-aids) and [CTeX Chinese typesetting](/docs/ctex-typography).
