# 产品页构建与发布

`product-page/` 独立使用 pnpm，不参与 Electron 打包。工作流位于
`.github/workflows/product-page.yml`。

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
pnpm exec vite preview --host 127.0.0.1
```

访问预览服务器的 `/TexStudioPro/`。普通本地开发不设环境变量即可使用 `/`。
工作流将入口复制为 `404.html`，供 Pages 在直接访问客户端路由时载入应用；
GitHub Pages 的此类回退仍返回 HTTP 404，新增需要搜索引擎索引的页面时应改为静态预渲染。
