---
slug: language-packs
title: "Language packs: install, translate and recover"
group: 开发
order: 68
summary: Use preinstalled Simplified Chinese, create declarative language plugins and verify fallback, placeholders and recovery.
---

> Requires a desktop build containing language plugins and package-manager synchronization. The previously published v0.1.0 installers do not contain this update.

## Where languages come from

English is TeXPro's built-in recovery language. Simplified Chinese is a preinstalled declarative `.tpp` plugin, independently distributed as `@texpro/extension-translate-zh-cn`. Both artifacts share one translation source. TeXPro does not automatically download languages. Website documentation languages are separate from desktop language plugins.

To install an author's `.tpp`, open Extensions, choose Install package…, review the identity, author and wording risks, then select Install disabled and Enable. Choose the language's own name under Preferences → Interface language. With two languages, a single button names the other language; additional languages use a selector.

The bundled Chinese pack can be disabled. Disabling, corrupting or removing the current pack falls back to English. Bundled resources cannot be uninstalled; uninstalling an installed Chinese update restores the disabled bundled copy. Missing individual messages fall back to English.

## Create a language pack

Install Node.js 20+. Start [qwertysay](/docs/qwertysay) and select English, Create a plugin or theme, then Language pack (data only). Choose the directory, package ID, author, BCP 47 identifier such as fr, autonym such as Français, and npm or Yarn. No compiler or build is needed.

```sh
npx --package @texpro/qwertysay@0.4.1 qwertysay
```

The generated `reference/en.json` is a reference snapshot. Edit `locales/fr.json`:

```json
{
  "Save": "Enregistrer",
  "Hello {name}": "Bonjour {name}"
}
```

Keep the exact keys from `reference/en.json`, including historical Chinese keys. Translate the English display text into the target-language values; never translate the keys. Preserve every placeholder such as `{name}` and `{count}`. Check a directory or package reports missing and unknown keys. Unknown keys permit version compatibility; missing messages fall back to English. The reference reflects the SDK version used to create it; review an updated catalog when the host adds messages.

Declare the contribution inside `contributes`:

```json
{
  "locales": [
    { "id": "fr", "title": "Français", "messages": "locales/fr.json" }
  ]
}
```

The complete manifest also needs an extension ID, version, API 1, author, license and empty capabilities; the template includes these. Include LICENSE. Language packs cannot contain an entry, capabilities, scripts, styles or other contributions. English recovery cannot be replaced. The bundled Chinese identifier remains zh for existing preference compatibility.

Use Pack for distribution to create a `.tpp`. Test enable/disable, missing messages, placeholders, native menus and recovery in a temporary TeXPro profile. See [package-manager extension management](/docs/extension-package-management) for npm distribution and install/remove synchronization, and the [SDK guide](/docs/extension-development) for APIs.

## Risks and recovery

Language packs supply strings without executing code or HTML, but can still mistranslate controls into misleading instructions. Check the author and contents; validation and data-only packaging do not certify safety. Themes can hide controls, and Node plugins can access user files, networks and processes.

Use View → Reset Appearance and Disable Extensions in the native menu. This recovery command deliberately stays in English so language plugins cannot replace it. Alternatively start with `--safe-mode`, which disables extensions and returns to English.
