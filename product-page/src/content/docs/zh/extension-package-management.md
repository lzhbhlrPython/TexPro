---
slug: extension-package-management
title: "用 npm／yarn 管理扩展"
group: 参考
order: 69
summary: 从创建扩展目录开始，逐步用 npm 或 yarn 安装、升级和卸载扩展，并在 TeXPro 中确认同步。
---

用 npm 或 yarn 管理扩展，需要做两件事：先在终端安装或移除包，再把变更同步给 TeXPro。**每次改完依赖，都要运行同步命令；安装到应用后，还要由你决定是否启用。**

本文用已经发布的官方简体中文包 `@texpro/extension-translate-zh-cn` 演示。换成其他作者提供的插件包或主题包时，操作相同，只需替换包名。

> 需要包含扩展同步功能的 TeXPro 构建。最初的 v0.1.0 安装包没有这项功能，仅升级 qwertysay 无法补上桌面端能力。

> **先确认来源，再安装或构建。** npm 页面可访问、下载完整性通过、有锁文件，都不代表包安全。安装时禁用脚本；如果源码需要编译，编译器和构建配置仍会以你的权限运行，可能读取文件、联网和启动进程。TeXPro 的启用确认无法撤销构建期间已经发生的操作。

## 开始前准备什么

- 安装 Node.js 20 或更高版本。在终端运行 `node --version`，确认版本号至少为 v20。
- npm 随 Node.js 提供，运行 `npm --version` 检查。选择 yarn 时，还需先安装它，并运行 `yarn --version` 确认是 1.x 还是 2 及以上版本。
- 安装支持扩展同步的 TeXPro，并至少打开一次。以下操作需要联网下载包；只安装公开包不需要 npm 账号。
- 选定 npm 或 yarn，后面只走对应的一条路径，不在同一个目录里混用。

这里管理的是用户安装的扩展，不是开发插件所用的 SDK。`@texpro/extension-sdk` 和 `@texpro/qwertysay` 是开发工具，不能当作功能插件安装到应用。

## 第一次使用：创建扩展目录

找一个保存扩展的父目录，在那里打开终端。不要在 LaTeX 工程、TeXPro 源码或插件源码目录里执行以下步骤。

```sh
npx --package @texpro/qwertysay@0.6.0 qwertysay
```

第一次运行 npx 可能询问是否下载 qwertysay，确认后进入引导。按顺序填写：

- 语言选择「简体中文」。
- 操作选择创建扩展管理环境的选项，选项标识为 `environment`。
- 「新扩展环境目录」填写 `texpro-extensions`，或直接回车采用这个默认值。该目录必须尚不存在。
- 「包管理器」选择 npm 或 yarn。
- 核对预览中的目录和包管理器，在「继续？[y/N]」输入 `y`。

引导完成后，你会得到 `texpro-extensions` 文件夹，里面有 package.json 和所选工具的配置。此时还没有下载扩展。**接下来的所有安装、同步、升级和卸载命令，都在这个文件夹内执行：**

```sh
cd texpro-extensions
```

如果刚才填写了其他目录，cd 后面也换成那个目录。路径含空格时，用双引号包住整个路径；Windows 可以在 PowerShell 中执行本文命令。

## 使用 npm

### 1. 安装管理工具和第一个扩展

在刚创建的扩展目录运行：

```sh
npm install --ignore-scripts
npm install --ignore-scripts --save-exact @texpro/extension-translate-zh-cn@1.0.0
npm run sync:extensions
```

第一条安装这个目录所需的 qwertysay，第二条下载简体中文包并记录版本，第三条把变更交给 TeXPro。生成的 `.npmrc` 已禁用安装脚本，命令仍显式保留 `--ignore-scripts`。

同步会打开 TeXPro 的「扩展」面板。接下来按下方「在 TeXPro 中完成安装」操作。

### 2. 升级扩展

仍在同一目录运行：

```sh
npm install --ignore-scripts --save-exact @texpro/extension-translate-zh-cn@latest
npm run sync:extensions
```

