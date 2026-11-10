---
slug: dev-setup
title: Development setup
group: 开发
order: 10
summary: Install dependencies, run the desktop app and website, and choose checks for your change.
---

## Requirements

CI uses Node.js 22. Check workflows and lockfiles for exact tool versions. Use npm for the desktop app and pnpm for the website. Real TeX compilation requires TeX Live or MacTeX, latexmk, the selected engine, and synctex. Without TeX you can inspect source and build the interface, but cannot claim to have verified compilation.

## Run the desktop app

From the repository root:

```sh
npm ci
npm run dev
```

Vite serves the renderer; Electron supplies native services. Restart the development process after changing electron files. Build the production renderer with `npm run build` and launch it with `npm start`.

## Run the website

```sh
cd product-page
pnpm install --frozen-lockfile
pnpm dev
```

The website is independent of desktop packaging. Vite's contentFiles plugin generates discovery files. Do not edit dist or generated llms and feed files manually.

## Troubleshoot

| Symptom | Check |
| --- | --- |
| Blank Electron window | Vite address, terminal errors and dist entry; preserve process isolation |
| Compiler not found | Local TeX installation, selected engine and GUI process PATH |
| Ambiguous main file | rootFile configuration and documentclass candidates; do not substitute the active tab |
| Native change has no effect | Restart Electron; renderer hot reload does not reload native services |
| Missing module in a package | asarUnpack, release resource list and external Node dependencies |

## Continue development

Read AGENTS.md, PRODUCT.md, DESIGN.md and docs/README.md first. See [architecture](/docs/dev-arch), [testing](/docs/dev-testing) and [session handoff](/docs/dev-handoff).

The renderer uses TypeScript and ES modules. Native services primarily use cjs; the MCP entry and shared pure modules also use mjs. Do not treat the entire electron or mcp directory as CommonJS. Maintain interface copy in both languages.
