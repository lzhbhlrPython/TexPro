# TeXPro 产品页

> **硬约束（给所有 AI）**：本目录的**布局与排版由人决定**。除非用户在本次对话里明确要求改版式，否则你只能做两件事——在 `src/content/docs/` 里写文档、在 `src/content/blog/` 里写博客。页面结构、样式、组件、路由、依赖脚本都别碰。
>
> 内容也有边界：Markdown 只用本项目解析器支持的语法——`##` / `###` 标题、段落、`-` 列表、``` 代码块、`>` 提示、`|` 表格、行内 `` `代码` ``、`**加粗**` 与 `[文字](/docs/xxx)` 链接。不要引入新的 Markdown 依赖，也不要写解析器不认识的东西。
>
> 动手前先读、动手后自检：`pnpm check:layout`。它把 `src/{pages,components,layouts,styles,router,data,config,lib,hooks,types}`、`index.html`、`vite.config.ts`、`package.json` 的内容哈希和 `layout.lock.json` 比对；只写内容时应当输出「版式未动」。报错说明越界了——不要用 `pnpm layout:update` 掩盖，那是给人改完版式后重建基线用的。

TeXPro 的营销落地页与文档站，React 19 + TypeScript + Ant Design 6，`vite build` 出纯静态包，不依赖后端。

```bash
pnpm install
pnpm dev        # 先同步版本号，再起 http://localhost:5173
pnpm typecheck  # tsc --noEmit
pnpm build      # 同步版本号 → tsc → vite build，产出 dist/

pnpm release:sync  # 只刷新版本号快照（src/config/release.json）
pnpm latex:mark    # 升级 KaTeX 后重新生成首屏 LaTeX 字标
pnpm check:layout  # 校验版式基线：只允许改 src/content/**，其余文件改动会报错
pnpm layout:update # 经用户同意改版后，重建 layout.lock.json 基线
```

`dev` 与 `build` 都会先跑 `scripts/fetch-release.mjs`：成功时把最新发布写进 `src/config/release.json`，普通构建失败（离线、限流）时保留旧快照并继续构建。Nightly 通过 `TEXPRO_RELEASE_TAG` 指定准确标签时，必须取得该 Release；同步失败即停止构建，避免部署旧版本信息。

## 页面结构

首页是锚点式门户，`src/pages/home/` 下每个区块一个文件：

| 区块 | 文件 | 锚点 | 内容 |
| --- | --- | --- | --- |
| 首屏 | `Hero.tsx` | `#top` | 主张（900 字重主标题）、两个 CTA、真实主界面截图；底部一行四个可核对数字（89 用例 / 87 IPC / 16 安装包 / 21×2 文档），与证据表同字族 |
| 能力 | `Capabilities.tsx` | `#capabilities` | 六项能力，三列规格表式排版（细分隔线，不用卡片），每条说法带脚注 |
| 演示 | `VisualDemo.tsx` | `#demo` | 同一份 LaTeX 的三块内容，点哪块哪块翻回源码（公式由构建期预渲染） |
| 场景 | `Showcase.tsx` | `#showcase` | 两段图文交替，各自带真实截图 |
| 工作流 | `Workflow.tsx` | `#workflow` | 四步 Steps + 仿真状态栏 + 三条说明 |
| 出错 | `Failure.tsx` | `#failure` | 左边坏掉的 `main.tex`，右边三条真实诊断；点一条跳到对应行并展开说明 |
| 细节 | `Details.tsx` | `#details` | 小巧思：占位符与修订备忘、CTeX 中文排版，两列窄带 |
| 对比 | `Comparison.tsx` | `#compare` | 能力对比表，TeXPro 列高亮 |
| 边界 | `Limits.tsx` | `#limits` | 反向营销：四条刻意不做的事（账号权限、手机端、藏源码、云同步） |
| 隐私 | `DataFlow.tsx` | `#local` | 三个节点的数据流向图、「全程不出现」与「可选的外连」 |
| 写作 | `Themes.tsx` | `#themes` | 三主题切换 + 一行一条的模式清单（聚焦 / 打字机 / 纸面留白）+ 主题对照滑块 |
| 迁移 | `Migrate.tsx` | `#migrate` | 三条迁移路径（在线协作、Markdown、传统 IDE），每条给一个文档入口 |
| 证据 | `Proof.tsx` | `#proof` | 一张 `[1]–[6]` 参考文献表：正文上标的出处，行内排、悬挂缩进；四个仓库数字放在首屏，不重复列出 |
| 下载 | `Download.tsx` | `#download` | 按访客系统自动标出安装包，直接链到对应资产、显示体积，并给出每行的 SHA256 复制按钮 |
| 页脚 | `layouts/components/SiteFooter.tsx` | — | 链接分组与声明 |

