---
slug: about
title: About TeXPro
group: 关于
order: 17
summary: What TeXPro is, who it is built for, and its design philosophy, design language, interaction approach, versions, and documentation map.
---

## What TeXPro Is

TeXPro is a desktop writing workbench for LaTeX. It places the source editor, the visual writing layer, PDF preview, project management, and the compile chain in one window, so you never have to leave the application from the first line you write to the PDF you hand in.

It does not replace LaTeX, and it does not hide LaTeX. Files are still `.tex`, and compilation is still performed by the local latexmk and TeX distribution; what TeXPro does is make that chain coherent: you can see the structure while editing, match positions after compiling, and check problems clearly before delivery.

The repository keeps the name `TexStudioPro`; the product name is TeXPro. It is not affiliated with projects such as TeXstudio or Typora.

## Who It Is Built For

TeXPro is aimed mainly at three groups:

- Researchers and graduate students writing papers: multi-file projects, bibliographies, cross-references, journal templates
- Students doing coursework or Chinese typesetting: formulas, figures, and reliable Chinese support
- Authors maintaining technical documentation: long texts, code, tables, and many revisions

What they share: they are willing to invest learning effort in typesetting quality, but do not want to spend time on tool switching and format patching.

## Design Philosophy

The seven points below are not slogans; they are the ordering criteria when conflicts arise.

- **Writing must be continuous**: body text, formulas, tables, music scores, and circuit diagrams all live in the same cursor flow. Everyday input and editing should not require opening a studio first, filling in a form, and then clicking "Done".
- **Source is the record**: `.tex` is the single source of truth; the visual layer is only its projection. Source files must stay readable, portable, and compilable offline, and must not become an application-private document format.
- **Help appears on demand**: tools appear only when you select content or explicitly ask for them. Moving configuration forms into the body text is not continuous writing; the studio is an optional accelerator, not the default path.
- **Preserve the author's position**: preview refreshes, validation, package insertion, and background compilation must not take away the current file, cursor, selection, undo history, or scroll position. While an input method is still composing, the interface must not reflow ahead of it.
- **Closed loop**: writing, project structure, compile diagnostics, PDF, citations, and version history should meet in the same workspace and share the same main file.
- **Automation must be inspectable**: AI, MCP, custom builds, and backups must make visible what they did, and it must be undoable.
- **Local first, remote explicit**: projects stay on disk by default; networking, cloud, and collaboration are choices with visible boundaries.

When conflicts arise, the priority order, from high to low, is: continuous writing, trustworthy source, complete visualization, number of tools.

## Design Language

The visual goal can be summed up as "paper body text, quiet shell": the reading area is close to paper, while the surrounding interface recedes into the background.

| Element | Value | Purpose |
| --- | --- | --- |
| Editing paper | theme variable `--paper` | Paper color rather than pure white, to reduce screen glare |
| Body text color | `#2b2926` | Softer than pure black; easier on the eyes for long reading |
| Accent color | warm terracotta (Studio `#d97757`, Paper `#b4532a`) | Marks only focus, selection, and current state |
| Body width | `760 px` | Single column, to control line length |
| Body font size | `18 px` | The comfortable range for on-screen reading |
| Corner radius | `10 px` | Soft but not excessive; not cartoonish |

Fonts come in three sets: the interface uses SF Pro, PingFang, or a system sans-serif; body text uses New York, Charter, a Song-style serif, or Georgia; code uses SF Mono, JetBrains Mono, or another monospace font. The three sets each do their own job and are not mixed.

- Icons uniformly use Lucide line icons with the same stroke weight; feature entry points do not rely on colorful emoji for distinction.
- Motion is used only for panel transitions and state changes, and respects the system's "Reduce Motion" setting; there are no decorative animations.
- Themes come in three sets: Studio, Night, and Paper. Switching themes changes colors and lightness, not layout, type hierarchy, or the meaning of the accent color.

## Interaction Approach