这会取得作者当前发布的最新版本。需要指定版本时，把 `latest` 换成作者已发布的版本号。本文使用精确版本保存依赖，因此不要期待 `npm update` 自动越过这个版本；升级后重新同步并审核。

### 3. 卸载扩展

```sh
npm uninstall --ignore-scripts @texpro/extension-translate-zh-cn
npm run sync:extensions
```

第一条只从这个目录移除依赖。第二条会让 TeXPro 列出该目录管理的移除项；在应用中点「卸载」，才会移除应用里的副本。扩展数据默认保留。

## 使用 yarn

先运行 `yarn --version`。**1.x 使用下面的 yarn 1 命令；2 及以上使用 yarn 2+ 命令，不要把两组参数混在一起。**

### yarn 1：安装、升级与卸载

首次安装：

```sh
yarn install --ignore-scripts
yarn add --ignore-scripts --exact @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

升级到作者最新发布的版本：

```sh
yarn add --ignore-scripts --exact @texpro/extension-translate-zh-cn@latest
yarn run sync:extensions
```

卸载：

```sh
yarn remove --ignore-scripts @texpro/extension-translate-zh-cn
yarn run sync:extensions
```

每次同步后，都到 TeXPro 确认对应的安装、更新或卸载。yarn 1 不读取新版配置中的脚本开关，因此这些命令都带 `--ignore-scripts`。

### yarn 2+：安装、升级与卸载

创建目录时生成的 `.yarnrc.yml` 已设置 `nodeLinker: node-modules` 和 `enableScripts: false`。保留这两项；当前不支持 PnP。新版 yarn 不使用上面那组 `--ignore-scripts` 参数。

首次安装：

```sh
yarn install
yarn add --exact @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

升级：

```sh
yarn add --exact @texpro/extension-translate-zh-cn@latest
yarn run sync:extensions
```

卸载：

```sh
yarn remove @texpro/extension-translate-zh-cn
yarn run sync:extensions
```

TeXPro 中的确认步骤与 npm 相同。yarn 1 已经过真实安装与卸载验证；yarn 2+ 仍需按你使用的具体版本验证，不把配置支持等同于所有版本的验收。

## 在 TeXPro 中完成安装

同步打开「扩展」后，找到「审核包管理器变更」：

- 核对扩展名称、版本、作者和请求能力。
- 对要安装或更新的项，点「安装并保持停用」。
- 在左侧选中已安装的扩展，检查详情，再点「启用」。可执行代码或自定义样式还需要确认信任。
- 主题安装并启用后，再在扩展详情中点「应用主题」；语言包启用后，语言入口才会提供它。

安装和更新都不会自动启用。以后每次更改 npm 或 yarn 依赖，都再次运行 `sync:extensions`；应用没有后台监听这个目录。

### 为什么安装简中包后没有新增项目

简体中文已经随 TeXPro 预装。如果 npm 中的包与预装副本内容相同，同步不会重复安装；你可能看到「扩展环境已同步。」，这不是失败。直接在「扩展」找到简体中文包，确认已启用即可。

你仍可用以下命令确认终端确实安装了这个 npm 包：

```sh
npm ls @texpro/extension-translate-zh-cn
```

使用 yarn 时运行：

```sh
yarn why @texpro/extension-translate-zh-cn
```

如果之后通过此目录安装了简中更新，卸载更新会恢复停用的预装副本；需要时在「扩展」重新启用。只移除 npm 依赖不会删除应用自带的简中资源。

## 换成其他插件或主题怎么做

向作者取得**准确的 npm 分发包名和版本**，然后替换前面命令中的 `@texpro/extension-translate-zh-cn@1.0.0`。不是所有 npm 包都能作为 TeXPro 扩展：作者可以直接发布源码目录，也可以继续用 `texpro.package` 指向 `.tpp`／`.tpt`。源码包必须带 `texpro.extension.json` 和 LICENSE；`texpro.source` 指向源码目录，省略时使用 npm 包根目录。普通 npm 模块不能直接当作 TeXPro 扩展。

