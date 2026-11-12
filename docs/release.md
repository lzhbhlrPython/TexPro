# 应用版本与发布

Nightly 每日上海时间 21:23 检查相对上一次成功公开、含资产的 Nightly 的所有新提交；没有新提交则跳过。读取失败、标签缺失或非祖先历史明确失败。日期只用于命名，不再过滤当天提交。空提交、合并与旧时间戳提交计入。首次无 Nightly 时构建现有历史。

## 正式版本

首次正式版本为 **v0.1.0 · Tajpilo**（2026-11-12），说明见 [v0.1.0](releases/v0.1.0.md)。**0.1.x** 系列代号 **Tajpilo**，世界语“打字机”，统一来源为根 `release-series.json`；标题自动使用代号，SemVer、标签与安装包名不变。后续系列未配置时只显示版本，不继承旧代号。

首次发布当前基础版本，在 **Release patch** 勾选 `initial_release`；本次保持 0.1.0，而非递增至 0.1.1。默认关闭，后续 patch 正常递增。首次路径要求没有其他正式标签、版本与受测源码一致。版本已一致时允许带运行身份的空版本提交，供同一次运行安全重试。已有正式发布后不再使用首次选项。

发布器优先使用 `docs/releases/vX.Y.Z.md` 作为人工说明，缺失才自动生成。代号不加入标签，说明须写明变更、依赖、验证范围和限制。

在 main 手动运行 Release major／minor／patch，分别递增 X、Y、Z 并清零较低位。三个入口共用 `_release-stable.yml`，Nightly 与正式版共用 `_release-build.yml`；固定源码 SHA 和包内版本，完整回归零跳过／TODO、类型与构建通过后才运行三平台打包。`beforePack`／`afterPack` 与外部 MCP 依赖核验保留。

全部产物成功后，`publish-stable.cjs` 再检查 main 未前进，原子推送根 package／lock 的版本提交与不可覆盖的正式标签，再上传草稿并公开。并发 main 更新、权限或保护规则导致推送失败时不得强推。正式版不会递增 SDK／qwertysay；下一次 Nightly 自动读取新的基础版本。未签名状态不会因使用正式标签改变。

所有发布入口共用 `texpro-release` 锁且不取消运行。构建和打包失败不改版本；版本已推送后若上传失败，同一次 Actions 重跑以源码 SHA 与运行 ID 校验原有提交，复用版本、补全草稿，不能覆盖其他运行的正式标签。已公开版本重跑只补官网刷新。不要为同一失败另开一次递增；若 main 在打包期间前进且尚无版本提交，则应从新 main 开启新运行。人工修改 tag、分支保护、网络不可用等需检查远端实际状态。

## 官网联动

GitHub 的按标签查询接口可能对草稿返回 404，即使认证身份已经上传资产。发布器在此情况下分页查询认证可见的 Release 列表，并按准确标签定位草稿；上传后同样使用该查询检查资产。不能把草稿的 404 当作上传失败或重复创建新版本。首发曾在此处中止；核对版本提交、双语说明、八个资产及摘要后通过 Release ID 公开，再重跑同一次 Actions 完成官网刷新，保留原有标签与构建产物。

公开成功后显式 workflow_dispatch Product page，并传入准确 release_tag；Nightly 兼容 nightly_tag。普通 GITHUB_TOKEN 产生的 release 事件不作为隐式触发保证。正式版刷新要求列表存在准确版本及资产，失败不部署旧列表。官网 `/releases` 只列真实公开正式版，`/changelog` 展示当前构建。详见[部署说明](product-page-deployment.md)。

## 验证

`tests/stable-release.test.cjs` 使用临时裸 Git 远端验证原子提交／标签、同次重试、main 前进拒绝和独立包版本保留，以模拟 GitHub 响应验证草稿上传失败不会公开。`tests/nightly.test.cjs` 验证成功基线选择与提交范围；`tests/product-page-release.test.cjs` 验证准确版本、分页及失败回退。工作流另做 YAML 与 actionlint 检查；本地测试不等于远端三平台安装验收。

共享测试任务先安装三种 TeX 引擎、CTeX/Fandol 和所需宏包，再运行基线中的真实编译。首次远端运行发现标准 Ubuntu runner 缺少 pdflatex，发布被测试闸门阻止；应补齐工具链而非删除或跳过用例。

LuaLaTeX 中文还需要 texlive-lang-japanese 提供的 LuaTeX-ja；CI 显式安装并预检该宏包及 Fandol，不依赖推荐包被隐式安装。

macOS 保留 universal DMG／ZIP，`build.mac.mergeASARs: false` 避开上游工具将大量外部 Node 文件展开为超长 glob 的限制。当前两架构的 JavaScript ASAR 内容相同，不生成架构分派入口；两个架构及最终 universal 包均需通过原有 ASAR／外部 MCP 校验。若未来引入架构专属内容，必须重新验证此布局，不能跳过包内校验。本机实际 universal 目录打包、lipo 双架构检查和包外 Node MCP 启动用于验证此路径。

## 开发 Skill 发行资产

正式版和 Nightly 的 `_release-build.yml` 在完整测试、类型与构建通过后，用 `scripts/package-extension-skill.cjs` 打包整个 `skills/texpro-extension-development/`。资产为 `texpro-extension-development-v{应用版本}.skill`，内容是 ZIP 内的顶层 `texpro-extension-development/`、SKILL.md、agents 和所有引用资源；与该次构建的受测源码逐文件一致。脚本拒绝缺失引用、符号链接、私有／生成文件及重复覆盖，并输出 SHA-256。

归档作为独立构建产物，与三平台安装包一起下载并上传 Release。正式发布器要求该资产并再次校验源码内容，成功上传后才公开草稿；失败保持既有重试身份，不另起版本。Nightly 也通过共用构建获得同版本 Skill。Skill 的文件名使用应用版本；npm SDK／CLI／语言包版本各自独立，不随应用递增。旧公开版本不补造历史构建或覆盖安装包。
