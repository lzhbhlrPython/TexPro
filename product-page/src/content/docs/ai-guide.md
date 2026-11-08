---
slug: ai-guide
title: 给 AI 的二次开发指南
group: AI 协作
order: 16
summary: 让模型在这个仓库里改代码，需要给它三样东西：能改的边界、不能动的约束、改完怎么验证。这一页就是这三样东西本身。
---

## 为什么单开一页

TeXPro 的代码量不大，但耦合点很集中：`App.tsx` 编排一切，`tex.cjs` 承担大半服务，可视层在每次按键时重扫全文。这三处一旦被「顺手重构」，功能会静默坏掉——不报错，只是某条链路不再更新。

所以给模型的指令不能只写「实现 X」，还要写清楚「不要碰什么」和「改完怎么证明没坏」。下面按这个顺序展开。

## 先读这四份

| 文件 | 作用 |
| --- | --- |
| `docs/architecture.md` | 模块边界与关键机制（代数、decoration 优先级、SyncTeX 语义） |
| `PRODUCT.md` | 产品定位与硬约束，决定「什么该做、什么不该做」 |
| `README.md` | 功能清单与使用方式，改功能前先确认它已存在 |
| `electron/services/tex.cjs` | 大部分能力的真实实现，从文件末尾的导出表倒着找入口 |

不要从 `App.tsx` 第一行开始读——它是编排层，先知道有哪些服务，再回来看它怎么调。

## 仓库地图

| 路径 | 内容 | 改动频率 |
| --- | --- | --- |
| `electron/main.cjs` | 窗口、菜单、87 个 IPC handler、路径闸门 | 中 |
| `electron/preload.cjs` | `contextBridge` 暴露的 90 个方法 | 中 |
| `electron/services/` | 12 个服务：工程、编译、历史、Git、协作、MCP 客户端、Paper API…… | 高 |
| `src/App.tsx` | 状态编排、代数、对话框与面板的挂载 | 高（谨慎） |
| `src/editor/` | CodeMirror 配置、补全、decoration、协作绑定 | 高 |
| `src/components/` | 界面组件与各工作室面板 | 高 |
| `src/i18n.ts` | 全部界面文案，以英文源串为 key | 随功能 |
| `src/styles/app.css` | 全站样式（按注释分区块） | 随功能 |
| `mcp/server.mjs` | 独立 stdio MCP server | 低 |
| `tests/` | `node --test` 用例 | 随服务层 |
| `electron/smoke.cjs` + `scripts/` | 界面冒烟与打包校验 | 随流程 |

## 不能动的约束

- **不做玻璃拟态**：`PRODUCT.md` 明确拒绝过，不要以「更现代」为理由重新引入
- **不加状态库**：跨组件状态留在 `App.tsx`，Redux / Zustand / Jotai 一律不要
- **不加第二套 UI 库**：图标只用 Lucide，组件都用现有面板与原子组件
- **不绕过 preload**：渲染层不能直接读文件、不能用 `require`、不能开 `nodeIntegration`
- **不绕路径闸门**：任何新 IPC 都必须先过 `isAllowed()`，涉及符号链接时用 `realpath` 比对
- **不做破坏性写入**：改写文件前留快照；删除、移动先算影响
- **不留 `any`**：仓库现在零 `any`，新增代码不破例
- **不写死文案**：一切界面文案走 `t()`，中英两份齐全

## 四个必须理解的不变量

### 代数（generation）

每类异步操作有一个自增 ref，`await` 回来后先比对，过期直接丢弃。`runCompile`、`synctexForward`、`synctexInverse`、打开工程、导航都走这一套。

```ts
const run = ++compileRunId.current;
const result = await window.texpro.compile(project.root, file);
if (run !== compileRunId.current) return; // 旧工程的结果，丢掉
setCompileResult(result);
```

新增异步流程时复用同一个模式：**先取号，回来再验号**。不要用 `setTimeout` 掩盖竞态。

### decoration 不重叠

可视层用 `occupied` 区间表保证同一位置只有一个装饰；光标所在区间回退成源码。新增一种可视元素要按优先级插进队列，并处理与表格、公式、TikZ 的嵌套。

缓存只有公式 HTML（LRU 800）与 TikZ 请求去重。整篇重扫是已知的性能债，改动时不要让它变得更贵（例如在里面发起请求）。

### 主文件策略

`configured` 优先于 `detected`；探测不出唯一主文件时标记 `ambiguous`，不要自作主张挑一个。用户手动指定后写入工程配置，之后以配置为准。

