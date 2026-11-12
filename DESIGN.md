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
  site-surface: "#fffcf7"
  site-text: "#2a231e"
  site-heading: "#1c1613"
  site-border: "#e0d3c0"
  site-dark-bg: "#141110"
  site-dark-surface: "#1d1917"
  site-dark-elevated: "#241f1b"
  site-dark-text: "#e9e3da"
  site-dark-heading: "#f5efe6"
  site-dark-border: "#3a322c"
typography:
  editor-body:
    fontFamily: '"New York", "Charter", "Iowan Old Style", "Palatino", "Songti SC", "Noto Serif CJK SC", Georgia, serif'
    fontSize: "18px"
rounded:
  desktop-base: "10px"
  site-sm: "6px"
  site-base: "8px"
  site-lg: "10px"
---

# TeXPro design system

## Overview

设计目标是安静、连续、可控制的纸面写作。正文与源文是中心，菜单、工程树和可视化工具辅助写作；普通修改不应要求先进入工作室再点击完成。品牌、产品原则见 [PRODUCT.md](PRODUCT.md)。

本文件使用 [Google Labs DESIGN.md 格式](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md)的 YAML token 与八节结构；它是可移交的设计规范，不是 Material 组件库迁移计划。设计方法参考 [Material Design 色彩角色](https://m3.material.io/styles/color/the-color-system)和[字体角色](https://m3.material.io/styles/typography/applying-type)，原生窗口交互遵守各平台惯例。沿用 Lucide 桌面图标和 Ant Design 官网组件，不为外观统一引入第二套组件库。

YAML 记录当前代码的默认值，不是另一个自动生效的主题配置。修改 token 时同步源码与本文；若出现差异，先检查 CSS 级联及用户设置，再修正规范。本次整理于 2026-11-10；未声明全产品已经通过无障碍认证。

### 官网的适用范围

官网首页用于介绍产品，文档与博客用于阅读，下载页用于辨认实际发行资产；它们继承纸面品牌，但不照搬桌面工作台布局或三主题。产品页规范同时适用于首页、文档、博客、更新记录、AI 入口及已有彩蛋页。站点维护入口是 [product-page/README.md](product-page/README.md)，样式事实来自站点源码；以下记录现状与后续约束，不在本次改动页面。

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

### 官网配色与主题

| 语义角色 | light | dark |
| --- | --- | --- |
| 布局背景 | #f7f2ea | #141110 |
| 容器 | #fffcf7 | #1d1917 |
| 浮层 | #fffcf7 | #241f1b |
| 正文 | #2a231e | #e9e3da |
| 标题 | #1c1613 | #f5efe6 |
| 边框 / 次级边框 | #e0d3c0 / #ebe1d2 | #3a322c / #332c27 |

表中来自 `product-page/src/App.tsx` 的 LIGHT_PALETTE / DARK_PALETTE；品牌值来自 `src/config/design.ts`。Ant Design 的色彩算法会参与派生状态色，不能只验证表中的基础色。

`src/lib/theme.tsx` 管理用户模式和临时 override；默认值先查本地选择，再查初次加载时的系统偏好，不承诺持续自动跟随系统变化。页面临时主题覆盖退出时应清空，不写坏持久选择。CSS 的 `--site-*` 部分由 App 的 ConfigEffects 注入；只改 :root 默认值不代表改完运行时主题。已有诊断等语义色例外需要按明暗分别检查，不能把“全站所有颜色已 token 化”当成事实。

## Typography

Material 的 display、headline、title、body、label 表示内容角色，TeXPro 按角色映射现有字体，不强制换成 Roboto。编辑正文使用衬线栈，工具界面使用 `--font-ui`，TeX 源码、日志和快捷键使用 `--font-mono`。官网使用自身 `--serif`、`--serif-latin`、`--mono`。

桌面默认正文 18px、写作宽度 760px 来自 `app.css`，允许设置调整。UI 字号与 PDF 中 TeX 字号互不替代。中文标题、括号、行距和中英混排要实际检查，不能仅凭拉丁字母样张验收。字体不可用时回退系统字体，页面仍须可读。

### 官网排字

全站正文沿用思源宋体与系统宋体回退，英文专门排字可用 `--serif-latin`，代码用 `--mono`。字体 CDN 加载失败不能使正文消失。首屏、文档与博客使用各自已有字号和行距，不能为了匹配桌面 18px 一刀切。CSS 有重复声明及断点覆盖，检查最终 computed style，不以首个 hero-title 声明当成全屏统一尺寸。正文层次靠字号、字重、留白和分隔，不以大量胶囊、渐变字或厚卡片替代。

## Layout

交互复杂度随任务生长：L0 内部增强、L1 原位增强、L2 按需工具、L3 独立工作空间。选能完整承载任务的最低层级；独立复杂任务可以建页，但必须有现有空间无法合理承载的依据，并复用焦点、路由、状态和撤销机制。完整决策条件见 AGENTS.md。

实时 TeX 预览属于 L0，自动融入既有 PDF 区域；只保留一套工具栏、页码、缩放与滚动，不显示引擎开关、模式标签、就绪徽标或回退页角标。首屏沿用排版等待，后台更新不遮挡已有页面、不移动正文焦点。搜索、复制、对比、打开 PDF 和定位按需准备正式排版；不得套用旧 PDF 的文字层或 SyncTeX 坐标。新输入恢复实时更新，正式 PDF 保留作者颜色，工具栏跟随三主题；失败进入现有诊断而非新增面板。

编辑区优先获得可用空间，侧栏与 PDF 可收起，辅助面板按需出现。正文、表格、乐谱和图稿保持同一源文流程；占位符保留轻量内外留白，不能变成厚卡片。

官网布局上限来自 `--site-max: 1200px`，窄屏导航沿用现有 Drawer。缩放和窄窗口下不得隐藏关闭、保存、取消等必要操作。禁止因切换预览重置整个编辑器。

新组件优先使用已有间距和密度，不把 Material Android dp 直接当作 Electron CSS px。Google 的[触控目标建议](https://support.google.com/accessibility/android/answer/7101858?hl=en)为 48dp；本项目将官网触控入口约 48 CSS px 的可点区域作为设计目标，桌面紧凑控件需保留键盘入口、可见焦点和足够间隔。视觉图标尺寸与实际命中区域分别检查。

### 官网导航、响应式与打印

- `.shell` 采用现有 1200px 上限和横向内边距；沿用实际 1100 / 991 / 767 / 640px 附近的分区断点，先查组件再复用，不另建不相容的断点体系。
- Header 负责站点入口，窄屏收进 Drawer；SectionRail 的页内圆点导航在 1280px 及以上显示。文档正文、侧栏和页内目录按现有断点重排，收起导航后仍能访问全部篇目。
- 长英文、代码块、表格、下载资产名和 SHA256 必须可阅读或局部滚动，不能撑破整个视口；本页锚点不能藏在吸顶导航后。
- 纸面分隔、能力规格表、参考文献式脚注和真实截图属于既有官网表达。保留它们的视觉层级，新增内容沿用同类区块；真实性要求不因营销页面而放宽。
- `@media print` 目前采用 A4 与 24mm / 22mm / 22mm 页边距；打印隐藏交互外壳、去除阴影，表格保持表头与合理分页。打印是独立验收表面，dark 屏幕色不能直接当作打印配色。
- 资源、字体、路由与链接兼容 BASE_URL，预览与构建使用相同 PAGES_BASE_PATH。网页路径不等于磁盘路径。

## Elevation & Depth

正文以纸色、留白和分隔建立层次。浮层才使用现有 `--shadow-sm/md/lg`，不增加无功能的多层阴影、玻璃模糊或悬浮卡片。深色状态优先检查表面明度与边界，不靠阴影独立传达层级。

官网动效复用 `--dur-quick: 160ms`、`--dur-base: 240ms`、`--dur-enter: 460ms`、`--ease-out`、`--rise: 12px`，Reveal 同屏按现有 60ms 节奏错开；这些值来自官网，并非桌面的通用动效配置。支持 reduced motion，禁用动画后内容仍可见。正文输入、定位和编译反馈不能等待装饰动画。

## Shapes

桌面基础 `--radius: 10px`；按钮、输入和弹层沿用所属组件的现有规则，不能把所有元素强制改为同一圆角。官网圆角由 Ant Design token 及既有 CSS 决定。不用大胶囊和卡片包装普通正文，也不以 Liquid Glass 替换纸面品牌。

### 官网控件形状与尺寸

当前 Ant Design 控件使用 6 / 8 / 10px 圆角，常规 / 小型 / 大型高度为 40 / 32 / 48px，按钮字重 500，定义在 `product-page/src/App.tsx`。这些是现状值，不等于所有触控命中区域均已达标；紧凑图标按钮需单独检查命中区域。自定义组件沿用所属类型的既有形状，不能把参考文献、规格行、诊断标签都改成 Ant Design 卡片或 Tag。

前端行为、组件边界和验收的完整规范见 [前端设计与实现约束](docs/frontend.md)。

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

### 官网交互与内容约束

搜索与快捷键弹层、移动导航和主题入口复用已有可访问名称、键盘与关闭机制；文档代码复制要提供成功和失败反馈，博客筛选不能使正文入口不可达。主题对照滑块保留指针与键盘操作。彩蛋页沿用同一字体、主题和 reduced motion 规则，不另起设计体系或引入新的产品能力承诺。

官网 UI 字符串同轮维护中文与英文；文档同名同 slug，博客保持简体中文并在英文界面说明语言。内容修改不改布局锁；已授权壳层改动核对后才更新基线。Release 版本、资产、体积和校验摘要来自实际数据，不在页面中硬写示例值。机器可读内容由生成器维护，不手改输出。

## Do's and Don'ts

- 先核对所属表面、主题、源码 token，再改组件；不凭截图发明全新主题。
- 普通写作保留焦点、选择、滚动与撤销；辅助工具不抢焦点。
- 同时验收默认、hover、focus、selected、disabled、loading、error 和空状态；不存在的状态不用硬造。
- 检查中英文长文案、键盘、IME、明暗色和 reduced motion；正式 PDF 另验。
- 不把设计目标、静态截图或编译通过描述成已完成全产品交互验收。
- 修改设计规范不自动授权重做界面；官网内容整理不修改布局锁。

## 本地扩展与任务承载

实时渲染是 L0，无新模式或入口。命令与正文补全为 L1；扩展管理、修改提案和论文 API 为 L2；需要画布的电路／逻辑／结构式、手写和模板工作坊为 L3，共用 WorkspaceFrame 的返回、键盘与焦点规则。编译详情属于既有问题面板；版本历史按工程 Git 状态进入相应工具，不制造重复入口。内置组件保持纸面 token；用户主动启用的主题可覆盖字体、尺寸、样式与本地资源，这是明确的可选定制边界，不作为内置 UI 设计规范。主题预览可取消，样式和资源随停用清理，尊重减少动态效果。信任提示写明代码权限与主题伪装风险；原生菜单和安全模式提供主题之外的恢复路径。

共享工作台的顶部导航为 macOS 原生窗口按钮预留 92px 起始区域，按钮与文字不得进入该区域；Windows／Linux 使用自身标题栏，不继承这块留白。窄窗口同样保留系统控件空间。

扩展作者的多语言与主题预处理属于开发工具能力，不新增桌面页面或模式。各语言在构建时收敛到现有插件／静态主题契约；安装、信任提示、修改提案、主题预览与恢复仍由已有 L1／L2 入口承载。开发源码后缀与 `.tpp`／`.tpt` 安装后缀应在说明中分开。

官网正式版本列表 `/releases` 是独立的版本查找任务，复用更新日志的 SectionHeading、Ant Design Flex 和资产表，入口放入页脚资源区，不增加桌面入口。当前构建仍在 `/changelog`；列表区分构建时同步、旧快照、不可用与真实空列表，说明按纯文本展示。颜色和动效沿用官网 token。最简主题包仅含 manifest 与 LICENSE，可只覆盖强调色；高级主题编译不成为基础配色的前置要求。