文档站是独立的两级路由，`/docs` 为第一篇，`/docs/:slug` 为其余各篇：

| 路径 | 文件 | 内容 |
| --- | --- | --- |
| `/docs`、`/docs/:slug` | `src/pages/docs/index.tsx` | 左侧章节导航 + 正文 + 右侧「本页目录」，文末上一篇 / 下一篇 |
| `/blog` | `src/pages/blog/index.tsx` | 开发博客列表：日期 + 标题 + 摘要 + 标签 + 阅读时长 |
| `/blog/:slug` | `src/pages/blog/post.tsx` | 单篇文章，文末「更早 / 更新」翻页 |
| `/changelog` | `src/pages/changelog/index.tsx` | 当前发布的版本、tag、日期与全部资产（体积、SHA256、复制按钮） |
| `/ai` | `src/pages/ai/index.tsx` | 给 AI 的结构化入口：项目定义、可核对事实、机器可读入口、修改边界 |

文档正文有中英两个版本：中文在 `src/content/docs/*.md`，英文在 `src/content/docs/en/*.md`（同名、同 `slug`，`group`/`order` 沿用中文文件的）。英文版缺失的篇目会回落中文正文，并在页面顶部标注「英文版还在翻译中」。博客按约定只写简体中文。

文档共 21 篇（中英各一套），分六组：

| 组 | 篇目 |
| --- | --- |
| 开始 | 安装与第一个工程 |
| 使用 | 导入 / 模板 / 素材、编译与诊断、PDF 与源码双向定位、写作模式与主题 |
| 参考 | 工程与文件、导出与 arXiv、AI 助手（可选）、快捷键、常见问题 |
| 开发 | 开发环境、进程与信任边界、渲染层、测试与冒烟、构建与发布 |
| AI 协作 | MCP：把工程交给 AI、给 AI 的二次开发指南 |
| 关于 | 关于 TeXPro、版权与许可 |

外壳在 `src/layouts/SiteLayout.tsx`：吸顶导航（移动端收进 Drawer）、页脚、回到顶部按钮。站点没有面向访客的外观配置面板——品牌色固定为 TeXPro 自己的赤陶色；亮/暗两套中性色由 `src/lib/theme.tsx` 在 `html[data-theme]` 上切换，默认跟随系统。

导航分两层，避免顶部堆成一排：

- **Header 只做页面切换**：logo、博客、文档、GitHub、下载按钮；不再放首页锚点。
- **右侧分段导航** `src/components/SectionRail.tsx`：≥1280px 固定在右侧，圆点常驻、标签在悬停或当前段落时浮现，滚动时按视口中线高亮；窄屏收起，抽屉里以「本页」分组列出同样十四段。

## 可信的说法与脚注

首页的每个说法都能点开出处：`src/data/claims.ts` 存六条 `{ id, file, href, note }`，`src/components/ClaimFootnote.tsx` 渲染正文上标，`Proof.tsx` 把它们排成一张 `[1]–[6]` 的参考文献表（780px、悬挂缩进、与打印稿同一样式）。四个仓库数字（89 / 87 / 16 / 21×2）作为首屏摘要放在 Hero 下面，字号 20px、字重 500，不放大也不加黑。

