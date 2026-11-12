---
slug: extension-development
title: 插件 SDK、qwertysay 与开发 Skill
group: 开发
order: 65
summary: 使用 API 1 开发和分发本地插件包、工具和主题，理解契约、测试与当前边界。
---

## 开发入口

独立 npm 包 `@gardenialiu/texpro-extension-sdk` 提供 API 1 类型与共用核心，`@gardenialiu/qwertysay`（命令 `qwertysay`）提供脚手架、离线校验与打包，作者为 Baolin Liu（gardenialiu），MIT。无需 Electron／TeX；要求 Node.js 20+。源码位于仓库 `packages/extension-sdk/`，类型在 `index.d.ts`。`examples/extensions/writing-kit` 展示处理器与服务，`quiet-paper` 展示无代码资源。配套 `skills/texpro-extension-development/` 可整体安装到你的 AI 工具技能目录；应用不会自动安装全局 Skill。

机制借鉴 Koishi 的生命周期与服务组织思路，使用 TeXPro 自有实现与协议，不复用其运行时、控制台源码或市场服务，也不兼容 Koishi 插件格式。TeXPro 新增代码及示例为 MIT；第三方内容保留各自许可。

```sh
npx --package @gardenialiu/qwertysay@0.1.0 qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

默认生成 TypeScript；`--language js` 无需构建，`--type theme` 生成主题。输出到源码目录外，拒绝覆盖。CLI 不自动安装依赖、联网或执行扩展代码；`npx` 可能下载 SDK。也可使用 `qwertysay check` 校验目录／归档，或 `qwertysay pack` 打包。

## npm 发行版

2026-11-12，两包均以 Baolin Liu（gardenialiu）名义按 MIT 首次发布：

| npm 包 | 版本 | 职责 |
| --- | --- | --- |
| [@gardenialiu/texpro-extension-sdk](https://www.npmjs.com/package/@gardenialiu/texpro-extension-sdk) | 0.1.0 | API 1 类型与共用校验核心 |
| [@gardenialiu/qwertysay](https://www.npmjs.com/package/@gardenialiu/qwertysay) | 0.1.0 | qwertysay 脚手架、校验与打包 |

注册表版本及完整性摘要与测试过的 tarball 一致，已从注册表独立安装，验证 TypeScript／JavaScript／主题脚手架、编译、归档及拒绝路径。npm 开发工具的发布不等于公开插件市场；插件包继续自行分发。

## 包格式与处理器

包根包含 `texpro.extension.json` 与 LICENSE，清单声明 namespaced id、作者、版本、许可证、`apiVersion: 1`、能力和贡献项。自包含入口为 `.cjs` 或 `.mjs`；TypeScript 需先编译。没有安装脚本、运行时依赖安装或原生二进制加载。ZIP 最大 16 MiB、300 文件，拒绝越界、符号链接、重复路径和损坏内容。

```js
exports.activate = ctx => {
  ctx.handle('rewrite', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

动作须在清单声明；偏移使用 UTF-16。用户接受提案后，宿主校验工程代数、文件、文档身份和包状态，经编辑器事务修改，保留撤销与输入法。处理器可以返回诊断、补全、纯文本、导出文件、工程创建提案或编译请求；编译仍使用原有保存与主文件流程。

## 能力与生命周期

可声明读取文档、提出正文修改、读取工程、请求构建、本地存储、网络和自定义主题样式。调用快照包含获准的未保存内容；`project.readFile` 与符号服务读取磁盘。存储每插件最多 1 MiB，配置不是密钥存储。

使用 `ctx.handle`、`ctx.on`、`ctx.onDispose` 和返回的清理函数。加载上限 5 秒，调用上限 10 秒；失败、崩溃和超时使扩展停用。关闭或换工程后不接受旧结果。代码插件仍具有当前用户的 Node 权限，可能读取文件、联网或启动进程，SDK 声明不是安全沙箱。主题样式也可能隐藏控件或伪装界面；仅启用可信来源。

静态资源、生命周期和基础结果为 API 1 稳定边界；高级提供器及界面贡献为实验性。动态补全和悬浮信息有编辑器适配；检查器接入问题面板；其余提供器在显式工具中调用。MCP 数据不会自动注册到外部 stdio MCP。主题支持语义色、字体、尺寸与受控包内 CSS／资源，具体契约见[主题包](/docs/themes)；内容预览为纯文本。首期不开放任意 React/HTML、二进制素材结果或自定义 TeX 引擎进程。

## 验证与分发

```sh
npm run test:extensions
npm run typecheck
npm run test:extensions:ui
node scripts/pack-extension.cjs examples/extensions/quiet-paper /tmp/quiet-paper.tpt
```

输出文件须不存在。在临时用户目录实际安装打包结果，验证启停、配置、错误、过期结果、IME、撤销、主题和卸载。修改宿主需重跑完整回归基线：零失败、零跳过、零 TODO。不能用定向补跑代替整套通过。

开发目录修改后重新加载会安装停用快照，需要重新检查和启用。包通过文件自行分发；手动更新可恢复上一版本，卸载保留插件数据。交接包含源码、包、许可证、API 版本、测试命令、实际证据和限制。完整宿主边界见仓库 `docs/extensions.md`、`docs/extension-development.md` 与[接手指南](/docs/dev-handoff)。

L3 工作台复用系统标题栏与焦点恢复。macOS 顶部避让原生窗口按钮，Windows／Linux 保持各自标题栏布局；插件内容不应覆盖宿主导航。

分发扩展名为 `.tpp`（插件）与 `.tpt`（主题），底层均为 ZIP 归档。`.tpt` 只接受主题配置、CSS 与资源，不接受可执行入口、动作或其他插件贡献；将代码包改名为 `.tpt` 会拒绝，扩展名不代表安全认证。
