---
slug: dev-renderer
title: 渲染层
group: 开发
order: 12
summary: 没有路由也没有状态库：一个 App.tsx 编排全部状态，编辑器是 CodeMirror 6，可视层靠 decoration 投影，工作室面板按需懒加载。读代码先认这四层。
---

## 这一层是什么

渲染层是一个单页 React 应用，入口 `src/main.tsx`，挂载 `src/App.tsx`。没有 router，没有 Redux 或 Zustand，也没有数据请求层——所有跨组件状态都在 `App.tsx` 里用 `useState` 与 `useRef` 编排，所有与磁盘、编译、Git 的交互都经 `window.texpro` 走 IPC。

界面分四块：左侧 `components/Sidebar.tsx`（文件树、符号、搜索），中间 `editor/EditorPane.tsx`（CodeMirror），右侧 `components/PdfPane.tsx`（PDF.js），以及 29 个按需打开的工作室面板。主题与排版全在 `src/styles/app.css`。

## 文件表

| 文件 | 行数 | 作用 |
| --- | --- | --- |
| `src/App.tsx` | 2846 | 顶层状态、副作用、编译与关闭编排、快捷键 |
| `src/editor/EditorPane.tsx` | 939 | CodeMirror 实例、每文件 EditorState 缓存、变更回灌 |
| `src/editor/visual.ts` | 1174 | 可视层 decoration：公式、表格、TikZ、乐谱、章节 |
| `src/components/PdfPane.tsx` | 885 | PDF.js 渲染、缩放、反向定位 |
| `src/components/Sidebar.tsx` | 721 | 文件树、素材、符号、搜索 |
| `src/i18n.ts` | 1845 | 以英文源串为 key 的中英词典 |
| `src/app/lazyTools.tsx` | 70 | 29 个工作室的延迟加载与崩溃隔离 |
| `src/styles/app.css` | 9602 | 三套主题、编辑器与面板样式 |

`src/lib/` 另有 36 个纯逻辑模块（latex、pdfSync、lineDiff、templates、importers 等），不依赖 React，可以直接被 `node --test` 覆盖。

## 并发：用代数丢弃迟到的结果

同一时刻可能发生「切工程」「重新编译」「正查」「反查」「重新打开同一文件」，这些异步结果回来时上下文可能已经不成立。做法是给每类操作一个自增 ref，`await` 之后比对：

```ts
const run = ++compileRunId.current;
const result = await window.texpro.compile({ ...args });
if (run !== compileRunId.current) return;        // 这一轮已经过期
if (generation !== projectGeneration.current) return;
```

每个异步域一个自增 ref：`compileRunId` 管编译，`projectGeneration` 管工程切换，`syncGeneration` 与 `inverseGeneration` 分别管 SyncTeX 两个方向，`navigationGeneration` 管大纲与搜索跳转，`openRequest` 管同一文件的重复打开。新增异步流程时照抄这个模式，不要用「取消标志」或裸 `setState`。

## 保存队列

写盘是串行的。`src/app/saveQueue.ts` 的 `SaveQueue` 注释写得很直白：让旧写入不可能晚于新写入完成。`saveDoc()` 先等飞行中的文件操作，用 `movedPath` 重写路径，再进队列：

```ts
await fileOperation.current;                     // 等移动/重命名落定
const target = movedPath(path, operation);
await saveQueue.current.run(() => window.texpro.writeFile(target, content));
```

`saveAll()` 最多循环 5 轮收集脏文档，最后 `await saveQueue.current.idle()` 再复查一遍。关闭窗口、切工程、编译前都调它——任何绕过队列直接写盘的新代码都会重新引入「旧内容覆盖新内容」的问题。

## 编译器在这里只做编排

`runCompile()` 的顺序值得记住：忙时把请求放进 `pendingCompile`；生成 `run-<timestamp>` 的 runId；先 `saveAll()`；再 `openProject(root)` 重读主文件配置（主文件变化就清空 PDF、诊断、热点并递增代数）；然后发 `compile`；结果回写前校验工程代数与 runId 都还对得上。

编译输出是流式的，`onCompileOutput` 按 `output.runId === compileRunId.current` 过滤，`stream === 'meta'` 单独处理，日志只保留最后 90000 字符。窗口关闭后主进程会跳过 `sender.send`，渲染层这边则靠代数丢弃。

## 编辑器：五个 Compartment

`EditorPane` 不重建 EditorState，运行时切换靠 `Compartment.reconfigure()`：