边界不藏：`Limits.tsx` 明确写「不做账号与权限 / 不做手机 App / 不做藏起源码的编辑器 / 不做账号体系与云同步」，`DataFlow.tsx` 画出整条链路只经过磁盘与本机进程。

## 交互件

| 位置 | 实现 | 行为 |
| --- | --- | --- |
| Header | 搜索按钮 / `⌘K` | `SearchDialog`：文档与博客同搜，↑↓ 选择、⏎ 打开 |
| Header | 键盘按钮 / `?` / `⌘/` | `ShortcutsDialog`：四组快捷键，输入框内不拦截 |
| Header | 月亮 / 太阳 | 亮暗切换，写 `localStorage['texpro:theme']`，默认跟随系统 |
| 首页 | `SectionRail` | 右侧圆点导航，≥1280px 显示，当前段落高亮 |
| 演示区 | `VisualDemo` | 点公式 / 表格 / 标题翻回源码，可一键还原 |
| 主题区 | `CompareSlider` | 拖动或 ←→ 对比 Studio 与 Night，`role="slider"` |
| 文档 | 代码块 | hover 出现「复制」，复制后按钮变「已复制」 |
| 博客 | 标签栏 | 按标签过滤，显示每个标签的篇数 |
| 页脚 | PWA | 浏览器支持时出现「安装到桌面」（`beforeinstallprompt`） |

## 机器可读

`scripts/gen-llms.mjs` 在 `dev` / `build` 前生成：

- `public/llms.txt` — 站点事实 + 21 篇文档 + 9 篇博客的纯文本索引；
- `public/llms-full.txt` — 全部中文文档正文拼接；
- `public/sitemap.xml`、`public/robots.txt`；
- `/ai` 页面把同样的信息排成可引用段落，`index.html` 里挂了 `rel="alternate" type="text/plain"`。

## 彩蛋页：Qwerty

- 路由 `/texpad`，用 `lazy(() => import('@/pages/easter'))` 单独分包：没有走到这一步，主包不含它的代码，`public/easter/texpad.webp` 也不会被请求（实测首页零次请求，点开后才拉取 105 KB 的 webp）。
- 入口是页脚的 `© 2026 TeXPro`：`RouterLink` 包住这七个字，`.foot-secret` 把颜色、下划线、光标全部设成 `inherit` / `none` / `text`，`transition: none`，hover 前后计算样式完全一致，点过也不留痕迹。
- 页面是一封写给仍在改稿的人的信（Qwerty 的独白，允许加粗与划掉的句子），版式沿用站点既有的 token 与字号，不引入第二套视觉；中文首行缩进两字、两端对齐，英文左对齐、按词断行，靠 `html[lang]` 区分。
- 页面是 Qwerty 写给仍在改稿的人的一封信，段落偏长、允许加粗与划掉句；正文里的 `\ref` / `\cite` 用行内代码样式标出。
- 底部是一段 Base64 文本，编码的是 `src/pages/easter/rose.tex`（一束主题色的 TikZ 玫瑰）；右上角「复制」按钮把原文整段写入剪贴板。页面不渲染这张图，也不写解码说明。
- 文案全部走 i18n（`src/i18n/en.ts` 的键就是中文原文），排版按 `html[lang]` 分开：中文首行缩进两字 + 两端对齐，英文 `--serif-latin` + 左对齐 + 按词断行；英文段落里的 `的 / 地 / 其实` 是刻意保留的语言样本。
- 页面自己写 `document.title = 'Qwerty · TeXPro'`，并临时插入 `<meta name="robots" content="noindex, nofollow">`，离开时移除。
- 不进 `llms.txt`、`llms-full.txt`、`sitemap.xml`：`scripts/gen-llms.mjs` 只遍历 `src/content/docs` 与 `src/content/blog`，站点级路由是手写列表，彩蛋不在其中。
- 头像插画由 GPT-Image 2.6 生成、作者提供。

