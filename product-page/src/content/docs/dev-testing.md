---
slug: dev-testing
title: 测试与冒烟
group: 开发
order: 13
summary: 按风险选择类型、源码回归、真实编译、原生交互与发布检查；报告实际结果和跳过项。
---

## 按改动选择验证

| 范围 | 命令 |
| --- | --- |
| 桌面类型与构建 | npm run typecheck、npm run build |
| 源码与服务回归 | npm run test:regression |
| 实际 TeX 编译 | npm run test:compile |
| 写作交互 | npm run test:flow:ui、test:continuity:ui、test:writing:ui |
| 占位符与备忘 | npm run test:aids:ui |
| 乐谱 | npm run test:music、test:music:ui |
| 素材与导入 | npm run test:assets:ui、test:import |
| 外部 MCP | npm run test:mcp |
| 发布资源 | npm run verify:release，及实际安装包检查 |
| 官网 | pnpm check:layout、pnpm typecheck、pnpm build |

表中省略前缀的桌面脚本同样使用 `npm run`。实际脚本以根 package.json 和产品页 package.json 为准，不把表中数量作为覆盖率。

## 源码回归

tests 下使用 node:test 和 node:assert。按故障选文件，例如主文件判定、PDF 坐标、保存顺序、乐谱、写作辅助和 Nightly 版本同步。文件名与数量会变化，直接查看 tests 目录。

测试不需要 Electron UI，但部分需要 TeX、Git、子进程或临时目录。报告缺失依赖和跳过项；不要声称所有用例都是无需系统依赖的纯函数测试。

## 原生交互

先构建再运行对应界面脚本。测试使用临时工程与用户目录，不修改日常文档。检查焦点、IME、撤销、滚动、工程切换、保存和真正的进程退出；超时与崩溃不能当通过。

## 官网内容

只写文档时版式检查应前后一致，不运行 layout:update 掩盖差异。构建会重新生成机器可读文档和 feed；检查中英文同 slug、链接和 Pages 子路径。页面壳层改变时再验窄屏、主题、键盘与 reduced motion。

## 如何报告

写出运行命令、通过和失败、跳过原因、实际编译引擎与平台。静态检查、原生交互、安装包验证和线上 Actions 是不同证据。文档整理不需要为没有变化的桌面业务重跑全部交互。
