---
slug: extension-package-management
title: "Manage extensions with npm or yarn"
group: 参考
order: 69
summary: Create an extension folder, install, upgrade and remove packages with npm or yarn, then confirm each change in TeXPro.
---

Managing extensions takes two steps: install or remove a package in your terminal, then synchronize the change with TeXPro. **Run synchronization whenever you change dependencies. After installation, you decide whether to enable the extension.**

This tutorial uses the published official Chinese pack, `@texpro/extension-translate-zh-cn`. To manage another author's plugin or theme, use the same steps with their package name.

> You need a TeXPro build with extension synchronization. The original v0.1.0 installers do not have this feature; updating qwertysay alone cannot add it to an older desktop.

> **Check the source before installing or building.** Registry availability, integrity hashes and lockfiles do not certify safety. Disable install scripts. A source build still runs compilers and project configuration with your user permissions, including file, network and process access. TeXPro’s later enable confirmation cannot undo actions performed during a build.

## Before you start

- Install Node.js 20 or later. Run `node --version` in a terminal and check that the version is at least v20.
- npm comes with Node.js; check it with `npm --version`. If you choose yarn, install it first and run `yarn --version` to see whether you have 1.x or version 2 or later.
- Install a TeXPro build with synchronization support and open it at least once. Downloading packages needs an internet connection. Public packages do not require an npm account.
- Choose npm or yarn and follow only that path. Do not mix them in one folder.

These steps manage extensions you use. `@texpro/extension-sdk` and `@texpro/qwertysay` are development tools, not functional plugins you can enable in the application.

## First-time setup: create an extension folder

Open a terminal in the parent folder where you want to keep your extensions. Do not use a LaTeX project, TeXPro source checkout or plugin source folder.

```sh
npx --package @texpro/qwertysay@0.5.0 qwertysay
```

The first npx run may ask to download qwertysay. Confirm, then answer the guide:

- Select English.
- Choose the action for creating an extension environment, identified by `environment`.
- Enter `texpro-extensions` for New extension environment directory, or press Enter to use that default. The folder must not already exist.
- Select npm or yarn as the Package manager.
- Check the destination and package manager, then enter `y` at Continue? [y/N].

The guide creates `texpro-extensions` with package.json and the selected tool's configuration. No extensions have been downloaded yet. **Run all remaining install, sync, upgrade and removal commands inside this folder:**

```sh
cd texpro-extensions
```

If you entered a different destination, use that path instead. Quote the entire path if it contains spaces. On Windows, these commands can run in PowerShell.

## Using npm

### 1. Install the management tool and your first extension

Inside your new extension folder, run:

```sh
npm install --ignore-scripts
npm install --ignore-scripts --save-exact @texpro/extension-translate-zh-cn@1.0.0
npm run sync:extensions
```

The first command installs the folder's qwertysay tool. The second downloads the Chinese pack and records its version. The third passes the changes to TeXPro. The generated `.npmrc` disables installation scripts; these commands also specify `--ignore-scripts` explicitly.

Synchronization opens Extensions in TeXPro. Continue with Finish installation in TeXPro below.

### 2. Upgrade an extension

In the same folder, run:

```sh
npm install --ignore-scripts --save-exact @texpro/extension-translate-zh-cn@latest
npm run sync:extensions
```

This gets the author's latest published version. Replace `latest` with a published version number to choose a specific version. These examples save exact versions, so do not expect `npm update` to move beyond the recorded version. Synchronize and review after upgrading.

### 3. Remove an extension

```sh
npm uninstall --ignore-scripts @texpro/extension-translate-zh-cn
npm run sync:extensions
```

The first command only removes the dependency from this folder. The second lists removals managed by this folder in TeXPro. Click Uninstall there to remove the application's copy. Extension data is kept by default.

## Using yarn

Run `yarn --version` first. **Use the yarn 1 commands for 1.x, or the yarn 2+ commands for version 2 or later. Do not mix their flags.**

### yarn 1: install, upgrade and remove

First installation:

```sh
yarn install --ignore-scripts
yarn add --ignore-scripts --exact @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

Upgrade to the author's latest published version:

```sh
yarn add --ignore-scripts --exact @texpro/extension-translate-zh-cn@latest
yarn run sync:extensions
```

Remove:

```sh
yarn remove --ignore-scripts @texpro/extension-translate-zh-cn
yarn run sync:extensions
```

After each synchronization, confirm the installation, update or removal in TeXPro. yarn 1 does not read the newer configuration's script switch, so keep `--ignore-scripts` in these commands.

### yarn 2+: install, upgrade and remove

The generated `.yarnrc.yml` sets `nodeLinker: node-modules` and `enableScripts: false`. Keep both settings. PnP is not supported here. Newer yarn versions do not use the `--ignore-scripts` flag shown above.

First installation:

```sh
yarn install
yarn add --exact @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