## 打印：排成一篇 CTeX article

`@media print` 是一整套独立的版式，不是把网页压窄：

- 页头换成论文题头：居中主标题 + 「摘要」段（英文界面写 Abstract），版本行缩成小字；
- 各节自动编号（1、2…），标题左对齐，正文两端对齐、首行缩进两字，行距 1.72；
- 图片按 148mm 宽等比缩放、去掉阴影与边框；表格 `table-layout: fixed`，表头跨页重复，隔行浅灰；
- 引用编号上标保留，`证据` 一节整表按参考文献排版（编号 + 出处 + 结论，悬挂缩进），不另起卡片；
- 外链以「‹URL›」形式补在句末，正文里的链接不再依赖点击；
- 导航、页脚、侧栏、搜索、复制按钮、对照滑块全部隐藏，`@page` 留 24/22mm 页边距，A4 导出 13 页。

用 `Page.pdf({ format: 'A4', printBackground: true })` 可直接验证；注意低 DPI 位图预览里中文粗体偶尔会有重影，那是 Ghostscript 的栅格化假象，DOM 与 PDF 字体都是干净的。

## 中英双语

界面文案走 `src/i18n/`：`useT()` 查字典（键是中文原文，缺条目回落中文），`useLocalize()` 递归翻译数据数组里的字符串。Header 右上角的 `EN / 中文` 切换写入 `localStorage['texpro:locale']`，默认跟随浏览器语言。

- 站点外壳、首屏与各区块的文案都在 `src/i18n/en.ts` 里；新增文案时**同时补中英两条**。
- 文档：英文版放 `src/content/docs/en/`（与中文同 slug、同 order，21 篇齐全）；博客不翻译。
- `/blog` 只在英文界面下显示一句英文提示（Blog posts are written in Simplified Chinese only …）；中文界面不打扰。

## 开发博客（给 AI 协作者的位子）

`/blog` 只服务**开发 TeXPro 应用本体**的 AI：主进程与 IPC、渲染层（编辑器与界面）、编译与 SyncTeX、服务层、测试、打包发布。**产品页（`product-page/`）的开发与记录不写进这个博客**——包括参与产品页的 AI，包括写这份 README 的协作方。产品页自己的改动留在提交信息与这里的文档里。

约定写在页面上，也写在这里，并与仓库根目录的 [AGENTS.md](../AGENTS.md) 一起适用：

1. 每完成一次**应用本体**的用户可见功能更新，就在 `src/content/blog/` 新增一个文件，文件名 `YYYY-MM-DD-slug.md`；
2. front matter 至少包含 `title` / `date` / `summary` / `tags`（可选 `version` / `author`）；
3. 正文回答四件事：改了什么、为什么这么改、怎么验证、还欠什么；
4. 不重写旧文。改口就再写一篇，说明为什么改口——博客是日志，不是宣传页；
5. 范围之外的内容（产品页 / `product-page/` 的站点开发记录）不要写进来，它们不属于这份日志；
6. 只用项目自带解析器支持的语法（`##` / `###`、列表、代码块、引用、表格、行内代码与加粗），不新增 Markdown 依赖。

列表按 `date` 倒序，阅读时长按中文字数估算（`src/lib/markdown.ts` 的 `readingMinutes`）。新增文章不需要改组件：加一个 `.md` 文件就出现在列表里。

## 交互件

| 组件 | 位置 | 行为 |
| --- | --- | --- |
| `CompareSlider` | `src/components/CompareSlider.tsx` | Studio / Night 两张同文档截图的对照滑块：拖动分割线、聚焦后用 ← → 调整、Home / End 到两端 |
| 平台识别 | `src/lib/platform.ts` + `Download.tsx` | 首帧不猜，UA 解析出 mac / windows / linux 后高亮对应行，并在资产清单里按正则认领安装包 |
| 锚点跳转 | `src/lib/section.ts` | 导航与页脚共用：首页内平滑滚动，从文档页回来时先切路由再轮询等区块挂载 |
| `SectionRail` | `src/components/SectionRail.tsx` | 右侧页内分段导航：按滚动位置（视口 40% 线）取当前段落，只在首页渲染 |
| `SearchDialog` | `src/components/SearchDialog.tsx` | ⌘K / Ctrl+K 全站搜索：文档标题与摘要、博客文章，↑↓ 选择、⏎ 打开、Esc 关闭 |

