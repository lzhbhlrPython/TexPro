# 声明式语言包与翻译维护

## 两种文本、两条资源路径

按钮、菜单、状态和短提示使用稳定语义键，例如 `app.save`。键标识用途，不是英文或中文正文；修改措辞不改键。桌面英文唯一来源是 `packages/extension-sdk/lib/locale-source.json`，简中唯一来源是 `packages/extension-translate-zh-cn/language/locales/zh.json`。`src/i18n.ts` 只负责加载、订阅、选择、插值与回退；英文 JSON 在首次渲染前动态加载，保持离线可用。英文是不可替换的恢复语言。

彩蛋、文档、教程和长篇说明按语言保存完整 Markdown 文件，复用同一解析器与渲染器。不要给每段、每句甚至每个强调片段单独建立翻译键，也不要把 Markdown 正文塞进 UI JSON。官网彩蛋信件位于 `product-page/src/content/letters/{zh,en}/qwerty.md`，仅进入该内容时加载；文档位于 `product-page/src/content/docs/{zh,en}/{slug}.md`，两种语言目录平级、同名同 slug，中文也不在文档根目录放正文。源代码、文件名、作者标题、插件返回值、URL 和技术枚举是数据，不能递归“翻译全部字符串”。

官网 UI 独立使用 `product-page/src/i18n/messages/{zh,en}.json`、`catalog.ts` 与 `useMessages()`。中文也必须有独立 JSON，不能靠组件里的中文正文隐式回退。`useLocalizedFields()` 只处理调用方明确列出的文本字段；不会递归修改 href、id、资源路径或 React 节点。文档内容与 UI 词典分开维护。

## 语义键的维护规则

- 按功能与用途命名，如 `app.save`；不含语言、版本和整句正文，不以译文或措辞变化重建键。
- 相同文字处于不同任务时可以有不同键；不要因为英文恰好相同就合并不相关语义。
- 新增键同轮补齐中英、占位符与调用；删除或更名先核对静态引用、动态标签表、原生菜单及 SDK 参考。静态键保留词典推导类型，不用宽泛字符串类型或断言压掉缺键错误。
- 动态显示先明确来源：宿主标签经语义键解析，作者／插件数据保持原文；不得递归翻译整个对象，也不得把显示键写入生成内容。
- 根 AGENTS.md 与包内 AGENTS.md 是强制维护约束；本指南解释契约与操作。只更新说明、没有同步消费者及实际验证，不视为迁移完成。

## 第 2 版清单与消息

```json
{
  "id": "author.language-fr",
  "name": "Français",
  "version": "2.0.0",
  "apiVersion": 1,
  "author": "Your name",
  "license": "MIT",
  "capabilities": [],
  "contributes": {
    "locales": [{
      "catalogVersion": 2,
      "id": "fr",
      "title": "Français",
      "messages": "locales/fr.json"
    }]
  }
}
```

对应的 `locales/fr.json`：

```json
{
  "app.save": "Enregistrer",
  "app.cancel": "Annuler"
}
```

`apiVersion: 1` 是扩展 API，`catalogVersion: 2` 是语言目录契约，二者独立。SDK 0.5.0、qwertysay 0.6.0 与预制中文包 2.0.0 对应新契约；它要求同时使用支持目录第 2 版的宿主。已有 v0.1.0 安装包不因此自动升级。源码版本、npm 注册表和应用 Release 是独立状态。

这是破坏性迁移。旧正文键、历史中文键、没有 `catalogVersion` 或值非 2 的语言包明确拒绝，安装／只读检查提示迁移，不保留旧键适配层。作者用新 SDK 的 `reference/en.json` 重新对照语义键填写译文，升级包版本并重新检查／打包；不能只修改版本字段或重命名旧键文件冒充完成迁移。旧包无法提供有效词典时使用内置英文，不允许旧词典覆盖恢复入口。

语言 ID 遵守 BCP 47，`title` 使用语言自称。预制简中继续使用 `zh`，HTML 根标签为 `zh-CN`；这与文本键的破坏性迁移无关。语言包仅含声明式 JSON、清单和 LICENSE，不包含功能入口、权限或样式。功能插件维护自己的资源与语义键，不把业务文案混进宿主目录；每次调用读取 `context.language`。

## 校验、缺译与异步边界

公共 SDK 的 `validateMessages`、`localeContributions`、`messageCoverage` 是宿主、qwertysay 与只读 MCP 的共用边界。拒绝危险键、非字符串、超限 JSON、非法语义键和路径越界。已知键必须保留英文的全部 `{name}`、`{count}` 等占位符；变量名不翻译。符合格式的未来键允许保留，但报告为 unknown，其变量契约尚无法按旧源目录验证。缺译逐条回退英文；覆盖率只能代表当前 SDK 目录。

`msg(id, variables)` 的静态 ID 由 TypeScript 对英文 JSON 推导。混合宿主标签与作者数据的显示边界明确使用 `msg.text(value)`：只解析已知语义 ID，其他字符串原样显示；它不是正文键兼容器。技术枚举、命令 ID、表格动作 ID 与展示标签分别存储。不得把语义键写入 `.tex`、文献字段、乐谱声部或新项目名称。

启动先准备语言资源再渲染。若英文主目录本身无法加载，入口使用极小的独立 `bootstrap-en.json` 显示不可覆盖的英文恢复信息与重新加载按钮，不渲染满屏消息 ID；它不是普通可翻译词典。桌面扩展刷新以请求序号拒绝旧结果；官网缓存成功的语言加载请求，失败允许重试，切换只在词典完整加载后提交，失败保留当前语言并提示。长文本独立处理过期结果、英文回退和失败重试。切换不重建编辑器、不改文档、撤销、焦点或滚动。

## 安全、恢复与作者流程

JSON 翻译作为纯文本；Markdown 使用现有受控渲染器，不执行 HTML、脚本或作者代码。翻译仍可伪装可信指令，主题可隐藏控件，Node 功能插件拥有用户权限；这些风险不能混称为“无代码所以安全”。原生 `Reset Appearance and Disable Extensions` 固定使用英文源消息，即使语言包提供该键也不覆盖；`--safe-mode` 仍可恢复。

qwertysay 无参数启动中英引导，选择「语言包（仅数据）」、语言自称与 npm／yarn。生成 `reference/en.json` 参考目录及 `locales/{id}.json`，无需构建。填写语义键译文后 check、pack 为 `.tpp`，在「扩展」审核并启用，再从「偏好设置」选择语言。普通 npm／yarn 分发与同步见[包管理方案](extension-package-management.md)。不得为了生成语言包执行未知入口或安装脚本。

验证完整中英键集、占位符、旧包拒绝、未知键报告、坏 JSON、刷新竞态、缺译、启停与卸载、英文恢复及真实原生菜单。完整基线必须零失败、零跳过、零 TODO。简中发行物由 `node packages/extension-translate-zh-cn/build.cjs` 同源生成，不手改 dist 归档；官网构建重新生成机器可读内容，前端变化同步真实预览图。
