# 官网翻译交接指引

本指南面向负责官网其他语种的第三方 AI 与维护者。程序主体开发侧维护简体中文博客，以及其他页面、界面文案和任务文档的简体中文／英文双语；其他语种的接入、翻译、构建和验证由第三方 AI 完成。桌面声明式语言插件与官网语言系统相互独立，安装桌面 `.tpp` 不会翻译官网。

## 交接与职责

主体开发侧在功能变更时交付中英内容、受影响的翻译键／文档 slug／页面入口、对应界面文案来源、行为变化及验证方法。其他语种未同步时说明变化，不能直接覆写第三方译文或将复制中文视为已翻译。

第三方 AI 先核对 `AGENTS.md`、本指南、产品页 README 与实际源码，再接入目标语言。博客正文只维护简体中文，不要求翻译副本；其他语种界面应准确提示博客以简体中文撰写。不得复制业务组件或重写功能流程来增加一种语言。

## 独立入口与当前限制

| 范围 | 入口 | 交接规则 |
| --- | --- | --- |
| 官网界面 | `product-page/src/i18n/locales.ts`、`catalog.ts`、`index.tsx`、`messages/{zh,en}.json` | 使用 `useMessages` 与稳定语义 ID；中英都是独立 JSON。`useLocalizedFields` 明确列出文本字段，不递归翻译业务对象 |
| 官网任务文档 | `product-page/src/content/docs/index.ts`、`zh/`、`en/` 与 `eo/` | 各语种目录平级，保留同 slug、顺序和分组身份，各语言使用独立正文文件，缺译有明确提示 |
| 博客 | `product-page/src/content/blog/index.ts`、根目录 Markdown | 保留简体中文原文及历史日期；只翻译周围界面和语言提示 |
| 页面路由与资源 | `product-page/src/router/`、`vite.config.ts` | 保留现有路由与基路径约定，不以翻译标题替换稳定链接 |
| 机器可读内容 | `product-page/scripts/gen-llms.mjs`、`gen-feed.mjs`、Vite `contentFiles` | 修改源生成逻辑并重新构建，不手改生成文件 |

当前官网 `Locale`、文档 `topicsFor`／`navFor`、语言切换与自动检测接入 `zh`／`en`／`eo`；三语文档分别在平级的 `zh/`、`en/` 与 `eo/`，不自动发现其他语言。新增语种同样使用 `{locale}/`，不能在文档根目录放正文。日期、数字及语言条件分支也需要逐处核对，不能假设只剩中英两种。

官网导航已通过 LanguageSwitch 图标菜单读取 locales.ts 的注册项，显示 ISO 639-1 代码和自称；当前注册 zh、en 与 eo，HTML lang 分别为 zh-CN、en 与 eo。新增语种时先在该入口核对 ISO 语言代码、自称、HTML `lang` 与词典注册，再让现有翻译接口和文档加载入口读取该注册信息。复用页面与数据，不复制每种语言的业务状态、路由组件和解析器。选择器、持久化、浏览器语言匹配、文档回退、分组名称、日期／数字、Ant Design locale 与文字方向须一起验证；Ant Design 没有世界语语言包，eo 界面暂以 enUS 组件文案为准。

`gen-llms.mjs` 当前只聚合 `docs/zh/` 的简体中文正文；博客 feed 也来自简体中文文章。新增语种须明确哪些产物保持中文、哪些新增语言入口，并验证 sitemap、摘要、语言提示和 URL，不能将中文内容标为目标语种。世界语文档已接入正文与搜索，但上述机器可读产物仍以简体中文为准。

## 翻译内容要求

使用文档中的操作名称必须与目标语种真实界面一致。桌面英文源目录为 `packages/extension-sdk/lib/locale-source.json`，简体中文来源为 `packages/extension-translate-zh-cn/language/locales/zh.json`；其他桌面语种以对应语言插件为准。目标语种界面尚无翻译时，保留真实名称并解释，不编造按钮名称。

保留品牌、命令、路径、包名、API、协议标识、TeX 源码和配置键。字符串占位符名称保持一致；不要翻译或执行 Markdown 代码。保留文档 front matter 的 slug、order 与分组身份，只翻译展示字段和正文；新分组译名通过共享映射接入。

缺译回退须向读者标明实际正文语言，不能把简体中文或英文正文标记为翻译完成。禁止导入私人聊天、凭据或本地环境信息；保持现有纸面设计、组件和可访问性规范。

## 构建与验收

