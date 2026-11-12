---
slug: extension-package-management
title: "用 npm／Yarn 管理扩展"
group: 开发
order: 69
summary: 用专用依赖环境安装、更新和移除扩展，再交给 TeXPro 审核同步，保留版本锁定与启用边界。
---

> 需要包含语言插件与包管理同步能力的桌面构建；此前公开的 v0.1.0 安装包不包含本次能力。

## 包管理器和应用各管什么

npm／Yarn 管理扩展分发包的依赖、版本和锁文件；TeXPro 保留自己的受检副本、信任、启停和数据。包管理器安装成功不代表应用已经启用，卸载依赖后也要同步才能移除宿主副本。没有后台监听或自动更新。

需要 Node.js 20+、已安装的 npm 或 Yarn，以及支持语言包和同步审核的新版 TeXPro。v0.1.0 安装包早于这项能力；使用包含此更新的后续构建，不把新版 CLI 当作旧桌面的补丁。先阅读[扩展安全说明](/docs/extensions)与[语言包教程](/docs/language-packs)。

## 创建专用环境

```sh
npx --package @texpro/qwertysay@0.4.1 qwertysay
```

引导中选择「创建 npm／Yarn 扩展管理环境」，填写新目录并选择包管理器。它只创建配置，不联网或自动安装。进入这个目录后再明确执行安装。环境与 TeX 工程、TeXPro 源码和插件作者工程分开，一个环境只保留一种锁文件。

npm 示例，官方简中包已经随应用预装，同摘要时不会重复安装：

```sh
npm install --ignore-scripts
npm install --ignore-scripts @texpro/extension-translate-zh-cn@1.0.0
npm run sync:extensions
```

Yarn Classic 示例：

```sh
yarn install --ignore-scripts
yarn add --ignore-scripts @texpro/extension-translate-zh-cn@1.0.0
yarn run sync:extensions
```

现代 Yarn 使用生成的 `.yarnrc.yml`：`nodeLinker: node-modules`、`enableScripts: false`。直接 `yarn install`、`yarn add 包名`，不要传 Classic 专用的 `--ignore-scripts`。暂不支持 PnP。SDK／CLI 属于 devDependencies，dependencies 只放带有 `texpro.package` 的扩展分发包。

提交 package.json 与对应锁文件；npm 用 npm ci 复现，Yarn 使用对应版本的冻结锁安装。不要同时产生 package-lock.json 与 yarn.lock。

## 审核、更新与卸载

同步后 TeXPro 的「扩展」中出现「审核包管理器变更」，逐项显示包名、版本和能力。点「安装并保持停用」后再决定是否启用；可执行插件和自定义样式继续要求信任确认。

更新依赖后再次运行同步。npm 使用 npm update，现代 Yarn 使用 yarn up，Classic 使用 yarn upgrade。插件摘要变化会产生更新审核，更新后不会沿用旧代码的启用状态。版本锁定与插件许可证由作者和使用者核对。

卸载示例：

```sh
npm uninstall --ignore-scripts @texpro/extension-translate-zh-cn
npm run sync:extensions
```

Yarn Classic 使用 `yarn remove --ignore-scripts 包名`，现代 Yarn 使用 `yarn remove 包名`，之后均运行 `yarn run sync:extensions`。应用逐项提示「卸载」，仅处理同一环境管理的记录，默认保留插件数据。不会删除手动安装的扩展或其他环境的扩展；若只用了原始预装简中而没有安装更新，移除 npm 依赖不会删除预装资源。

安装的简中更新被卸载后恢复停用的预装副本，可在「扩展」重新启用。要把手动安装改为环境管理，先在应用卸载原副本再同步；数据仍保留。

## 分发与单独下载

作者完成 `.tpp`／`.tpt` 后，用 qwertysay「创建 npm 分发包」生成新目录，package.json 的 `texpro.package` 指向唯一安装包。然后由作者自行核对 LICENSE 并发布；脚手架不会自动发布。

不需要管理环境时，可选择「从 npm 获取扩展并交给 TeXPro 审核」。它只下载公开 npm 元数据与归档，校验 SHA-512、包身份和实际安装包，不安装 npm 依赖或执行脚本。也可只保存文件，稍后在「扩展」选择「安装插件包…」。插件和语言包是 `.tpp`，主题是 `.tpt`。

## 失败、恢复与风险

缺失依赖、混用锁文件、损坏归档或陈旧审核计划会明确失败。先修复环境、重新安装依赖并同步；不要用删除 node_modules 模拟卸载全部。部分项已确认成功时保留结果，失败项重新审核，不宣称整批原子事务。

自动启动失败时把 `TEXPRO_APP_PATH` 设置为 TeXPro 可执行文件路径，或按 CLI 输出用 `--extension-sync` 打开本地计划。Windows／Linux 桌面关联取决于实际安装位置；路径含空格需要正确引用。安装器／便携版本分别验证，源码测试不能代表所有平台都已原生验收。

专用环境禁用生命周期脚本；如果手动绕过配置，npm／Yarn 仍可能执行安装代码。Node 插件启用后有用户文件、网络和进程权限，主题和语言包都可能伪装可信界面。摘要校验不是安全认证。恢复使用原生固定英文命令 `Reset Appearance and Disable Extensions` 或 `--safe-mode`。
