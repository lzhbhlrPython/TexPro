---
slug: extension-development
title: "插件 SDK：API 1 开发"
group: 开发
order: 65
summary: SDK 安装、清单、处理器、服务、生命周期、JSON 桥接、权限和分发验收。
---

## 先选对入口

这篇说明 `@texpro/extension-sdk` **0.3.0 / API 1**，作者 Baolin Liu（gardenialiu），自有代码为 MIT。SDK 提供类型、作者辅助函数、JSON 桥接和共用校验核心，不依赖 Electron、React 或 TeX。创建工程和选择语言见 [qwertysay 引导式工具](/docs/qwertysay)；让 AI 协助开发见[开发 Skill](/docs/extension-skill)。

```sh
npm install --save-dev @texpro/extension-sdk@0.4.0
```

SDK 安装不等于向 TeXPro 安装插件。宿主只加载完成的自包含入口和包资源，不在作者机器以外安装 npm 依赖，也不编译源码。SDK 辅助函数若被运行时使用，必须随作者代码打包；直接导出 `activate(ctx)` 则不要求运行时引用 SDK。

## 清单、入口和安装包

包根必须包含 `texpro.extension.json` 和 LICENSE。清单与实际动作一致，使用小写命名空间标识，声明中英名称、作者、版本、许可、API 及最小能力。下面是一个转换插件的完整起点：

```json
{
  "id": "author.uppercase",
  "name": { "zh": "选区大写", "en": "Uppercase selection" },
  "version": "1.0.0",
  "apiVersion": 1,
  "author": "Your name",
  "license": "MIT",
  "entry": "index.cjs",
  "capabilities": ["document.read", "document.write"],
  "contributes": {
    "actions": [{ "id": "uppercase", "title": { "zh": "转换为大写", "en": "Uppercase" }, "kind": "transform", "level": "L2" }]
  }
}
```

插件运行入口仅为自包含 `.cjs` 或 `.mjs`；TypeScript、CoffeeScript、PureScript、ReScript、ClojureScript、Elm、Scala.js、GopherJS 先编译为 JavaScript。安装包为 **`.tpp`**。主题为 **`.tpt`**，没有可执行入口，也不接受插件动作；源码后缀、运行入口后缀和安装后缀是三件事。不能通过重命名 `.zip` 或把代码改名为 `.tpt` 绕过校验。

## 实现一次可撤销的修改

