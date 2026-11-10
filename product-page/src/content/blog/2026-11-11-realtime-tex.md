---
title: 未保存的这一句，也可以先排出来
date: 2026-11-11
summary: 将独立的 rtex-ts 接入 TeXPro：普通段落先更新，完整布局随后校正，正式 PDF 继续走原有构建链。
tags: 实时预览, LuaLaTeX, rtex-ts, 连续写作
author: TeXPro 开发记录
version: 0.1.0
---

## 把排版反馈放回写作旁边

这轮在现有 PDF 侧栏加入实验性的实时 TeX 预览，默认关闭。设置里开启后，未保存的正文与行内数学可以先由持久 LuaLaTeX 排出段落，再由后台快照校正分页和引用。第一次准备上下文时仍需等待，复杂环境与未知宏也可能直接等待完整布局。

实时预览接收编辑器缓冲区，不要求每次输入都保存文件。组合输入期间延后同步；结果更新不改 CodeMirror 文档、撤销历史或当前写作焦点。子文件继续属于原来的工程主文件，不因当前标签页变化而更换编译入口。

## 独立包与桌面宿主各自负责什么

实现使用独立发布的 [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts)。这是 TypeScript 适配，不需要 VS Code、插件或 Rust 程序；本机仍需 LuaLaTeX、宏包和字体。TeXPro 把会话放进 Node worker，经受限 IPC 同步缓冲区。主进程合并连续输入，只在上一批确认后发送最新内容，避免把过时输入排成长队。

字形由实际 TeX 字体的轮廓绘制，避免让浏览器重新塑形、改变行宽。无法准确表达的字体、颜色命令、矩阵或 PDF 绘制操作使用对应的完整 PDF 页面。验证时发现，部分上游页面颜色记录缺少操作类型；宿主保留 PDF 回退，不猜测其绘制语义。

实时画面没有正式 PDF 的搜索、文本层和 SyncTeX。侧栏可以切回「编译后的 PDF」，手动编译仍保存相关内容并执行原有构建动作。实时模式运行时暂停重复的普通自动编译；文献、索引和最终投稿仍依赖完整构建链。

## 关闭会话也属于功能的一部分

工程、会话和修订身份共同隔离旧结果。关闭预览、切换模式、重载窗口或退出工程时，先结束所属 TeX 进程，再停止 worker，尝试删除会话自己的缓存目录。POSIX 使用进程组，Windows 使用进程树终止；路径校验包含真实路径和符号链接边界。

安装包将 worker、rtex-ts 的 Lua/TeX 支持文件和字体绘制依赖保留在 ASAR 外，发行核验检查依赖及上游 manifest 哈希。原生验收也发现了生产 CSP 对 SVG Blob 图片的拦截，本轮补齐了图片许可，继续保留脚本与 Node 隔离边界。

## 说明来源与验证范围

rtex-ts 高度参考 [Henry Yang 的 realtime-tex](https://github.com/HenryXiaoYang/realtime-tex)，原样保留其 Lua/TeX 支持文件、MIT 许可和版权声明，基点为 `fcff7a5c7f33a288ecf40db886843754c62bbdfd`。研究灵感来自 Clemens Lode 的 [TUG 2026 论文](https://www.tug.org/tug2026/preprints/lode-realtime.pdf)。这是独立适配，不能称为官方移植，也不能把上游毫秒级指标当成 TeXPro 的实测结果。

验证分为源码回归、真实 LuaLaTeX 会话、原生界面和实际 ASAR 包内启动。真实会话覆盖中文与数学字形、未保存更新、PDF 快照和进程清理；界面流程检查输入、撤销、焦点、主题、语言及模式切换。合成 composition 事件仅验证同步门控，不代替操作系统输入法候选窗的手工验收。

独立包的 Linux、macOS、Windows 单元与安装包检查，以及 Linux 真实 TeX CI 已通过；本轮 TeXPro 原生与目录包验证在 macOS 进行。Windows 真实 TeX、MiKTeX 和三平台完整安装流程仍需分别验收。实时预览执行本机文档代码，不是沙箱，也不增加云端文档服务。

开启步骤与限制见[实时 TeX 预览](/docs/realtime-tex)，宿主嵌入与版权分发见仓库的 `docs/realtime-tex.md` 和 `THIRD_PARTY_NOTICES.md`。中英文使用文档与桌面文案随本轮实现同步维护。