模式预览用两张真实截图（`public/shots/focus.jpg`、`typewriter.jpg`），取自应用本身：聚焦模式下只有当前段落保持对比度，打字机模式下光标停在视线中央。

## 字体

全站思源宋体（Noto Serif SC），通过 jsDelivr 上的 Fontsource 包按字重加载，定义在 `index.html`：

| 字重 | 用途 |
| --- | --- |
| 400 | 正文 |
| 600 | 章节标题、表格与列表强调 |
| 700 | 加粗（正文里的 `**…**`） |
| 900 | 首屏主标题（`.hero-title`，Black） |

字体文件按 `unicode-range` 拆成中文子集，浏览器只下载页面实际用到的部分；`FONT_FAMILY` 在 `src/App.tsx` 里给了系统宋体与 `serif` 的兜底栈。

## 文档内容

文档用 Markdown 写，一篇文章一个文件，放在 `src/content/docs/`：

```markdown
---
slug: start          # 路由 /docs/start
title: 安装与第一个工程
group: 开始          # 左侧导航分组（开始 / 使用 / 参考 / 开发 / AI 协作 / 关于）
order: 1             # 排序
summary: 一句话摘要
---

## 准备环境

- macOS 13 及以上：下载 `.dmg`
```

解析器在 `src/lib/markdown.ts`（`splitFrontMatter` / `parseMarkdown` / `readingMinutes`），文档与博客共用；渲染器在 `src/components/MarkdownBlocks.tsx`（`MarkdownBlocks` / `inline` / `collectSections`）。支持的语法：`##` / `###` 标题、段落、`-` 列表、``` 代码块、`>` 提示块、任意列数的 `|` 表格、行内 `` `代码` ``、`**加粗**` 与 `[文字](/docs/xxx)` 链接。

`src/content/docs/index.ts` 与 `src/content/blog/index.ts` 各自用 `import.meta.glob` 在构建时把 `.md` 读进来。新增一篇文档不需要改任何组件：加一个 `.md` 文件即可；排序按 front matter 的 `order`，分组按 `GROUP_ORDER`。

## 版本号

版本号不在代码里写死，顺序是「构建期同步 → 运行期实时 → 快照兜底」：

1. `scripts/fetch-release.mjs` 在 `dev` / `build` 之前跑一次：先试 GitHub API，再退回 `releases.atom`，把版本写进 `src/config/release.json`。
2. 浏览器加载后 `useRelease()` 再试一次 `api.github.com`（结果在 `sessionStorage` 缓存 10 分钟）。能取到就用实时的。
3. 取不到（离线、403 限流、被拦截）就用构建期快照；连快照都没有时退回 `constants.ts` 的 `APP_VERSION`。

nightly 的版本号有两种形状，脚本都认：

- 新（2026-11 起）：tag 自带日期版本，如 `v0.1.0-20261109-Nightly`；同一天重跑会覆盖当天 tag 与安装包，不同日期保留独立版本。
- 旧：tag 固定叫 `nightly`，真实版本号只在安装包文件名里（`TeXPro-0.1.0-nightly.20261025-…`），只能从 `assets[].name` 解析。

所以版本号优先读 tag（`VERSION_RE`），读不到再退到资产名；`channel` 由 `prerelease` 与版本里的日期后缀共同判断。首屏徽标、下载区说明、页脚「关于」三处共用这份数据；窄屏徽标只显示主版本号。

## LaTeX 字标

首屏「让 LaTeX 像纸面一样好写」里的 LaTeX 不是手画的变形字，而是 KaTeX 排出来的 `\LaTeX`：

- `scripts/build-latex-mark.mjs` 在构建期用 KaTeX 渲染一次，把 HTML 写成 `src/components/latexMarkHtml.ts` 常量，所以首页不需要打包 KaTeX 运行时（省掉约 260 kB JS）。
- `src/components/LatexMark.tsx` 只负责 `role="img"` 语义与字号缩放；样式表 `katex/dist/katex.min.css` 与 KaTeX_Main 字体仍在（gzip 12 kB CSS + 一份字体）。
- KaTeX 默认按正文字号调紧字距，放到 40px 以上的标题里会挤在一起，脚本与组件里把四个负字距按比例收了一点（`-0.36em → -0.26em` 等）。

## 品牌与设计系统

- **品牌色 `#BC4F30`**：取自应用图标 `build/icon.svg` 的渐变中段（`#E1845F → #BC4F30 → #7C2B18`），配置在 `src/config/design.ts` 的 `BRAND_PRIMARY`。
- **标志**：`src/components/BrandMark.tsx` 复刻 `build/icon.svg`（渐变圆角底 + 奶油色 T + 桃色折角），`public/favicon.svg` 同源；字标 `TeXPro` 的「Pro」用品牌色。
- **纸面中性色**：`#F7F2EA` 底 / `#FFFCF7` 面 / `#EBE1D2` 描边 / `#2A231E` 正文，都在 `src/App.tsx` 的 token 里；`colorLink`、`colorInfo` 跟随品牌色。
- **减少卡片**：能力区是带细分隔线的规格表（`.feature-grid`），下载区是行式列表（`.download-row`），工作流说明只在左侧留 2px 竖线（`.mini-block`）；卡片只留在真正需要浮起的截图上。
- 所有颜色走 antd token（`theme.useToken()`）或 CSS 变量 `--site-brand / --site-border / --site-bg`，页面里没有硬编码主题色；没有覆盖 `.ant-*` 深层选择器。

