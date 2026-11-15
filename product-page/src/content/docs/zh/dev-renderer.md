---
slug: dev-renderer
title: 渲染层与连续写作
group: 开发
order: 12
summary: 按编辑状态、源码投影、异步身份与可选面板理解渲染层，不以大文件行数代替架构。
---

## 模块职责

| 入口 | 职责 |
| --- | --- |
| src/App.tsx、src/app/ | 工程、缓冲区、保存队列、编译和关闭编排 |
| src/editor/EditorPane.tsx | CodeMirror 实例、每文件会话与输入回写 |
| src/editor/visual.ts | 公式、表格、标题、图示等源码投影 |
| src/editor/writingTargets.ts | 辅助操作的源范围映射与失效保护 |
| src/editor/writingSession.ts | 编辑状态与位置恢复 |
| src/components/PdfPane.tsx | PDF.js 阅读与双向定位 |
| src/app/lazyTools.tsx | 可选辅助工具的延迟加载与错误隔离 |
| src/styles/、src/i18n.ts | 主题、各表面样式及双语文案 |

App.tsx 仍承载较多编排，拆分应沿已有边界进行，不一次性更换状态架构。样式已按写作、PDF、图示、乐谱等拆分，不全部追加到 app.css。

## 源码与投影

CodeMirror transaction 修改原文并进入历史；decoration 显示可视结果。扫描范围须处理平衡括号、嵌套、注释和逐字环境，复杂内容保留源码入口。更新可视层不应重建整个文档或丢失组合输入。

简单表格可以原位编辑单元格，复杂表格回到 TeX。乐谱、电路、结构式等同属正文流程，工具面板是可选辅助，不是日常写作的前置步骤。

## 保存与异步回写

saveQueue.ts 保证写盘顺序，保存期间继续输入仍需保持脏状态。编译先保存全部相关缓冲区，再重读工程主文件。

异步结果回来时检查工程、文件、请求序号及源范围。writingTargets 允许周围编辑映射位置，但目标原文改变后拒绝旧结果。取消请求不能替代接收端检查。IME 组合期间避免替换正在输入的投影。

## 预览与主题

数学使用 KaTeX；完整 TeX、图稿和乐谱使用本机编译及 PDF.js 显示路径。主编译和辅助预览分别管理取消、缓存和结果身份，成功编译才发布预览缓存。

studio 是暗工具栏和亮纸，night 的正文也暗，paper 是亮界面。单色图稿可以适配主题，作者图色和正式 PDF 保持原义。设计规范见[设计语言](/docs/dev-design)。

## 验证

```sh
npm run typecheck
npm run test:regression
npm run build
```

涉及输入、选择、焦点、滚动和撤销时补跑相应原生界面回归。切工程、关闭、IME、异步失败和工具取消都要有明确行为；仅截图正常不代表连续写作通过。

## 前端实现约束

仓库 docs/frontend.md 是前端实现契约，DESIGN.md 是视觉依据，二者同时适用。

- 工程编排、编辑事务、可选工具和纯逻辑按已有模块分工，原生访问经过类型化 preload API。
- 复用所属表面的主题 token、字体、状态和图标；桌面三主题与官网明暗分别验收。
- 保留源文、选择、IME、撤销和滚动，普通内容修改不强制进入工作室或完成弹层。
- 异步回写校验工程、文件、请求与源范围身份，取消不能替代校验。
- 桌面弹层用共享焦点 hook，官网沿用 Ant Design 焦点管理；检查名称、Tab、Escape 与焦点返回。
- 加载、空结果、失败和适用的选择状态分别表达，失败保留源文并提供下一步。
- 复用按需加载和缓存，不在输入路径增加无界计算；支持 reduced motion 与长中英文。
- 代码变化同步设计文档与双语；涉及输入的修改追加原生交互检查，构建通过不等于交互验收通过。

同一任务复用分支，通过检查及时提交并按已有授权推送；合并 main 和发版是另行确认范围的操作。

## 工程感知引擎与扩展边界

源码扫描、工程上下文、纯投影提供器与 CodeMirror 显示适配分开维护。共享实现为 `electron/services/tex-source-core.mjs`、`writing-path-core.mjs` 和 `writing-context-core.mjs`，配套 `.d.mts`；本地预览、渲染层与 MCP 不另写同一套解析器。文件读取由回调注入：桌面优先未保存缓冲区，MCP 明确只读磁盘。原生自动读取校验真实路径、文件类型和大小；引用展开限制深度、数量和总量。

`src/lib/writingEngine/` 的注册器负责范围校验、稳定顺序、隔离失败和按源码／上下文缓存。公式、图像、文字样式、表格与图示提供器返回原始 TeX 的 UTF-16 范围和语义数据；不写源码、不处理 DOM 或焦点。`src/editor/visual.ts` 管理选择、修订与专业对象冲突，`src/editor/projection/widgets.ts` 管理 DOM 与异步图稿生命周期。正文和表格共用受限数学渲染，宏变化会使缓存失效。

新增能力先实现纯提供器，再显式注册并接入适配层；测试嵌套、注释、逐字环境、未完成输入、原始偏移和失败回退。注册器是内部接口，不是新的可执行插件入口，不绕过 SDK 能力边界。源代码仓库的 `docs/writing-engine.md` 提供详细职责、扩展方法与接手顺序。

