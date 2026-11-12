# 开发与新会话接手

完整回归基线使用 `npm run test:regression`，要求零失败、零跳过、零 TODO。原生进程测试需要对应运行权限；环境不满足时补齐条件重跑整套，不将跳过或定向补跑报告为完整基线通过。Windows 验证平台适用的退出行为，macOS/Linux 执行原生父进程检查。

## 最小上下文

先读 [文档导航](README.md)、根 `AGENTS.md`、`PRODUCT.md` 和 `DESIGN.md`。开始工作先运行：

```sh
git status --short --branch
git log -5 --oneline
```

同一任务持续复用现有任务分支，不因新消息或新会话重复建分支。通过相应检查后及时本地提交；有已授权远端则及时推送当前任务分支。合并 main 和发版仍需对应授权。

保留现有修改。核对用户这轮目标、允许修改的目录、已完成的提交，以及尚未验证的部分。不要把旧聊天里的设想当成当前任务；ISO 已取消，独立工作室不是普通写作的默认入口。

## 环境与运行

CI 使用 Node.js 22；根目录使用 npm 和 `package-lock.json`。本机 TeX 编译需要 TeX Live／MacTeX 中的 `latexmk`、所选引擎及 `synctex`。编辑器与文档站构建不等于 TeX 编译验证。

```sh
npm ci
npm run dev
```

渲染进程由 Vite 提供，Electron 服务代码修改后需要重启开发进程。没有 TeX 时仍可检查 TypeScript、源码转换和站点；实际编译用例应明确报告依赖不足，不报通过。

官网独立运行：

```sh
cd product-page
pnpm install --frozen-lockfile
pnpm dev
```

官网 pnpm 版本以 `.github/workflows/product-page.yml` 为准，不混用根锁文件。

## 按任务找入口

| 任务 | 先读 |
| --- | --- |
| 保存与缓冲区 | `src/app/saveQueue.ts`、`src/app/fileOperations.ts`、`src/App.tsx` |
| 工程入口与磁盘操作 | `electron/services/project-root.cjs`、`project-operations.cjs`、`project-files.cjs` |
| 可视编辑、智能格式与选择 | `src/editor/EditorPane.tsx`、`visual.ts`、`smartInput.ts`、`writingTargets.ts` |
| 位置恢复、修订与诊断 | `src/editor/writingSession.ts`、`writingReview.ts`、`writingFeedback.ts` |
| 实时预览 | `docs/realtime-tex.md`、`electron/services/realtime-tex.cjs`、`src/hooks/useRealtimePreview.ts`、`src/components/PdfPane.tsx`、`electron/services/tex-engine.mjs` |
| 编译与同步 | `electron/services/tex.cjs`、`src/components/PdfPane.tsx`、`src/lib/pdfSync.ts` |
| 占位符和备忘 | `electron/services/writing-aids-core.mjs`、`writing-aids.cjs`、`src/lib/writingAids.ts` |
| 窗口关闭与退出 | `electron/window-close.cjs`、`quit-watchdog.cjs`、`electron/main.cjs` |
| IPC 与类型 | `electron/main.cjs`、`electron/preload.cjs`、`src/api.ts`、`src/types.ts` |
| 新 UI 与主题 | `src/styles/`、`src/editor/theme.ts`、`src/i18n.ts`、`DESIGN.md` |
| 官网文档与解析 | `product-page/src/content/docs/`、`src/lib/markdown.ts` |

表中同一目录内的短文件名沿用所在行第一个完整路径的目录。具体接口看源码，不依赖固定行号。

## 验证矩阵

| 改动 | 验证 |
| --- | --- |
| 桌面业务代码 | `npm run typecheck`、`npm run test:regression`、`npm run build` |
| 写作交互 | 对应 `test:flow:ui`、`test:continuity:ui`、`test:writing:ui` |
| 占位符、中文排版、备忘 | `test:aids:ui` 及实际 TeX 编译 |
| 乐谱、素材、导入、MCP | 对应 `test:music`、`test:assets:ui`、`test:import`、`test:mcp` |
| 实时 LuaLaTeX 预览 | `test:realtime`、`test:realtime:ui`；需要真实 LuaLaTeX、CTeX/Fandol 和 unicode-math |
| 打包依赖 | `npm run verify:release`；发布前检查实际 ASAR 和安装后的应用 |
| 官网内容 | `pnpm check:layout`、`pnpm typecheck`、`pnpm build` |
| 官网壳层 | 加验桌面、窄屏、键盘、主题及 Pages 子路径 |
| 纯仓库文档 | 核对命令、链接、源码入口和事实，不重跑无关桌面交互 |

`node --test` 不需要 Electron UI，但部分用例可能调用本机工具或子进程。记录实际通过、失败、跳过和依赖；不要承诺固定耗时或把输出成功等同于运行完成。

## 交接内容

交付注明修改目标、变更文件、为什么这样处理、验证命令及结果、未覆盖的平台或风险、当前分支与提交状态。长久约束写入相应规范；临时计划和 superpowers 记录留在忽略目录。提交、推送、合并与发布是四种不同状态，按已有授权执行。

完整基线要求 pdfLaTeX、XeLaTeX 和 LuaLaTeX 可用；缺少引擎直接失败，不以诊断后继续代替验收。中文编译使用隔离的临时字体缓存，LuaLaTeX 冷数据库初始化允许最多 180 秒；其他编译仍有 45 秒上限。这是测试环境准备边界，不是写作渲染性能指标。

## 扩展作者编译矩阵

多语言作者工具另有 `npm run test:extensions:authoring -- --tools /absolute/compiler-prefix`，可在末尾指定单项如 `plugin-elm` 或 `theme-tcss`。默认运行九种插件语言与七种主题样式，缺失编译器直接失败，无跳过分支。`compiler-prefix/node_modules` 需安装脚手架模板声明的 Node 编译器依赖；Java、sbt、匹配版本的 Go／GopherJS 和 tcss 在 PATH 中准备。矩阵明确为临时 Go 工程执行 `go mod tidy`，不会安装全局工具。失败保留临时工程路径，成功清理。

测试使用公开 SDK 文件、实际编译器、`.tpp`／`.tpt` 归档和隔离宿主，补充完整零跳过回归。不要把仅生成模板、直接执行手写 JS 或缺少工具的失败写成语言支持已验收。工具链版本、源码与安装后缀、JSON 桥接、版权和本机平台边界见[多语言构建](extension-authoring.md)。独立源码检查不等于 npm 发布或应用打包。