## 截图素材

`public/shots/` 里的六张图来自仓库根目录的 `artifacts/`，是 TeXPro 真实运行的窗口截图（同一份 `main.tex`），已转成 Web 用 JPEG：

| 文件 | 来源 | 用途 |
| --- | --- | --- |
| `hero.jpg` | `artifacts/smoke.png` | 首屏 |
| `table.jpg` | `artifacts/writing-table-studio.png` | 场景一 |
| `diagram.jpg` | `artifacts/writing-diagram-studio.png` | 场景二 |
| `theme-studio/night/paper.jpg` | `artifacts/writing-color-*.png` | 主题切换与对照滑块 |
| `focus.jpg` | 应用实拍（CDP 驱动，聚焦模式） | 写作模式预览 |
| `typewriter.jpg` | 应用实拍（CDP 驱动，打字机模式） | 写作模式预览 |

`docs/preview/` 里是页面自身的截图（桌面首页、文档页、移动端），供评审时对照。

## 外链

`src/config/constants.ts` 的 `SITE_LINKS` 指向真实仓库 `https://github.com/lzhbhlrPython/TexStudioPro`（仓库 / Releases / Issues / LICENSE），页面其它位置没有写死 URL。下载行的按钮统一指向 Releases；「从源码运行」与页脚「使用文档」走站内 `/docs/dev-setup` 与 `/docs`。

## 下载：从首页跳到独立页面

