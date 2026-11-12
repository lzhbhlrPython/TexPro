---
slug: extension-package-management
title: "Manage extensions with npm or Yarn"
group: 开发
order: 69
summary: Install, update and remove packages in a dedicated dependency environment, then review synchronization in TeXPro.
---

> Requires a desktop build containing language plugins and package-manager synchronization. The previously published v0.1.0 installers do not contain this update.

## Separate responsibilities

npm or Yarn manages distribution packages, versions and a lockfile. TeXPro owns validated installation snapshots, trust, enablement and plugin data. Installing a dependency does not enable it; removing a dependency requires synchronization before the host copy is removed. There is no background watcher or automatic updater.

Use Node.js 20+, an installed npm or Yarn, and a TeXPro build containing language-pack and sync-review support. The v0.1.0 application predates this feature: a newer CLI cannot patch an older desktop. Read [extension safety](/docs/extensions) and [language packs](/docs/language-packs).

## Create a dedicated environment

```sh
npx --package @texpro/qwertysay@0.4.1 qwertysay
```

Choose English, then Create an npm/Yarn extension environment. Select a new directory and package manager. Creation writes configuration without accessing the network or installing dependencies. Enter the directory and explicitly install. Keep this environment separate from TeX projects, TeXPro source and authoring projects, with one lockfile only.

npm example using the official Chinese pack, already bundled with the application; an identical digest is not reinstalled:

```sh
npm install --ignore-scripts
npm install --ignore-scripts @texpro/extension-translate-zh-cn@1.0.0
npm run sync:extensions
```

Yarn Classic:

```sh
yarn install --ignore-scripts
yarn add --ignore-scripts @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

Modern Yarn uses the generated `.yarnrc.yml` with `nodeLinker: node-modules` and `enableScripts: false`. Run `yarn install` and `yarn add package-name` without Classic-only flags. PnP is outside this implementation. Put SDK/CLI tools in devDependencies; dependencies must be extension wrappers with `texpro.package` metadata.

Commit package.json and its lockfile. Reproduce with npm ci or the chosen Yarn version's frozen-lock installation. Do not mix package-lock.json and yarn.lock.

## Review, update and remove

Synchronization opens Review package manager changes inside Extensions. Review each package name, version and capability. Install disabled creates the snapshot; enable separately. Executable plugins and custom styles still require trust confirmation.

After updating dependencies, synchronize again. Use npm update, modern Yarn's yarn up, or Classic's yarn upgrade. A changed artifact digest requires an update review and clears the old executable's enablement. Review version constraints and author licenses.

Removal example:

```sh
npm uninstall --ignore-scripts @texpro/extension-translate-zh-cn
npm run sync:extensions
```

For Yarn Classic use `yarn remove --ignore-scripts package-name`; for modern Yarn use `yarn remove package-name`, then `yarn run sync:extensions`. Review Uninstall in TeXPro. Only records owned by this environment are removed; plugin data is kept. Manual installations and other environments cannot be taken over. Removing the npm dependency does not delete bundled Chinese resources when no managed update was installed.

Uninstalling a managed Chinese update restores the disabled bundled copy. Enable it again in Extensions. To migrate a manual installation into environment management, uninstall its host snapshot first, then synchronize; its data remains.

## Distribution and single downloads

After packing a `.tpp` or `.tpt`, authors can choose Create an npm distribution wrapper in qwertysay. Its package.json points `texpro.package` to exactly one artifact. Review LICENSE and publish separately; scaffolding never publishes automatically.

Without an environment, choose Get an extension from npm for TeXPro review. It downloads public npm metadata and an archive, checks SHA-512, package identity and the actual artifact, without installing dependencies or running lifecycle scripts. Download-only mode lets you later use Extensions → Install package…. Plugins and language packs use `.tpp`; themes use `.tpt`.

## Failures, recovery and risk

Missing dependencies, mixed lockfiles, corrupt archives and stale reviews fail explicitly. Repair the environment, install dependencies and synchronize again. Do not delete node_modules to request a mass uninstall. Confirmed items remain after a later item fails; this is a reviewed sequence, not a whole-batch transaction.

If application launch fails, set `TEXPRO_APP_PATH` to the executable or follow the CLI's `--extension-sync` command for the local plan. Windows/Linux associations depend on installation paths. Quote paths containing spaces. Installer and portable builds need separate native validation; source tests do not prove every platform's runtime.

Environment configuration disables lifecycle scripts. Bypassing it manually can allow npm/Yarn to run installation code. Enabled Node plugins have user file, network and process permissions. Themes and language packs can imitate trusted UI. Digests do not certify safety. Recover with the fixed-English native command Reset Appearance and Disable Extensions or `--safe-mode`.
