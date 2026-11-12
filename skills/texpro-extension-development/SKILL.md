---
name: texpro-extension-development
description: Develop, debug, package, and review TeXPro local extensions and theme packs. Use when creating a TeXPro plugin, adding an SDK provider, extending commands or tools, or distributing a TeXPro theme. Applies to TeXPro API 1 packages, not Koishi plugins or arbitrary Electron modifications.
---

# TeXPro extension development

Build against the checked-out TeXPro contracts. Use `@gardenialiu/texpro-extension-sdk` for public API 1 types and `@gardenialiu/qwertysay` for offline scaffolding/check/pack. Version 0.2.0 includes multilingual builds and static theme compilation; API version remains 1. Pin matching SDK/CLI releases for npm use, or install matching local paths together for source development. Read docs/extension-authoring.md for compiler/build/bridge work. Find the TeXPro repository for host work; do not guess internal contracts. Source is maintained in `packages/extension-sdk`, independently of Electron.

Keep the minimal color-only theme path: `texpro.extension.json` plus `LICENSE`, `capabilities: []`, and only required `contributes.themes[].tokens` such as `accent`. Use `examples/extensions/accent-only`. No stylesheet, executable entry, build configuration or compiler is required; check/pack the directory directly as `.tpt`. Do not force preprocessing on token-only authors.

## Establish the contract

Read the repository's `AGENTS.md`, `PRODUCT.md`, `DESIGN.md`, `docs/extensions.md`, and `packages/extension-sdk/index.d.ts`. Read [authoring checks](references/authoring.md) for the task-specific workflow. Prefer `examples/extensions/quiet-paper` for data packages and `writing-kit` for executable providers.

Classify the author task as L0–L3. Rendering stays L0; ordinary writing stays in the editor. Register commands and contextual providers before introducing tools. Use L3 only for a complete workflow that needs a dedicated canvas or persistent stages. The desktop does not use the antd-admin-template skill.

## Implement a local package

1. Start with `npx --package @gardenialiu/qwertysay@0.2.0 qwertysay init <directory> --id author.name --author "Your name"`; for multilingual/static-style builds, read [build and bridge checks](references/build-and-bridge.md). Install/build explicitly as documented; the CLI never does this automatically. Create `texpro.extension.json` with API version 1, a namespaced lowercase id, bilingual names, author, semantic version, license, and only the required capabilities. Include LICENSE.
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

Report package/API version, capabilities, tests, known limits, license and recovery instructions. For TeXPro host changes, update repository architecture, SDK docs, bilingual website docs, i18n, real screenshots and a dated development blog. Do not commit private task notes.

Use `.tpp` for plugin packages and `.tpt` for theme-only packages. A `.tpt` has no executable entry or non-theme contributions; never claim its suffix certifies safety.

MCP authoring inspection is read-only: texpro_extension_capabilities reports formats; texpro_inspect_extension validates a built package inside the project. Neither executes or enables plugins. Manifest mcp actions are not automatically external tools.
