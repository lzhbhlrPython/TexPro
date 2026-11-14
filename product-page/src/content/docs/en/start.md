---
slug: start
title: Installation and Your First Project
group: 开始
order: 1
summary: "TeXPro is a desktop application that does not depend on a server. This section covers only four things: install it, open it, compile, and look at the result."
---

## What TeXPro Is

A local-first LaTeX workbench: write on the left, typeset on the right, with no switching back and forth in between. The source is always real source, compilation always goes through `latexmk` on your machine, and your files always stay on your own disk.

It is not a Markdown editor, nor an online collaboration platform. Before you open it, you do not need to register an account or upload your manuscript to any server.

## Finding the right guide

The [User guide](/docs) starts with this chapter and covers installation, writing, compilation and delivery. For plugins, themes, MCP integration or app contributions, start with the development setup chapter in [Developer docs](/developers). Search covers both sections; article navigation and previous/next links stay within the current section. Existing article links remain valid.

## Preparing the Environment

### The Application

| Platform | Installer | Notes |
| --- | --- | --- |
| macOS 13+ | `.dmg` | Separate builds for Apple silicon (arm64) and Intel (x64) |
| Windows 10+ | `.exe` | NSIS installer, install path selectable |
| Linux | `.AppImage` | Make it executable and run it directly; deb / rpm also available |

Installers are hosted on GitHub Releases. Nightly checks daily at 21:23 Asia/Shanghai for commits since the last successfully published Nightly, then tests, packages and publishes when new commits exist; otherwise it skips. Nightly versions carry a date. Actions queues may delay the scheduled check.

### TeX Distribution

TeXPro does not bundle TeX; a complete distribution must already be installed locally:

- macOS: MacTeX (or BasicTeX plus the packages you need)
- Windows: TeX Live
- Linux: TeX Live (usually packaged as `texlive-full` in distro repositories, or installed as needed)

Any one of `pdflatex`, `xelatex`, or `lualatex` is enough; on launch the app probes for the distribution and the executables, and if it cannot find them it tells you what is missing before compiling. For Chinese typesetting, XeLaTeX or LuaLaTeX is recommended.

## Opening It for the First Time

The first launch gives you a demo project (`demo/`) containing a `main.tex` that covers formulas, tables, TikZ, music scores, citations, and other common elements. You do not have to prepare your own manuscript first — compiling it once is the fastest way to confirm that the environment is complete.

After you press compile, the status bar at the bottom shows "Typesetting" and then "PDF ready · elapsed". If this step works, the TeX environment is fine and you can open your own project.

## Opening Your Own Project

Use "File → Open Folder" (⌘O / Ctrl+O) to pick a directory. TeXPro scans it for `.tex`, `.bib`, images, and subdirectories, and infers the main file from them.

The main file is determined in this order:

| State | Meaning |
| --- | --- |
| `configured` | A main file is fixed in the project configuration and takes precedence |
| `detected` | Only one plausible candidate exists in the directory; selected automatically |
| `ambiguous` | Several candidates exist; you must specify one |
| `missing` | There is no `.tex` file in the directory |
| `invalid` | The file the configuration points to does not exist |

If it cannot be inferred, specify it once with the "Main file" dropdown on the left; the choice is written into the project configuration and used from then on.

> The `.texpro/` directory under the project root stores the project configuration and content snapshots. Whether it goes into version control is up to you, but for shared projects it is usually easier to handle it together with `.gitignore`.

## Compiling for the First Time

Press ⌘↩ (Ctrl+Enter on Windows / Linux) to compile.

```text
main.tex  →  latexmk（-synctex=1）  →  main.pdf
```

- The engine follows the project setting by default (`pdflatex` / `xelatex` / `lualatex`)
- Incremental builds are handled by `latexmk`; the second compile is usually faster than the first
- The log is also written to the build directory next to the PDF, and the diagnostics panel reads the same file
- When something fails, the number of problems appears on the right; click it to open the diagnostics panel, and click an entry to jump to the offending line

Compilation runs in the background and does not block typing: you can keep writing, and when the results come back only the preview and diagnostics update.

## Interface Map

