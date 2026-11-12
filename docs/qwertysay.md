# qwertysay 引导式开发工具

独立包 @texpro/qwertysay 0.4.1，依赖公开 SDK 0.3.0，不依赖 Electron 或宿主源码；MIT，Baolin Liu（gardenialiu）。作者任务指南见[官网 qwertysay](https://texpro.pyliubaolin.top/docs/qwertysay)，中英同 slug。

## 交互与自动化边界

直接启动 qwertysay，以 Node readline 提供中英数字选择。lib/wizard.cjs 只收集并预览操作；确认后才调用既有 CLI/build/scaffold，不维护第二套校验或编译器。取消、EOF、Ctrl+C 不开始新操作。非 TTY 无参数时失败，完整旧参数保留给 CI 和 npm scripts。不要把伪造终端当作自动化默认。

创建引导包括插件/主题、目录、ID、作者、语言/样式；主题第一项为最简 token 配色，只输出清单和 LICENSE。所有写入共用防覆盖检查。普通模板要求明确安装依赖，再选择构建；check/pack 不执行作者代码。构建风险在确认前说明。源码及分发后缀、工具链和失败失效契约见[构建参考](extension-authoring.md)。

## 维护与验收

根 npm ci 后运行 node packages/qwertysay/bin/qwertysay.cjs；开发生成工程需同时安装本地 SDK 和 CLI 路径。包版本变更同步 packages/qwertysay/package.json 与根 npm lock 对应元数据，SDK 独立版本不递增。

运行 npm --prefix packages/qwertysay test，覆盖引导计划、真实创建/构建/归档、取消、非交互拒绝和防覆盖；另以真实 PTY 走通启动、输入及 Ctrl+C。完整语言/样式矩阵按 docs/extension-authoring.md 准备真实工具链后全部运行，不跳过。

发布前分别 npm pack 两个包，从临时目录执行根 npm run test:extensions:sdk:package -- /absolute/sdk.tgz /absolute/qwertysay.tgz，验证实际发行物的独立安装、引导模块、TS/JS/theme 构建和拒绝路径。发布后核对注册表版本、完整性与重新安装结果；本地 tarball 不等于 npm 发布。不要把浏览器验证链接、凭据或临时配置写进公开文档。

相关说明：[SDK](extension-development.md)、[开发 Skill](extension-skill.md)。

## 语言与包管理

0.4.1 的引导增加声明式语言包、npm／Yarn 作者环境、专用扩展管理环境、npm 分发包生成、只下载与宿主同步审核。语言模板无构建，check 报告缺译；插件／语言为 .tpp、主题为 .tpt。现代 Yarn 使用 node_modules，一项目一种锁文件。

技术方案与边界见[语言包](language-packs.md)、[npm／Yarn 管理](extension-package-management.md)。包管理器安装／卸载后必须显式 sync，宿主逐项审核，不自动启用。创建、check、pack 继续不联网或执行作者代码；install 是单独、明确确认的联网操作。

功能插件生成后，在作者工程维护独立 i18n 库与资源；使用每次调用的 context.language 选择插件自身词典，并将依赖和资源一起构建到 .tpp。不要把功能插件误建为宿主语言包。清单多语种展示与运行消息是两条独立路径，详细示例见 SDK 指南。
