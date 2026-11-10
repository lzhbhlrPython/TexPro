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
