# 产品页构建与发布

`product-page/` 独立使用 pnpm，不参与 Electron 打包。工作流位于
`.github/workflows/product-page.yml`。

- 自动触发路径仅为 `product-page/**`；应用、根文档、`AGENTS.md` 和工作流文件本身变更不单独触发 Pages。
- PR 修改产品页时，安装锁定依赖、检查 TypeScript 并构建，上传 Pages 产物供检查。
- `main` 上的产品页变更通过构建后，部署到 `github-pages` 环境。
- Actions 中可手动运行；只有 `main` 会发布，其他分支仅构建。

仓库管理员首次使用时，在 **Settings → Pages → Build and deployment → Source**
选择 **GitHub Actions**。如果环境要求人工批准，发布会等待该环境的审核。
部署地址以 Actions 的 `github-pages` 环境链接为准。

工作流使用 Node.js 22、pnpm 11.22.0 和 `pnpm install --frozen-lockfile`。
Pages 提供的 `base_path` 同时用于 Vite 资源路径和 React Router 的 `basename`，
可兼容项目站点 `/TexStudioPro/` 和自定义域名根目录。

本地复现项目子路径构建：

```sh
cd product-page
pnpm install --frozen-lockfile
PAGES_BASE_PATH=/TexStudioPro pnpm run build
PAGES_BASE_PATH=/TexStudioPro pnpm exec vite preview --host 127.0.0.1
```

访问预览服务器的 `/TexStudioPro/`。普通本地开发不设环境变量即可使用 `/`。
工作流将入口复制为 `404.html`，供 Pages 在直接访问客户端路由时载入应用；
GitHub Pages 的此类回退仍返回 HTTP 404，新增需要搜索引擎索引的页面时应改为静态预渲染。

## Nightly 版本刷新

Nightly 的 release job 在安装包上传并成功发布之后，以 `actions: write` 权限
显式 dispatch 产品页工作流，传入本次 `nightly_tag`。无有效变更而跳过 Nightly、
打包失败或发布失败时不会触发。不要依赖 `GITHUB_TOKEN` 创建 Release 自动启动
另一个 release 事件工作流。

Pages 构建调用 `product-page/scripts/fetch-release.mjs`，将准确标签传入
`TEXPRO_RELEASE_TAG`，从对应 Release 同步版本、安装包地址、体积和摘要到构建期快照，
同时更新此次 CI checkout 的 `APP_VERSION` 供旧版入口使用。指定标签同步失败时构建失败，
不会把旧版本当成新发布成功部署；普通构建离线仍可保留旧快照。
这些生成变更只用于构建，不提交回 Git，也不触发新的 Nightly。

产品页内容变更和 Nightly 版本刷新是两条允许的自动重建来源；手动入口继续保留。
构建和部署规则需要合并到 `main` 后才作用于定时发布。`main` 之外的手动构建不部署。

本地内容构建只刷新不受版式锁约束的版本快照，不改写 `constants.ts`；旧入口常量适配限定在 CI 构建中。