所有站点命令在 `product-page/` 运行，使用 pnpm 与站点锁文件：

```sh
pnpm install --frozen-lockfile
pnpm check:layout
pnpm typecheck
pnpm test:docs
pnpm build
pnpm check:layout
```

纯内容修改不更新版式基线。新增语言接入涉及壳层时，按任务授权核对实际改动，不能用 `layout:update` 掩盖失败。涉及行为变更还要遵守根 AGENTS.md 的完整基线要求。

检查中英原有路径、目标语言、缺译、首次自动选择和持久选择，覆盖桌面／窄屏、明暗主题、键盘、长文案以及必要时的从右向左排版。设置 `PAGES_BASE_PATH=/TexStudioPro` 构建并预览，核对资源和文档链接；生成真实预览图。报告实际执行命令与结果，区分本地构建、已推送和线上部署。

交接结果写明源码提交、目标语种、翻译键与文档覆盖、回退项、界面名称依据、预览图、验证结果及剩余限制。主体开发侧以后交付中英变更清单，第三方据此维护自己的语种，双方不覆盖彼此工作。

## 文档分区翻译

官网 `/docs`（使用文档）与 `/developers`（开发文档）分别提供任务入口，文章仍为 `/docs/:slug`。两个入口直接显示首篇文章，不维护独立首页文案；翻译文章标题、摘要、分组名称、搜索分区标签与跨区链接；保持文章 slug 和中文规范 group。开发／AI 协作归开发区，其余既有分组归使用区，英文与以后语种继承相同归属。不要把分区键翻译成新的路由或另建正文副本。验证两区的宽窄屏、明暗主题、前后篇与语言切换不改变当前文章地址。

## 短文案与整篇译文

改短文案的 JSON 值，不因措辞变动修改已有语义键；新增键在中英词典同轮补齐。新增语种在 locales.ts 注册自称与 HTML 标签，并在 catalog.ts 注册独立 JSON 资源，通过现有加载器按需请求，验证缓存、失败重试与过期切换。不要把中文值留在组件充当隐式回退。新长文本采用按需加载；现有文档索引仍使用构建时的 glob 聚合，不应误称整站文档正文已全部按需请求。

彩蛋长信位于 `src/content/letters/{语言}/qwerty.md`，文档仍为同 slug 整篇 Markdown。第三方维护完整译文，沿用 `LocalizedMarkdown`／`MarkdownBlocks` 与 Shiki；不为每段另建 UI 键，不运行 Markdown 中的脚本或 HTML。加载失败、缺译与实际正文语言必须准确提示。博客继续只维护简体中文。桌面语言包采用第 2 版语义键，旧正文键包必须重新制作，不能为迁就旧包恢复正文查词。

## 声明式语言接入

新增语言不修改 React、路由或生成器：在 `product-page/src/i18n/languages/{code}.json` 提交 `code`、`name`（自称）、`htmlLang`、`dateLocale`、`componentLocale`，在 `messages/{code}.json` 提交语义键译文，在 `src/content/docs/{code}/` 提交同 slug 的 Markdown。可逐篇提交，缺少 UI 键回退英文，缺少文章回退英文再中文，页面注明实际正文语言。空正文同样明确标注回退。

`componentLocale` 是统一组件库适配标识，目前支持 `zh_CN` 与 `en_US`；其他语言显式使用 `en_US`，不宣称组件库已有对应翻译。贡献者不需要修改业务代码。运行 `node scripts/check-locales.mjs`（工作目录 `product-page`）检查声明、语义键与插值变量；构建自动执行同一检查。世界语资源继续由翻译贡献者维护，新增宿主键缺译时按上述规则回退。

## 2026-11-14 更新交接

主体侧同步 zh/en 的首页下载区说明（`site.build.v.version.nightly.checks.for.new.commits.daily`）及 start、dev-design、dev-release：新增 GitHub 手动更新、可选 Nightly、兼容资产、错误重试、先保存退出再安装及同版本替换边界；设计篇补充 L0–L3 实例与页面判断。其他语种由对应维护者同步这三个同 slug 篇目，不覆盖其既有内容；此条不声明其他语种已完成。简体中文博客新增更新检查与 L0–L3 主题。

## 2026-11-14 应用内下载补充交接

zh/en 的 start、dev-release 和首页下载说明增加应用内下载、默认关闭的检查后自动下载、进度、取消、SHA256、文件定位和手动安装边界。其他语种由对应维护者同步。原来的浏览器入口继续保留，不把下载校验翻译为应用签名。
