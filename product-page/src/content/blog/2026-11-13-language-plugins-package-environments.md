---
title: "让语言成为插件，让 npm／Yarn 管理扩展版本"
date: 2026-11-13
summary: 简体中文拆为同源预装语言插件，SDK 与 qwertysay 迁移到 @texpro，包管理器通过逐项审核同步安装与卸载，开发 Skill 加入发行资产。
tags: [插件, i18n, SDK, qwertysay, 发布]
author: Baolin Liu
---

## 语言插件保持安静

桌面保留英文恢复语言，简体中文从内置词典提取为声明式 `.tpp`，唯一维护源位于 packages/extension-translate-zh-cn/language。应用预装它，npm 分发名为 @texpro/extension-translate-zh-cn，归档由相同源码生成。官网自身的语言与任务文档继续独立维护。

语言贡献只有 JSON 字符串和语言自称，没有入口、权限或样式。SDK 共用校验拒绝错误变量、危险键和越界路径；缺译逐项回退英文。停用、卸载当前语言或包损坏时回到英文，不改正文与撤销。原生菜单也使用同一受检词典；恢复命令刻意固定英文，避免语言插件改写恢复入口。

这属于 L0 基础能力，配置仍在已有偏好设置。两种语言时保持一个目标语言按钮，更多语言才出现选择器；安装审核属于已有 L2 扩展面板，没有新的语言管理页面。

功能插件也有自己独立的 i18n 库与词典，清单展示和运行消息分别本地化。每次调用携带当前语言，插件负责区域与缺译回退；自带 JSON 和所选库随 .tpp 构建，不依赖宿主私有词典，不能把业务文案注入宿主语言包。

## 包管理器与宿主各守一个边界

SDK 0.3.0 与 qwertysay 0.4.1 使用 @texpro/extension-sdk 和 @texpro/qwertysay。旧作用域发布记录不会覆盖。脚手架增加语言包模板、缺译统计与 npm／Yarn 选择；最简强调色主题继续只需要清单和 LICENSE。

专用扩展环境用 package.json 与单一锁文件管理版本。npm install／Yarn add 改变依赖，qwertysay sync 把新增或更新交给 TeXPro 逐项审核，安装保持停用；npm uninstall／Yarn remove 后再次同步，才审核卸载宿主副本。卸载默认保留插件数据，不能接管手动安装或其他环境拥有的记录。

分发包通过 texpro.package 指向唯一 .tpp／.tpt。单独下载路径只读取公开 npm 元数据与归档，检查 SHA-512、身份与实际内容，不安装 wrapper 依赖或运行生命周期脚本。环境方式也配置禁用脚本；这不等于给 npm、Yarn 或已启用的 Node 插件建立沙箱。主题能隐藏控件，语言包能误导指引，摘要不能证明作者可信。

## Skill 随版本交付

正式版与 Nightly 的共用构建开始生成版本化 .skill ZIP，包含整个 texpro-extension-development 目录及引用资源。发布前逐文件比对受测源码，拒绝私有文件、符号链接及缺失引用。它是 AI 开发说明归档，不是 TeXPro 插件；文件名使用应用版本，npm 包版本保持独立。

## 验证与边界

修改前完整基线为 137 项，第一轮实现后为 147 项，均零失败、零跳过、零 TODO。最终补齐独立插件 i18n、参数重排与发行必需模块测试后，完整基线为 151 项，同样零失败、零跳过、零 TODO。另验声明式安装、启停、重启、占位符、坏包、环境所有权、锁文件变化、卸载保留数据与 Skill 正式／Nightly 归档。本机已通过实际 npm tarball 独立安装、npm／Yarn 的真实安装与卸载同步、原生语言／主题 UI、九种插件语言及七种主题样式的真实编译、实际 macOS ASAR 和包外普通 Node 的 MCP。系统级验收发现 Electron 会重排第二实例参数，改用单参数路径并在宿主兼容旧写法；qwertysay 0.4.1 保留此前版本，修复转交行为。跨平台打包和线上部署分别核对，不把本机验收写成三平台原生验收。

v0.1.0 的公开安装包早于这项更新，需要后续包含该能力的桌面构建。现代 Yarn 使用 node_modules，暂不承诺 PnP；不存在后台同步或公开插件市场。详细操作见[语言包教程](/docs/language-packs)、[包管理器管理扩展](/docs/extension-package-management)与[开发 Skill](/docs/extension-skill)。