- 首页下载区的每一行不再是外链，而是 `navigate('/download?platform=…')`；页面顶部「回到下载区」回到 `/#download`。
- `/download`（`src/pages/download/index.tsx`）：标题「你的 LaTeX 编辑器正在路上」，先是三阶段进度（核对版本 → 准备安装包 → 准备完成，520ms / 1180ms 两段推进，`aria-live="polite"`），再是主安装包卡片（文件名 / 体积 / 立即下载），然后「同一个平台的其它格式」「装好之后的四步」。
- 变体数据在 `src/data/site.ts` 的 `DownloadTarget.variants`：mac = DMG / ZIP，Windows = EXE / Portable / ZIP，Linux = AppImage / deb / rpm；页面会过滤掉与主卡片相同的那一档，只在「其它格式」里列真正不同的。
- 页面入场用 `dl-page-in`（`opacity 0→1`、`translateY(8px)→0`），子块按 60ms 一档，`prefers-reduced-motion` 下关闭；实心主按钮不做下划线动效，只有图标下沉与按下缩放。
- 早先的侧边抽屉（`DownloadSheet`）已删除，功能与首页下载区重复。

## 下载按钮动效

- `.dl-cta`：hover 时下载图标下沉 2px，按下 `translateY(1px) scale(0.99)`，全部走 `--dur-quick/base` 与 `--ease-out`，`prefers-reduced-motion` 下自动降级。
- 下划线展开只给描边 / 文字按钮（`.dl-cta:not(.ant-btn-primary)`）；实心主按钮不画线。

## 首屏数字与引用

- 四个数字（89 / 87 / 16 / 21×2）在首屏底部，思源宋体 Black、`34px`，数字与标签上下居中。
- 标签末尾的上标 `7–10` 复用正文的 `.claim-ref` 样式，链接到 `#ref-7`…`#ref-10`；参考文献表铺满版心，`:target` 行有浅色高亮。

## 动效

克制、一次性、可关闭，**全站共用一套参数**（`src/styles/global.css` 顶部的变量）：

| 变量 | 值 | 用在哪 |
| --- | --- | --- |
| `--ease-out` | `cubic-bezier(.22,.61,.36,1)` | 所有进场与悬停 |
| `--dur-quick` | 160ms | 颜色、下划线、底色的悬停 |
| `--dur-base` | 240ms | 升起的悬停、切篇、切主题 |
| `--dur-enter` | 460ms | 首屏与 `Reveal` 的进场 |
| `--rise` | 12px | 所有「从下往上」的位移，只此一个值 |

- `Reveal`：进入视口淡入上移一次，同屏多条按 `index * 60ms` 错开（能力、下载、模式、流程、迁移、博客列表统一 60ms）
- 首屏：`.hero-copy > *` 每段延迟 50ms 递增，截图晚 140ms 起身；与 `Reveal` 同一套 `--rise` / `--dur-enter`
- 章节标题：`SectionHeading` 自身包在 `Reveal` 里，滚到标题时与正文同一节奏出现
- 导航：悬停/当前项用 `::after` 画 1px 下划线，`transform: scaleX` 从左侧展开
- 截图框：悬停上移 3px 并加深阴影，不缩放图片（避免正文发虚）；`--dur-base`
- 主题切换：`theme-in` 只做 160ms 的淡入，不缩放也不位移（换的只是一张图）
- 证据：`Reveal` 逐行 60ms 错开，每行的分隔线用 `scaleX` 从左画出，与文字同节奏
- 全部动效在 `prefers-reduced-motion: reduce` 下由一条全局规则压到 0.01ms，进入类元素直接可见

## 组件复用记录

- 复用 antd：`ConfigProvider` / `App` / `Button` / `Space` / `Flex` / `Table` / `Steps` / `Segmented` / `Drawer` / `Divider` / `Typography` / `AutoComplete` / `Modal` / `Tag` / `FloatButton.BackTop` / `Grid`。
- 复用第三方：KaTeX（只用于首屏字标，见上一节）。
- 自定义（都在 `src/components/`，均使用 token）：`BrandMark`（品牌图标）、`ScreenshotFrame`（截图框，带 `width/height` 预留位置，避免图片加载导致的布局跳动）、`SectionHeading`（眉标 + 标题 + 描述，字号用内联 `clamp` 覆盖 Typography 默认值）、`Reveal`（IntersectionObserver 一次性淡入，`prefers-reduced-motion` 与打印下直接可见）、`LatexMark`（KaTeX 字标）、`MarkdownBlocks`（文档与博客共用的正文渲染器：标题 / 段落 / 列表 / 代码 / 提示 / 表格 / 行内标记）。
- 文档页与博客共用同一套轻量类（`.docs-p` / `.docs-section-title` / `.docs-table` 等），没有引入第二个 UI 库，也没有引入 Markdown 渲染依赖。

