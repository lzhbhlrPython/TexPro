---
version: alpha
name: TeXPro
description: 以连续写作为中心的纸面 LaTeX 编辑器
colors:
  primary: "#b4532a"
  paper-bg: "#f3f1ec"
  paper-surface: "#fffefa"
  paper-text: "#2e2c28"
  studio-primary: "#d97757"
  studio-bg: "#151517"
  studio-surface: "#faf6ed"
  night-primary: "#e08663"
  night-bg: "#0d0e10"
  night-surface: "#15161a"
  night-text: "#ddd9d0"
  site-primary: "#bc4f30"
  site-bg: "#f7f2ea"
typography:
  editor-body:
    fontFamily: '"New York", "Charter", "Iowan Old Style", "Palatino", "Songti SC", "Noto Serif CJK SC", Georgia, serif'
    fontSize: "18px"
rounded:
  desktop-base: "10px"
---

# TeXPro design system

## Overview

设计目标是安静、连续、可控制的纸面写作。正文与源文是中心，菜单、工程树和可视化工具辅助写作；普通修改不应要求先进入工作室再点击完成。品牌、产品原则见 [PRODUCT.md](PRODUCT.md)。

本文件使用 [Google Labs DESIGN.md 格式](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)的 YAML token 与八节结构；它是可移交的设计规范，不是 Material 组件库迁移计划。设计方法参考 [Material Design 色彩角色](https://m3.material.io/styles/color/the-color-system)和[字体角色](https://m3.material.io/styles/typography/applying-type)，原生窗口交互遵守各平台惯例。沿用 Lucide 桌面图标和 Ant Design 官网组件，不为外观统一引入第二套组件库。

YAML 记录当前代码的默认值，不是另一个自动生效的主题配置。修改 token 时同步源码与本文；若出现差异，先检查 CSS 级联及用户设置，再修正规范。本次整理于 2026-11-10；未声明全产品已经通过无障碍认证。

## Colors

| 表面 | 源码 | 使用规则 |
| --- | --- | --- |
| 桌面 paper / studio / night | `src/styles/app.css` | paper 为亮纸；studio 为暗工具栏与亮纸；night 为暗工具栏与暗纸 |
| 编辑器语法与选区 | `src/editor/theme.ts`、`src/styles/writing.css` | 跟随当前主题的语义变量，不新建孤立色板 |
| 官网品牌 | `product-page/src/config/design.ts` | 赤陶色品牌主色，与桌面各主题强调色区分 |
| 官网明暗中性色 | `product-page/src/App.tsx`、`src/lib/theme.tsx`、`src/styles/global.css` | Ant Design token 与 `--site-*` 配合，不把桌面主题选择直接套到官网 |

`app.css` 有同一主题的后续覆盖块，paper 的实际 `--paper` 是 `#fffefa`，不能只提取首个声明。运行时还会受编辑器设置影响。

应用约定：背景与其文字成对使用；强调色用于主要操作、当前项与焦点；危险、警告和成功有独立语义，并辅以文字或图标。编辑器与 PDF 是不同色彩域：单色预览可适配主题，作者指定图色要保留，不能将 night 墨色写回正式 PDF。

作为后续验收目标，普通文本对比度至少 4.5:1，大文本至少 3:1，关键控件边界及状态至少 3:1；逐主题测量实际组合，透明色必须合成后测量。这里是项目验收要求，不是对当前所有 token 的通过声明。

## Typography

Material 的 display、headline、title、body、label 表示内容角色，TeXPro 按角色映射现有字体，不强制换成 Roboto。编辑正文使用衬线栈，工具界面使用 `--font-ui`，TeX 源码、日志和快捷键使用 `--font-mono`。官网使用自身 `--serif`、`--serif-latin`、`--mono`。

桌面默认正文 18px、写作宽度 760px 来自 `app.css`，允许设置调整。UI 字号与 PDF 中 TeX 字号互不替代。中文标题、括号、行距和中英混排要实际检查，不能仅凭拉丁字母样张验收。字体不可用时回退系统字体，页面仍须可读。

## Layout

编辑区优先获得可用空间，侧栏与 PDF 可收起，辅助面板按需出现。正文、表格、乐谱和图稿保持同一源文流程；占位符保留轻量内外留白，不能变成厚卡片。

官网布局上限来自 `--site-max: 1200px`，窄屏导航沿用现有 Drawer。缩放和窄窗口下不得隐藏关闭、保存、取消等必要操作。禁止因切换预览重置整个编辑器。

新组件优先使用已有间距和密度，不把 Material Android dp 直接当作 Electron CSS px。Google 的[触控目标建议](https://support.google.com/accessibility/android/answer/7101858?hl=en)为 48dp；本项目将官网触控入口约 48 CSS px 的可点区域作为设计目标，桌面紧凑控件需保留键盘入口、可见焦点和足够间隔。视觉图标尺寸与实际命中区域分别检查。

## Elevation & Depth

正文以纸色、留白和分隔建立层次。浮层才使用现有 `--shadow-sm/md/lg`，不增加无功能的多层阴影、玻璃模糊或悬浮卡片。深色状态优先检查表面明度与边界，不靠阴影独立传达层级。

官网动效复用 `--dur-quick: 160ms`、`--dur-base: 240ms`、`--dur-enter: 460ms`、`--ease-out`、`--rise: 12px`，Reveal 同屏按现有 60ms 节奏错开；这些值来自官网，并非桌面的通用动效配置。支持 reduced motion，禁用动画后内容仍可见。正文输入、定位和编译反馈不能等待装饰动画。

## Shapes

桌面基础 `--radius: 10px`；按钮、输入和弹层沿用所属组件的现有规则，不能把所有元素强制改为同一圆角。官网圆角由 Ant Design token 及既有 CSS 决定。不用大胶囊和卡片包装普通正文，也不以 Liquid Glass 替换纸面品牌。

## Components

| 组件 | 必须保持的行为 |
| --- | --- |
| 编辑器、公式与表格 | TeX 原文可达，普通输入连续，转换可撤销，组合输入不被重建打断 |
| 补全 | 复用主题字体、表面、选中与焦点样式，键盘选择，不遮断正在编辑的内容 |
| 工程树与素材 | 路径和真实文件一致，删除影响明确，新建不覆盖文件 |
| 诊断 | 说明发生什么、位置和下一步；编译失败保留日志和源码 |
| 可选面板 | 主动打开，Tab 边界、Escape、取消和关闭后的焦点返回一致 |
| 占位符与备忘 | 轻量、可直接编辑，未解决状态清楚；备忘不进 PDF |
| 按钮、图标和链接 | 有可访问名称和 focus-visible，hover 不能是唯一入口 |
| 官网文档 | 中英同 slug，代码可复制，站内链接兼容 Pages 子路径 |

文案写任务和结果，避免让用户理解 IPC、runId 或内部缓存。中文界面说明用中文，英文界面用英文；LaTeX、PDF、MCP、代码与品牌名保留技术标识。桌面字符串走 `src/i18n.ts`，官网走 `product-page/src/i18n/`。

## Do's and Don'ts

- 先核对所属表面、主题、源码 token，再改组件；不凭截图发明全新主题。
- 普通写作保留焦点、选择、滚动与撤销；辅助工具不抢焦点。
- 同时验收默认、hover、focus、selected、disabled、loading、error 和空状态；不存在的状态不用硬造。
- 检查中英文长文案、键盘、IME、明暗色和 reduced motion；正式 PDF 另验。
- 不把设计目标、静态截图或编译通过描述成已完成全产品交互验收。
- 修改设计规范不自动授权重做界面；官网内容整理不修改布局锁。
