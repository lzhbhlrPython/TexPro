---
slug: language-packs
title: "语言包：安装、翻译与恢复"
group: 使用
order: 68
summary: 使用预装简体中文包，创建声明式语言插件，并验证缺译回退、占位符与安全恢复。
---

## 选择与恢复

简体中文由预制插件 `@texpro/extension-translate-zh-cn` 提供。进入「扩展」查看、停用或启用，再到「偏好设置」选择语言。英文始终内置；停用或卸载当前语言更新后回退英文。预制资源不能删除，安装更新可以卸载。原生恢复命令 `Reset Appearance and Disable Extensions` 固定英文，必要时使用 `--safe-mode`。

翻译可能伪装可信操作，纯数据不等于可信来源；只启用已核对作者及内容的语言包。功能插件维护自己的 i18n，不能通过宿主语言包替换插件业务逻辑。

## 制作第 2 版语言包

在仓库开发环境运行 qwertysay 的引导入口，选择「语言包（仅数据）」、语言代码、自称和 npm／yarn：

```sh
npm ci
node packages/qwertysay/bin/qwertysay.cjs
```

在生成的 `reference/en.json` 查找用途对应的语义键，在 `locales/fr.json` 填写译文。不要翻译键名或 `{name}` 等变量。

```json
{
  "app.save": "Enregistrer",
  "app.cancel": "Annuler"
}
```

清单中的语言贡献必须声明目录版本：

```json
{
  "catalogVersion": 2,
  "id": "fr",
  "title": "Français",
  "messages": "locales/fr.json"
}
```

这段对象放在 `contributes.locales` 数组中。扩展的 `apiVersion` 仍为 1；清单、消息文件和 LICENSE 必需，无入口、权限或样式。无需编译，选择「校验」「打包」生成 `.tpp`，然后在「扩展」审核安装、启用并选择语言。缺失项回退英文；未知语义键会报告，覆盖率取决于 SDK 参考版本。

## 破坏性迁移与长文本

SDK 0.5.0、qwertysay 0.6.0、中文包 2.0.0 与支持目录第 2 版的宿主配套。旧正文键语言包明确拒绝，不提供兼容层。重新生成参考目录、按语义键迁移译文、递增包版本并校验；只改清单版本不够。源码、npm 发布和应用 Release 的状态分别核实，已有 v0.1.0 安装包不会自动获得新契约。

按钮、菜单与状态使用 JSON。彩蛋、文档、教程及长说明按语言维护完整 Markdown，交给统一渲染器；不要给每段每句另建翻译键。官网与桌面词典独立，桌面语言插件不会翻译官网。

官网文档源码统一放在 `product-page/src/content/docs/{locale}/{slug}.md`。`zh/` 和 `en/` 平级、同名同 slug，中文也不放在根目录；新增语种沿用同一目录约定。移动源码文件不改变公开的 `/docs/:slug` 链接。

作者还应阅读 [SDK](/docs/extension-development)、[qwertysay](/docs/qwertysay)、[AI 开发 Skill](/docs/extension-skill) 与 [npm／yarn 扩展管理](/docs/extension-package-management)。
