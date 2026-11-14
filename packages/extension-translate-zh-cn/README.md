# @texpro/extension-translate-zh-cn

Simplified Chinese language plugin for TeXPro, by Baolin Liu (gardenialiu), MIT. Version 2.0.0 contains the same declarative translation source bundled with the application. English remains built-in for recovery. The npm wrapper declares `dist/texpro.language-zh-cn.tpp` through `texpro.package`; it has no runtime dependencies or lifecycle scripts.

[简体中文](README.zh-CN.md)

Use qwertysay's guided download or npm/yarn extension environment, then review the `.tpp` in TeXPro Extensions. Installation and updates stay disabled until you enable them. Identical bundled data needs no duplicate installation. Uninstalling an installed update restores the disabled bundled copy; bundled resources can be disabled, not deleted.

The pack requires a TeXPro build with declarative language support; v0.1.0 predates this contract. Missing messages fall back to English. Strings preserve source placeholders and are displayed as text. No executable entry, styles or capabilities are allowed, but translations can still mislead or impersonate instructions. Review authors and content. Recover using the fixed-English native Reset Appearance and Disable Extensions command or `--safe-mode`.

See the [language tutorial](https://texpro.pyliubaolin.top/docs/language-packs) and [npm/yarn guide](https://texpro.pyliubaolin.top/docs/extension-package-management). Source translations live in language/, and build.cjs generates the artifact before packaging; never edit the archive directly. Publication state must be verified separately from a local build.

Catalogue v2 uses stable semantic IDs and requires a matching host, SDK 0.5.0 and qwertysay 0.6.0. Version 1 phrase-key packs are unsupported. Long prose is maintained as whole localized Markdown documents, separately from UI JSON.

The source catalogue now includes software update checks, optional Nightly builds, version results, downloads and retry messages. See the [installation guide](https://texpro.pyliubaolin.top/docs/start). Application update checks do not update npm language packages; generating the package locally does not publish it.

In-app download messages include automatic downloading after checks, progress, cancellation, integrity errors and Show in folder. Users still save and quit before manual installation; language packs are not automatically updated.
