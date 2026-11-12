# Language packs and distribution checks

Use docs/language-packs.md and docs/extension-package-management.md in a host checkout, or the corresponding website guides. SDK source messages are a versioned reference snapshot; never promise coverage for newer unreviewed host keys.

Choose qwertysay's Language pack (data only) template. It creates `contributes.locales`, a BCP 47 identifier, autonym, empty capabilities, LICENSE, message JSON and reference/en.json. Translate values, preserve all placeholders, and pack `.tpp` without building. No entry, CSS, scripts or other contributions are allowed. Test missing-key English fallback, native menus, disable/re-enable, corrupt data and recovery. Translations can impersonate instructions even without code. The native Reset Appearance and Disable Extensions command deliberately remains English.

Use one package manager and lockfile per author project or dedicated extension environment. Modern Yarn uses node_modules; PnP is not claimed. Install tools/dependencies only when authorized, with extension lifecycle scripts disabled. An npm distribution wrapper declares exactly one artifact with `texpro.package`; its version and artifact identity are checked separately. Never install arbitrary wrapper dependencies or require its code merely to inspect an extension.

For environment management, initialize a separate private directory. Extension wrappers go in dependencies, CLI tools in devDependencies. npm install/Yarn add and npm uninstall/Yarn remove change that environment. qwertysay sync then asks TeXPro to review each addition, update or removal. New snapshots stay disabled; stale locks/artifacts fail. Do not take over manually installed or other-environment records, and retain plugin data on uninstall. Removing a bundled Chinese update restores the disabled bundled copy.

Report acquisition, dependency installation, host import and enablement separately. Validate actual npm/Yarn lock workflows, digest changes, removal, failed and partial reviews, paths with spaces, and platform launch paths. MCP inspection stays read-only and cannot install/enable/execute an extension.

## Independent i18n for functional plugins

Each functional plugin owns its i18n library and translation resources. Host language packs translate TeXPro, not plugin business messages. Manifest labels use Localized objects with an en fallback. Runtime messages, diagnostics and previews select the plugin catalog from each invocation's `context.language`; JSON bridges receive invoke.context.language. Match exact locale, base language and the plugin's English catalog, then fall back per missing message. Do not cache the language during activate.

For an independent `i18n/messages.json` with en and fr catalogs, select `messages[context.language] || messages[context.language.split('-')[0]] || messages.en`, then use `table[key] || messages.en[key]` for missing messages. Keep plugin-owned keys and placeholders out of the host catalog. `contributes.locales` is reserved for declarative host translations and cannot be mixed with functional entries.

Use npm/Yarn to install your chosen language's i18n library. Bundle its runtime and include every referenced JSON/resource in the final self-contained `.tpp`; do not depend on host node_modules, private dictionaries or runtime downloads. Test target locales, regional and missing-message fallback, and language changes between two invocations in the same plugin process. Treat translations as text, never executable code or HTML.
