---
slug: copyright
title: Copyright and License
group: 关于
order: 18
summary: TeXPro's MIT license, this site's content, third-party dependencies and font licenses, plus trademark and privacy notes.
---

## The Three-Sentence Version

- The application itself is MIT-licensed: you may use it commercially, modify it, and redistribute it, as long as you keep the copyright and license notices.
- Your papers, images, and exported PDFs belong to you; TeXPro claims no rights over them.
- The application has no accounts and no telemetry; network access happens only in actions you explicitly trigger.

The full explanation follows. It is not legal advice; if commercial use or redistribution is involved, read the original `LICENSE` at the repository root as well.

## The Application: MIT License

TeXPro is released under the MIT license, with the copyright notice:

```text
Copyright (c) 2026 TeXPro contributors
```

MIT is a permissive license: it allows you to use TeXPro anywhere, change it however you like, and incorporate it into closed-source products.

### You May

- Use it in personal, educational, or commercial settings, without paying and without a license key
- Read and modify the source code, adding or removing features as you need
- Redistribute the original or modified version, including packaging it into your own distribution
- Incorporate the code into other projects, including projects that do not publish their source
- Use a different name and icon for modified versions (you bear the trademark risk yourself)

### You Must

- Keep the copyright notice and the full MIT license text in copies or derivative works
- Include `LICENSE` when distributing, usually in the install directory or on the About page

MIT does not require you to publish modified source code, nor to release derivative works under the same license. It also provides no warranty of any kind, which the next section expands on.

### When Distributing Modified Versions

If the version you publish differs noticeably from the official build, label it "unofficial build" in the name or description, so that users do not attribute problems to upstream. Using the TeXPro name and icon is a trademark matter outside the scope of the MIT grant; see "TeX, LaTeX, and Related Names" below.

## The Software Is Provided "As Is"

The disclaimer in the MIT license applies to the entire application:

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

In everyday language:

- No guarantee that compile results are correct, or that the typesetting meets journal requirements
- No guarantee that the application is free of defects, or that it will run on your system without interruption
- No guarantee that data will not be lost through mistakes, disk failure, or third-party tools
- The authors and contributors are not liable for damages arising from the use of, or inability to use, this software

So keep history for important papers with Git, backups, or project snapshots, and compile once more with the target template before submitting to a journal. The application offers snapshots, version history, and backup entry points, but they cannot replace your own backup strategy.

## This Site's Content

The product page and the application live in the same repository, and the site source is also provided under the MIT license. The text, structure, styles, and examples on these pages may be reused, rewritten, and used in commercial projects.

What still needs to be kept is only the copyright and license notice. The following are not covered by the MIT grant:

- The "TeXPro" name, the application icon, and the visual identity of official builds
- Third-party interfaces, fonts, and assets appearing in page screenshots (they belong to their respective owners)

Page screenshots come from real running windows using the `demo/` project in the repository; no interface was composited or faked. When quoting screenshots, credit the source and avoid implying that your product is the official version.

## Third-Party Dependencies

TeXPro stands on a large number of open-source projects. The table below lists the main dependencies and their actual licenses; versions are the major versions at the time of writing, and exact versions are defined by `package.json` and `package-lock.json`.

| Component | Version | License | Purpose |
| --- | --- | --- | --- |
| rtex-ts / realtime-tex Lua/TeX | 0.1.11 / 0.0.7 | MIT | Incremental paragraph typesetting and context capture |
| fontkit | 2.0.4 | MIT | TeX glyph outlines |
| Electron | 44.x | MIT | Desktop runtime and native menus |
| React / React DOM | 19.x | MIT | Rendering-layer interface |
| CodeMirror | 6.x | MIT | Source editor and extensions |
| KaTeX | 0.19.x | MIT | Formula preview |
| PDF.js (pdfjs-dist) | 6.x | Apache-2.0 | PDF rendering and text layer |
| Yjs | 13.x | MIT | CRDT for LAN collaboration |
| y-codemirror.next / y-protocols | 0.3.x / 0.1.x | MIT | Collaboration and editor binding |
| Lucide (lucide-react) | 0.544.x | ISC | Interface icons |
| Ant Design | 6.x | MIT | This site's component library |
| Vite | 8.x (app) / 7.x (site) | MIT | Build and dev server |
| TypeScript | 5.9.x | Apache-2.0 | Type checking and compilation |
| ws | 8.x | MIT | Local collaboration WebSocket |
| perfect-freehand | 1.2.x | MIT | Freehand ink |
| react-router-dom | 7.x | MIT | This site's routing |
| dayjs | 1.11.x | MIT | Date formatting |

