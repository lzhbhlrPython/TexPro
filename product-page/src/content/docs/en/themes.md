---
slug: themes
title: Theme packs
group: Usage
order: 63
summary: Preview and apply local themes while retaining built-in modes and the formal PDF's original colors.
---

## Install and apply

Install and enable theme packs through [Extensions](/docs/extensions). Themes need no JavaScript. Packs with CSS require explicit acceptance of style risks before enabling. Choose **Preview** to try a theme temporarily. Closing Extensions cancels the preview and restores the applied theme. **Apply theme** saves the choice across restarts.

Themes inherit paper, studio or night. Studio retains dark chrome with a light writing surface. Choosing a built-in theme or toggling day/night clears the package selection. Disabling, uninstalling or losing the selected theme removes its tokens and falls back to its base mode.

## Scope

Themes can customize semantic colors for chrome, paper, syntax, selections, diagnostics and focus, plus UI/editor/monospace font families, editor size and width, radii and spacing. Missing values inherit the base mode. Formal PDFs, author fonts and explicitly colored artwork remain separate; screen colors are not written into source documents.

Package CSS can change layout, typography and interaction states and reference bundled images/fonts. It does not install system fonts, load remote resources or execute JavaScript. Parsed CSS applies to the active theme; reduced-motion preferences disable package animations/transitions. Colors use 6/8-digit hex values and font tokens use ordinary family lists. Editor size is 12–36px, width 400–1600px, radius 0–24px and a spacing unit 2–12px for package CSS. Package editor size/width take precedence over writing settings; built-in themes restore those user settings.

Declare `stylesheet` and the `theme.styles` capability. Ordinary rules are scoped to the active theme; use `:scope` for its root. Supported at-rules are media, supports, container, layer, font-face and keyframes. URLs must refer to bundled PNG/JPEG/WebP/GIF or WOFF/WOFF2/TTF/OTF relative to the CSS file. Imports, remote/data URLs, CSS escapes, traversal and other resource functions are rejected. CSS source is limited to 128 KiB, each asset to 1 MiB, expanded assets to 2 MiB per theme and combined generated styles to 4 MiB per package. See developer contracts and examples. DOM selectors are not a stable cross-version API; recheck after upgrades.

## Security and recovery

Theme freedom can also hide controls, obscure content, impersonate trusted prompts or harm accessibility. Fonts and images need trusted sources. Validation, scoping and the absence of JavaScript do not certify safety. Review authors, licenses and contents before enabling. Executable plugins additionally have user-level file, network and process access.

If the interface becomes unusable, use the native **View → Reset Appearance and Disable Extensions** command or launch with `--safe-mode`. Safe mode disables all extensions before running plugin code and restores built-in paper. Review packages individually before enabling again. Platform commands are in [local extension packages](/docs/extensions).

## Develop a theme

`examples/extensions/quiet-paper` is a data-only example. See [extension development](/docs/extension-development) for the SDK and Skill. Check writing, menus, selections, syntax, diagnostics, focus and narrow windows, and supply accurate screenshots from the real application.
