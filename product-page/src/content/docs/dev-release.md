---
slug: dev-release
title: 构建与发布
group: 开发
order: 14
summary: 打包配置全在 package.json 的 build 字段：mac 出 universal DMG 与 zip，Windows 出 NSIS、免安装 exe 与 zip，Linux 出 AppImage、deb、rpm。nightly 由 GitHub Actions 每天生成。
---

## 这一层是什么

发布由两段拼起来：本地的 `electron-builder` 配置，和 `.github/workflows/nightly.yml` 的自动化。前者决定包里有什么、产物叫什么；后者决定什么时候打、打完发到哪。两者共用 `scripts/` 下的校验与版本脚本。

没有单独的 electron-builder 配置文件，全部在根目录 `package.json` 的 `build` 字段里。

## 包的身份

```json
{
  "appId": "dev.texpro.app",
  "productName": "TeXPro",
  "artifactName": "${productName}-${version}-${os}-${arch}.${ext}",
  "directories": { "output": "release", "buildResources": "build" }
}
```

`files` 是白名单，只有 `dist/**`、`electron/**`、`mcp/**`、`demo/**`、`build/icon.*` 与 `package.json` 进包；排除项里显式去掉了 `node_modules/@napi-rs/canvas/**` 与 `.playwright-mcp/**`。源码、`tests/`、`scripts/`、`artifacts/` 都不进包。

**必须留在 asar 外的有 9 项**，写在 `asarUnpack`：

| 路径 | 原因 |
| --- | --- |
| `mcp/**` | MCP server 用普通 Node 启动，不能依赖 Electron 的 asar 加载 |
| `electron/services/tex.cjs` | 被按路径 spawn 或 require |
| `electron/services/history.cjs` | 同上 |
| `electron/services/git.cjs` | 同上 |
| `electron/services/project-files.cjs` | 同上 |
| `electron/services/project-root.cjs` | 同上 |
| `electron/services/project-operations.cjs` | 同上 |
| `electron/services/font-report.cjs` | 同上 |
| `electron/services/music.cjs` | 同上 |

漏一项的表现是「本地开发正常，装出来的包报模块找不到」。

## 平台与产物名

| 脚本 | 实际命令 | 产物 |
| --- | --- | --- |
| `npm run package` | `electron-builder --mac --dir` | `release/mac-arm64/TeXPro.app`，未签名，调试用 |
| `npm run package:mac` | `electron-builder --mac --universal` | `TeXPro-<version>-mac-universal.dmg` 与同名 zip |
| `npm run package:win` | `electron-builder --win nsis portable zip --x64` | `TeXPro-<version>-windows-x64-setup.exe`、`-portable.exe`、zip |
| `npm run package:linux` | `electron-builder --linux AppImage deb rpm --x64` | `TeXPro-<version>-linux-x64.AppImage`、`.deb`、`.rpm` |

Windows 的两个安装器在 `build.nsis` 与 `build.portable` 里覆盖了 `artifactName`，其余平台沿用顶层模板。所有命令都先 `npm run build`，产物落在 `release/`。

跨平台打包不推荐：NSIS 与 AppImage 在各自平台上最稳，交叉打包需要额外工具链，CI 也是三平台分开跑的。

## nightly 工作流

`.github/workflows/nightly.yml` 由 `schedule: cron '17 3 * * *'`（03:17 UTC，11:17 北京时间，特意避开整点）与 `workflow_dispatch` 触发，`concurrency` 组是 `nightly-release`，新任务取消旧任务。

| job | 平台 | 做什么 |
| --- | --- | --- |
| `changes` | ubuntu | 跑 `nightly-changes.cjs`，判断今天有没有带文件变更的提交，输出 `build` |
| `test` | ubuntu | `npm ci`、`test:regression`、`typecheck`、`build` |
| `macos` | macos-latest | 设版本、build、verify、`--mac --universal`，上传 dmg 与 zip |
| `windows` | windows-latest | 同上，`--win nsis portable zip --x64` |
| `linux` | ubuntu-latest | 先装 `fakeroot rpm libarchive-tools`，再 `--linux AppImage deb rpm --x64` |
| `release` | ubuntu | 汇总三平台产物，发当天日期 tag（`v0.1.0-20261109-Nightly`）的 pre-release |