A few notes:

- MIT and ISC both require keeping the copyright and license notice; Apache-2.0 additionally requires keeping the NOTICE file (when provided with the package) and stating changes when you modify files. TeXPro uses these libraries as-is, without patching them.
- The table is not a complete list. Indirect and development dependencies (such as electron-builder, Vite plugins, and type definitions) follow their own licenses; the full texts are in `node_modules/<package>/LICENSE`.
- Third-party code in build artifacts remains bound by its original license. When redistributing installers, keep `LICENSE` and the dependency notices as well; Electron's license information is in `LICENSES.chromium.html`.
- If you add a dependency, choose an MIT-compatible license and explain it in the PR; AGPL-type dependencies need separate evaluation, and the repository deliberately does not use `codemirror-lang-latex` (AGPL-3.0-or-later) at present.

## Realtime preview provenance and licenses

Realtime preview bundles the independent MIT package [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts). Its TypeScript host closely adapts Henry Yang and the realtime-tex contributors' [realtime-tex](https://github.com/HenryXiaoYang/realtime-tex). Lua/TeX support is retained unchanged from version 0.0.7, revision `fcff7a5c7f33a288ecf40db886843754c62bbdfd`. Original attribution, `Copyright (c) 2026 Henry Yang and the realtime-tex contributors`, and the complete MIT text are preserved. Rewriting does not transfer ownership of those contributions.

Research inspiration comes from Clemens Lode's [Real-Time LuaTeX: Recompiling Large Documents in 1 ms](https://www.tug.org/tug2026/preprints/lode-realtime.pdf), TUG 2026. Citation does not imply endorsement, and upstream performance is not a measurement of this application. The host uses fontkit (MIT, Devon Govett) for glyph outlines. TeX distributions and fonts are installed separately and retain their own licenses.

Redistributors must retain the root THIRD_PARTY_NOTICES.md, rtex-ts LICENSE, UPSTREAM and third-party notices, and the vendored upstream license and manifest. Packaged rtex-ts resides in `app.asar.unpacked/node_modules/rtex-ts/`. See [realtime preview and embedding](/docs/realtime-tex).

## Font Licenses

TeXPro's font strategy has two parts, because the application and the product page are not the same.

### Inside the Application

The application installer does not ship font files. The interface uses system fonts: SF Pro and PingFang on macOS, falling back to the system sans-serif on Windows / Linux; the editor prefers locally installed New York, Charter, and Song-style fonts, falling back to Georgia or a system serif when they are missing.

This means:

- Font licensing is determined by the operating system and the fonts you have installed; TeXPro does not license them separately
- Glyphs may differ on another machine; typesetting follows the local fonts at compile time
- To use a commercial font reliably in a PDF, you need to buy and install it yourself

### This Site and the Documentation Pages

The body text on this site uses Source Han Serif / Noto Serif SC, under the SIL Open Font License 1.1. The font is loaded in subsets via `@fontsource/noto-serif-sc` on jsDelivr; Chinese subsets are downloaded on demand, and no font binaries are distributed with the site repository.

SIL OFL 1.1 allows:

- Free use, including on commercial websites and in print
- Embedding in documents and PDFs
- Modifying glyphs and redistributing them
- Bundling with other software, as long as the font is not sold separately

You must comply with:

- Keep the OFL license and copyright notice when redistributing font files
- Modified versions must not use the original font's Reserved Font Name; the `OFL.txt` shipped with the font is authoritative
- You may not sell the font itself as the primary product

### Fonts in PDFs

Exported PDFs are typeset by the local TeX distribution; which fonts are embedded is determined by the document, the packages, and the system fonts. TeXPro does not substitute or bundle fonts. When using a publisher-specified or commercial font, make sure you hold the corresponding license; before distributing a PDF publicly, check in particular the origin of images, figures, and fonts.

The music score feature depends on the local MusiXTeX / musixtnt, which ship with the TeX distribution and are not distributed with the TeXPro installer; their licenses follow the distribution's own documentation.

## TeX, LaTeX, and Related Names

- TeX is a trademark of the American Mathematical Society
- LaTeX is maintained by the LaTeX Project; its name and hummingbird logo refer to that project and its software. The logo is not covered by the LPPL grant; read the official documentation before using it
- TeXPro is not affiliated with TeX or LaTeX and is not endorsed by them
- These names are mentioned in the documentation only to describe compatibility with file formats and the compile chain
- The TeXPro name and icon belong to this project; the MIT license does not include trademark rights
- The names Typora, TeXstudio, Overleaf, and others belong to their respective owners; they are mentioned only for comparison or to describe interoperability

