# @gardenialiu/texpro-extension-sdk

独立的 TeXPro API 1 TypeScript 契约、作者辅助函数与包校验核心。**Baolin Liu（gardenialiu），MIT，Node.js 20+**，不依赖 Electron 或 React。

[English](README.md)

## 安装与开发

```sh
npm install --save-dev @gardenialiu/texpro-extension-sdk
```

```ts
import type { Extension } from '@gardenialiu/texpro-extension-sdk';
export const activate: Extension['activate'] = ctx => {
  ctx.handle('uppercase', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

在清单声明动作和能力，打包前编译为自包含 `.cjs`／`.mjs`。仅类型导入无需运行时依赖；可选 `defineExtension(activate)` 将函数包装为扩展对象，`API_VERSION` 为 1。

`index.d.ts` 包含 UTF-16 修改提案、诊断、补全、悬浮、文本预览、导入导出、文献、素材、编译请求、配置、磁盘工程读取和存储。通过 `onDispose` 清理；宿主检查身份和过期状态，接受后一次可撤销事务应用。高级提供器和界面贡献仍为实验性，不开放任意 React／HTML 或编辑器内部对象。

## qwertysay 脚手架

CLI 独立发布为 **[@gardenialiu/qwertysay](https://www.npmjs.com/package/@gardenialiu/qwertysay)**：

```sh
npx --package @gardenialiu/qwertysay qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

默认 TypeScript，`--language js` 无需构建，`--type theme` 生成主题。插件使用 `.tpp`，纯主题使用 `.tpt`。包手动分发，不提供公开市场和自动更新。

## 共用校验核心

`require('@gardenialiu/texpro-extension-sdk/package-tools')` 提供 `validateManifest`、`readPackage`、`validatePackageType`、`pack`、`unpack` 和主题解析。qwertysay 与桌面共用同一核心，检查兼容性、跨平台路径、归档和主题资源；不安装依赖、不联网、不执行代码，也不能证明处理器正确。普通非隐藏源码文件会进入归档，请勿放入密钥。

## 信任与恢复

**代码插件有当前用户的 Node 文件、网络和进程权限；能力声明和进程隔离不是操作系统沙箱。主题可能隐藏控件、伪装可信界面或损害可访问性。仅启用可信来源。** CSS 限制、扩展名与摘要都不能认证作者或保证安全。

原生「视图 → 重置外观并停用扩展」和 `--safe-mode` 可恢复。临时用户目录验收实际归档，检查过期请求、工程切换、输入法、撤销、中英文、三主题和恢复；CLI 检查不能替代原生和安装包验收。

## 源码、灵感和版权

[源码](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/packages/extension-sdk)、[开发契约](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-development.md)、[示例](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/examples/extensions)、[开发 Skill](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/skills/texpro-extension-development)。

借鉴 Koishi 生命周期和服务组织思路，使用原创实现，不兼容 Koishi 格式，不含其运行时和控制台源码。本包 MIT（LICENSE），PostCSS 和 postcss-value-parser 保留各自 MIT 许可。第三方扩展和资源仍需保留自身版权。