`test` 失败则三个打包 job 都不跑；`release` 只在 main 分支执行，用 `softprops/action-gh-release@v2` 覆盖同名资产。所有包都未签名：CI 里 `CSC_IDENTITY_AUTO_DISCOVERY` 设为 `false`。

## 版本号

nightly 版本由脚本算，不是手改：

```bash
npm run nightly:version
```

`set-nightly-version.mjs` 导出 `nightlyVersion(version, date)`：从 `package.json` 的版本里剥掉旧的 nightly 后缀（`-nightly.20261025` 或 `-20261109-Nightly`）得到 base，再拼上日期：`${base}-${YYYYMMDD}-Nightly`。日期按 `Asia/Shanghai` 当天算，可以用 `NIGHTLY_DATE` 覆盖；`--dry-run` 只打印不动文件。同时同步 `package-lock.json` 的 `version` 与 `packages[''].version`（lock 不存在就跳过）。

`nightly-changes.cjs` 决定要不要发：按 `Asia/Shanghai` 的当天窗口取 `git log --first-parent` 的提交，逐个用 `git diff --name-only`（根提交用 `diff-tree --root`）确认真的改了文件，全都没变更就跳过整条流水线，避免空转出一条同内容的 nightly。

## 发布校验

```bash
npm run verify:release
```

`scripts/verify-release.cjs` 是纯函数加 CLI，校验的是「产物内容」而不是「文件存在」：

- required 清单：`package.json`、`electron/main.cjs`、`electron/preload.cjs`、`electron/quit-watchdog.cjs`、`electron/window-close.cjs`、`mcp/server.mjs`、`dist/index.html`、8 个服务文件
- 从 `dist/index.html` 抽出引用的 `assets/*.js` 与 `*.css`，要求至少各一个且真实存在
- 要求存在 `dist/assets/pdf.worker.*.mjs`
- 禁止 `.ai-notes` 与 `superpowers` 路径混入
- 传目录时遍历 `dist/`、`electron/`、`mcp/`；传 `.asar` 时用 `@electron/asar` 的 `listPackage` 与 `extractFile` 读真实包内容
- 额外检查 `app.asar.unpacked` 下的 `mcp/server.mjs` 与 8 个服务

失败会打印 `[release] <原因>` 并以退出码 1 结束。`@electron/asar` 是 devDependency，校验脚本本身不进包。

## 打包前后的两道闸

`build.beforePack` 与 `build.afterPack` 指向两个小脚本，各自只做一件事：

```js
// scripts/before-pack.cjs
const result = verifyDirectory(context.packager.projectDir);
// scripts/after-pack.cjs
verifyPackagedApp(path.join(resources, 'app.asar'));
```

前者在打包前校验 `dist/`、`electron/`、`mcp/` 的实际待打包目录，后者读真实 ASAR 复核资源与外部 MCP 服务。它们和 `verify:release` 共用同一个校验模块，所以本地跑一次就等于预演了两道闸。

## 陷阱

- 新增服务文件却没加进 `asarUnpack` 与 `verify-release` 的 required：本地能跑，装完就崩
- 把 `.ai-notes/` 或调试截图放进 `electron/`：会被白名单带进包，校验直接拒
- 手改 `package.json` 的版本发 nightly：下一次 `nightly:version` 会以它为新 base，版本号越滚越乱
- 同一天重跑会用同一条 tag：`release` 会 `git tag --force` 并覆盖安装包，历史产物不会保留
- 在 Windows 上打 mac 包：universal 合并需要 macOS 工具链，CI 里也是分开的 job
- 把 build 产物 `dist/` 提交上去：CI 会重新 build，提交的产物只会制造冲突

## 验证

```bash
npm run build
npm run verify:release
npm run package -- --publish never
node scripts/verify-release.cjs release/mac-arm64/TeXPro.app/Contents/Resources/app.asar
```

最后一条用真实 ASAR 走一遍打包校验，是本地最接近用户的检查。签名、公证与更新通道都还没纳入仓库，发出去的包首次打开需要手动放行。CI 打包不等于运行时验收，界面回归见 `/docs/dev-testing`。

## 发布后的官网刷新

Nightly 发布成功后显式 dispatch Product page 工作流，传入准确标签；跳过或失败不刷新。指定标签获取失败必须停止构建，不能部署旧版本并宣称更新。普通官网构建离线时才允许旧快照。

产品页路径变化也会构建 Pages；PR 只验证，main 才部署。本地构建不能证明已上线，详见仓库 docs/product-page-deployment.md。