If you describe your own product as "LaTeX-compatible", make sure the statement is accurate and avoids implying official certification.

## Your Content Belongs to You

Everything you create or edit in TeXPro is copyrighted by you (or the original rights holder):

- `.tex`, `.bib`, images, figures, and other project files
- PDFs produced by compilation; exported Markdown / Typst / HTML
- Text, comments, and annotations you write

TeXPro claims no license or ownership over this content. The application reads and writes files only in your project directory, the application data directory, and the export and backup locations you explicitly choose; it does not upload documents to its own servers.

Boundaries to be aware of:

- Exported files may contain third-party images, fonts, or tables that you cited; clear the rights yourself before publishing
- Whether AI-generated content is protected by copyright, and who owns it, depends on the terms of the model service you use and on local law; check before publishing
- In collaboration scenarios, ownership of the document is agreed among the participants; the application does not intervene
- The `demo/` project in the repository is provided under MIT with the repository, for demonstration only unless stated otherwise in the files

## Privacy

TeXPro is a local application: there is no account system and no cloud sync service.

- No registration, login, or phone number required
- No telemetry, analytics, crash reporting, or advertising SDKs
- The product page is a static site, with no analytics scripts and no cookie banner

Network access happens only in actions you explicitly trigger:

| Action | Connects to | Sends |
| --- | --- | --- |
| AI assistant | The model endpoint you configured (OpenAI by default) | Text in the context box |
| DOI / arXiv metadata | Crossref, arXiv API | The DOI or arXiv ID you enter |
| Git / Overleaf | The remote you configured | Repository content and commit messages |
| Backup | The iCloud Drive, WebDAV, or SSH host you choose | Project files |
| Zotero literature | Local `127.0.0.1:23119` | Local queries; nothing leaves the machine |
| LAN collaboration | The WebSocket service started locally | Document updates; no third party involved |
| External links | Your browser | Handled by the destination site |

AI API keys are encrypted by the main process with the system keychain (Electron `safeStorage`) and stored in `secrets.json` in the application data directory, with file permissions readable only by the current user; keys are never written to browser localStorage, and never enter project files or the Git repository. The text in the context box is sent to your configured endpoint only when you click Run; the application never calls the model automatically.

The product page is hosted on GitHub Pages, and fonts are loaded from jsDelivr. These two services keep access logs (such as IP and User-Agent) under their own policies; TeXPro does not additionally collect or analyze this data.

## How to Report Copyright Issues

If you believe that code, documentation, screenshots, or demo assets in the repository infringe your rights, raise it in GitHub Issues:

- Repository: `https://github.com/lzhbhlrPython/TexStudioPro`
- State the files, pages, or versions involved
- Provide proof of rights or a link to the original source
- State how you would like it handled: attribution, replacement, or removal

Maintainers will verify and respond. Trademark misuse or impersonation of official builds can also be reported through the same channel. Do not paste API keys, unpublished manuscripts, or other people's personal information in public Issues.

> This page is updated as dependencies and licenses change; released versions remain governed by the `LICENSE` shipped with them. This page does not constitute legal advice.

## Extensions, themes and inspiration

Extension lifecycle and service organization take conceptual inspiration from Koishi. TeXPro uses its own API and package format, includes no Koishi runtime, console source or market, and is not compatible with Koishi plugins. New host, SDK, examples and development Skill are MIT. PostCSS 8.5.32 (Andrey Sitnik) and postcss-value-parser 4.2.0 (Bogdan Chadkin) parse theme styles and retain their MIT notices. Plugin authors, assets, fonts and third-party dependencies retain their own licenses; TeXPro MIT does not change their rights. See root THIRD_PARTY_NOTICES.md.

The independent `@gardenialiu/texpro-extension-sdk` and `@gardenialiu/qwertysay` packages are maintained by Baolin Liu (gardenialiu), under MIT, each with LICENSE. Scaffolded extensions declare their own authors and licenses; the SDK author is not automatically the extension author.

## Third-party licenses in compiled plugins

The unreleased SDK/scaffold retains Baolin Liu (gardenialiu) MIT licensing for original code. The author project LICENSE does not relicense embedded standard libraries. Elm, Scala/Scala.js, Go/GopherJS, ClojureScript/Closure and PureScript code retain their licenses and notices. The builder supplies known runtime notices and collects package licenses; authors must review added dependencies/assets and supplement THIRD_PARTY_NOTICES.md. Koishi inspires organization, without copied runtime or marketplace code. See [extension development](/docs/extension-development).
