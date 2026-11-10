---
slug: dev-setup
title: 开发环境
group: 开发
order: 10
summary: 从安装依赖到启动应用与官网；按修改范围选择检查，不混用包管理器。
---

## 环境

CI 使用 Node.js 22，具体工具版本以工作流和锁文件为准。桌面使用 npm，官网使用 pnpm。实际 TeX 编译需要 TeX Live 或 MacTeX，以及 latexmk、选用的引擎和 synctex。没有 TeX 不影响阅读源码和构建界面，但不能宣称编译链路已验证。

## 启动桌面应用

在仓库根目录执行：

```sh
npm ci
npm run dev
```

Vite 提供渲染界面，Electron 提供本机服务。修改 electron 目录后重启开发进程。生产界面构建为 `npm run build`，启动为 `npm start`。

## 启动官网

```sh
cd product-page
pnpm install --frozen-lockfile
pnpm dev
```

站点独立于桌面打包。生成内容由 Vite 的 contentFiles 插件自动维护；不要编辑 dist 或手改 llms、feed 等输出。

## 常见问题

| 现象 | 检查 |
| --- | --- |
| Electron 白屏 | Vite 地址、终端错误和 dist 入口；不要关闭安全隔离规避问题 |
| 编译找不到程序 | 本机 TeX 安装、引擎和 GUI 进程的 PATH |
| 主文件不明确 | 工程的 rootFile 配置及 documentclass 候选；不要以当前标签替代 |
| 主进程修改没生效 | 重启 Electron；渲染热更新不包含原生服务 |
| 安装包缺模块 | asarUnpack、发布资源清单与包外 Node 依赖 |

## 继续开发

先读仓库 AGENTS.md、PRODUCT.md、DESIGN.md 和 docs/README.md。模块关系见[架构与信任边界](/docs/dev-arch)，验证选择见[测试与冒烟](/docs/dev-testing)，接手步骤见[新会话接手](/docs/dev-handoff)。

代码约定：渲染层 TypeScript／ES modules；原生服务主要是 cjs，MCP 入口及共享纯模块允许 mjs。不要把整个 electron 或 mcp 目录都当作 CommonJS。界面文案与中英文一起维护。