### SyncTeX 语义

正向是「源码行 → 页 + 坐标」，反向是「PDF 点 → 文件 + 行」，多处命中时返回列表而不是单点。改动画布坐标前先读 `tests/pdf-sync.test.cjs`。

## 四个常见改动路线

### 新增一条 IPC

```text
electron/main.cjs     ipcMain.handle('thing:do', async (_e, path) => {
                        if (!isAllowed(path)) throw new Error('File is outside the open project');
                        ...
                      })
electron/preload.cjs  thingDo: (path) => ipcRenderer.invoke('thing:do', path)
src/api.ts            thingDo(path: string): Promise<Result>
```

三处通道名必须逐字一致。改完跑一遍通道集合比对（preload 与 main 各 87 个、一一对应），缺一个就是运行时 `undefined`。

### 新增一种可视元素

在 `src/editor/visual.ts` 的 `buildDecorations()` 里加一轮扫描，产出与现有 decoration 同构的区间（带优先级），然后：

- 在 `occupied` 里占位，避免被后面的轮次吞掉
- 光标落入时回退源码
- 渲染结果需要异步（TikZ、乐谱）时走现有的请求去重，不要每次都发

### 新增一个工作室面板

```text
src/components/ThingStudio.tsx      面板本体（用现有原子组件与 token）
src/app/lazyTools.tsx               注册 deferredTool + RecoveryBoundary
src/styles/app.css                  对应注释区块里加类
src/i18n.ts                         中英文案
```

延迟加载是默认：首次打开才 `import()`，关闭后保留状态，崩溃由 `RecoveryBoundary` 隔离。

### 新增一个设置项

四处一起改，少一处就会出现「能改但重启后失效」：

1. `src/types.ts` 的 `Settings` 加字段
2. `src/App.tsx` 的默认值与 `SETTINGS_KEY` 持久化（localStorage）
3. 设置面板里加控件
4. `src/i18n.ts` 中英两份文案

密钥类不要进 localStorage：用 `safeStorage` 加密后走主进程。

## 调试手段

| 目标 | 做法 |
| --- | --- |
| 渲染层问题 | `npm run dev` 后 `Cmd/Ctrl+Shift+I` 打开 DevTools |
| 主进程问题 | 终端里看 stdout / stderr，主进程的 `console.log` 直接在前台可见 |
| IPC 没通 | 先比对三处通道名，再看 `isAllowed` 是否抛了「outside the open project」 |
| 编译不对 | 看 `CompileOutput` 的完整日志，不要只看错误条数 |
| 回归 | `npm run smoke`，截图落在 `artifacts/` |

## 验证清单

```bash
npm run typecheck        # 必须零错误
npm run test:regression  # 68 条用例必须全绿
npm run smoke            # 改到界面时跑，看 artifacts/ 的新截图
```

三条都过了再写改动说明：改了什么、为什么这么改、验证到哪一步。不要用「应该可以」交差。

## 反模式清单

- 直接改 `dist/`——下次构建就被覆盖
- 在渲染层拼文件路径再交给主进程——路径要由主进程解析并校验
- 用 `setTimeout` 掩盖竞态——用代数
- 把整篇文档在 React 与 CodeMirror 之间来回 `setState`——会丢光标，改走 `textChange` 差分
- 为了「顺手」把 `sandbox` 打开——先确认主进程服务层的依赖面
- 一次性重写 `App.tsx` 或 `tex.cjs`——没有测试覆盖的窗口太大，分步改
- 把 i18n 文案写成中文 key——key 是英文源串，中文放在表里

## 可以直接给 AI 的任务模板

```text
范围：只改 <文件/目录>，不要动其它模块。
目标：<一句话说明行为变化>
约束：遵守 PRODUCT.md；不加依赖；i18n 中英齐全；不破坏零 any。
验证：npm run typecheck && npm run test:regression，改到界面再跑 npm run smoke。
输出：改动清单 + 每处改动的原因 + 验证结果。若发现范围外的问题，只汇报不修改。
```

## 交接时怎么描述状态

比「已修复」有用的三句话：

1. **改了哪里**：文件 + 函数，别只写模块名
2. **为什么这样改**：约束或失败现象，让下一个人能判断方案是否仍成立
3. **验证边界**：跑过什么、没跑什么（例如「没在有 TeX 的环境跑冒烟」）

> 这一页本身也适合作为 prompt 的一部分：把「不能动的约束」与「四个不变量」整段贴给模型，比让它自己总结可靠。
