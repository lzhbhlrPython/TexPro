---
slug: language-packs
title: "语言包：安装、翻译与恢复"
group: 开发
order: 68
summary: 使用预装简体中文包，创建声明式语言插件，并验证缺译回退、占位符与安全恢复。
---

> 需要包含语言插件与包管理同步能力的桌面构建；此前公开的 v0.1.0 安装包不包含本次能力。

## 语言从哪里来

TeXPro 内置英文作为恢复语言，简体中文通过预装的声明式 `.tpp` 插件提供，并独立分发为 `@texpro/extension-translate-zh-cn`。预装与 npm 归档来自同一翻译源，不会自动联网下载语言。官网的文档语言独立于桌面语言插件。

安装作者提供的 `.tpp`：打开「扩展」，选择「安装插件包…」，核对包名、作者与文案风险后点「安装并保持停用」，再点「启用」。在「偏好设置」的「界面语言」中选择语言自称。两种语言时只显示切换到另一语言的单个按钮；有更多语言时才显示语言选择。

预装简体中文可以停用；停用、坏包或卸载当前语言时回退英文。预装资源不能直接卸载；安装的中文更新可以卸载，随后恢复停用的预装副本。缺译条目逐项回退英文，不把整页空白当作正常结果。

## 创建语言包

需要 Node.js 20+。启动 [qwertysay](/docs/qwertysay) 的中英引导，选择「创建插件或主题」后选「语言包（仅数据）」，填写目录、包标识、作者、BCP 47 语言标识（例如 fr）、语言自称（例如 Français）和 npm／Yarn。没有编译器或构建步骤。

```sh
npx --package @texpro/qwertysay@0.4.1 qwertysay
```

工程中的 `reference/en.json` 是英文参考，编辑 `locales/fr.json`：

```json
{
  "Save": "Enregistrer",
  "Hello {name}": "Bonjour {name}"
}
```

键须与 `reference/en.json` 一致，其中保留部分历史中文键；翻译对应的英文显示文本作为目标语言值，不翻译键。保留所有 `{name}`、`{count}` 等占位符，不更改变量名。通过引导选择「校验目录或安装包」会报告缺译和未知键；未知键可用于版本兼容，缺译回退英文。参考快照对应所用 SDK 版本，宿主新增文案后要升级并核对源目录。

语言声明：

```json
{
  "locales": [
    { "id": "fr", "title": "Français", "messages": "locales/fr.json" }
  ]
}
```

这段位于清单的 `contributes`。清单还需要合法插件 ID、版本、API 1、作者、许可证及空 capabilities；生成模板已经包含它们。包必须附 LICENSE，不能添加入口、权限、脚本、样式或其他贡献。英文恢复语言不能被覆盖。简中标识沿用 zh 以兼容既有偏好。

完成后选择「打包分发」生成 `.tpp`，在临时 TeXPro 用户目录测试启停、缺译、变量、菜单和恢复。npm 分发与安装／卸载联动见[包管理器管理扩展](/docs/extension-package-management)；API 见[插件 SDK](/docs/extension-development)。

## 风险与恢复

语言包只提供字符串，不执行代码或 HTML，但仍可能把按钮翻译成误导性指令。确认作者与内容，不能把数据包或校验通过当作安全保证。主题也可能隐藏控件，Node 插件可能访问用户文件、网络和进程。

恢复时使用原生「视图」菜单中的 `Reset Appearance and Disable Extensions`；这个命令刻意固定为英文，以免被语言插件替换。找不到菜单时，以 `--safe-mode` 启动，回到英文并停用扩展。在英文界面中，「偏好设置」「界面语言」「扩展」分别显示 Preferences、Interface language、Extensions。