如果作者只给了 `.tpp` 或 `.tpt` 文件，在 TeXPro「扩展」里点「安装插件包…」即可；无需为了安装文件而创建 npm 环境。作者要把文件放到 npm 分发，见 [qwertysay 指南](/docs/qwertysay)。

同一扩展只能由一个环境管理。已经手动安装的扩展不会被这个目录接管；需要迁移时，先在 TeXPro 卸载原副本，再回到扩展目录运行同步，原有扩展数据会保留。

## 源码包需要编译时怎么用

可以直接发布并安装源码，不需要作者先塞入 `.tpp` 或 `.tpt`。有两种情况：

- **可直接使用**：清单指向可运行的、自包含的 `.cjs`／`.mjs`，或者只有静态片段、语言 JSON、主题色和静态 CSS。安装后直接同步；应用复制受检文件，不从 node_modules 原地加载。
- **需要编译**：包中有 `qwertysay.build.json`，例如 TypeScript、CoffeeScript、PureScript、ReScript、ClojureScript、Elm、Scala.js、GopherJS 插件，或 SCSS／Sass／Less／Stylus／CSS-in-JS／Thematic CSS 主题。先完成下面的显式构建，再同步。普通 npm 的 build 脚本不会被自动执行。

> 源码直接导入与「构建已安装的源码扩展」需要 SDK 0.4.0、qwertysay 0.5.0 及对应桌面构建。旧 qwertysay 0.4.1 只支持内含安装包的 npm 分发；不要把仅更新工具当成已升级桌面宿主。

先用前面的 npm install 或 yarn add 安装作者提供的准确包名和版本。然后，在扩展环境目录中启动已经安装的 qwertysay：

```sh
npm exec -- qwertysay
```

使用 yarn 时：

```sh
yarn qwertysay
```

在引导中选择「构建已安装的源码扩展」（标识 `prepare`），扩展环境目录保留 `.`，填写刚安装的 npm 包名，例如作者给你的 `@your-author/my-plugin`。这只是占位包名，必须换成真实名称。

接下来选择编译依赖安装脚本策略，默认选择「禁用，缺少工具时停止」。只有你已经审核并信任编译依赖时，才选择允许；该选项会执行第三方安装代码。

**在输入 y 之前，核对作者、版本和源码，阅读安全提醒。** 确认后，qwertysay 把源码复制到临时目录，安装编译依赖，再调用对应工具链构建。安装依赖默认禁用生命周期脚本；单独选择允许时，编译依赖的安装脚本也会执行。真正的编译、CSS-in-JS 生成器和项目配置会执行代码，临时目录并不是沙箱。构建结束清理临时目录，但无法撤销代码对其他文件或网络的影响。

成功时终端输出 `Prepared` 和包标识。接着运行：

```sh
npm run sync:extensions
```

或：

```sh
yarn run sync:extensions
```

到 TeXPro 审核，点「安装并保持停用」，最后才决定是否启用。没有任何一步会自动授权下一步。

缺少 Java、sbt、Go、GopherJS、Elm、PureScript 或 Thematic CSS 编译器时，构建会失败；按作者说明先安装匹配工具链。某些编译器依赖安装脚本，默认禁用后可能不可用，需要你另外审核并安装可信工具，或在引导中单独信任本次编译依赖的安装脚本；这个选择仅作用于本次临时构建，不更改扩展环境。不要为了消除报错直接开启整个扩展环境的安装脚本。作者还需提供各工具链依赖和锁定方式。仅锁定顶层扩展版本，不能保证所有编译依赖可重现。

升级源码包或修改源码后，旧构建不再匹配，重新选择构建再同步。构建失败时不会把旧产物冒充新产物，也不改变应用中已经安装的副本。

## 作者如何发布源码

