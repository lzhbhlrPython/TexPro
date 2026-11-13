# TeXPro 产品页维护

本目录是独立静态站，React、TypeScript、Ant Design 与 Vite，使用 pnpm 和自身锁文件，不参与 Electron 打包。协作规则见根 [AGENTS.md](../AGENTS.md)，设计规范见 [DESIGN.md](../DESIGN.md)，全仓文档导航见 [docs/README.md](../docs/README.md)。

前端行为与验收还须遵守 [前端设计与实现约束](../docs/frontend.md)，不能只校对视觉 token。

## 修改边界

默认内容工作只修改 `src/content/docs/**` 与 `src/content/blog/*.md`。布局、样式、组件、路由、数据、依赖、脚本和配置需要用户明确授权。整理文档不等于改版，不能用 `layout:update` 掩盖版式变化。

## 内容来源

| 位置 | 内容 |
| --- | --- |
| src/content/docs/*.md | 中文使用与开发文档 |
| src/content/docs/en/*.md | 同名同 slug 的英文版本 |
| src/content/blog/*.md | 简体中文的应用开发历史 |
| src/content/docs/index.ts | 文档 glob 加载、分组与英文回退 |
| src/content/blog/index.ts | 博客加载、排序与 slug |
| src/lib/markdown.ts | 实际支持的 Markdown 语法 |
| src/i18n/ | 官网 UI 字符串，不与桌面词典混用 |

文档 front matter 包含 slug、title、group、order、summary。分组沿用开始、使用、参考、开发、AI 协作、关于；保持已有 slug 稳定。新增篇目自动进入文档导航，无需修改页面组件。

只使用解析器支持的二三级标题、段落、列表、代码块、引用、表格、行内代码、加粗与链接。站内文档链接写 `/docs/slug`，交给现有渲染组件处理子路径；不要插入任意 HTML、MDX、Mermaid 或依赖复杂嵌套列表。

中文与英文同轮维护；博客只用简体中文，英文界面说明语言。博客只记录桌面应用及其工具链，不写产品页改版流水账，不粘贴私人聊天和技能记录。

语言维护分工：程序主体开发侧只维护上述简体中文博客及其他页面的中英双语，提供功能与文案的分离边界和翻译变更清单；其他语种由第三方 AI 接入、翻译、构建并校验，不自动扩大主体开发侧的翻译职责。入口、限制和验收方式见[官网翻译交接指引](../docs/website-translation.md)。当前官网语言类型与文档加载仍只接入 `zh`／`en`，新增词典文件本身不会启用新语言；不得覆盖第三方已有译文或把中文回退冒充翻译完成。

## 页面与设计

首页区块在 `src/pages/home/`；文档、博客、更新记录和 AI 入口由 `src/router/index.tsx` 组织。组件与路由是实现依据，避免在此复制会过期的页面数量和区块表。

品牌色在 `src/config/design.ts`；明暗主题在 `src/App.tsx`、`src/lib/theme.tsx`；字体、宽度及动效变量在 `src/styles/global.css`。现有截图在 public/shots，必须来自真实应用。具体设计语言和主题区别见根 [DESIGN.md 的官网约束](../DESIGN.md#官网的适用范围)，包括明暗色表、字体、控件尺寸、响应式导航、动效、打印和彩蛋页主题覆盖。新增区块沿用这些规范，不从桌面三主题直接推导站点样式。

## 构建和预览

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm check:layout
pnpm typecheck
pnpm build
```

复现 GitHub 项目子路径时，构建和预览使用相同环境：

```sh
PAGES_BASE_PATH=/TexStudioPro pnpm build
PAGES_BASE_PATH=/TexStudioPro pnpm exec vite preview --host 127.0.0.1
```

访问 `/TexStudioPro/`。默认本地开发不设置 base，使用 `/`。只写内容前后运行版式检查，基线应该一致；只有已授权并核对完的壳层改动才重建基线。

首页、证据表和 AI 入口的数字要同步核对源码与中英文词典：回归用例来自实际测试清单，IPC 统计 preload 的请求与事件通道，文档按中英文同 slug 核对，发行包种类按 Nightly 工作流核对。用例数量不代表本次全部通过，发行包种类也不代表某次远端发布已完成。2026-11-11 按用户要求修订这些数字，未改变页面结构或样式。

首页主指标使用实际 MCP 工具数，不再显示文档数。文档覆盖统计由 `src/data/documentation.ts` 通过 Vite 文件清单自动统计，供证据表和 AI 入口等需要覆盖信息的页面使用，不手填总数。中英齐全时显示 `N × 2`，有缺译文时显示实际中文／英文数量；孤立英文文件不算作已配对译文。开发时随文件变更刷新，线上随正常内容构建更新；统计不把 Markdown 正文加载到首页。`pnpm test:docs` 验证增删篇目、缺译文与孤立译文，不修改真实内容。

## 版本信息

dev 和 build 先执行 fetch-release.mjs，刷新 src/config/release.json。普通构建可在离线或限流时沿用旧快照；显式 TEXPRO_RELEASE_TAG 必须取得准确 Release，失败就终止构建。CI 可更新旧入口 APP_VERSION，本地内容构建不改写 constants.ts。

运行期版本接口和构建快照见 src/lib/release.ts；最终下载以实际 GitHub Release 为准。不要把示例版本、历史统计或本机构建当成线上发布事实。

## 机器可读产物

vite.config.ts 的 contentFiles 插件在 buildStart 执行 gen-feed.mjs 与 gen-llms.mjs，直接使用 Vite 构建也会生成 feed、llms、sitemap 与 robots。不手改 public 下这些输出；更正文档后重新构建并检查生成 diff。

`release:sync`、`feed:build`、`llms:build` 用于单独刷新对应内容，`latex:mark` 用于更新预渲染字标。没有对应任务时不要重建字标或版式基线。

## 发布与验收

Pages 自动来源仅产品页路径变化与成功 Nightly／正式版的准确 tag 刷新；PR 仅构建，main 才部署，保留手动入口。详见 [部署文档](../docs/product-page-deployment.md)。

内容交付核对中英 slug、站内链接、front matter、实际命令、生成产物、版式检查、类型与构建。壳层变更另验窄屏、主题、键盘、reduced motion 和子路径。dist、缓存、本地环境及私人记录沿用 .gitignore，不进入提交。

2026-11-12：按本地扩展／工作台改造授权更新实际预览图、扩展展示、统计和单一目标语言切换；保持现有区块、Ant Design 与纸面视觉。图像来源和原始摘要见 `public/shots/README.md`。当前统计由完整基线、preload 和双语同 slug 文档核对；SDK 与 qwertysay 的发布入口同步到开发文档。

2026-11-12：多语言作者工具源码修订后，当前完整基线为 135 项／21 个根测试文件、外部 MCP 为 21 个工具；单独的真实编译矩阵为九种插件语言与七种样式。只同步事实数字、中英文案与开发内容，作者工具版本为 0.2.0，发布和部署分别核验实际结果。

## 正式版本列表

`/releases` 使用现有 SectionHeading、Ant Design Flex／Table 与纸面 token，入口位于页脚资源区；`/changelog` 保留当前构建。`vite.config.ts` 的 contentFiles 自动分页同步真实正式 Release，排除草稿和预发布；失败回退明确标识的旧快照，首次失败显示不可用，不能虚构空列表。正式版准确 tag 刷新要求列表包含本次版本与资产。说明作为纯文本显示，下载使用原始 URL。站点预览核对中英、明暗、390px、减少动态效果及 Pages 子路径。

本次官网真实版本页预览及来源记录见 `docs/screenshots/site/`；这组图不替代桌面应用展示截图，也不包含私有版本夹具。

2026-11-12 首次正式发布联动：SDK、qwertysay、开发 Skill 拆为三篇同 slug 中英文指南，旧 extension-development 保留为 SDK 入口；文档计数由 glob 自动变为 29 × 2。qwertysay 0.3.0 增加中英引导，SDK 保持 0.2.0；完整基线 137 项／21 文件，真实语言／样式矩阵 16 项。正式版真实列表与前端预览在发布后核对。

2026-11-12：正式版本页按 major.minor 与 release-series.json 代号分组（V0.1 / Tajpilo），小版本可独立折叠，默认展开最新版本；复用 MarkdownBlocks，不执行原始 HTML。首页以可核对的 21 个 MCP 工具替代文档数；博客标签解析清理数组括号和反引号。中文操作文案按桌面和原生菜单 i18n 核对；英文指南保持英文界面名称。外链改用官网与当前仓库地址，TCSS 使用可访问的版本化分发文档。

2026-11-13：补齐声明式语言插件、npm／yarn 管理和 qwertysay 0.4.1 的中英任务文档、简体中文博客和真实预览；文档正文中的插件独立 i18n 边界与桌面原生恢复命令同步。主体开发只维护中文博客与其他页面中英双语，其他语种按翻译交接指引由第三方 AI 完成。

## 代码高亮

文档、博客和正式版本说明继续使用现有 Markdown 解析器，围栏语言传给共享 CodeHighlight；首页 TeX 演示与诊断源码也复用它。Shiki 4.6.0 使用独立 core、JavaScript 正则引擎和显式按需导入的语法，首屏不下载全部语法或外部 CDN/WASM。支持 sh/bash、tex/latex、js/ts/jsx/tsx、json/jsonc、css/scss/less、html/xml、yaml、toml、markdown、diff 与 powershell；text、base64、未标注与未知语言保留纯文本。新增语法需同时补齐 codeLanguages、加载器与 test:code，不启用自动猜测。

CodeHighlight 以 React 文本节点渲染 Shiki token，不注入高亮 HTML。异步结果验证原文与语言，组件卸载后丢弃，失败保留原文。缓存最多 64 项；超过 40,000 字符、1,000 行或单行 2,000 字符回退纯文本。复制始终取原始代码字符串。色彩使用当前 Ant Design token，经局部 --site-code-* 传给 Shiki；不足 5:1 的语义色向正文色混合；切换站点主题无需重新着色，打印使用 CanvasText。

验证入口：pnpm test:code、pnpm test:docs、pnpm typecheck、pnpm build。浏览器核对中英、明暗、1440／390px、复制、键盘、切换主题、失败回退和项目子路径。构建通过 Vite license 收集实际捆绑依赖的完整许可，输出 third-party-licenses.txt；随站点产物保留，不能用根项目 MIT 替代第三方许可。高亮属于官网，不写入应用功能开发博客。

2026-11-13：统一 npm／yarn 小写；包管理指南按实际操作顺序重写，区分 npm、yarn 1 和 yarn 2+，明确简中预装无变更、应用内确认、精确版本升级及卸载保留数据。

## 官网语言入口

导航使用共享 LanguageSwitch 图标菜单，宽窄屏都直接可见；菜单显示 ISO 639-1 代码与自称，当前为 zh · 简体中文、en · English。i18n/locales.ts 维护代码、自称及 HTML lang，沿用既有 texpro:locale 持久选择与路由。选择后与 Escape 关闭后返回触发器；点击外部不抢焦点。菜单只列已接入的语言；新增语言仍需按翻译交接指引接入词典、内容、回退和格式化，单加注册项不等于完成翻译。

## 使用与开发文档分区

`/docs` 为使用文档首页，`/developers` 为开发文档首页；文章沿用 `/docs/:slug`。`src/content/docs/sections.mjs` 是运行期目录和静态生成器共用的归属规则：中文 group 为开发／AI 协作时进入开发区，其余既有分组进入使用区。英文继承中文归属，不能通过翻译 group 改变信息架构。安装与管理扩展属于使用区；编写 SDK 插件、qwertysay、MCP 与应用架构属于开发区。

目录、文章侧栏、前后篇使用同一过滤规则，搜索显示分区标签；顶栏、页脚、llms 与 sitemap 同轮维护。使用区较疏朗，开发区突出代码、紧凑目录与技术契约；字体、token、组件和 Reveal 动画共用。`pnpm test:docs` 验证分区完整性、中英对应、前后篇边界、搜索与生成入口；浏览器另验两区明暗／宽窄屏、语言菜单、直接访问和 Pages 子路径。站点改版不新增应用开发博客。