## MCP、SyncTeX 与兼容性

插件 API 1、已有命令、MCP 工具名和参数保持兼容。新增只读 `texpro_writing_context` 说明主文件、静态导言区和依赖的磁盘来源，不保存、编译或读取编辑器内存。SyncTeX 从大服务拆出，原有 `tex.cjs` 导出继续可用；数值与真实路径校验集中在 `electron/services/synctex.cjs`，PDF.js 变换仍由 `pdfSync.ts` 负责。

本轮没有已知破坏性插件／MCP 迁移。无效数值、越界文件被明确拒绝；已有误按子文件目录生成的图片路径需要按工程工作目录修正，不通过猜测路径掩盖与真实 TeX 的差异。以后若无法避免破坏兼容，开发文档与版本说明必须列出受影响版本、接口、迁移和回退步骤。

底层上下文属于 L0，正文投影属于 L1；不新增模式或页面。AI 助手升级单独保留为提案，当前不作为写作引擎的依赖。

在仓库根目录运行 `node scripts/test-flow-ui.cjs --project-writing` 检查原生多文件流程，并补跑完整回归、类型、构建、MCP stdio 与实际包内依赖核验。真实工程只在临时副本上验收，不把一次本机通过称为全平台验证。


## 原生排版与源码编辑分别维护

`writingEngine/native.ts` 发现不透明环境、未知宏段落和失败公式，`useNativeWriting.ts` 负责去抖、组合输入与结果身份。`electron/services/native-writing.cjs` 建立不可变临时副本，覆盖打开的未保存缓冲区，复用原工程文档类、宏包、字体与编译器。配置未知字段保留，只在副本重定向构建目录；不保存作者文件。相同磁盘清单及缓冲区内容可复用已完成 PDF；新请求取消旧进程并等其结束后清理。临时副本不构成 TeX 执行沙箱。

字面量章节引用使用 `includes.ts`、`useWritingComposition.ts` 与 `projection/includeWidget.ts` 原位接入连续文流，保持每个子文件独立的 UTF-16 源范围；只读投影点击后进入真实文件编辑。子文件不透明块按原生 SyncTeX 盒子裁切，可靠普通文字通过 `nativeText.ts` 回到宿主字体，几何内容保留图稿，不在正文嵌入整页 PDF。PDF、映射与原文来自同一副本；反向校验不可靠、超出资源限额或失败时保留源码，并通过已有问题列表报告。`projection/nativeWidget.ts` 负责可见区域加载、显示密度、viewport 坐标、原色与单色主题处理、键盘／鼠标回源码和资源释放。不要在纯提供器中加入 DOM 或文件读取。

语法高亮不是所见即所得的替代。源码模式与点击展开继续使用 `latexLanguage.ts`、`theme.ts`、原有补全及诊断；TeX 源码和撤销仍由 CodeMirror 维护。原生快照 preload 仅用于桌面，不改插件 `apiVersion: 1`，不让外部 MCP 读取编辑器内存。MCP 的磁盘上下文工具保持只读，正式编译入口不变。

验收运行 `node scripts/test-flow-ui.cjs --native-writing`，分别检查原生像素、任意自定义宏／环境、未保存快照、点击与键盘进入、源码高亮、撤销、三主题和窄窗口。`--project-writing` 检查静态上下文与即时投影；完整基线仍必须单独通过。资源限额与缓存细节见仓库 `docs/writing-engine.md`。

## 扩展几何适配

共享 `electron/services/geometry-core.mjs` 描述环境／命令语法、依赖、必要包装和驱动限制。`texDocument.diagramBlocks` 使用平衡范围合并嵌套对象，`tex.cjs` 以工程导言区解决共享语法的歧义；不要给每个宏包建页面或在 UI 复制解析器。PGFPlots 裸 axis 需要 TikZ 包装，TikZ 内嵌对象只取外层；Xy-pic／QCircuit 保留间距修饰，qtree 保留嵌套方括号。证明树按工程声明区分 bussproofs 与 ebproof。

新增适配须核对包依赖、引擎、源码位置、取消／过期、颜色与三主题，运行 `node scripts/test-geometry.mjs` 的真实 PDF 编译；识别成功不能代替真实工具链验收。该注册表是内部实现，不改变公开扩展 SDK。外部程序、shell-escape 和未验证的 Lua 宏包不能宣称自动支持。完整架构与限制见仓库 `docs/writing-engine.md`、`docs/geometry-compatibility.md`。

工作室的源码模式共用 `TexSourceEditor` 与 `useDiagramPreview`；局部编辑保留高亮、IME 和撤销，取消／关闭丢弃过期结果。无标记乐谱按原始范围识别，复杂内容不强制恢复模型。`--source-studio` 检查原位识别、源码预览、原块替换及撤销。


### 工作室内的源码与可视模式

`texVisualEdits.ts` 为已识别的字面量返回 UTF-16 范围；`TexVisualEditor` 只替换该范围并验证原文、类型与数值，不重建未知 TeX。电路、图形、乐谱、图表的源码与可视模式共用草稿和预览，源码 CodeMirror 保持挂载以保留局部撤销。手写电路、化学结构和 PGFPlots 回到各自已有工作室，不打开平行的源码工具。只有仍与源码一致的节点模型可以继续作为可写模型。
