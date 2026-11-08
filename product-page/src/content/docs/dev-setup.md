---
slug: dev-setup
title: 开发环境
group: 开发
order: 10
summary: 单仓库、两套运行时：渲染层由 Vite 打包成 ES 模块，主进程与服务层是直接跑的 CommonJS。装好 Node 22 与 npm 就能起界面，TeX 只在编译和预览时才需要。
---

## 这一层是什么

`npm run dev` 起的是两个进程，不是一个进程里的两段代码。Vite 只服务渲染层；`electron .` 加载 `electron/main.cjs`，再由它开窗口、挂菜单、注册 IPC 与服务层。生产路径换成了另一条：`npm run build` 把渲染层产出到 `dist/`，主进程用 `loadFile` 读它。

两条路径的唯一开关是 `VITE_DEV_SERVER_URL`。`electron/main.cjs:15` 用 `Boolean(process.env.VITE_DEV_SERVER_URL)` 判定 dev 模式，同时决定是否开 DevTools、CSP 由谁提供、`texpro-asset` 协议的 CORS 头写什么。

## 前置条件

| 依赖 | 版本 | 说明 |
| --- | --- | --- |
| Node.js | 22 | 仓库没有 `engines` 字段，CI 固定 `node-version: 22`，本地建议与 CI 一致 |
| npm | 随 Node 附带 | 提交的是 `package-lock.json` |
| TeX 发行版 | TeX Live 或 MacTeX，需 `latexmk` 与至少一个引擎 | 编译、SyncTeX 正反查、模板预览需要 |
| 系统 | macOS 13+ / Windows 10+ / Linux | 冒烟与打包在 macOS 上验证最完整 |

TeX 的路径不写死：`electron/services/tex.cjs` 的 `resolveTexBinary` 在运行时探测发行版与引擎，换安装位置不需要改代码。

## 第一次启动

```bash
npm install
npm run dev
```

`dev` 展开后是这条命令：

```bash
concurrently -k -n VITE,ELECTRON -c cyan,magenta \
  "vite --host 127.0.0.1" \
  "wait-on tcp:5173 && cross-env VITE_DEV_SERVER_URL=http://127.0.0.1:5173 electron ."
```

三个细节值得先知道：Vite 配置了 `strictPort: true`，5173 被占用时直接失败而不是换端口；`wait-on tcp:5173` 保证 Electron 不会先于 dev server 启动；`-k` 让任一侧退出时另一侧跟着结束。渲染层改动走 HMR，`electron/` 下任何文件的改动都要重启。

## 常用脚本

| 脚本 | 实际命令 | 用途 |
| --- | --- | --- |
| `npm run typecheck` | `tsc --noEmit` | 全仓类型检查，strict |
| `npm run build` | `vite build` | 产出 `dist/`，生产 CSP 在这一步注入 |
| `npm start` | `npm run build && electron .` | 跑生产构建 |
| `npm run smoke` | `npm run build && cross-env TEXPRO_SMOKE=1 electron .` | 自动跑一遍界面，截图进 `artifacts/` |
| `npm run smoke:welcome` | 再加 `TEXPRO_SMOKE_WELCOME=1` | 只跑欢迎页场景 |
| `npm run test:regression` | `node --test tests/*.test.cjs` | 单元测试，13 个文件 80 条用例 |
| `npm run test:ui` | `node scripts/test-ui.cjs` | 拉起真 Electron 跑界面回归 |

`test:ui` 与 `test:flow:ui` 都不跑 build，跑之前先 `npm run build`。完整矩阵见 `/docs/dev-testing`。

## 环境变量

冒烟与回归全靠环境变量切换，读代码时先认这组：

