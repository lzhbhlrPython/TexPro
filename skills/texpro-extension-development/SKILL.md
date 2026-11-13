---
name: texpro-extension-development
description: Develop, debug, package, and review TeXPro local extensions and theme packs. Use when creating a TeXPro plugin, adding an SDK provider, extending commands or tools, or distributing a TeXPro theme. Applies to TeXPro API 1 packages, not Koishi plugins or arbitrary Electron modifications.
---

# TeXPro extension development

Build against the checked-out TeXPro contracts. Use `@texpro/extension-sdk` for public API 1 types and `@texpro/qwertysay` for offline scaffolding/check/pack. SDK 0.3.0 / API 1 provides multilingual contracts; qwertysay 0.4.1 adds bilingual guided workflows and accent-only themes. Pin compatible SDK/CLI releases for npm use, or install matching local paths together for source development. Read docs/extension-authoring.md for compiler/build/bridge work. Find the TeXPro repository for host work; do not guess internal contracts. Source is maintained in `packages/extension-sdk`, independently of Electron.

Keep the minimal color-only theme path: `texpro.extension.json` plus `LICENSE`, `capabilities: []`, and only required `contributes.themes[].tokens` such as `accent`. Use `examples/extensions/accent-only`. No stylesheet, executable entry, build configuration or compiler is required; check/pack the directory directly as `.tpt`. Do not force preprocessing on token-only authors.

## Establish the contract

Read the repository's `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/extensions.md`, and `packages/extension-sdk/index.d.ts`. Read [authoring checks](references/authoring.md) for the task-specific workflow. Prefer `examples/extensions/quiet-paper` for data packages and `writing-kit` for executable providers.

Classify the author task as L0–L3. Rendering stays L0; ordinary writing stays in the editor. Register commands and contextual providers before introducing tools. Use L3 only for a complete workflow that needs a dedicated canvas or persistent stages. The desktop does not use the antd-admin-template skill.

## Implement a local package

1. For authors, start `npx --package @texpro/qwertysay@0.4.1 qwertysay` without arguments and guide language, operation, type, destination, id, author and toolchain choices. Review before confirmation. Token-only themes use the accent-only option and need no build. In unattended automation, use complete compatible arguments, record equivalent choices and never fake TTY or silently accept prompts; for multilingual/static-style builds, read [build and bridge checks](references/build-and-bridge.md). Install dependencies explicitly; selecting build runs trusted project/compiler code. Check/pack never build. Create `texpro.extension.json` with API version 1, a namespaced lowercase id, bilingual names, author, semantic version, license, and only the required capabilities. Include LICENSE.
2. Prefer data-only completions, templates, snippets and theme tokens when sufficient. Theme colors use allowlisted 6/8-digit hex tokens. Font families, bounded dimensions and optional package CSS/local assets are supported; read the current theme contract in `docs/extension-development.md`. Declare `theme.styles` for CSS, explain spoofing/hidden-control risks, and test native recovery and `--safe-mode`. No remote assets or JavaScript theme injection.
3. For code, provide a self-contained `.cjs` or `.mjs` entry with `activate(ctx)`. Register only declared action ids via `ctx.handle()`. Clean up external effects through `ctx.onDispose()` or the returned disposer. Do not depend on install scripts, native binaries, runtime npm installation, or an existing node_modules directory.
4. Return serializable results. Use checked edit proposals for document changes. Preserve UTF-16 positions; never mutate the editor DOM or replace all source to perform a local edit.
5. Handle `signal`, failure and timeouts. `project.readFile` reads saved disk content; the invocation snapshot contains permitted unsaved source. Do not confuse the two.
6. Keep visible Chinese and English names consistent. Host tools inherit paper/studio/night tokens and focus behavior; theme packs never recolor the formal PDF.

Executable plugins are trusted Node code. Process isolation controls faults, not hostile-code privileges. Declare network access honestly; declaration alone cannot block Node networking. Never describe API grants as an OS sandbox.

## Validate and distribute

Use **Extensions → Load development directory…**, inspect, install disabled, then explicitly trust and enable executable code. Reload creates a new disabled snapshot; recheck capabilities before enabling. Test disable/re-enable, changes after invocation, undo, IME, project switches, failure and restoration. Check all relevant themes and both languages.

From the TeXPro root, run `npm run test:extensions`, `npm run typecheck`, and relevant native journeys. Changes to the host also require the complete `npm run test:regression` baseline: zero failures, zero skips, zero TODOs. Do not bypass missing process permissions by editing tests to skip.

For a new builder project, explicitly build and load dist/package first; use source-root check/pack for stale-build detection. Package with `qwertysay pack <directory> <new-output.tpp|new-output.tpt>` (or the repository wrapper `node scripts/pack-extension.cjs`). Reinstall that artifact in a clean temporary profile and verify its declared contributions. Share the artifact manually; no public plugin marketplace or remote deployment is implied. Publishing an author’s extension to npm is separate from using the published SDK.

Report package/API version, capabilities, tests, known limits, license and recovery instructions. Author guides are separate: docs/extension-development.md (SDK contracts), docs/qwertysay.md (guided tools), docs/extension-skill.md (AI workflow). For TeXPro host changes, update repository architecture, SDK docs, bilingual website docs, i18n, real screenshots and a dated development blog. Do not commit private task notes.

Use `.tpp` for plugin packages and `.tpt` for theme-only packages. A `.tpt` has no executable entry or non-theme contributions; never claim its suffix certifies safety.

MCP authoring inspection is read-only: texpro_extension_capabilities reports formats; texpro_inspect_extension validates a built package inside the project. Neither executes or enables plugins. Manifest mcp actions are not automatically external tools.

## Language packs and package-manager environments

For translations, read [language and environment checks](references/languages-and-distribution.md). Use the declarative language template, not executable providers. English is immutable recovery; Simplified Chinese is a preinstalled `.tpp` and the independently distributed `@texpro/extension-translate-zh-cn`. Authoring package-manager choice does not grant permission to install dependencies or publish.

npm/yarn dependency operations change a dedicated environment, not the running host. Sync produces per-item install/update/removal reviews in the existing Extensions panel. New code remains disabled; uninstall keeps plugin data and respects environment ownership. Never implement lifecycle scripts that silently install or enable a plugin. CLI/network and native review tests are separate evidence.

The application release workflow attaches this complete directory as a versioned `.skill` ZIP. Keep relative references self-contained; do not add private notes, generated caches or symlinks. Inspect the exact archive against tested source before publication. SDK and CLI versions remain independent of the Skill asset's application version.

For direct npm source distribution, follow the source/prepare contract in [languages and distribution](references/languages-and-distribution.md). Explain install, local compilation and runtime trust separately before commands. Do not silently execute npm scripts, compiler configuration or source generators during inspection/synchronization. Keep SDK, qwertysay, host and read-only MCP aligned and verify the actual published file list with a real tarball.
