---
slug: extensions
title: Local extension packages
group: Usage
order: 62
summary: Install, trust, configure and manually update local extensions while preserving continuous writing.
---

## Install and enable

Open **Extensions** from the command palette and choose **Install package…**. Select a shared `.tpp` plugin package or `.tpt` theme package, inspect its author, version, license, capabilities and digest, then choose **Install disabled**. Packages require an API 1 manifest and LICENSE.

Data packages can contribute completions, snippets, templates and themes. Executable packages require explicit trust before enabling. They run Node code with your user permissions; the separate process isolates faults and is not a security sandbox. Enable only trusted code. There is no public marketplace or automatic download/update service.

## Use contributions

Enabled commands join the existing palette and tool menu. Static and dynamic completions work in the editor. Checkers can populate the Problems panel. Transforms show proposed edits; accepting applies one transaction that can be undone once. Results are rejected when their document, project or extension context expires.

Extensions can provide on-demand tools, dedicated workspaces, project templates, plain-text previews, project import proposals, and export/bibliography/asset text results. Advanced providers remain experimental. MCP data providers are not automatically exposed to external MCP clients. See [extension development](/docs/extension-development) for adapter coverage.

## Update and recover

Install a package with the same id to update manually. Updates remain disabled until reviewed and enabled. Use **Restore previous package** to roll back. Uninstalling retains plugin storage and leaves the original distribution file and author documents alone.

Activation errors, crashes and timeouts are shown and disable executable extensions. Disabled contributions no longer supply commands, completions, diagnostics or themes. Re-enable to retry. Incompatible APIs, changed content and corrupt archives are rejected during installation.

## Development mode and themes

**Load development directory…** installs a validated snapshot. After editing, choose **Reload from directory**, review and enable again. Changes are not executed directly from an unchecked directory. The host does not run install scripts, install npm dependencies or load native binaries.

See [theme packs](/docs/themes) for preview, cancellation, application and built-in recovery. Extension, proposal and drawing screenshots come from the running application; implementation and validation details are recorded in developer documentation and the Chinese development blog.

## Security and independent recovery

Executable plugins can read files, use networks, start processes and reach credentials accessible to your user. Capability declarations and process isolation do not sandbox malicious code. Even themes without code can hide buttons, imitate trusted UI or harm readability. Review package contents and trust the author; SHA-256 is not an author signature.

If a theme breaks the UI, use the native **View → Reset Appearance and Disable Extensions** command. Alternatively launch with `--safe-mode` to disable every extension before executing plugin code and restore paper. macOS: `open -a TeXPro --args --safe-mode`; Windows: `TeXPro.exe --safe-mode`; Linux: add the flag to the executable or AppImage. Disabled state persists; review and enable packages individually afterward.

Packages use `.tpp` for plugins and `.tpt` for themes (both are ZIP containers). A `.tpt` contains only theme configuration, CSS and assets, with no executable entry, actions or other plugin contributions. Renaming a code package to `.tpt` is rejected; file suffixes are not a safety certification.

## Theme source and installable artifacts

Author sources may use CSS, SCSS, Sass, Less, Stylus, build-time CSS-in-JS or Thematic CSS (`.tcss`). Choose the authoring style in guided qwertysay 0.4.1; see [qwertysay](/docs/qwertysay). Every theme artifact is a `.tpt` containing static CSS and assets; plugins use `.tpp`. Source suffixes and `.zip` are not installable suffixes. A theme can conceal controls or impersonate UI without JavaScript; trust remains necessary.

## Language packs and package-manager environments

See [language packs](/docs/language-packs) for the declarative template, preinstalled @texpro/extension-translate-zh-cn, placeholder validation and English recovery. See [npm/Yarn management](/docs/extension-package-management) for authoring configuration, distribution wrappers and reviewed installation/update/removal synchronization. SDK 0.3.0 and qwertysay 0.4.1 use @texpro; historical @gardenialiu versions remain available separately.