| Compartment | 切换什么 |
| --- | --- |
| `visual` | 可视层 decoration 与源码模式的互斥 |
| `focus` | 当前段落聚焦、其余淡化 |
| `typewriter` | 打字机滚动 |
| `lineNumbers` | 行号槽 |
| `collab` | Yjs 协作扩展 |

扩展清单里比较关键的是：`history`、`writingTargets`、`stableViewport`、`writingReview`、`bracketMatching`、`closeBrackets`、`autocompletion`（覆盖自定义补全源，`maxRenderedOptions: 80`，`defaultKeymap: false`）、`foldGutter`。keymap 里 `Mod-z` / `Mod-Shift-z` / `Mod-y` 不走 CodeMirror 历史，而是回调 `onProjectHistory` 做工程级撤销；Tab 只在 `!view.composing` 时接受补全；`ArrowUp` / `ArrowDown` 走 `moveLogicalLine`，保证跨过可视块时光标按逻辑行移动。

每个文件的 `EditorState` 存在 `sessions: Map` 里，切回来时若 `cached.state.doc.toString() === props.value` 就复用，连同滚动位置一起恢复；内容对不上则重新 `EditorState.create()`。切工程时 `App` 直接把整张 Map 换掉，不逐项清理。

## 可视层：一次扫描，先到先得

`visual.ts` 的 `buildDecorations()` 每次文档或选区变化都全量重扫，用一个 `occupied` 区间表保证同一位置只有一个 decoration。扫描顺序是固定的（从上到下），新块级元素插在哪里决定了它会不会被前面的块吞掉：

- 乐谱块（`musicWidget`）
- 表格（`writingTable` / `tableWidget`）
- 标题行
- 行内与行间公式，含 `equation`、`align`、`gather`、`multline`、`eqnarray`
- 图、表、代码块
- 标签与引用
- 收尾（章节徽标、写作目标等）

公式渲染走 KaTeX，参数是 `throwOnError: true`、`strict: 'ignore'`、`trust: false`、`maxExpand: 500`，另加 `\R`、`\N`、`\Z`、`\C`、`\dd` 五个宏。渲染结果进 `mathHtmlCache`，key 是 `d:` 或 `i:` 加 TeX 源，超过 800 条按 LRU 淘汰。渲染失败返回空字符串，界面上回退成源码。

可视块点一下能回源码：`LatexWidget` 的 `bind()` 拦截 mousedown，把光标放到块首。TikZ 与图示预览额外走 `tikzRequests` 去重，再用 `rasterizeTexPdf` 拿图。

## 懒加载与崩溃隔离

`src/app/lazyTools.tsx` 的 `deferredTool()` 做三件事：没打开过就 `return null`（连 `import()` 都不发）；首次打开才 `lazy(load)`；外层 `RecoveryBoundary` 接住渲染异常，只让这一个面板失败。`generation` 作为 key，可以在不刷新整页的情况下重建某个面板。

新增面板的路径：`lazyTools.tsx` 注册 → `components/` 写面板 → `app.css` 加区块 → `i18n.ts` 补中英。面板只在用户主动打开时才加载，别在 `App.tsx` 顶层静态 `import`。

## 改动指南

新增一个可视元素：在 `visual.ts` 里定区间与 `WidgetType`，插进 `buildDecorations()` 合适的位置，确认 `overlaps()` 逻辑覆盖它，再补 `theme.ts` 里的样式。别在 `EditorPane` 里另起一个 ViewPlugin 做同类事。

新增一个设置项：在 `src/app/settings.ts` 的 `defaultSettings` 加默认值，`loadSettings` 里处理旧值迁移，再接到 `App.tsx` 的状态与界面上。持久化 key 是 `texpro.settings.v1`，`aiApiKey` 会被主动剔除，不进 localStorage。

新增一个异步流程：先想清楚它属于哪一代，拿对应 ref 的当前值，回来时比对；涉及写盘的先进 `SaveQueue`。

## 陷阱

- 直接 `setState` 一个 `await` 的结果：不校验代数，切工程后旧数据会写进新视图
- 手动改 `EditorState` 的 doc 而不走 `textChange` 差分：整篇替换会让光标跳到文档头
- 在 decoration 里做重计算：`buildDecorations` 每次输入都跑，重活要放缓存或挪到主进程
- 在面板里静态 import 重依赖（PDF.js、KaTeX）：会把主包撑大，懒加载失效

## 验证

```bash
npm run typecheck
npm run build && npm run smoke
```

冒烟会走一遍真实交互并截图到 `artifacts/`，可视层改动的效果直接看 `smoke-*.png`。测试矩阵见 `/docs/dev-testing`，编辑器与主进程的边界见 `/docs/dev-arch`。