```js
exports.activate = ctx => {
  ctx.handle('uppercase', context => {
    if (context.signal.aborted) return {};
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

处理器 ID 必须在清单中声明。`source` 和 `selection` 属于一次调用快照；偏移以 JavaScript **UTF-16 代码单元**计算，不能按字节或 Unicode 码点计算。调用快照可包含获准的未保存文本，而磁盘服务不包含。

返回的是修改提案，用户明确接受后才应用。宿主核对工程、文件、文档身份、范围、能力和启用状态，并通过一次 CodeMirror transaction 保留撤销。即使用户修改后撤销回相同文本，旧身份仍失效。不要改 DOM、持有内部编辑器对象或直接覆盖源文件来绕开提案。

## 能力、服务与结果

| 能力 | 作用与边界 |
| --- | --- |
| `document.read` | 获准的调用快照正文；不等于任意文件读取授权 |
| `document.write` | 提出编辑；宿主仍要求接受和新鲜身份 |
| `project.read` | 受控读取已保存工程文本及磁盘符号 |
| `build.request` | 请求编译；仍先保存相关缓冲区并解析真实主文件 |
| `storage` | 每插件最多 1 MiB JSON 存储，不保存凭据 |
| `network` | 如实声明联网意图；声明本身不隔离 Node 网络 |
| `theme.styles` | 使用包内受控 CSS；纯 token 主题不需要 |

`context.services.call` 当前支持 `storage.get({key})`、`storage.set({key,value})`、`project.readFile({path})` 和 `project.symbols()`。后两项读磁盘；工程路径受限。配置通过 `ctx.config` 读取，清单声明字符串、布尔或数值设置，不把配置当作密钥存储。

`ExtensionResult` 可返回 `edits`、`diagnostics`、`completions`、纯文本 `content`、文本导出 `output`、创建工程提案 `project` 或 `action: 'compile'`。纯文本预览不解释 HTML；导出、导入及编译继续经过宿主明确操作。没有任意 React/HTML 注入、自定义原生 TeX 进程或二进制素材结果。

## 生命周期与取消

通过 `ctx.handle()`、`ctx.on('projectChanged' | 'buildFinished', listener)` 注册处理器和事件；保存返回的清理函数，或在 `ctx.onDispose()` 及 activate 返回的 disposer 中释放定时器、连接和外部状态。加载上限 5 秒，调用上限 10 秒；失败、超时或崩溃会使扩展停用。

异步工作检查 `context.signal`。取消、换工程、重载、停用后不能回写旧结果。取消不保证已经交给系统或网络的副作用可以撤回，避免在返回提案前直接修改文件。

## 跨语言 JSON 桥接

`defineTextTransform()` 适合编译后纯字符串变换；完整消息与受控服务使用 `defineJsonExtension({actions,start})`。编译语言与 SDK 交换 JSON 字符串：宿主发送 init、invoke、cancel、event、service-result、dispose；插件返回 result、service、log。Elm 使用无 DOM 的 Platform.worker ports。

桥接最多四个并行调用，单消息 4 MiB，超时 9.5 秒；每调用最多十六个在途服务、六十四次服务请求。桥接保留 API 1 的能力、UTF-16 和过期检查，不获得更高权限。精确类型见包内 `index.d.ts`，构建契约见仓库 `docs/extension-authoring.md`。

## 校验、安全与交接

公开 `package-tools` 导出校验、归档和只读检查；宿主、MCP 与 CLI 共用此核心。归档上限 16 MiB／300 文件，拒绝路径越界、符号链接、重复路径和原生二进制。检查成功与摘要一致只证明格式和内容身份，不是安全认证。

**代码插件以当前用户的 Node 权限运行，可能读取文件、联网和启动进程；进程隔离不是安全沙箱。主题也可能隐藏控件、伪装提示或破坏可访问性。** 只启用可信来源；原生「视图 → Reset Appearance and Disable Extensions」和 `--safe-mode` 提供恢复。主题规则见[主题包](/docs/themes)。

在临时用户目录安装实际 `.tpp`／`.tpt`，验证停用、启用、重载、配置、错误、过期请求、IME、撤销、主题和恢复。修改宿主时运行完整回归：零失败、零跳过、零 TODO。打包结果保留作者 LICENSE 与第三方通知；SDK 的 MIT 不覆盖被打包的语言运行时或其他依赖。

交接提供源码、API 和包版本、能力、安装包、摘要、测试证据及限制。高级提供器和界面贡献仍为实验性；清单中的 `mcp` 动作不自动注册为外部 MCP。外部 `texpro_extension_capabilities` 与 `texpro_inspect_extension` 只读，不构建、执行、安装或启用插件。

## 语言插件与包管理环境

[语言包教程](/docs/language-packs)说明声明式模板、预装 @texpro/extension-translate-zh-cn、占位符校验与英文恢复。[npm／yarn 管理](/docs/extension-package-management)说明作者配置、分发包与经过审核的安装／更新／卸载同步。SDK 0.4.0 与 qwertysay 0.5.0 使用 @texpro；旧 @gardenialiu 版本保留独立历史。

## 功能插件自己的 i18n

每个功能插件自行维护 i18n 库和翻译资源；宿主语言包只翻译 TeXPro，不翻译插件业务文案。清单名称、操作标题等使用带 en 回退的 Localized 对象。运行消息、诊断和预览根据每次调用的 `context.language` 选择插件词典；JSON 桥接读取 invoke.context.language。依次匹配完整语言、基础语言和插件自己的英文，并对单条缺译回退英文，不在 activate 时固定语言。

例如作者维护独立 `i18n/messages.json`（en、fr 等词典），处理器用 `messages[context.language] || messages[context.language.split('-')[0]] || messages.en` 选择，再用 `table[key] || messages.en[key]` 回退。插件键与占位符由作者维护，不合并到宿主 locale-source.json；`contributes.locales` 专用于宿主的纯数据语言包，不能和功能入口混用。

可以用 npm／yarn 安装自己开发语言的 i18n 库，构建时将库打入自包含运行产物，并包含所有实际引用的 JSON 等资源。不要依赖宿主 node_modules、私有词典或运行时下载。验证最终 `.tpp` 的实际资源、目标语种、区域与缺译回退，以及同一插件进程两次调用之间切换语言。译文按普通文本使用，不执行代码或 HTML。

## 源码发布 npm 与构建安全

源码可直接发布 npm，texpro.source 指向目录（省略为包根），不必先内嵌 .tpp／.tpt。SDK 0.4.0、qwertysay 0.5.0 和对应宿主支持此路径；旧归档分发继续兼容。可运行 JS／静态文件安装后直接同步；需要编译的包在 qwertysay 选择「构建已安装的源码扩展」，单独确认信任后再同步到 TeXPro 审核。构建配置和编译器拥有用户权限；禁用安装脚本和临时目录都不是沙箱。完整的作者发布、用户安装／升级／卸载、工具链限制与风险见 [npm／yarn 管理扩展](/docs/extension-package-management)。
