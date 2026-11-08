---
slug: faq
title: FAQ
group: 参考
order: 10
summary: Install failures, build failures, missing fonts, upload worries — the dozen things that most often trip people up on first use, answered in one place.
---

## Does it need a network connection?

No. TeXPro is a desktop app; opening a project, editing, compiling and reading the PDF all happen locally. The only network traffic is what you start yourself: a Git remote, Overleaf, an arXiv upload, the optional AI assistant, and the GitHub Releases lookup when a page displays a version number.

## Do I have to install TeX myself?

Yes. TeXPro bundles no TeX distribution; it drives the `latexmk` and engines already on your machine. Install MacTeX or BasicTeX on macOS, TeX Live on Windows and Linux; for Chinese projects, make sure `ctex` is included.

## Which platforms are supported?

macOS 13 and later (Universal, Apple silicon and Intel), Windows 10 and later x64, Linux x64 (AppImage, plus deb / rpm). Interface regression testing currently happens mostly on macOS; builds for the other two platforms come from the same nightly pipeline.

## It says pdflatex is missing

Two common causes:

- The distribution is not installed, or it is installed but not on `PATH`;
- an app started from the graphical interface does not inherit the login shell's environment variables (especially common on macOS).

Run `which latexmk` in a terminal to confirm the path, then point TeXPro's build settings at the executable; or launch the app from a terminal so it inherits the full environment.

## Chinese comes out garbled, or a font is reported missing

Switch the engine to XeLaTeX or LuaLaTeX, and use the `ctex` package in the preamble. The font coverage panel shows whether the fonts are actually found; when a font is missing, the build log names it.

## Should `.texpro/` be committed to the repository?

Your call. It holds the project configuration, content snapshots and the trash, which is local working state; most people handle it through `.gitignore`, and when a team shares a project it is best ignored so everyone keeps their own history.

## Can it replace Overleaf?

They aim at different things. TeXPro is built for one person finishing one paper, with project files on your own disk; Overleaf is online collaboration and cloud builds. The two can round-trip through Git: Overleaf clones from Git, and TeXPro has a Git panel too.

## How does collaboration work?

Temporary rooms on the local network: one person starts a session, others on the same network join with a room code, and edits sync over a local WebSocket. It is not cloud sync, has no accounts, and keeps no long-term archive.

## Will the AI upload my draft?

Not by default. The AI assistant is optional: only once you configure a service and key and actively send a request with text selected does that text leave. Leave it unconfigured and it never touches the network; nothing else is affected.

## Builds are slow. What can I do?

First check whether every build is a full build: watch the duration in the status bar at the bottom. The usual speedups are incremental builds with `latexmk`, converting images to PDF or lowering their resolution, and splitting a long document into sub-files — a chapter brought in with `\include` can be built on its own.

## Will uninstalling delete my draft?

No. Your draft lives in the project directory you chose, and uninstalling the app does not touch it. The app's own configuration, history and templates sit in the user data directory; delete those by hand for a clean removal.

## Where do data and settings live?

- Project-related: the project directory plus the `.texpro/` inside it;
- App-related: the TeXPro folder in the system user data directory (settings, recent opens, user templates, MCP configuration).

The AI key is stored separately as `secrets.json` in that directory, encrypted by the system secure store with `0600` permissions; where the system offers no encryption, saving fails outright rather than falling back to plain text.

## Can shortcuts be changed?

Menu shortcuts are currently fixed; the Shortcuts page has the full reference. Inside the editor there is a separate set of CodeMirror keybindings that follow editor conventions. The command palette offers an entry point that needs no shortcut.
