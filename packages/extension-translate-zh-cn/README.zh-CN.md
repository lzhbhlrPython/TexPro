# @texpro/extension-translate-zh-cn

TeXPro 简体中文语言插件，作者 Baolin Liu（gardenialiu），MIT，版本 2.0.0。与应用预装使用同一份声明式翻译源，英文仍为内置恢复语言。npm 分发包通过 texpro.package 声明 dist/texpro.language-zh-cn.tpp，没有运行时依赖或生命周期脚本。

[English](README.md)

通过 qwertysay 引导下载或 npm／yarn 专用扩展环境获取，再交给 TeXPro「扩展」审核。安装与更新保持停用，启用由你确认；已有同摘要预装资源时不会重复安装。卸载中文更新会恢复停用的预装副本，原始预装资源只能停用。

需要包含声明式语言支持的 TeXPro 构建；v0.1.0 早于此契约。缺译回退英文，变量占位符保持不变，翻译按纯文本显示。语言包没有入口、样式或能力，但仍可能用误导文案伪装指引，请核对作者和内容。恢复使用原生固定英文命令 Reset Appearance and Disable Extensions，或 --safe-mode。

见[语言包教程](https://texpro.pyliubaolin.top/docs/language-packs)和[npm／yarn 管理](https://texpro.pyliubaolin.top/docs/extension-package-management)。维护源在 language/，打包前使用 build.cjs 生成发行物，不手改归档。本地构建与 npm 公开发布分别核对。

目录第 2 版使用稳定语义键，需配套宿主、SDK 0.5.0 与 qwertysay 0.6.0。第 1 版正文键包不再兼容；长篇正文按语言维护完整 Markdown，不逐句放入 UI JSON。

本次源码补齐「软件更新」的检查、Nightly 选择、版本、下载和失败重试文案；使用流程见[安装指南](https://texpro.pyliubaolin.top/docs/start)。应用更新检查不更新 npm 语言插件；本地生成不代表 npm 已发布。

应用内下载同时提供「检查后自动下载」、进度、取消、校验错误与「打开文件位置」文案。下载完成后仍须保存退出并手动安装；语言包本身不因此自动更新。
