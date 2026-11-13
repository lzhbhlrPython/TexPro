# npm／yarn 扩展管理技术方案

面向使用者的完整操作步骤见官网[用 npm／yarn 管理扩展](https://texpro.pyliubaolin.top/docs/extension-package-management)，包括进入工作目录、三种包管理器命令、应用内确认和常见问题。本文记录实现契约，不替代该教程。

## 职责与交互层级

包管理器管理专用目录中的声明式依赖、真实版本和锁文件；TeXPro 管理受检副本、信任、启停与数据。作者构建属于按需的命令行工具流程，安装与同步审核复用现有 L2「扩展」，没有市场、新页面或后台自动更新。核心入口是 qwertysay 的无参数引导；以下完整命令用于复现与自动化。

## 分发与下载

.tpp／.tpt 分发兼容路径使用 `package.json` 的 `texpro.package` 指向唯一 `.tpp` 插件或 `.tpt` 主题，例如 `"texpro": { "package": "dist/example.tpp" }`。qwertysay 的「创建 npm 分发包」可从已校验安装包生成独立目录与 LICENSE；不代替作者发布授权。包后缀由实际贡献决定，语言包为 `.tpp`；最简强调色主题仍只需清单和 LICENSE。

「从 npm 获取扩展」直接读取公开 npm HTTPS 元数据及归档，要求 SHA-512 完整性、包名与版本一致，并支持唯一声明的安装包或可直接运行的源码载荷，并复用 SDK 校验。拒绝其他 registry、重定向、链接、扩展 tar 头及越界文件，不执行 npm 安装、依赖或脚本。下载不等于安装，更不等于启用；文件交给现有安装审核，也可稍后手动选择。

## 直接发布源码与显式本地构建

SDK 0.4.0、qwertysay 0.5.0 与对应宿主增加源码路径，不要求 npm 包内先生成 .tpp／.tpt。`texpro.source` 指向包内目录，省略时使用 npm 根目录，不能与 texpro.package 共存。清单和 LICENSE 必须存在。无构建配置时直接校验自包含 JavaScript、静态主题或声明式贡献；运行时依赖不复制 node_modules，作者需打包或提供包内相对模块。高级主题仍只有静态 CSS 进入宿主；最简配色主题不增加构建要求。

有 qwertysay.build.json 时，sync 只读检测并要求 prepare，不自动构建。无参数引导选择「构建已安装的源码扩展」，确认源包与风险；自动化为 `qwertysay prepare <environment> <npm-name> --trust-build`。未传信任参数时不安装、不构建。编译器保持 CLI 内，不引入 Electron 或 MCP。

prepare 复制受限源码到临时目录，按环境所选 npm／yarn 安装 devDependencies，移除根安装脚本、workspaces 与脚本豁免，默认禁用生命周期；未单独信任安装脚本时，现代 yarn 额外跳过 build 阶段。随后复用已有语言／样式工具链构建。Java／sbt／Go／GopherJS／Thematic CSS 等工具需用户先安装；依赖安装脚本的编译器也须另行审核安装，不能悄悄放开脚本。顶层扩展锁不等于编译依赖完整锁定；作者需提供工具链可复现说明。

构建检查源身份和源码指纹未变后，把经过完整校验的归档写入 npm 包内 `.texpro-prepared/<sourceDigest>.tpp|tpt`。失败不产生新版本产物；源码改变后不复用旧缓存。临时目录清理不等于安全隔离，也无法撤销任意构建代码的外部影响。

CLI 和宿主共用 SDK 的 npmSource／readNpmExtension／sourceFingerprint。宿主重新解析 npm 元数据、路径、锁及文件摘要；源码目录安装成普通受检副本，保留环境归属但不标记开发热重载。修改 node_modules 不自动改变启用中的副本。

MCP 的 texpro_extension_capabilities 描述源码字段与显式构建；texpro_inspect_extension 可只读检查未构建源码并返回 requiresBuild、源码摘要与风险，不运行 npm／yarn、编译或插件。不能把检查输出当作可信认证。

## 专用扩展环境

通过引导选择「创建 npm／yarn 扩展管理环境」，生成独立目录、随机环境身份、私有 package.json 与包管理配置。使用运行环境已安装的 npm／yarn；不自动安装包管理器。现代 yarn 采用 node_modules，PnP 不在本轮范围。不要把 TeX 工程、TeXPro 源码依赖与用户扩展环境混在一起。

```sh
npx --package @texpro/qwertysay@0.4.1 qwertysay
```

npm 环境的实际操作：

```sh
npm install --ignore-scripts
npm install --ignore-scripts @author/my-extension@1.0.0
npm run sync:extensions
npm uninstall --ignore-scripts @author/my-extension
npm run sync:extensions
```

yarn 环境的实际操作：

```sh
yarn install --ignore-scripts
yarn add --ignore-scripts @author/my-extension@1.0.0
yarn run sync:extensions
yarn remove --ignore-scripts @author/my-extension
yarn run sync:extensions
```

上述 `--ignore-scripts` 是 yarn Classic 参数。现代 yarn 配置已生成 `enableScripts: false` 与 `nodeLinker: node-modules`，添加时使用 `yarn add @author/my-extension@1.0.0`；不要向现代 yarn 传 Classic 参数。yarn Classic 安装也显式添加 `--ignore-scripts`，因为它不会读取现代 YAML 设置。包名为作者自己的实际分发包；示例包不是现存服务。简中官方包为 `@texpro/extension-translate-zh-cn`，应用已有预装副本时同摘要不会重复安装。

只保留一种锁文件并提交，复现使用 npm ci 或对应 yarn 的冻结锁安装。环境中的 dependencies 专供扩展分发包，开发工具放 devDependencies。缺包、非扩展依赖、混用锁文件或损坏归档均失败，不把缺少 node_modules 当作卸载全部。离线时可同步已经完整安装的依赖，不隐式联网。

## 同步、更新与卸载

`sync` 读取显式 dependencies、包内元数据与安装包，不 require 扩展、不运行构建。生成本地审核计划，记录环境身份、路径、锁摘要、实际版本、插件 ID 与归档摘要，并交给 TeXPro。宿主独立复验，不信任计划内容。Windows／Linux 自动定位失败时设置 `TEXPRO_APP_PATH` 为 TeXPro 可执行文件，或按 CLI 输出用 `--extension-sync` 打开该计划；macOS 使用应用名称启动。输出路径含空格时作为单独参数传递。

「审核包管理器变更」逐项显示包名、版本与请求能力。新增和更新点「安装并保持停用」，之后单独启用；代码和自定义样式保留显式信任。`npm update`／`yarn up`（Classic 用 `yarn upgrade`）修改包后重新同步；不同摘要更新副本并保留上一版本，不能沿用旧代码的启用授权。

`npm uninstall`／`yarn remove` 先改变环境依赖，再同步。只有该环境拥有的已安装记录会出现「卸载」。人工确认后停止进程并移除副本，默认保留插件数据。手动安装和其他环境拥有的记录不能被接管；欲迁移先在应用卸载原副本，数据仍保留。中文更新被卸载后恢复停用的预装副本。

同步不是隐式观察器：修改依赖后不运行 sync，宿主副本保持原样。每项写入前重新检查环境、锁、包与摘要，失效则失败并要求重新同步。多项按用户逐项确认，成功项保留；失败项不会伪称整批事务成功。取消不继续操作，关闭审核不撤销已经确认的项。不要直接编辑宿主 installed.json 或用包管理器删除插件数据。

## 安全与验收

npm／yarn 自身及选用工具是开发者信任的代码；环境配置禁用扩展生命周期脚本，不能把用户绕过配置后的安装称为沙箱。宿主不会执行扩展 npm 的 postinstall，Node 插件启用后仍有当前用户文件、网络与进程权限；主题和语言包都可能伪装界面。完整性摘要证明字节一致，不证明作者可信。

测试覆盖 npm／yarn 两套环境、含空格路径、混合锁、缺失与损坏包、陈旧计划、手动与跨环境所有权、更新停用、卸载保留数据及启动参数。MCP 只读描述语言／分发格式和校验归档，不获得安装、卸载或启用接口。真实系统启动、真实 npm／yarn 安装、完整基线及发布状态分别报告。

编译依赖安装脚本默认禁用。需要此类安装器时，qwertysay prepare 引导提供独立的、默认拒绝的信任选择；自动化须同时传 --trust-build 与 --trust-install-scripts。允许后第三方编译依赖安装脚本以用户权限运行，仅作用于本次临时构建，不改扩展环境的脚本禁用设置。缺少外部 Java／Go 等工具仍须自行安装。不得把同意构建等同于同意安装脚本。

Compiler dependency lifecycle scripts are disabled by default. The prepare wizard offers a separate, default-deny trust choice; automation requires both --trust-build and --trust-install-scripts. Allowing them executes third-party dependency installers with user permissions for this temporary build only, without changing extension environment settings. External Java/Go tools still require installation. Build trust alone never grants installer-script trust.
