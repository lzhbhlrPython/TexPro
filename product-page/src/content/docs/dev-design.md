---
slug: dev-design
title: 设计语言与界面规范
group: 开发
order: 14.1
summary: 以 Google DESIGN.md 格式记录纸面品牌；用 Material Design 的语义角色和可访问性方法约束新增界面。
---

## 规范入口

仓库根 DESIGN.md 是设计语言的统一入口，包含可读取的 YAML token 和 Overview、Colors、Typography、Layout、Elevation & Depth、Shapes、Components、Do's and Don'ts 八节。结构参考 [Google Labs DESIGN.md 格式](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)。

它记录 TeXPro 当前纸面品牌，不要求改用 Material 组件库，也不要求将字体换成 Roboto。设计要求与实际旧界面是否已达标要分开说明。

## 设计原则

写作居中，工具退后。公式、表格、乐谱、电路与结构式都在同一写作流程中，源码可达，可视化只辅助。普通修改不依赖工作室、弹层或完成按钮；辅助动作保留文件、光标、选择、滚动、IME 和撤销。

## 按任务选择交互层级

界面的复杂度应与任务复杂度匹配，而不是与功能数量成正比。实施前说明任务、层级、现有页面承载能力、新页面理由和重复入口风险。

| 层级 | 承载方式 |
| --- | --- |
| L0 无感增强 | 内部自动完成，不新增界面；实时 TeX 排版属于此层 |
| L1 原位增强 | 正文、预览、补全、诊断和已有上下文操作 |
| L2 按需工具 | 已有弹层、侧栏、Studio 或工具视图 |
| L3 独立工作空间 | 有完整独立流程的页面或工作台 |

选择能完整承载任务的最低层级，不为减少页面牺牲清晰、效率和可用性。独立流程、大画布、持续多阶段状态、不同的专注情境，或现有空间明显拥挤时，可以新增职责清楚的页面；重要或实现复杂本身不是理由。

简单状态、按钮选项、自然属于保存和预览的能力，以及与已有工具重复的内容，应留在原有空间。复杂能力按需显现；退出恢复写作位置，不强迫作者经过新页面，也不隐藏必要错误。

新页面复用视觉语言、路由、焦点、数据状态和撤销机制。实时预览复用同一 PDF 工具栏，自动加速，专业操作按需准备正式结果，不要求作者理解渲染模式。完整页面决策与验收条件见仓库 AGENTS.md。

## 颜色和文字

参考 [Material Design 色彩角色](https://m3.material.io/styles/color/the-color-system)组织表面、文字、强调和状态。桌面 token 来自 src/styles/app.css；paper 有后续覆盖，不能仅抄第一块 CSS。studio 是暗工具栏与亮纸，night 为暗纸，paper 为亮界面。官网使用自己的 Ant Design token 与 site 变量。

编辑正文用衬线，工具界面用系统 UI 栈，源码和日志用等宽；display、headline、title、body、label 表示角色，不是替换全站字体的命令。屏幕主题不能改变作者配色或最终 PDF 墨色。

## 可访问性与状态

新增或调整组件按普通文本 4.5:1、大文本和关键非文本控件 3:1 的目标检查实际颜色组合。触控目标参考 Google 的 48dp 建议；网页可点范围与桌面紧凑控件分别验收，不直接把 dp 当成 CSS px。

所有交互有名称、可见键盘焦点、可退出路径；状态不能只靠颜色。检查长英文、中文标点、缩放、三主题和 reduced motion。以上是验收目标，不表示所有历史组件已完成认证。

## 动效与组件

官网复用已有 dur、ease-out、rise 与 Reveal 节奏；减少动效时仍显示全部内容。正文输入与定位不能等待装饰动画。桌面使用 Lucide，官网沿用 Ant Design，补全、菜单和占位符共享表面风格，不另建视觉体系。

## 修改前后

先读 PRODUCT.md、DESIGN.md 与所属样式和组件；用户要求内容整理不等于允许改布局。官网内容工作前后运行版式检查，中文与英文同时维护。设计规范更新并不代表界面已改版。

## 官网专属规范

根 DESIGN.md 同时记录官网的明暗表面角色、衬线字体回退、控件尺寸与圆角、响应式导航、动效和打印规则。站点 token 来自 product-page/src/App.tsx、src/config/design.ts 与 src/styles/global.css，主题状态和临时覆盖在 src/lib/theme.tsx；现有彩蛋页临时使用 dark，退出后恢复原选择。

官网使用自身 light / dark 色板，不套用桌面 paper / studio / night。保留既有纸面区块、规格行、参考文献式脚注与真实截图，分别检查窄屏、长译文、键盘和打印。内容工作不修改布局锁。
