# 应用版本与发布

Nightly 每日上海时间 21:23 检查相对上一次成功公开、含资产的 Nightly 的所有新提交；没有新提交则跳过。读取失败、标签缺失或非祖先历史明确失败。日期只用于命名，不再过滤当天提交。空提交、合并与旧时间戳提交计入。首次无 Nightly 时构建现有历史。

## 正式版本

在 main 手动运行 Release major／minor／patch，分别递增 X、Y、Z 并清零较低位。三个入口共用 `_release-stable.yml`，Nightly 与正式版共用 `_release-build.yml`；固定源码 SHA 和包内版本，完整回归零跳过／TODO、类型与构建通过后才运行三平台打包。`beforePack`／`afterPack` 与外部 MCP 依赖核验保留。

全部产物成功后，`publish-stable.cjs` 再检查 main 未前进，原子推送根 package／lock 的版本提交与不可覆盖的正式标签，再上传草稿并公开。并发 main 更新、权限或保护规则导致推送失败时不得强推。正式版不会递增 SDK／qwertysay；下一次 Nightly 自动读取新的基础版本。未签名状态不会因使用正式标签改变。

所有发布入口共用 `texpro-release` 锁且不取消运行。构建和打包失败不改版本；版本已推送后若上传失败，同一次 Actions 重跑以源码 SHA 与运行 ID 校验原有提交，复用版本、补全草稿，不能覆盖其他运行的正式标签。已公开版本重跑只补官网刷新。不要为同一失败另开一次递增；若 main 在打包期间前进且尚无版本提交，则应从新 main 开启新运行。人工修改 tag、分支保护、网络不可用等需检查远端实际状态。

## 官网联动

公开成功后显式 workflow_dispatch Product page，并传入准确 release_tag；Nightly 兼容 nightly_tag。普通 GITHUB_TOKEN 产生的 release 事件不作为隐式触发保证。正式版刷新要求列表存在准确版本及资产，失败不部署旧列表。官网 `/releases` 只列真实公开正式版，`/changelog` 展示当前构建。详见[部署说明](product-page-deployment.md)。

## 验证

`tests/stable-release.test.cjs` 使用临时裸 Git 远端验证原子提交／标签、同次重试、main 前进拒绝和独立包版本保留，以模拟 GitHub 响应验证草稿上传失败不会公开。`tests/nightly.test.cjs` 验证成功基线选择与提交范围；`tests/product-page-release.test.cjs` 验证准确版本、分页及失败回退。工作流另做 YAML 与 actionlint 检查；本地测试不等于远端三平台安装验收。
