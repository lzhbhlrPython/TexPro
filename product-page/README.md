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

## 版本信息

dev 和 build 先执行 fetch-release.mjs，刷新 src/config/release.json。普通构建可在离线或限流时沿用旧快照；显式 TEXPRO_RELEASE_TAG 必须取得准确 Release，失败就终止构建。CI 可更新旧入口 APP_VERSION，本地内容构建不改写 constants.ts。

运行期版本接口和构建快照见 src/lib/release.ts；最终下载以实际 GitHub Release 为准。不要把示例版本、历史统计或本机构建当成线上发布事实。

## 机器可读产物

vite.config.ts 的 contentFiles 插件在 buildStart 执行 gen-feed.mjs 与 gen-llms.mjs，直接使用 Vite 构建也会生成 feed、llms、sitemap 与 robots。不手改 public 下这些输出；更正文档后重新构建并检查生成 diff。

`release:sync`、`feed:build`、`llms:build` 用于单独刷新对应内容，`latex:mark` 用于更新预渲染字标。没有对应任务时不要重建字标或版式基线。

## 发布与验收

Pages 自动来源仅产品页路径变化与成功 Nightly 的准确 tag 刷新；PR 仅构建，main 才部署，保留手动入口。详见 [部署文档](../docs/product-page-deployment.md)。

内容交付核对中英 slug、站内链接、front matter、实际命令、生成产物、版式检查、类型与构建。壳层变更另验窄屏、主题、键盘、reduced motion 和子路径。dist、缓存、本地环境及私人记录沿用 .gitignore，不进入提交。
