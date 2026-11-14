---
slug: dev-release
title: Building and releasing
group: 开发
order: 14
summary: "Packaging is configured entirely in the build field of package.json: mac produces a universal DMG and zip, Windows produces NSIS, a portable exe and a zip, Linux produces AppImage, deb and rpm. Nightly builds are generated daily by GitHub Actions."
---

## What this layer is

Releasing is assembled from two pieces: the local `electron-builder` configuration and the automation in `.github/workflows/nightly.yml`. The first decides what goes into the package and what the artifacts are called; the second decides when a build runs and where the results are published. Both share the verification and version scripts under `scripts/`.

There is no separate electron-builder config file; everything lives in the `build` field of the root `package.json`.

## Package identity

```json
{
  "appId": "dev.texpro.app",
  "productName": "TeXPro",
  "artifactName": "${productName}-${version}-${os}-${arch}.${ext}",
  "directories": { "output": "release", "buildResources": "build" }
}
```

`files` is a whitelist: only `dist/**`, `electron/**`, `mcp/**`, `demo/**`, `build/icon.*` and `package.json` enter the package; the exclusions explicitly drop `node_modules/@napi-rs/canvas/**` and `.playwright-mcp/**`. Source code, `tests/`, `scripts/`, and `artifacts/` never enter the package.

**9 entries must stay outside the asar**, listed in `asarUnpack`:

| Path | Reason |
| --- | --- |
| `mcp/**` | The MCP server starts with plain Node and must not depend on Electron's asar loading |
| `electron/services/tex.cjs` | Spawned or required by path |
| `electron/services/history.cjs` | Same as above |
| `electron/services/git.cjs` | Same as above |
| `electron/services/project-files.cjs` | Same as above |
| `electron/services/project-root.cjs` | Same as above |
| `electron/services/project-operations.cjs` | Same as above |
| `electron/services/font-report.cjs` | Same as above |
| `electron/services/music.cjs` | Same as above |

Missing one shows up as "local development works, but the installed package reports a missing module".

## Platforms and artifact names

| Script | Actual command | Artifact |
| --- | --- | --- |
| `npm run package` | `electron-builder --mac --dir` | `release/mac-arm64/TeXPro.app`, unsigned, for debugging |
| `npm run package:mac` | `electron-builder --mac --universal` | `TeXPro-<version>-mac-universal.dmg` and a zip of the same name |
| `npm run package:win` | `electron-builder --win nsis portable zip --x64` | `TeXPro-<version>-windows-x64-setup.exe`, `-portable.exe`, and a zip |
| `npm run package:linux` | `electron-builder --linux AppImage deb rpm --x64` | `TeXPro-<version>-linux-x64.AppImage`, `.deb`, `.rpm` |

The two Windows installers override `artifactName` in `build.nsis` and `build.portable`; other platforms use the top-level template. Every command runs `npm run build` first, and artifacts land in `release/`.

Cross-platform packaging is not recommended: NSIS and AppImage are most reliable on their own platforms, cross-building needs extra toolchains, and CI also runs the three platforms separately.

## Nightly and stable releases

Nightly checks main daily at 21:23 Asia/Shanghai (13:23 UTC, cron `23 13 * * *`) and supports manual runs. Build whenever commits exist after the last successfully published Nightly tag with downloadable assets. Empty, merged and old-timestamp commits count; there is no same-day filter. No new commits means skip. With no previous Nightly, build existing history. API, missing-tag and ancestry errors fail explicitly. Failed builds never advance the successful baseline, so later runs retry.

Nightly and stable releases share `_release-build.yml`: pin the source SHA and version, run the full regression baseline with zero skips/TODOs, typecheck and build, then package macOS universal DMG/ZIP, Windows x64 NSIS/portable/ZIP and Linux x64 AppImage/deb/rpm. Builders use `--publish never`, retaining pre-pack and actual ASAR verification. Only after all platforms succeed does Nightly upload a draft, update its dated tag, publish the prerelease and refresh the website. All release workflows share the `texpro-release` queue without cancelling an active release.

The shared Ubuntu test job first installs latexmk, pdfLaTeX/XeLaTeX/LuaLaTeX and CTeX/Fandol for actual compilation. Missing engines must fail the baseline rather than skip its compile tests.

Chinese LuaLaTeX also needs LuaTeX-ja from `texlive-lang-japanese`. The shared job installs it explicitly and preflights CTeX, LuaTeX-ja and Fandol with kpsewhich instead of relying on recommended packages.

