---
slug: dev-testing
title: Testing and smoke checks
group: 开发
order: 13
summary: Choose checks for types, source regressions, real compilation, native interaction and packaging; report actual results.
---

## Choose checks by scope

| Scope | Command |
| --- | --- |
| Desktop types and build | npm run typecheck, npm run build |
| Source and service regressions | npm run test:regression |
| Real TeX compilation | npm run test:compile |
| Writing interaction | npm run test:flow:ui, test:continuity:ui, test:writing:ui |
| Placeholders and memos | npm run test:aids:ui |
| Music | npm run test:music, test:music:ui |
| Assets and import | npm run test:assets:ui, test:import |
| External MCP | npm run test:mcp |
| Release resources | npm run verify:release and actual package inspection |
| Website | pnpm check:layout, pnpm typecheck, pnpm build |

Desktop scripts with an omitted prefix also use `npm run`. Check the root and website package.json files for current scripts. Table length is not test coverage.

## Source regressions

Tests use node:test and node:assert. Select relevant cases for main-file resolution, PDF coordinates, saving order, music, writing aids or Nightly synchronization. Inspect the tests directory rather than relying on a fixed file or case count.

Tests do not require Electron UI, but some need TeX, Git, child processes or temporary directories. Report missing dependencies and skipped cases. Do not describe every test as a dependency-free pure function test.

## Native interaction

Build before running relevant UI scripts. Use temporary projects and user directories, not everyday documents. Check focus, IME, undo, scrolling, project switching, saving and actual process exit. Timeouts and crashes are failures.

## Website content

Layout checks must match before and after content-only work. Do not use layout:update to hide differences. Builds regenerate machine-readable docs and feeds. Check bilingual slugs, links and the Pages base path. Shell changes additionally need narrow-screen, theme, keyboard and reduced-motion checks.

## Report results

List commands, passes, failures, skip reasons, actual engines and platforms. Static analysis, native interaction, installed-package checks and remote Actions provide different evidence. Documentation cleanup does not require rerunning every unchanged desktop interaction.
