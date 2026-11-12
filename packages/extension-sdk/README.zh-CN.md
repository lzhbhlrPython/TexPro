# @texpro/extension-sdk

作者 **Baolin Liu（gardenialiu）**，自有代码 MIT。当前 **0.3.0 / API 1**，Node.js 20+，不依赖 Electron、React 或 TeX。

[English](README.md)

## SDK 的职责

SDK 提供 API 1 TypeScript 类型、defineExtension、defineTextTransform、defineJsonExtension 和公共 package-tools 校验／归档／只读检查核心。它不安装插件、不调用编译器、不运行宿主，也不提供权限沙箱。

```sh
npm install --save-dev @texpro/extension-sdk@0.3.0
```

## 文档分工

- [插件 SDK](https://texpro.pyliubaolin.top/docs/extension-development)：完整清单、处理器、能力、服务、生命周期、JSON 桥接及验收。
- [qwertysay](https://texpro.pyliubaolin.top/docs/qwertysay)：独立 0.4.1 引导工具；创建、语言／样式选择、构建、校验和打包不需要记参数。
- [开发 Skill](https://texpro.pyliubaolin.top/docs/extension-skill)：AI 技能安装、调用、开发约束和交接。

## 运行入口

```js
exports.activate = ctx => {
  ctx.handle('uppercase', context => {
    if (context.signal.aborted) return {};
    const { from, to } = context.selection;
    return { edits: [{ from, to, insert: context.source.slice(from, to).toUpperCase() }] };
  });
};
```

动作和能力必须在清单声明，偏移为 UTF-16。返回修改提案，宿主在用户接受后核对文档身份与启用状态，再一次性应用以保留撤销。异步工作检查取消，换工程或停用后不回写。project.readFile 读取磁盘，不包括未保存缓冲区；存储上限每插件 1 MiB，不保存凭据。

直接导出 activate 不需运行时引用 SDK。若使用 defineExtension／桥接辅助函数，需要编译并打包进自包含 .cjs／.mjs。插件分发 .tpp，主题分发 .tpt；主题无可执行入口，最简配色只需 manifest 和 LICENSE。源码、运行与安装后缀不可混淆。

## JSON 桥接和检查

完整桥接类型见 index.d.ts。defineJsonExtension 提供 init/invoke/result/cancel/event/service/service-result/dispose 字符串消息传输，支持受控服务和清理；defineTextTransform 为简单编译后字符串变换提供起点。最多四个并行调用、4 MiB 消息、9.5 秒超时；宿主的能力与过期检查仍有效。

公共 package-tools 与宿主／MCP 共用同一核心，目录／归档上限 16 MiB、300 文件，拒绝路径越界、符号链接、原生二进制及主题代码伪装。只读检查不导入编译器或扩展入口。外部 MCP 的格式与包检查不构建、不安装、不启用，清单 mcp 动作不自动成为外部工具。

## 安全与版权

**Node 插件拥有当前用户文件、网络和进程权限，进程隔离不是沙箱。主题也可能隐藏控件或伪装可信界面。** 只启用可信来源；原生视图菜单与 --safe-mode 可恢复。摘要和后缀不是安全认证。

MIT 只覆盖 SDK 自有代码，不替代编译语言运行时、字体或其他依赖许可。构建器收集可识别通知，作者仍需审查新增依赖及 THIRD_PARTY_NOTICES.md。Koishi 启发了生命周期／服务组织，没有复制其运行时、控制台或插件格式。

维护改动运行包测试和完整零跳过基线，验证实际 npm tarball 的独立安装、编译、归档与拒绝路径。发布和原生运行验收分别报告，不能用源码软链接或本地 PASS 冒充。

## Language packs and npm/Yarn / 语言包与包管理

SDK 0.3.0 / API 1 and qwertysay 0.4.1 use the @texpro scope. Historical @gardenialiu packages remain immutable; install the new package names and update imports. / 使用新作用域并更新依赖与 import，旧版本不覆盖。

- [Language packs / 语言包](https://texpro.pyliubaolin.top/docs/language-packs): declarative .tpp, placeholder checks, missing-key fallback and preinstalled @texpro/extension-translate-zh-cn. / 声明式语言插件、变量校验、英文回退及预装简中。
- [npm/Yarn management / 包管理](https://texpro.pyliubaolin.top/docs/extension-package-management): one lockfile, node_modules, texpro.package wrappers, reviewed synchronization and removal with plugin data retained. / 单锁文件、分发包、逐项审核与卸载保留数据。

Language packs never contain code or styles, but translations may impersonate instructions. npm/Yarn changes dependencies; sync asks the host to install/update/remove its snapshots. It never auto-enables extensions. / 语言包没有代码或样式，文案仍可能误导用户。包管理器修改依赖，宿主另行审核同步，不自动启用。

## 功能插件自己的 i18n

每个功能插件自行维护 i18n 库和翻译资源；宿主语言包只翻译 TeXPro，不翻译插件业务文案。清单名称、操作标题等使用带 en 回退的 Localized 对象。运行消息、诊断和预览根据每次调用的 `context.language` 选择插件词典；JSON 桥接读取 invoke.context.language。依次匹配完整语言、基础语言和插件自己的英文，并对单条缺译回退英文，不在 activate 时固定语言。

例如作者维护独立 `i18n/messages.json`（en、fr 等词典），处理器用 `messages[context.language] || messages[context.language.split('-')[0]] || messages.en` 选择，再用 `table[key] || messages.en[key]` 回退。插件键与占位符由作者维护，不合并到宿主 locale-source.json；`contributes.locales` 专用于宿主的纯数据语言包，不能和功能入口混用。

可以用 npm／Yarn 安装自己开发语言的 i18n 库，构建时将库打入自包含运行产物，并包含所有实际引用的 JSON 等资源。不要依赖宿主 node_modules、私有词典或运行时下载。验证最终 `.tpp` 的实际资源、目标语种、区域与缺译回退，以及同一插件进程两次调用之间切换语言。译文按普通文本使用，不执行代码或 HTML。
