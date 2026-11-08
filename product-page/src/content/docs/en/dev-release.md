---
slug: dev-release
title: Building and releasing
group: 开发
order: 14
summary: Packaging is configured entirely in the build field of package.json: mac produces a universal DMG and zip, Windows produces NSIS, a portable exe and a zip, Linux produces AppImage, deb and rpm. Nightly builds are generated daily by GitHub Actions.
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

## The nightly workflow

`.github/workflows/nightly.yml` is triggered by `schedule: cron '17 3 * * *'` (03:17 UTC, 11:17 Beijing time, deliberately off the hour) and by `workflow_dispatch`; the `concurrency` group is `nightly-release`, so a new run cancels the old one.

| job | Platform | What it does |
| --- | --- | --- |
| `changes` | ubuntu | Runs `nightly-changes.cjs` to decide whether today has commits with file changes, outputting `build` |
| `test` | ubuntu | `npm ci`, `test:regression`, `typecheck`, `build` |
| `macos` | macos-latest | Set version, build, verify, `--mac --universal`, upload dmg and zip |
| `windows` | windows-latest | Same as above, with `--win nsis portable zip --x64` |
| `linux` | ubuntu-latest | Install `fakeroot rpm libarchive-tools` first, then `--linux AppImage deb rpm --x64` |
| `release` | ubuntu | Collect artifacts from the three platforms and publish a pre-release tagged with the day's date (`v0.1.0-20261109-Nightly`) |

If `test` fails, none of the three packaging jobs run; `release` runs only on the main branch and overwrites assets with the same name via `softprops/action-gh-release@v2`. All packages are unsigned: CI sets `CSC_IDENTITY_AUTO_DISCOVERY` to `false`.

## Version numbers

The nightly version is computed by a script, not edited by hand:

```bash
npm run nightly:version
```

`set-nightly-version.mjs` exports `nightlyVersion(version, date)`: it strips the old nightly suffix (`-nightly.20261025` or `-20261109-Nightly`) from the `package.json` version to get the base, then appends the date: `${base}-${YYYYMMDD}-Nightly`. The date is the current day in `Asia/Shanghai` and can be overridden with `NIGHTLY_DATE`; `--dry-run` prints without touching files. It also syncs `version` and `packages[''].version` in `package-lock.json` (skipped when the lockfile is absent).

`nightly-changes.cjs` decides whether to publish: it takes commits from `git log --first-parent` within the current day in `Asia/Shanghai`, confirms with `git diff --name-only` that each one really changed files (using `diff-tree --root` for the root commit), and skips the whole pipeline when none of them changed anything, avoiding a nightly that spins up with identical content.

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