| Location | Purpose |
| --- | --- |
| Left sidebar | File tree, asset library, symbols, and full-text search (⌘\ to collapse) |
| Center | The editor. Source and visual layer are two faces of the same content (⌘⌥M to switch) |
| Right | PDF preview, collapsible as a whole (⌘⌥P) |
| Bottom | Status bar, compile time, and diagnostics panel |

## Four Common Shortcuts

| Shortcut | Action |
| --- | --- |
| ⌘K | Command palette; all 30+ panels and actions are searchable |
| ⌘⌥F | Focus mode: keep only the current paragraph |
| ⌘⌥T | Typewriter mode: keep the cursor fixed in the middle of the view |
| ⌘⌥L | Toggle light / dark |

See [Shortcuts](/docs/shortcuts) for the full list.

## Common First-Time Problems

**Compile reports that latexmk cannot be found**: TeX is not installed, or the terminal / app was not restarted after installing it. The installer changed PATH, and the old process cannot see it.

**The PDF is blank**: most likely the wrong main file was chosen, so a stub with no body text was compiled. Check the "Main file" dropdown on the left.

**Chinese turns into boxes**: the engine is pdfLaTeX. Switch to XeLaTeX, or load the `ctex` package.

**The PDF preview does not follow the cursor**: compile once so that the SyncTeX data is generated; `-synctex=1` is a default argument, but it may have been overridden in an old project configuration.

**Opening a project is slow**: large directories such as `node_modules` / `build` are skipped, but if your project contains an extremely large image directory, the first scan still reads metadata.

## Next Steps

- Compiling and diagnostics: [Compile and Diagnostics](/docs/compile)
- Two-way navigation: [Two-Way Navigation Between PDF and Source](/docs/synctex)
- Writing experience: [Writing Mode and Themes](/docs/writing)
- Moving a manuscript from another tool: [Import, Templates, and Assets](/docs/import)

## Check and install application updates

Prerequisites: a TeXPro build with Software updates and access to GitHub. If your version lacks this section, download a newer build from [GitHub Releases](https://github.com/lzhbhlrPython/TexPro/releases). These steps take place in the app; no terminal or working directory is needed.

- Open Preferences → Software updates and verify Current version. Only stable releases are checked by default; select Include Nightly builds for preview releases.
- Enable Automatically download after checking to download a newer installer as soon as your manual check finds one. It is off by default and stored locally. It does not check at startup.
- Click Check for updates. With automatic downloading enabled, a newer compatible installer downloads inside the app; otherwise click Download update. Files go into the updates subdirectory of the application's user-data directory. Progress appears in Preferences; Cancel download allows you to stop and retry.
- TeXPro verifies the size and GitHub SHA256 before showing Show in folder. Save your work and quit TeXPro normally, then manually run the installer or replace the application. Grant executable permission to a Linux AppImage if needed. Reopen TeXPro and verify Current version.
- Use Download in browser or GitHub Releases as a fallback. If the release has no SHA256, the in-app download is explicitly refused; download in the browser and verify it manually.

Closing Preferences keeps the download running; reopen it to view progress or locate the completed file. Quitting interrupts downloads. Resume is not supported: failed or cancelled downloads restart from the beginning, and download state does not survive an application restart. Cancel an active download before switching channels. Temporary files use .part and the current temporary directory is removed on failure or cancellation. Completed files remain in the cache. TeXPro never executes the installer or quits to install it. A crash or forced termination may leave .part files behind.

Channels never force a downgrade. Numeric base versions are compared first, stable wins at the same base, and Nightly uses dates. Other prereleases are excluded. Installers must match the current system and architecture: DMG on macOS, setup.exe on Windows, AppImage on Linux. Missing compatible installers and no higher version are distinct results. Same-version stable replacements and same-day Nightly rebuilds still require manual retrieval from Releases.

Offline, rate-limit, timeout, malformed-response and history-limit failures never report up-to-date status. Download timeouts, insufficient disk space, size and checksum mismatches have separate messages; retry after recovery. SHA256 checks download integrity and does not replace operating-system code signing. This feature does not update npm plugins or require a new signing or automatic installation mechanism.
