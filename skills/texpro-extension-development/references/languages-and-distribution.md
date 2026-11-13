# Language packs and distribution checks

Use docs/language-packs.md and docs/extension-package-management.md in a host checkout, or the corresponding website guides. SDK source messages are a versioned reference snapshot; never promise coverage for newer unreviewed host keys.

Choose qwertysay's Language pack (data only) template. It creates `contributes.locales`, a BCP 47 identifier, autonym, empty capabilities, LICENSE, message JSON and reference/en.json. Translate values, preserve all placeholders, and pack `.tpp` without building. No entry, CSS, scripts or other contributions are allowed. Test missing-key English fallback, native menus, disable/re-enable, corrupt data and recovery. Translations can impersonate instructions even without code. The native Reset Appearance and Disable Extensions command deliberately remains English.

Use one package manager and lockfile per author project or dedicated extension environment. Modern yarn uses node_modules; PnP is not claimed. Install tools/dependencies only when authorized, with extension lifecycle scripts disabled. An npm package may publish source with `texpro.source` (default root), or declare an archive with `texpro.package`; its version and artifact identity are checked separately. Never install arbitrary wrapper dependencies or require its code merely to inspect an extension.

For environment management, initialize a separate private directory. Extension source packages or archive wrappers go in dependencies, CLI tools in devDependencies. npm install/yarn add and npm uninstall/yarn remove change that environment. qwertysay sync then asks TeXPro to review each addition, update or removal. New snapshots stay disabled; stale locks/artifacts fail. Do not take over manually installed or other-environment records, and retain plugin data on uninstall. Removing a bundled Chinese update restores the disabled bundled copy.

Report acquisition, dependency installation, host import and enablement separately. Validate actual npm/yarn lock workflows, digest changes, removal, failed and partial reviews, paths with spaces, and platform launch paths. MCP inspection stays read-only and cannot install/enable/execute an extension.

## Independent i18n for functional plugins

Each functional plugin owns its i18n library and translation resources. Host language packs translate TeXPro, not plugin business messages. Manifest labels use Localized objects with an en fallback. Runtime messages, diagnostics and previews select the plugin catalog from each invocation's `context.language`; JSON bridges receive invoke.context.language. Match exact locale, base language and the plugin's English catalog, then fall back per missing message. Do not cache the language during activate.

For an independent `i18n/messages.json` with en and fr catalogs, select `messages[context.language] || messages[context.language.split('-')[0]] || messages.en`, then use `table[key] || messages.en[key]` for missing messages. Keep plugin-owned keys and placeholders out of the host catalog. `contributes.locales` is reserved for declarative host translations and cannot be mixed with functional entries.

Use npm/yarn to install your chosen language's i18n library. Bundle its runtime and include every referenced JSON/resource in the final self-contained `.tpp`; do not depend on host node_modules, private dictionaries or runtime downloads. Test target locales, regional and missing-message fallback, and language changes between two invocations in the same plugin process. Treat translations as text, never executable code or HTML.

Source publishing requires the manifest, LICENSE, actual source/configuration and an inspected npm files allowlist. Never rely on postinstall to build an extension. Ready-to-run JS must be self-contained. For qwertysay.build.json projects, prepare installed source only after explicit trust; this installs compiler dependencies with lifecycle scripts disabled by default and executes trusted toolchains in a temporary directory. Temporary directories and checksums are not sandboxes or malware scans. Missing installer-dependent tools must be installed separately after review. A changed source invalidates prepared output. Sync/check/MCP never invoke prepare.

编译依赖安装脚本默认禁用。需要此类安装器时，qwertysay prepare 引导提供独立的、默认拒绝的信任选择；自动化须同时传 --trust-build 与 --trust-install-scripts。允许后第三方编译依赖安装脚本以用户权限运行，仅作用于本次临时构建，不改扩展环境的脚本禁用设置。缺少外部 Java／Go 等工具仍须自行安装。不得把同意构建等同于同意安装脚本。

Compiler dependency lifecycle scripts are disabled by default. The prepare wizard offers a separate, default-deny trust choice; automation requires both --trust-build and --trust-install-scripts. Allowing them executes third-party dependency installers with user permissions for this temporary build only, without changing extension environment settings. External Java/Go tools still require installation. Build trust alone never grants installer-script trust.
