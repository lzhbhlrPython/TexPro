---
slug: dev-arch
title: 架构与信任边界
group: 开发
order: 11
summary: 按主进程、preload、渲染层与外部 MCP 理解文件、编译和发布边界。
---

## 进程边界

| 层 | 源码 | 职责 |
| --- | --- | --- |
| 主进程 | electron/main.cjs、electron/services/ | 文件、编译、窗口、系统能力与参数校验 |
| 桥接 | electron/preload.cjs | 明确的 IPC 包装与订阅清理 |
| 渲染层 | src/App.tsx、src/editor/、src/components/ | 写作状态、投影、交互与反馈 |
| 类型 | src/api.ts、src/types.ts | API 契约与共享数据 |
| 外部 MCP | mcp/server.mjs | 普通 Node stdio 服务，只访问磁盘内容 |

保持 contextIsolation 开启、nodeIntegration 关闭。渲染层不能直接调用 Node。当前 Electron sandbox 配置不代表完整沙箱；路径、参数、sender、协议和外部命令仍需独立校验。

## 工程与文件

project-root.cjs 统一解析主文件：显式 rootFile 优先，否则只接受唯一未注释的 documentclass 候选。配置失效和歧义不静默回退。当前标签页不改变编译入口。

project-files.cjs 提供文件边界；project-operations.cjs 协调路径引用修改与失败回滚；src/app/fileOperations.ts 同步打开缓冲区，避免之后保存覆盖新路径。这里不是断电事务保证。

## 新增能力

新增 IPC 同步检查 main handler、preload 包装、src/api.ts 和 src/types.ts；检查真实路径、输入、sender 和关闭后的回写。handler 数量不是正确性证明，不能只靠两边数量相同判断接口一致。

新增外部 Node 使用的服务时，核对 package.json 的 asarUnpack、scripts/verify-release.cjs 及实际包外启动。MCP stdout 只放协议，日志写 stderr；未保存编辑器内容不会自动出现在外部 MCP 中。

## 关闭与退出

window-close.cjs 与渲染层协商保存，确认失败保持窗口。保存与清理完成后才能退出。macOS 的 quit-watchdog.cjs 只在不可取消 quit 后武装，是原生收尾停留的兜底，不代替保存，也不用于普通关窗。

## 网络与权限

AI、备份、局域网协作、MCP 客户端和本地只读 API 各有不同信任边界。可选联网不意味着项目自动上传；不能以本地优先宣称所有功能永不联网。CSP、协议与允许路径的真实配置见 main.cjs，变更时按功能核对，不复制旧策略字符串当作现状。

## 验证

```sh
npm run typecheck
npm run test:regression
npm run build
npm run verify:release
```

涉及 MCP 时补跑 `npm run test:mcp`；涉及保存与关闭时补跑对应原生回归。详细不变量见仓库 docs/technical-contracts.md，发布见[构建与发布](/docs/dev-release)。