| 变量 | 作用 |
| --- | --- |
| `VITE_DEV_SERVER_URL` | 有值就 loadURL 并开 DevTools；无值就 loadFile `dist/index.html` |
| `TEXPRO_SMOKE=1` | 进入冒烟模式：加 Chromium 降级开关，挂载 `electron/smoke.cjs` |
| `TEXPRO_SMOKE_WELCOME=1` | 只跑欢迎页，配合 `smoke:welcome` |
| `TEXPRO_USER_DATA` | 覆盖 userData，测试用临时目录隔离 |
| `TEXPRO_ARTIFACTS` | 截图目录，默认仓库根 `artifacts/` |
| `TEXPRO_EXIT_REPORT` | 退出报告 JSON，供 `scripts/test-ui.cjs` 判定是否正常退出 |
| `TEXPRO_PERF=1` | 冒烟里额外做一次性能采样 |

回归脚本的选择是互斥的，`electron/main.cjs:371-380` 按固定顺序取第一个命中：`TEXPRO_FLOW_REGRESSION`、`TEXPRO_CONTINUITY_REGRESSION`、`TEXPRO_ASSETS_REGRESSION`、`TEXPRO_WRITING_REGRESSION`、`TEXPRO_MUSIC_REGRESSION`、`TEXPRO_REGRESSION`，都没有才落到默认冒烟。

## 目录地图

| 目录 | 内容 |
| --- | --- |
| `src/` | 渲染层：`App.tsx` 编排、`editor/` 17 个文件、`components/`、`lib/` 36 个模块、`app/lazyTools.tsx` |
| `electron/` | 主进程 `main.cjs`、`preload.cjs`，`services/` 11 个服务，冒烟与回归脚本 |
| `mcp/` | 独立 stdio MCP server，`server.mjs` 409 行 |
| `scripts/` | 集成测试、UI 回归、发布校验、nightly 版本，共 12 个脚本 |
| `tests/` | `node --test` 用例与 helper |
| `demo/` | 演示工程，冒烟默认打开它 |
| `docs/` | 架构、可靠性、交互审计等说明 |
| `artifacts/` | 截图产物，不进包 |

## 没有 TeX 的机器

界面、编辑器、可视层、导入导出、版本历史都不依赖本机 TeX，可以正常开发与调试。会失败的是编译、SyncTeX 双向定位、模板预览与 PDF 字体覆盖检查——这些请求在服务层返回结构化错误，界面上表现为提示而不是崩溃。

写测试时注意：涉及编译的用例应当能跳过而不是硬失败。`tests/` 里已有这类条件分支的写法，照着来。

## 代码约定

- TypeScript `strict` 全程打开，新增代码不引入 `any` 逃逸
- 界面文案走 `src/i18n.ts`，以英文源串为 key，中英两份都要补
- 图标只用 `lucide-react`，不引入第二套图标库
- 不引状态管理库，全局状态在 `App.tsx` 编排，纯逻辑下沉到 `src/lib/`
- `electron/` 与 `mcp/` 是 CommonJS，不要在里面写 ESM 语法
- `dist/` 是产物，不手改；样式改动落在 `src/styles/`

## 常见问题

- **5173 起不来**：`strictPort` 下不会自动换端口，先看是谁占了 5173
- **Electron 白屏**：既没注入 `VITE_DEV_SERVER_URL`，也没 build 出 `dist/index.html`
- **编译按钮不可用**：主文件未确定，看 `Project.rootSource` 是 `ambiguous` 还是 `missing`
- **原生依赖装不上**：`@napi-rs/canvas` 是可选依赖，`files` 里已被排除，缺了不影响主流程
- **改了主进程没反应**：`electron/` 下没有热更新，重启 `npm run dev`
- **打包后才出现的路径错误**：运行时需要按路径加载的模块必须在 `asarUnpack` 里，漏一项就是装出来的包报模块找不到，见 `/docs/dev-release`

## 验证命令

```bash
npm run typecheck
npm run test:regression
npm run build && npm run smoke
```

三条都过再提交。改到界面时，按 `/docs/dev-testing` 里的对照表补跑对应的 UI 回归。