## Publish a stable version manually

The first stable version is **v0.1.0 · Tajpilo** (2026-11-12). **Tajpilo**, Esperanto for “typewriter”, names the **0.1.x** series in the root `release-series.json`. It appears in release titles; versions, tags and asset filenames stay unchanged. The publisher uses bilingual `docs/releases/vX.Y.Z.md` notes when available, otherwise generated notes.

Only for the first stable release of the current base, enable `initial_release` in **Release patch**; this release keeps 0.1.0. The option defaults to off, preserving normal patch increments. It requires no other stable tags and a version matching the tested source. A release commit records run identity even if version files need no changes, enabling safe retries of that same Actions run. Do not use this option after a stable release exists.

In Actions choose **Release major**, **Release minor** or **Release patch**, select main and run. They produce X+1.0.0, X.Y+1.0 or X.Y.Z+1 through `_release-stable.yml`. They do not publish the npm SDK.

Only after tests and all platform packages pass does the workflow verify main still matches the tested source, then atomically push the root `package.json`/`package-lock.json` version commit and `vX.X.X` tag. If main advanced, start a new run on the latest source; never force push. Stable tags cannot be overwritten. Assets upload to a draft, which becomes public only when complete, then refreshes the [stable releases page](/releases). Retry the same Actions run after an upload or website-refresh failure: it does not increment the committed version again or reupload a published release. Do not start a new version increment to fix the same failed upload. Branch/tag protection or environment reviews may still require repository administration.

## Version numbers

GitHub may return 404 when a draft is queried by tag. The publisher falls back to the authenticated, paginated release list to find the exact tag and verify uploaded assets. Do not create another version or rewrite a tag because of this response. A draft becomes public only after its assets are complete, and the same workflow run can be retried safely.

`release-version.cjs` computes stable versions and synchronizes the root package and lockfile. SDK/qwertysay versions stay independent. Subsequent Nightlies automatically use the new base as `v{base}-YYYYMMDD-Nightly`; installed package versions omit v. The Shanghai date is calculated once for every platform. Same-day Nightlies replace that day's tag/assets; different dates retain separate records.

```bash
npm run nightly:version
```

`set-nightly-version.mjs` accepts `NIGHTLY_DATE=YYYYMMDD` and `--dry-run`. Nightly stamps only the build checkout, never committing dated versions or incrementing the stable version. 21:23 is the scheduled check; Actions may queue it later.

## Release verification

```bash
npm run verify:release
```

`scripts/verify-release.cjs` is pure functions plus a CLI, and it verifies artifact contents rather than mere file existence:

- required list: `package.json`, `electron/main.cjs`, `electron/preload.cjs`, `electron/quit-watchdog.cjs`, `electron/window-close.cjs`, `mcp/server.mjs`, `dist/index.html`, and 8 service files
- extracts the referenced `assets/*.js` and `*.css` from `dist/index.html`, requiring at least one of each and that they really exist
- requires `dist/assets/pdf.worker.*.mjs` to exist
- forbids `.ai-notes` and `superpowers` paths from slipping in
- given a directory, walks `dist/`, `electron/`, and `mcp/`; given an `.asar`, reads the real package contents with `listPackage` and `extractFile` from `@electron/asar`
- additionally checks `mcp/server.mjs` and the 8 services under `app.asar.unpacked`

A failure prints `[release] <reason>` and exits with code 1. `@electron/asar` is a devDependency, and the verification script itself never enters the package.

## Two gates before and after packaging

`build.beforePack` and `build.afterPack` point at two small scripts, each doing just one thing:

```js
// scripts/before-pack.cjs
const result = verifyDirectory(context.packager.projectDir);
// scripts/after-pack.cjs
verifyPackagedApp(path.join(resources, 'app.asar'));
```

The first verifies the actual directories about to be packed — `dist/`, `electron/`, `mcp/` — before packaging; the second reads the real ASAR to re-check resources and the external MCP service. Both share the same verification module as `verify:release`, so one local run rehearses both gates.

## Pitfalls

- Adding a service file without adding it to `asarUnpack` and to the required list in `verify-release`: it runs locally and crashes after install
- Putting `.ai-notes/` or debug screenshots in `electron/`: the whitelist carries them into the package and verification refuses it outright
- Editing the `package.json` version by hand to publish a nightly: the next `nightly:version` takes it as the new base and the version number drifts
- Re-running on the same day reuses the same tag: `release` runs `git tag --force` and overwrites the installers, so earlier artifacts are not preserved
- Building a mac package on Windows: the universal merge needs macOS toolchains, and CI also keeps them in separate jobs
- Committing the build output `dist/`: CI rebuilds anyway, and committed artifacts only create conflicts

