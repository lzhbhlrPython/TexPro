# 声明式语言包与翻译维护

## 源码与发行边界

英文源消息位于 `packages/extension-sdk/lib/locale-source.json`，英文始终内置。`src/i18n.ts` 负责订阅、选择、插值与回退，不再承载中文词典。简体中文唯一源码位于 `packages/extension-translate-zh-cn/language/`，原生菜单也读取该包。应用预装该目录；独立 npm 包 `@texpro/extension-translate-zh-cn` 的 `texpro.package` 指向同源生成的 `.tpp`。官网的中英内容和 i18n 保持独立。

```json
{
  "id": "author.language-fr",
  "name": "Français",
  "version": "1.0.0",
  "apiVersion": 1,
  "author": "Your name",
  "license": "MIT",
  "capabilities": [],
  "contributes": {
    "locales": [{ "id": "fr", "title": "Français", "messages": "locales/fr.json" }]
  }
}
```

JSON 是英文源目录中的稳定消息键到翻译字符串的映射；部分键沿用历史中文标识，保留原键并翻译对应的英文显示文本。语言标识遵守 BCP 47，`title` 使用语言自称。`en` 是不可替换的恢复语言；预装简中沿用 `zh`，兼容现有偏好，HTML 文档根语言标签为 `zh-CN`。消息路径为包内 JSON，LICENSE 必需。语言包没有入口、权限、样式或其他贡献，安装后不启动插件进程。

## 校验、缺译和恢复

公共 SDK `localeContributions`、`validateMessages` 与 `messageCoverage` 同时供宿主、CLI 和只读检查使用。拒绝危险对象键、非字符串、超限消息、路径逃逸及占位符不匹配。保留 `{name}`、`{count}` 等全部变量，不能翻译变量名。缺失键回退英文；未知键报告但允许留给不同版本宿主。检查基于所用 SDK 版本的源目录，新增宿主文案须同步升级目录，不能把旧目录的完整覆盖冒充新版本覆盖。

启动在首次 React 渲染前获取语言数据，不需要下载或执行语言包代码。包损坏、停用、卸载或安全模式下回退英文；更新词典通知已有界面，不重建编辑器。简中预装副本可停用；安装同 ID 的合法语言更新保持停用，卸载更新恢复停用的预装副本。原生恢复命令 `Reset Appearance and Disable Extensions` 固定使用英文，避免翻译包篡改恢复入口；也可用 `--safe-mode`。

翻译是纯文本，不作为 HTML。数据包仍可把按钮翻成误导性指令，不能宣称“无代码等于安全”。扩展审核明确提示作者信任与文案伪装风险。恢复文案、主题和 Node 扩展的风险分别说明。

## 开发与验收

运行 qwertysay 的中英引导，选择「语言包（仅数据）」、目标语言、语言自称及 npm／Yarn。生成的 `reference/en.json` 是参考快照，编辑 `locales/{语言}.json`；无需构建，直接校验与打包为 `.tpp`。npm 分发格式和受控同步见[包管理方案](extension-package-management.md)。

验证源目录覆盖、占位符、坏 JSON、预装与更新、启停、重启、卸载回退、原生菜单、快捷键、完整基线与真实 UI。新增文案同时修改英文目录和简中包；其他语言保持英文回退。构建简中发行物使用 `node packages/extension-translate-zh-cn/build.cjs`，不要手改 dist 归档。
