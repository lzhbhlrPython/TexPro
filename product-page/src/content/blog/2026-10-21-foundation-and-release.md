---
title: 从可视 LaTeX 工作台到可交付应用
date: 2026-10-21
summary: 开发回顾 01：建立源文件、编译、协作与打包的基础，再处理跨平台发布的现实问题。
tags: 架构, 发布
author: TeXPro 开发记录
version: 0.1.0
---

## 写作工具的第一条底线

这组开发日志按仓库提交和保留的开发记录回溯。它记录 TeXPro 本体的实现过程，不把讨论中的设想写成已经交付的能力，也不把一次本地验证扩大为所有平台的保证。

最早的工作台已经把 React、CodeMirror、Electron 与本地 TeX 工具链接在一起：作者编辑普通 `.tex`，行内可视层呈现结构，本地编译得到真正的 PDF，SyncTeX 再把纸面位置带回源码。这个组合确定了后续边界：预览可以辅助写作，源文件必须始终可读、可移交。

随后补入研究工作流、MCP 协作与夜间打包。工具越多，越需要明确哪些动作只是读取，哪些会修改项目。审批约束和协作会话由此进入实现；它们是可选辅助，不应成为写一段正文的前置步骤。

## 安装包也是产品的一部分

macOS 通用架构打包暴露了原生 canvas 依赖的问题。修复从发布依赖入手，排除不需要的原生包，并关闭构建器隐式自动发布，让产物生成和发布时机更明确。后续又增加安装包内容核验，检查入口脚本、PDF worker 和外部 MCP 所需文件是否齐全。

这类修复不改变编辑器截图，却决定作者拿到软件后能不能正常启动、编译和调用工具。工作记录也开始与产品资料分开：私人 AI 工作笔记不进入版本库和发行包。

## 证据与边界

相关实现见[最初工作台](https://github.com/lzhbhlrPython/TexStudioPro/commit/d4ef147)、[研究工作流与打包](https://github.com/lzhbhlrPython/TexStudioPro/commit/84fc73c)、[协作与 MCP](https://github.com/lzhbhlrPython/TexStudioPro/commit/5d26648)、[通用架构构建修复](https://github.com/lzhbhlrPython/TexStudioPro/commit/ca8ef9a)。这些提交说明能力如何进入代码；各平台安装包是否成功，仍应以对应 Actions 运行与实际安装验证为准。