## 已验证

- `pnpm typecheck`、`pnpm build` 通过；当前产物：CSS 59.8 kB、入口 JS 432 kB、antd vendor 1.07 MB、React vendor 90.7 kB；`dist/` 内含 `feed.xml`、`feed.json`、`manifest.webmanifest`、`sw.js`。
- `check-antd-docs.mjs`：项目 antd 6.7.0 与技能文档快照一致（36 个组件）。
- `npx @ant-design/cli lint ./src`：`Scanned 50 files. No issues found.`
- 浏览器实测（Playwright + Chrome for Testing）：1440 / 390 两个宽度无横向溢出，控制台无报错与 antd 弃用告警；字体实际生效（`document.fonts.check("600 16px 'Noto Serif SC'") === true`）；首页锚点、跨页锚点（含从文档页点页脚「数据流向」回到首页）、文档导航（窄屏横向目录自动居中当前项）、主题 Segmented、对照滑块拖拽与键盘、移动端 Drawer、文档表格横滑、⌘K 搜索、版本号兜底、下载区平台识别与资产链接、证据行进场与行线绘制、写作模式清单、Service Worker 注册均正常。

## 订阅与离线

- `scripts/gen-feed.mjs` 从 `src/content/blog/*.md` 生成 `public/feed.xml`（RSS 2.0）与 `public/feed.json`（JSON Feed 1.1），只含标题、摘要、标签与链接；`dev` / `build` 都会先跑它，也可单独 `pnpm feed:build`。
- `src/main.tsx` 按 `BASE_URL` 在 `<head>` 注入 `manifest.webmanifest` 与 `feed.xml` 的 alternate 链接，兼容 Pages 子路径。
- `public/sw.js` 是运行时缓存的 Service Worker：安装时缓存外壳，导航请求网络优先并回落到缓存，其余同源资源缓存优先。生产构建注册，开发环境不注册（避免缓存干扰热更新）。

## 许可

与应用同仓库、同 MIT 许可；版权与第三方依赖清单见站内 `/docs/copyright` 与仓库根目录 `LICENSE`。

> 本站沿用模板的构建脚手架，但没有中后台外壳：登录、权限、菜单、页面容器、外观设计面板都已移除，只保留门户需要的导航与页脚。

## 写作约定（只在这里，不上页面）

给所有写内容的人与 AI。这些规则**不放在前端**——页面是给读者看的，约束是给自己人看的。

1. **只改内容**：`src/content/docs/**` 与 `src/content/blog/**`。页面结构、样式、组件、路由都不动，版式由人决定。
2. **文档中英成对**：同一个 `slug`、同一个 `order`；中文在 `src/content/docs/`，英文在 `src/content/docs/en/`。缺译文会回落中文并在页头标注。
3. **博客只写简体中文**，页面只在英文界面下显示提示；内容只记录 TeXPro 应用本体的开发（主进程与 IPC、渲染层、编译与 SyncTeX、服务层、测试、发布）。产品页自己的改动不写进博客。
4. **只用解析器支持的语法**：`##` / `###`、段落、`-` 列表、代码块、`>` 提示、`|` 表格、行内 `` `代码` ``、`**加粗**`、`[文字](/docs/xxx)`。不引入 Markdown 依赖，不写解析器不认识的东西。
5. **改完自检**：`pnpm check:layout` 必须输出「版式未动」。它报错说明你动了不该动的地方，别用 `layout:update` 掩盖——那条命令是给人改完版式后重建基线用的。
