---
slug: language-packs
title: "Language packs: install, translate and recover"
group: 使用
order: 68
summary: Use preinstalled Simplified Chinese, create declarative language plugins and verify fallback, placeholders and recovery.
---

## Choose a language and recover

The preinstalled `@texpro/extension-translate-zh-cn` plugin provides Simplified Chinese. Review, disable or enable it in **Extensions**, then choose the language in **Preferences**. English is always built in. Disabling or removing an active language update falls back to English. Bundled resources can be disabled, but not deleted. The native **Reset Appearance and Disable Extensions** command always uses English; `--safe-mode` also provides recovery.

Translations can imitate trusted instructions. Data-only packages still require trust in the author and content. Functional plugins own their i18n resources; host language packs do not replace plugin business logic.

## Make a catalogue v2 language pack

In a repository development environment, start the guided qwertysay tool and choose a data-only language pack, locale code, autonym, and npm or yarn:

```sh
npm ci
node packages/qwertysay/bin/qwertysay.cjs
```

Find semantic message IDs in the generated `reference/en.json`, then translate values in `locales/fr.json`. Keep IDs and variables such as `{name}` unchanged.

```json
{
  "app.save": "Enregistrer",
  "app.cancel": "Annuler"
}
```

Each contribution in `contributes.locales` declares the catalogue version:

```json
{
  "catalogVersion": 2,
  "id": "fr",
  "title": "Français",
  "messages": "locales/fr.json"
}
```

The extension `apiVersion` remains 1. Include the manifest, message JSON and LICENSE, without entries, capabilities or styles. No compilation is needed. Choose Check and Pack to create a `.tpp`, review it in **Extensions**, enable it, and select the language. Missing messages use English; unknown semantic IDs are reported. Coverage is relative to the SDK reference version.

## Breaking migration and long documents

SDK 0.5.0, qwertysay 0.6.0 and Chinese pack 2.0.0 target a host with catalogue v2 support. Old phrase-key packs are rejected, with no compatibility layer. Regenerate the reference, migrate translations to semantic IDs, bump the pack version and validate it. Changing only the version field is insufficient. Source, npm publication and application Releases are separate states; existing v0.1.0 installations do not automatically gain this contract.

Buttons, menus and statuses use JSON. Easter eggs, documentation, tutorials and long explanations use complete Markdown documents per language and one shared renderer, rather than separate message keys per sentence or paragraph. Desktop language plugins do not translate the website.

Website document sources live in `product-page/src/content/docs/{locale}/{slug}.md`. The `zh/` and `en/` directories are peers with matching filenames and slugs; Chinese is not stored at the documentation root. New languages follow the same structure. Moving source files does not change public `/docs/:slug` links.

Continue with the [SDK](/docs/extension-development), [qwertysay](/docs/qwertysay), [AI development Skill](/docs/extension-skill) and [npm/yarn extension management](/docs/extension-package-management) guides.
