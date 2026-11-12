# 插件与主题包开发

API 1 SDK 独立为 `@gardenialiu/texpro-extension-sdk`，离线脚手架独立为 `@gardenialiu/qwertysay`（命令 `qwertysay`），作者为 Baolin Liu（gardenialiu），MIT；源码位于 `packages/extension-sdk/`，不依赖 Electron／React。插件作者可使用脚手架或 `examples/extensions/`，自行分发 `.tpp` 插件与 `.tpt` 主题；没有公开市场和自动更新服务。

```sh
npx --package @gardenialiu/qwertysay qwertysay init my-plugin --id gardenialiu.example --author "Baolin Liu"
cd my-plugin
npm install
npm run build
npm run check:extension
npm run pack:extension
```

默认 TypeScript；`--language js` 无需构建，`--type theme` 生成主题包。CLI 不自动安装、联网或执行代码；`npx` 可能下载 SDK。输出位于源码目录外，拒绝覆盖。校验与宿主共用同一核心，不代替实际交互验收。发布维护需先 `npm pack`，再从临时目录通过 `npm run test:extensions:sdk:package -- /absolute/sdk.tgz /absolute/qwertysay.tgz` 验证真正 tarball 的独立安装、TS 构建和归档；注册表发布后使用准确版本重复验证。

## 包清单

```json
{
  "id": "author.example",
  "name": { "en": "Example", "zh": "示例" },
  "version": "1.0.0",
  "apiVersion": 1,
  "author": "Author",
  "license": "MIT",
  "entry": "index.cjs",
  "capabilities": ["document.read", "document.write"],
  "contributes": {
    "actions": [{ "id": "rewrite", "title": { "en": "Rewrite selection", "zh": "改写选中内容" }, "kind": "transform", "level": "L2" }]
  }
}
```

同目录包含 LICENSE。可执行入口仅支持自包含 `.cjs` / `.mjs`；TypeScript 需要作者预先编译。宿主不安装依赖，不执行安装脚本。包 id、API 版本、路径、大小和主题 token 均会校验；目录模式同样不接受符号链接。可使用 `defineExtension` 辅助函数，也可直接导出 `activate(ctx)`，无需运行时引用 SDK。

## 写作处理器