The goal of the interaction is to keep your hands on the keyboard and your eyes on the text.

- **Keyboard first**: common actions all have shortcuts or command-palette entries; the mouse is an accelerator, not a prerequisite. See `/docs/shortcuts` for the full list.
- **Edit in place**: paragraphs, formulas, tables, and images are modified where they are. Selecting text brings up only six actions — bold, italic, code, inline formula, quote, cross-reference — without opening a large panel.
- **Clear entry and exit**: press Esc inside a visual block to return to source; closing the writing assistant restores the previous cursor and selection, without leaving half-finished work in the document.
- **Position preservation**: autosave, background compilation, and preview refresh do not steal focus or reset the selection; they do not interrupt input while an input method is composing.
- **Visible automation**: AI suggestions are listed as action cards and written only after you apply them one by one; builds use the command you configured, and shell-escape is off by default. Nothing is rewritten silently.
- **Assets as you write**: dragging in or pasting an image stores it in the project's asset directory and inserts a figure with a label; SVG is first converted to a 1800 px PNG.
- **Restrained feedback**: success gets a short toast; errors go to Problems and the log. Destructive actions such as deleting or replacing the whole document ask for confirmation first; the rest of the time writing is not interrupted.

The measure of good interaction is not whether the animation is smooth, but whether you need to find the cursor again after finishing a paragraph.

## What It Does Not Do

### Not an Online Collaboration Platform

TeXPro has LAN collaboration based on Yjs, but it is not a cloud document service: there is no room hosting, no public sharing, and no account permission system. When you need remote collaboration with several people, keep using Overleaf or Git; TeXPro only handles local editing and version handoff.

### Not a Markdown Editor

Markdown and Typst exist only as interoperability formats for import and export. TeXPro's source files are LaTeX; if your goal is Markdown writing, choose a dedicated Markdown tool instead of taking a detour here.

### Not Glassmorphism

The interface deliberately avoids Liquid Glass-style translucency, strong reflections, and layered blur. The visual language is closer to paper and print: a stable base color, clear hierarchy, and a small amount of accent color. This is not an aesthetic preference, but a way to keep long reading and writing from being tiring.

## Tech Stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Desktop runtime | Electron 44 | Native menus, filesystem, and child processes |
| Rendering layer | React 19 + TypeScript 5.9 | Editor, panels, and state |
| Build | Vite 8 | Dev server and production build |
| Editor | CodeMirror 6 | Syntax highlighting, completion, folding, and collaboration extensions |
| PDF | PDF.js 6 | Rendering, text layer, and inverse search |
| Formulas | KaTeX 0.19 | Formula preview in the visual layer and on exported pages |
| Collaboration | Yjs 13 | LAN CRDT sync |
| Icons | Lucide | Interface icons |

The process boundary is explicit: the rendering layer is responsible only for editing and display; file I/O, compile processes, and key encryption are all handled by the main process through typed IPC exposed by preload. TeX itself is not distributed with the application; TeX Live or MacTeX must be installed locally. Node.js 22+ is needed only for development.

## Versions and Release Cadence

Download versions come from actual GitHub Releases and the website version pages; the root package files manage the application base version. The application uses nightly builds: GitHub Actions checks every day at `13:23 UTC` (21:23 Asia/Shanghai) whether `main` has new commits since the last successfully published Nightly; if so, it runs regression tests, type checks, and the build, and publishes the installers with a dated `v{baseVersion}-YYYYMMDD-Nightly` prerelease tag.

| Platform | Artifacts |
| --- | --- |
| macOS | Universal DMG and ZIP (Apple Silicon / Intel) |
| Windows | x64 NSIS installer, portable version, and ZIP |
| Linux | x64 deb, AppImage, and rpm |

A few practical constraints:

- No new commits since the last successful Nightly means no new build
- Nightly builds are unsigned; macOS may warn that the developer cannot be verified, and Windows may trigger SmartScreen
- A failed build produces no installers; the latest artifacts shown on the download page are authoritative
- There is no fixed stable release cadence yet; keep your own backups and version history for important work

