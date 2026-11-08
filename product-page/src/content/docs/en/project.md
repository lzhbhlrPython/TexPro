---
slug: project
title: Projects and files
group: 参考
order: 6
summary: A project is a directory on disk. Main file, sub-files, images, bibliography and .texpro metadata all live inside it; TeXPro builds no database and only reads and writes those files.
---

There is no hidden import step: open a directory and it is the project. From then on every create, rename, move and delete happens inside that directory, and anything reaching outside is refused outright. Copy the directory to another machine and you can keep compiling.

## Opening and creating

- `⌘O` or `File → Open Folder…` picks a directory, and it becomes the project; the welcome page keeps the last 8.
- `File → Template Library…` starts a new project from a template: pick a parent folder, name the project, and it creates `<parent folder>/<project name>`.
- Backslashes, slashes, colons, asterisks, question marks, quotes, angle brackets and pipes in the project name become `-`, truncated to 80 characters; if a directory of that name already exists, `-2`, `-3` is appended rather than overwriting.
- Opening a project parses the tree, main file, assets, outline and comments; it copies and moves nothing.
- `Explore the demo project` on the welcome page generates a sample project in the app data directory and tries one build, a good way to get familiar with the interface.

## How the main file is resolved

- First `rootFile` in `.texpro/project.json` (a path relative to the project root). If present it is validated: it must be a `.tex` or `.ltx` inside the project containing an uncommented `\documentclass`.
- With no configuration, files containing `\documentclass` are probed recursively, five levels deep, skipping dot-directories and ignored directories such as `.git`, `node_modules`, `.texpro`, `build`, `out` and `dist`.
- Exactly one becomes the main file; several give "Multiple main files found. Choose the project main file." and you must choose in Project Structure; none gives "No main file containing \documentclass found.".
- A configured file that breaks gives "Project main file configuration is invalid: ...", with no quiet fallback to probing.

The main file decides the build entry point and the PDF name, not editing focus: open any file, press `⌘↩`, and the main file is still what builds. Error messages mention a `% !TeX root` comment, but main-file resolution does not read it; that comment is only rewritten when you rename or move files.

## Directories and metadata

| Path | Contents |
| --- | --- |
| `.texpro/project.json` | Main file, modules, assets, build directory, TOC and module list |
| `.texpro/build/` | Build artifacts, the default build directory |
| `.texpro/trash/` | Staging area for deleted files, named by timestamp |
| `.texpro/comments.json` | Comments, anchored to file, line and snippet |
| `.texpro/svg-cache/` | Rasterised SVG cache; source files untouched |
| `.texpro/history/` | Internal snapshots, content-addressed |

All of it can be deleted. Deleting `project.json` forgets the main-file choice and the directory configuration, and the next open probes again. Backups skip every dot-directory but add `project.json` and `comments.json` into the zip separately.

## File operations and references

Creating, renaming, moving and deleting all happen in the file tree, and the impact is computed first:

- Renaming or moving rewrites paths in `\input`, `\include`, `\includegraphics`, `\bibliography`, `\addbibresource`, `\lstinputlisting`, `\includepdf` and `% !TeX root`.
- Rewriting skips comments, and everything inside verbatim, lstlisting, minted and `\verb`.
- Extensions are added or dropped by reference type: images recognise `.pdf`, `.png`, `.jpg`, `.jpeg` and `.svg`, bibliographies `.bib`, source `.tex` and `.ltx`.
- Every change is computed before the rename; if writing back fails, contents and paths are restored in reverse, leaving nothing half-changed.
- An existing target reports "A file or folder with that name already exists"; going out of bounds reports "Path is outside the project"; symlinks are refused.
- A new file without an extension gets `.tex`; a rename without one keeps the original extension; names cannot contain slashes or backslashes.

## Deleting and recovering

Delete is not really delete: the file or directory moves to `.texpro/trash/<timestamp>-<original name>`, where the timestamp is ISO time with colons and dots removed. The confirmation first lists the affected sub-files, assets and reference counts.

The interface has no Restore button. To get something back, open `.texpro/trash` in Finder, sort by time and drag it back where it was; references are not restored automatically, so fix the paths by hand if needed.

## Snapshots and versions

While the project sits outside a Git repository, an explicit `⌘S` save leaves an internal snapshot of the changed files; `Project → Version Review…` can create snapshots by hand, show line-level diffs, restore a single file or delete a snapshot.

Once the project lives inside a Git repository, internal snapshots stop automatically and the panel points you at Git instead. The Git panel shows the branch, ahead / behind and the last 8 commits; the default commit message is "Update from TeXPro", and pulls only ever run with `--ff-only`.

Snapshots are content-addressed: chunked at 4096 characters, named by sha256 and brotli-compressed, with duplicate content stored once. They suit that paragraph you just deleted by accident, not long-term version control.

## Search, outline and project checkup

- Search: two characters minimum, 320-millisecond debounce, five levels deep, 2 MB per file, 120 hits at most, case sensitivity toggles.
- The outline centres on the active file: it does not merge across files, and in a long project reading it per `\input` branch is more accurate.
- Project Doctor checks the toolchain, orphan `.tex` files, missing packages, broken links, missing images, undefined references, missing bib keys, duplicate labels and font embedding, and can clean the build directory.
- There is one active document at a time, with no full multi-tab editing; encodings are handled as UTF-8.

## Comments

Comments from `Project → Comments…` live in `.texpro/comments.json`, anchored to a file, a line and a snippet of the original text, without inserting markers into the `.tex`. If line numbers have drifted when the project opens, they are re-anchored by snippet; if the snippet changed too, the comment stays in the list but is no longer anchored.

## Common pitfalls

- Wrong project root: a parent directory sweeps in unrelated projects, a subdirectory finds no main file; reopen the right directory.
- Files moved in Finder without reopening the project: the tree and references are stale; only moves inside the app rewrite references.
- Deleted something and cannot find it: sort `.texpro/trash` by timestamp, where the prefix of each name is ISO time.
- Committing with external Git and then opening Version Review: internal snapshots have stopped, so you see old ones.
- Deleting all of `.texpro`: comments, trash and snapshots vanish together; the source is unaffected.
- Backup zips exclude the default build directory and the rest of `.texpro`; the first build after restoring recreates the build directory.

## Related pages

- Compiling and diagnostics: `/docs/compile`
- Two-way PDF and source navigation: `/docs/synctex`
- Import, templates and assets: `/docs/import`
- Exporting and arXiv: `/docs/export`