Upgrade:

```sh
yarn add --exact @texpro/extension-translate-zh-cn@latest
yarn run sync:extensions
```

Remove:

```sh
yarn remove @texpro/extension-translate-zh-cn
yarn run sync:extensions
```

Confirmation in TeXPro works as it does with npm. yarn 1 has been tested with actual installation and removal. Validate your specific yarn 2+ version separately; compatible configuration does not mean every version has been tested.

## Finish installation in TeXPro

When synchronization opens Extensions, find Review package manager changes:

- Check each extension's name, version, author and requested capabilities.
- Click Install disabled for each installation or update you want.
- Select the installed extension in the left column, review its details, then click Enable. Executable code or custom styles require an additional trust confirmation.
- After enabling a theme package, click Apply theme in the extension details. Enabling a language pack makes it available in the language control.

Installation and updates never enable an extension automatically. Whenever you change npm or yarn dependencies, run `sync:extensions` again. The application does not watch this folder in the background.

### Why the Chinese pack may not produce a new installation

Simplified Chinese already comes with TeXPro. If the npm package contains the same data as the bundled copy, synchronization will not install it twice. You may see Extension environment is up to date.; this is expected. Find the Chinese pack in Extensions and check that it is enabled.

You can still verify that the terminal installed the npm package:

```sh
npm ls @texpro/extension-translate-zh-cn
```

For yarn, run:

```sh
yarn why @texpro/extension-translate-zh-cn
```

If you later install a Chinese update through this folder, removing the update restores the disabled bundled copy. Enable it again in Extensions if needed. Removing the npm dependency does not delete bundled Chinese resources.

## Install another plugin or theme

Get the author's **exact npm distribution package name and version**, then replace `@texpro/extension-translate-zh-cn@1.0.0` in the earlier commands. An arbitrary npm package is not a TeXPro extension. Authors may publish source directories directly, or keep pointing `texpro.package` to a `.tpp`/`.tpt`. Source packages need texpro.extension.json and LICENSE. `texpro.source` selects a directory; omitting it selects the npm package root. An ordinary npm module is not a TeXPro extension.

If the author only provides a `.tpp` or `.tpt` file, use Extensions → Install package… in TeXPro. You do not need an npm environment to install a file. Authors can find npm distribution instructions in the [qwertysay guide](/docs/qwertysay).

An extension can be managed by one environment. This folder cannot take over a manual installation. To migrate one, uninstall the application's existing copy, then synchronize from your extension folder. Existing extension data is kept.

## When an npm source package needs compilation

Authors can publish source without first embedding a `.tpp` or `.tpt`:

- **Ready to use:** a self-contained runnable `.cjs`/`.mjs`, static snippets, language JSON, accent tokens or static CSS. Install, then sync. TeXPro copies validated files instead of loading them in place from node_modules.
- **Needs compilation:** a package containing qwertysay.build.json, including TypeScript, CoffeeScript, PureScript, ReScript, ClojureScript, Elm, Scala.js or GopherJS plugins, and SCSS/Sass/Less/Stylus/CSS-in-JS/Thematic CSS themes. Prepare it explicitly before syncing. Arbitrary npm build scripts are not run automatically.

> Direct source import and Prepare installed source require SDK 0.4.0, qwertysay 0.5.0 and the matching desktop build. Previous qwertysay 0.4.1 only supports embedded extension archives. Updating the CLI does not update the desktop host.

Use the earlier npm install or yarn add commands with the author’s real package name and pinned version. Inside your extension environment, start the installed wizard:

```sh
npm exec -- qwertysay
```

For yarn:

```sh
yarn qwertysay
```

Choose **Prepare installed source** (`prepare`), keep the environment directory as `.`, and enter the installed package’s name. For example, `@your-author/my-plugin` is a placeholder; replace it with a real package.

Next choose the compiler dependency installer policy. Keep **Disable; stop on missing tools (default)** unless you have reviewed and trust those dependencies. Allowing them executes third-party installer code.

**Before typing y, review the author, version, source and security notice.** qwertysay copies source to a temporary directory, installs compiler dependencies, and runs the toolchain. Dependency lifecycle scripts are disabled by default; separately allowing them also executes compiler dependency installers. Compilation, CSS-in-JS generators and project configuration execute code with your permissions; a temporary directory is not a sandbox. Cleanup cannot undo external file or network effects.