### Upgrades and Compatibility

`0.1.0` is still in a period of rapid iteration and does not yet promise a stable data format. Nightly builds may change fields in `.texpro/project.json`, the history and template structures, export output, or shortcuts.

- Back up the entire project directory before upgrading, and keep a known-good version of the application
- Open and compile on a copy first; only replace your working directory after confirming it works. Do not assume that an older version can read data written by a newer one

## Project Story

TeXPro's first commit was on October 21, 2026, with the message "Initial commit: TeXPro visual LaTeX workbench". It did not start out to be an all-purpose IDE; it wanted to solve one specific annoyance: TeXstudio is very capable at project management, but writing in it feels like typesetting in a terminal; Typora's paper is quiet, but it is not a LaTeX tool.

In the first few days, the repository quickly grew a research workflow, nightly packaging, an approval-gated MCP, and collaborative editing; then came in-body music scores, and a document that wrote "continuous writing" into the product contract. These features look scattered, but they follow the same line: every assistive capability must return to the same cursor position.

The project has also made subtractions. A translucent Liquid Glass shell was once implemented and was later removed entirely; unless there is a new explicit decision, it will not come back. The LaTeX syntax highlighting library `codemirror-lang-latex` was also not adopted, because it is AGPL-3.0-or-later, which is inconsistent with the repository's preferred MIT license.

To this day it is still a `0.1.0` project: a short history, boundaries still converging, and nightly builds leaving `main` every day. It does not pretend to be mature, but it tries to write down every trade-off so that people who come later know why things are the way they are.

## How to Contribute

### Reporting Issues

Describe the symptom, reproduction steps, and expected result in GitHub Issues. Useful information includes:

- Version number and build date (footer or About window)
- Operating system and TeX distribution (version of TeX Live / MacTeX)
- A minimal reproducing `.tex` snippet, or a description of the project structure
- The key error lines in the compile log

Do not paste API keys, unpublished manuscripts, or other people's personal information.

### Contributing Code

PRs are welcome, but keep changes focused:

- Open an Issue to discuss larger changes first, so you do not find out the direction is wrong only after writing the code
- Respect the boundary between the rendering layer and the main process; do not read files or spawn processes directly from the rendering layer
- Include tests for behavior changes; at minimum run the existing tests and the type check
- Explain the reason before adding a dependency, and prefer MIT-compatible licenses

### Improving Documentation

The product page documentation lives in `product-page/src/content/docs/`; each file is one page, and the front matter determines the title, group, and order. When writing:

- Facts must follow the source code and repository documentation; do not document unimplemented features
- Organize content with `##` and `###`, and write tables and notes the way the existing pages do
- Leave a space between Chinese and Latin text, and write internal paths as `/docs/xxx`

## Documentation Map

The documentation is organized into six groups; reading along the usage path is recommended:

| Group | Pages |
| --- | --- |
| Start | `/docs/start` Installation and your first project |
| Using | `/docs/import`, `/docs/compile`, `/docs/synctex`, `/docs/writing` |
| Reference | `/docs/project`, `/docs/export`, `/docs/ai`, `/docs/shortcuts` |
| Development | `/docs/dev-setup`, `/docs/dev-arch`, `/docs/dev-renderer`, `/docs/dev-testing`, `/docs/dev-release` |
| AI workflow | `/docs/mcp`, `/docs/ai-guide` |
| About | `/docs/about`, `/docs/copyright` |

> First time here? Start with "Installation and Your First Project". To connect AI or build your own integration, read "MCP: Handing the Project to AI" and "A Second-Development Guide for AI".

Stable releases use three manual major/minor/patch workflows, committing the incremented version only after tests and all platform packages pass. See [stable releases](/releases) for history, notes and downloads. Minimal color-only themes still need no stylesheet compiler; see [theme packs](/docs/themes).