```js
exports.activate = ctx => {
  ctx.handle('rewrite', context => {
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

偏移使用 JavaScript UTF-16。返回修改提案后，用户明确应用；宿主验证工程代数、文件、文档身份、包状态和范围，通过单次 CodeMirror transaction 修改。输入后即使撤销回相同文本，旧文档身份仍失效。关闭工具会丢弃未完成结果。不可在插件中调用内部编辑器对象或改 DOM。

## 能力与接入状态

| 扩展点 | 当前宿主接入 |
| --- | --- |
| 命令与工具 | 同一命令目录；L2 工具、L3 工作台、清单声明的动作分组 |
| 静态补全、片段 | 启用后进入既有编辑器补全 |
| 动态补全、悬浮信息 | 自动调用已启用提供器；每类最多取前八个，过期结果丢弃 |
| 检查器 | 工具中显式运行，结果进入既有问题面板，随文档或扩展状态变化清除 |
| 转换 | 预览修改、明确接受、一次撤销 |
| 预览 | 安全的纯文本结果，不执行 HTML |
| 导入 | 返回工程文件提案，明确创建新工程 |
| 导出、文献、素材 | 工具中提供输入，返回文本或下载结果；暂不支持二进制素材输出 |
| 编译请求 | 接受后进入既有保存全部缓冲区及真实主文件编译流程 |
| 模板 | 扩展详情中明确创建新工程 |
| MCP 数据 | 实验性工具调用，不自动向外部 stdio MCP 注册 |
| 工程服务 | 受控读取已保存文本、读取磁盘符号索引 |
| 配置与存储 | 类型校验配置；每插件 1 MiB 本地 JSON 存储；不用于凭据 |

包校验、生命周期和基础结果属于 API 1 的稳定边界；高级提供器及界面贡献暂为实验性。未开放任意 React/HTML 注入、自定义 TeX 引擎进程和原生二进制加载。扩大能力时先补契约、服务和真实验收，不能只加类型名称。

## 主题包

主题无须 JavaScript 入口。每项包含 `id`、中英 `title`、`base`、`tokens`，可选 `stylesheet` 指向包内 CSS。基础模式为 paper、studio 或 night。颜色 token 见 `schema.cjs` 的 `TOKEN_NAMES`，接受六位或八位十六进制；字体可设 `font-ui`、`font-editor`、`font-mono`（普通字体族列表）；尺寸可设 `editor-font-size`（12–36px）、`editor-width`（400–1600px）、`radius`（0–24px）、`space-unit`（2–12px，供主题 CSS 使用）。未声明项继承基础模式。启用包时，主题字号／宽度覆盖写作设置；切回内置主题恢复用户设置。

CSS 可调整应用布局、间距、边框、排版和交互状态，使用标准选择器及 `:scope` 指向主题根。宿主通过 PostCSS 解析，在 `@scope ([data-extension-theme])` 内应用普通规则，允许 media、supports、container、layer、font-face、keyframes；字体和动画定义仅随活动主题样式存在。CSS 不保证跨版本 DOM 选择器稳定，升级后需要验收。

使用样式必须声明 `theme.styles` 并在启用前确认信任。`url("assets/example.png")` 相对 CSS 文件解析，只接受包内 PNG/JPEG/WebP/GIF 和 WOFF/WOFF2/TTF/OTF；宿主验证后嵌入，不安装系统字体。禁止远程／绝对／data URL、路径越界、CSS 转义、@import 及 image-set 等其他资源加载函数。CSS 源上限 128 KiB，单资源 1 MiB，资源展开上限每主题 2 MiB、包内生成样式合计 4 MiB。减少动态效果偏好下停用包动画及过渡。

预览取消后恢复已应用主题；应用后保存主题包标识。停用、卸载或加载失败时清除包样式、字体与 token。正式 PDF 和作者图色不受影响。主题可能隐藏按钮、覆盖文字、伪装可信提示或破坏可访问性；本地资源也需要可信来源。校验和作用域不是安全认证。原生「视图 → 重置外观并停用扩展」不依赖主题按钮；`TeXPro --safe-mode` 启动会在加载插件代码前停用全部扩展，并恢复内置纸面。macOS 可用 `open -a TeXPro --args --safe-mode`，Windows 使用 `TeXPro.exe --safe-mode`，Linux 使用可执行文件或 AppImage 加该参数。恢复会持久停用扩展，之后需逐项重新检查并启用。

## 开发、打包与交接

```sh
npm run test:extensions
npm run typecheck
npm run test:extensions:ui
node scripts/pack-extension.cjs examples/extensions/quiet-paper /tmp/quiet-paper.tpt
```

输出路径须不存在。开发目录重新加载后安装新的停用快照；重新查看并启用。更新保留旧版本，可显式恢复；卸载保留插件数据。可执行代码按受信任 Node 扩展处理，进程隔离不等于权限沙箱。包摘要校验完整性，不代表作者签名。

配套 Skill 位于 `skills/texpro-extension-development/`，可复制整个目录安装到所用 AI 工具的技能目录；TeXPro 不自动修改全局技能。交接时提交清单、源代码、许可证、包、测试说明及限制。宿主改动必须完整基线零跳过，并同步官网中英文、i18n、实际截图和博客。

分发扩展名为 `.tpp`（插件）与 `.tpt`（主题），底层均为 ZIP 归档。`.tpt` 只接受主题配置、CSS 与资源，不接受可执行入口、动作或其他插件贡献；将代码包改名为 `.tpt` 会拒绝，扩展名不代表安全认证。