在作者自己的工程中配置 package.json；不要在用户的扩展环境目录发布。一个无需编译的 JavaScript 插件可以这样组织：

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

`extension/` 里放 `texpro.extension.json`、LICENSE 和清单声明的可运行入口／资源。运行时依赖要自行打包成自包含入口，或作为包内相对模块提供；TeXPro 不会复制 node_modules，也不为启用插件运行 npm install。

需要编译时使用 qwertysay 模板，保留 `qwertysay.build.json`、src、工具链配置、LICENSE 和 package.json 中的 devDependencies。模板已经带 `texpro.source` 与发布文件列表；发布前改成你拥有的 npm 包名、同步清单版本，并移除模板的 `private: true`。最简配色主题仍只需清单和 LICENSE；要发布 npm 时额外加 npm 元数据，不强制增加 CSS 或构建配置。

先核查实际将上传的文件，确保没有凭据、私人文档或缺失源码：

```sh
npm pack --dry-run --ignore-scripts
npm pack --ignore-scripts
```

把生成的实际 tgz 安装到新的扩展环境，依次验证构建（需要时）、同步、安装、启用和卸载，再由作者主动执行 `npm publish --access public --ignore-scripts`。这些命令会发布公开代码；只有作者确认发布时才执行。发布到 npm 不等于通过 TeXPro 的安全认证。完整作者流程见 [qwertysay](/docs/qwertysay) 与 [SDK](/docs/extension-development)。

## 常见问题

### 提示找不到 sync:extensions

先检查终端是否位于刚创建的 `texpro-extensions` 目录，而不是父目录或 TeX 工程。这个目录的 package.json 应有 `scripts.sync:extensions`。若提示找不到 qwertysay，先补做对应包管理器的首次 install。

### 同步没有打开 TeXPro

先确认安装的是支持同步的桌面构建。macOS 默认通过应用名启动 TeXPro；Windows 默认尝试当前用户的 `Programs/TeXPro/TeXPro.exe`，Linux 默认寻找 `texpro` 命令。

如果用了便携版或其他安装位置，将环境变量 `TEXPRO_APP_PATH` 设为实际的 **TeXPro 可执行文件**，再运行同步。Windows 在 PowerShell 中设置，例如：

```powershell
$env:TEXPRO_APP_PATH = "C:\Apps\TeXPro\TeXPro.exe"
npm run sync:extensions
```

macOS／Linux 在终端设置，例如：

```sh
export TEXPRO_APP_PATH="/Applications/TeXPro.app/Contents/MacOS/TeXPro"
npm run sync:extensions
```

把示例路径换成自己的实际路径；Linux 指向 texpro 可执行文件或 AppImage。使用 yarn 时，最后一行换成 `yarn run sync:extensions`。CLI 也会输出本地审核计划及手动打开方式。

### 提示锁文件、依赖或审核计划有问题

npm 目录只留 package-lock.json，yarn 目录只留 yarn.lock。如果误用了另一种工具，先确认保留哪一套配置与锁文件，再重新安装依赖、重新同步。审核期间又改过依赖时，旧审核会失效，需要重新同步。

不要通过删除 node_modules 表示卸载全部扩展；使用前面的 uninstall／remove，再同步。扩展分多项确认，已经确认成功的操作会保留。

## 保留目录，注意信任来源

日后仍回到同一个扩展目录管理版本，保留 package.json 和对应锁文件。迁移或重建目录时，npm 使用 `npm ci --ignore-scripts`，yarn 1 使用 `yarn install --frozen-lockfile --ignore-scripts`，yarn 2+ 使用 `yarn install --immutable`，随后再同步。

安装脚本禁用后，包下载不会自动启用扩展，但启用的 Node 插件仍可能访问你的文件、网络和进程。主题能改变界面，语言包也可能提供误导性文案；请只启用可信来源。更多说明见[扩展安全说明](/docs/extensions)；需要恢复时使用原生固定英文命令 `Reset Appearance and Disable Extensions` 或 `--safe-mode`。
