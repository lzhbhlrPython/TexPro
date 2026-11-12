# @gardenialiu/qwertysay

qwertysay：TeXPro 独立的离线脚手架、校验和打包 CLI，依赖 `@gardenialiu/texpro-extension-sdk` 的公开类型与校验核心。以 **Baolin Liu（gardenialiu）** 名义、MIT 协议发布。需要 Node.js 20+；工具无需 Electron 或 TeX 环境。

[English](README.md)

## 创建插件

```sh
npx --package @gardenialiu/qwertysay qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

默认生成 TypeScript 项目（`src/index.cts` → `dist/index.cjs`）。加 `--language js` 可生成带类型注释的 JavaScript，无需构建。输出 `../gardenialiu.example.tpp`，通过 TeXPro「扩展」检查、安装并启用。开发者明确安装依赖；CLI 本身不自动安装、不联网、不执行扩展代码。`npx` 可能从 npm 下载 SDK。

## 创建主题

```sh
npx --package @gardenialiu/qwertysay qwertysay init my-theme --id gardenialiu.paper --author "Baolin Liu" --type theme
cd my-theme
npm install
npm run check:extension
npm run pack:extension
```

输出 `../gardenialiu.paper.tpt`，只接受主题配置、CSS 和资源，不含可执行入口、动作或其他插件贡献。插件使用 `.tpp`，两者底层均为 ZIP。将代码改名为 `.tpt` 会拒绝；后缀不代表安全认证。包自行分发，没有公开市场和自动更新。

## CLI 与 SDK

```sh
qwertysay init <directory> [--id author.name] [--author "Your name"] [--type plugin|theme] [--language ts|js]
qwertysay check <directory|file.tpp|file.tpt>
qwertysay pack <directory> <new-output.tpp|new-output.tpt>
```

脚手架目标必须是新目录或空目录。TypeScript 先构建再校验、打包。输出必须位于源码目录外，且不能覆盖文件。CLI 与宿主共用清单、兼容性、跨平台路径、ZIP、摘要、大小及主题检查；不运行处理器，也不能证明逻辑正确。普通非隐藏文件会打包，忽略 dotfiles 和 `node_modules`；勿在源码目录放密钥。

入口必须为自包含 `.cjs`／`.mjs`，运行时依赖需自行打包并保留许可。宿主不安装依赖、不执行安装脚本。归档压缩／展开均限制 16 MiB、最多 300 文件，拒绝符号链接、越界、损坏内容和原生二进制。

```ts
import type { Extension } from '@gardenialiu/texpro-extension-sdk';
export const activate: Extension['activate'] = ctx => {
  ctx.handle('uppercase', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

清单须声明动作及能力。可选 `defineExtension(activate)` 包装函数；仅类型导入不需要 SDK 运行时。公开契约在 SDK 的 `index.d.ts`：UTF-16 修改提案、诊断、补全、悬浮、文本预览、导入导出、文献、素材、编译请求、配置、磁盘工程读取和独立存储。通过 `onDispose` 清理。宿主校验身份和过期状态，接受后通过一次可撤销事务修改。高级提供器与界面贡献仍为实验性，不开放任意 React／HTML 和编辑器内部对象。

## 信任、恢复与验收

**代码插件具有当前用户的 Node 文件、网络和进程权限；能力声明和进程隔离不是操作系统沙箱。主题也可能隐藏控件、伪装可信界面或损害可访问性。仅启用可信来源。** CSS 限制和 SHA-256 完整性检查不能认证作者。

原生「视图 → 重置外观并停用扩展」或 `--safe-mode` 可在代码加载前停用全部扩展并恢复内置纸面，之后逐项复核启用。

临时用户目录实际安装归档，验收启停、配置、过期请求、工程切换、输入法、撤销、中英文、三主题和恢复；CLI 校验不能代替原生与安装包验收。

## 源码、灵感与版权

[源码](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/packages/qwertysay)、[开发契约](https://github.com/lzhbhlrPython/TexPro/blob/codex/realtime-tex/docs/extension-development.md)、[示例](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/examples/extensions)、[开发 Skill](https://github.com/lzhbhlrPython/TexPro/tree/codex/realtime-tex/skills/texpro-extension-development)。

生命周期和服务组织借鉴 Koishi 思路；使用原创实现，不兼容 Koishi 格式，不含其运行时／控制台源码。本包 MIT（见 LICENSE），PostCSS 与 postcss-value-parser 在各自 npm 包保留 MIT 许可。第三方代码与资源仍需保留自身版权。
