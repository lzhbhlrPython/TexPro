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

## Nightly 与正式版

Nightly 每日 Asia/Shanghai 21:23（UTC 13:23，cron `23 13 * * *`）检查 main，也保留手动入口。相对上一次成功公开且含安装包的 Nightly 标签，只要有新提交就构建；空提交、合并和旧时间戳提交均计入。不按当天窗口过滤。无新提交跳过；首次无 Nightly 构建现有历史；API、缺失标签或非祖先历史异常明确失败。失败不会推进成功基线，下次仍会重试。

Nightly 与正式版共用 `_release-build.yml`：固定源码 SHA 和版本，运行完整回归（零跳过／TODO）、类型检查与构建，再分别打包 macOS universal DMG／ZIP、Windows x64 NSIS／portable／ZIP、Linux x64 AppImage／deb／rpm。打包器使用 `--publish never`，保留打包前和真实 ASAR 后校验。三平台均成功后，Nightly 上传草稿、更新当天日期标签并公开预发布，再刷新官网。所有发布共用 `texpro-release` 排队锁，不取消正在发布的版本。

## 手动发布正式版本

在 Actions 选择 **Release major**、**Release minor** 或 **Release patch**，选择 main 并运行。它们分别产生 X+1.0.0、X.Y+1.0、X.Y.Z+1，复用 `_release-stable.yml`，不会直接发布 npm SDK。

所有测试和三平台打包完成后，才确认 main 仍是受测源码，并原子推送根 `package.json`／`package-lock.json` 的版本提交和 `vX.X.X` 标签。main 若已变化则拒绝发布，需以最新代码开启新运行，不能强推。标签不可覆盖；上传资产期间保持草稿，完整后才公开正式 Release，并刷新官网[正式版本列表](/releases)。上传或官网刷新失败时可重跑同一次 Actions；已提交的版本不会再次递增，已公开版本不重复上传。不要为修复同一上传失败另开一次版本递增运行。GitHub 分支／标签保护或环境审核仍可能要求仓库管理员处理。

## 版本号

`release-version.cjs` 计算三段正式版本并同步根 package 与 lock，SDK／qwertysay 的版本独立。之后 Nightly 自动读取新基础版本，生成 `v{基础版本}-YYYYMMDD-Nightly`；包内无 v，日期只计算一次传给平台。同日 Nightly 更新当天标签与资产，不同日期保留独立记录。

```bash
npm run nightly:version
```

`set-nightly-version.mjs` 支持 `NIGHTLY_DATE=YYYYMMDD` 和 `--dry-run`。Nightly 仅修改构建 checkout，不向 main 提交日期版本，也不递增正式版本。21:23 是检查计划，Actions 排队可能延后。

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

Nightly／正式版发布成功后显式 dispatch Product page 工作流，传入准确标签；跳过或失败不刷新。指定标签获取失败必须停止构建，不能部署旧版本并宣称更新。普通官网构建离线时才允许旧快照。

产品页路径变化也会构建 Pages；PR 只验证，main 才部署。本地构建不能证明已上线，详见仓库 docs/product-page-deployment.md。