After the terminal prints `Prepared`, synchronize:

```sh
npm run sync:extensions
```

Or:

```sh
yarn run sync:extensions
```

Review in TeXPro, choose **Install disabled**, and decide separately whether to enable. No step automatically authorizes the next one.

Missing Java, sbt, Go, GopherJS, Elm, PureScript or Thematic CSS tools cause failure. Install matching trusted toolchains according to the author’s instructions. Some compilers require installer scripts and may not work with those disabled; review and install trusted tools separately, or explicitly allow compiler dependency scripts for this temporary build in the wizard. This does not change your extension environment’s settings. Do not enable scripts for the entire extension environment just to suppress an error. Authors must document compiler dependencies and locking. Pinning the extension alone does not make every compiler dependency reproducible.

After upgrading or editing source, prepare it again before syncing. A failed or stale build is rejected and leaves the installed application copy unchanged.

## Publishing source as an author

Configure package.json in the author project, not the user’s extension environment. A ready-to-run JavaScript plugin can use:

```json
{
  "name": "@your-author/my-plugin",
  "version": "1.0.0",
  "license": "MIT",
  "files": ["extension/"],
  "texpro": { "source": "extension" },
  "publishConfig": { "access": "public" }
}
```

Put texpro.extension.json, LICENSE and the declared executable/resources in extension/. Bundle runtime dependencies into a self-contained entry, or provide relative modules inside the package. TeXPro does not copy node_modules or install dependencies when enabling.

For compiled source, use a qwertysay template and include qwertysay.build.json, src, compiler configuration, LICENSE and devDependencies in package.json. Templates include texpro.source and a publishing file list. Before publishing, choose an npm name you own, align the manifest version, and remove private: true. The minimal accent theme still only needs a manifest and LICENSE; npm distribution adds metadata without requiring CSS or a build.

Inspect the real upload contents for secrets, private documents and missing sources:

```sh
npm pack --dry-run --ignore-scripts
npm pack --ignore-scripts
```

Install the actual tgz in a fresh extension environment and verify prepare (if needed), sync, install, enable and uninstall. Only when the author intentionally publishes, run `npm publish --access public --ignore-scripts`. This publishes public code; npm publication does not certify TeXPro extension safety. See [qwertysay](/docs/qwertysay) and the [SDK](/docs/extension-development).

## Troubleshooting

### sync:extensions cannot be found

Check that the terminal is inside your generated `texpro-extensions` folder, not its parent or a TeX project. Its package.json should contain `scripts.sync:extensions`. If qwertysay cannot be found, complete the first install command for your selected package manager.

### Synchronization does not open TeXPro

First check that the desktop build supports synchronization. macOS launches the application by its TeXPro name. Windows tries the current user's `Programs/TeXPro/TeXPro.exe`; Linux looks for the `texpro` command.

For portable builds or other installation locations, set `TEXPRO_APP_PATH` to the actual **TeXPro executable**, then synchronize again. For example, in Windows PowerShell:

```powershell
$env:TEXPRO_APP_PATH = "C:\Apps\TeXPro\TeXPro.exe"
npm run sync:extensions
```

In a macOS/Linux terminal:

```sh
export TEXPRO_APP_PATH="/Applications/TeXPro.app/Contents/MacOS/TeXPro"
npm run sync:extensions
```

Replace the example with your actual path. On Linux, point to the texpro executable or AppImage. For yarn, replace the last line with `yarn run sync:extensions`. The CLI also prints the local review plan and a manual launch command.

### A lockfile, dependency or review plan is rejected

An npm folder should have package-lock.json only; a yarn folder should have yarn.lock only. If you used the wrong tool, decide which configuration and lockfile to keep, reinstall dependencies and synchronize again. Changing dependencies while a review is open invalidates the old review; synchronize again.

Do not delete node_modules to request removal of every extension. Use uninstall/remove as shown above, then synchronize. Each change is confirmed separately; successful confirmations remain if a later operation fails.

## Keep the folder and check whom you trust

Return to the same extension folder for future version management. Keep package.json and its lockfile. To restore its dependencies, use `npm ci --ignore-scripts`, `yarn install --frozen-lockfile --ignore-scripts` for yarn 1, or `yarn install --immutable` for yarn 2+, then synchronize.

With installation scripts disabled, downloading a package does not automatically enable it. Enabled Node plugins can still access your files, network and processes. Themes can change the interface, and language packs can contain misleading instructions. Only enable sources you trust. Read [extension safety](/docs/extensions); recovery is available through the fixed-English native command Reset Appearance and Disable Extensions or `--safe-mode`.