## Verification

```bash
npm run build
npm run verify:release
npm run package -- --publish never
node scripts/verify-release.cjs release/mac-arm64/TeXPro.app/Contents/Resources/app.asar
```

The last one runs the packaging check against a real ASAR and is the closest thing to a user-side check available locally. Signing, notarization, and an update channel are not yet part of the repository, so a published package needs manual approval on first launch. CI packaging is not runtime acceptance; for UI regression see `/docs/dev-testing`.

## Website refresh after a release

A successful Nightly or stable release explicitly dispatches the Product page workflow with its exact tag. Skipped or failed releases do not refresh the site. A pinned release fetch must fail the build rather than deploy stale metadata. Ordinary website builds can use a previous snapshot when offline.

Pages also builds for product-page changes; PRs validate, while main deploys. A local build does not prove deployment. See docs/product-page-deployment.md in the repository.

## macOS universal ASAR

Both architectures currently share identical JavaScript ASAR contents. `build.mac.mergeASARs: false` avoids an upstream merge step expanding external Node files into an oversized glob. Universal DMG/ZIP delivery remains, with ASAR and external MCP checks on each architecture and the final bundle. Actual local directory packaging and lipo checks confirm x86_64/arm64. Revalidate the archive layout if architecture-specific modules are introduced; never bypass verification.

The website groups stable releases by major.minor series, such as “V0.1 / Tajpilo”. Each patch release folds independently; only the latest opens by default. Notes reuse the existing Markdown renderer for headings, lists, code, quotes, tables and links; raw HTML is not executed.

## Language contributions and build channels

To add a website language, submit language metadata JSON, message JSON and translated Markdown; see docs/website-translation.md in the repository. Missing messages and articles fall back explicitly. The homepage separates stable and Nightly releases. Delayed Nightly schedules use the most recent 21:23 Asia/Shanghai window; hourly recovery checks skip windows with an already published build.

## Next-patch Nightly versions

The root package and lock on main retain the published stable version. Nightly targets the next patch: stable 0.1.1 produces 0.1.2-YYYYMMDD-Nightly without incrementing main or the next stable release twice. Successful stable publication explicitly dispatches the same-day Nightly. An older base version on that date does not suppress the new build; existing releases remain intact. Scheduled recovery skips only the exact target version and date. An already stamped Nightly only changes date, avoiding repeated increments.

The homepage has one download section with a stable/Nightly selector. macOS, Windows, Linux and the extension-development Skill share the same rows, sizes, SHA256 controls and download buttons. Skill sizes use KB.


## Replacing a version after critical fixes

Only with explicit maintainer authorization, run Release patch on main with replacement_version, for example 0.1.1, matching the current stable base. The full regression, types, build, three-platform packages and Skill validation must pass before the old Release/tag is deleted and the new draft uploaded and verified. Downloads briefly become unavailable during replacement; other historical versions remain intact. Retry the same Actions run on failure instead of incrementing again. Ordinary updates continue to use normal patch releases.

## Desktop update checks

Update checks use Preferences → Software updates (L2), defaulting to stable with optional Include Nightly builds. electron/services/app-updates.cjs reads public GitHub Releases from a fixed repository. The main process obtains the current version from app.getVersion(); dedicated preload/IPC accepts only a boolean channel choice and sends no project data. It queries stable latest separately and, when Nightly is included, paginates the list (100 per page, at most 10 pages). The total timeout is 20 seconds and each response is limited to 8 MiB. Exceeding limits fails explicitly.

Only uploaded, nonempty DMG, setup.exe or AppImage assets matching the system and architecture are eligible. Numeric base versions are compared first; stable wins at the same base, and Nightly uses dates. Other prereleases are excluded. Links are constructed from the fixed repository and notes are plain text. Missing installers, no higher version and failed queries are distinct results. Channel changes and closing Preferences invalidate old results. There are no startup checks, automatic downloads or installation. Users save and quit before installing; see the [installation guide](/docs/start).

Same-version replacements and same-day Nightly rebuilds cannot be detected by version comparison; visit Releases manually. App maintenance does not add a writing/project MCP tool. Service regressions are in tests/app-updates.test.cjs and the detailed repository contract is docs/app-updates.md. A real query does not certify installation on three platforms.
