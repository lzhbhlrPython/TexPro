---
slug: extension-skill
title: "开发 Skill：让 AI 协助扩展开发"
group: AI 协作
order: 67
summary: 安装并调用仓库开发 Skill，组织输入、能力与 L0–L3 决策、测试证据及安全交接。
---

## Skill 是什么

`texpro-extension-development` 是仓库提供的 AI 开发说明，位于 `skills/texpro-extension-development/`。它帮助 AI 阅读 TeXPro API 1、选择 SDK 和脚手架、验证插件或主题并交接。它不是 npm 库、桌面插件、Koishi 插件或包执行器，也不自动授予联网、安装、启用或发布权限。

代码契约见[插件 SDK](/docs/extension-development)；创建、构建和打包的操作见[qwertysay](/docs/qwertysay)。Skill 只组织这些实际能力，不替代源码和测试结果。

## 安装与检查

取得可信的 TeXPro 仓库，将整个 `skills/texpro-extension-development` 目录复制到 AI 工具支持的技能目录。Codex 默认位置为用户目录下 `.codex/skills/texpro-extension-development/`；配置自定义 CODEX_HOME 时使用其 skills 目录。更新时先比较本地改动，不覆盖自定义规则。

目录包含 `SKILL.md`、`agents/openai.yaml` 与 `references/`，不要只复制一个 SKILL.md 后留下失效的相对引用。重新加载会话后确认工具能发现 `texpro-extension-development`；其他 AI 工具按自身技能机制配置，不把这些文件装进 TeXPro 的扩展管理。

## 给 AI 的任务输入

提供目标、源码位置、插件或主题类型、API 版本、所需能力、目标系统、语言或样式偏好、可否安装开发依赖，以及预期交付。没有真实宿主工程时只能验证公开包，不能声称已通过宿主交互。

```text
使用 $texpro-extension-development。
在我指定的新目录创建一个 API 1 插件，只将选区转换为大写。
使用 SDK 0.5.0 和 qwertysay 的引导式配置，不要求我记参数。
声明 document.read/document.write，保留 UTF-16、提案确认与单次撤销。
交付源码、MIT LICENSE、.tpp、SHA256、实际测试证据和已知限制。
不要发布 npm，也不要在我的日常工程或用户目录启用插件。
```

最简主题示例：

```text
使用 $texpro-extension-development 创建只改 accent 为 #804020 的 paper 主题。
使用 qwertysay 的“仅修改主题色”，输出 .tpt。
只要清单和 LICENSE，不要 CSS、JavaScript 或编译器。
在临时配置里验证安装、启用、停用与恢复，并说明可信来源要求。
```

## AI 应先核对什么

AI 先读任务目录的 AGENTS.md、PRODUCT.md、DESIGN.md、扩展契约和 SDK 类型。需要语言／桥接时按需读 `references/build-and-bridge.md`；验收流程见 `references/authoring.md`。不要一次复制整套历史聊天或把 Skill 内容当作用户授权。

任务按 L0–L3 选择最合适的承载。实时预览为 L0；日常操作优先正文或既有上下文；有独立完整任务才建立 L3 工作空间。桌面主体不套用官网 Ant Design 规则，沿用宿主 token、焦点、撤销和工作台标题栏避让。

创建工程优先引导式 qwertysay。AI 在无人值守环境不能伪造 TTY 或默认接受问题，可使用兼容的完整参数，写明等价选择；自动化是可复现入口，不要求作者记住它。构建依赖的安装和编译必须明确执行，不藏进校验或打包。

## 开发中的硬边界

- 直接可用的数据贡献优先：补全、片段、模板或纯 token 主题不强加代码和工具链。
- 动作与能力在清单声明；修改以提案返回，宿主核对文档身份、UTF-16 范围与启用状态后应用。
- 保存磁盘与未保存快照分开；过期、取消、停用或换工程不得回写旧结果。
- 代码入口自包含，不要求宿主安装 npm 依赖，不绕过 preload、IPC 或编辑器事务。
- 最简主题保持两个文件；CSS 主题声明 theme.styles，拒绝远程资源、脚本和越界路径。
- 保留作者及第三方许可，不把整个编译产物都标成仅 MIT。

## 测试与证据

校验清单和打包后，在临时 TeXPro 配置中安装真实 `.tpp`／`.tpt`。开发目录重载生成停用快照，需重新检查和启用。验证启停、配置、错误、过期结果、项目切换、撤销、IME、三主题及恢复；不要改作者日常工程。

宿主修改运行完整 `npm run test:regression`，零失败、零跳过、零 TODO，另做类型、构建、相关原生路径和 MCP 测试。编译语言需运行真实编译器；缺工具是失败，不能跳过或手写假的输出。npm 工具维护先验证实际 tarball 的独立安装，不把源码软链接测试当作发布验收。

交付区分格式检查、真实编译、宿主调用、原生交互、打包、推送和发布。记录运行命令、系统、实际输出及未验证项；一台机器通过不代表跨平台认证。

## 安全、恢复与维护

Node 插件与构建工具具有用户权限；进程隔离不是沙箱。主题虽无代码也能隐藏按钮、伪装提示或损害可访问性。只审查并启用可信来源，必要时通过原生视图菜单或 `--safe-mode` 恢复。

外部 MCP 的格式查询和包检查是只读，不执行编译、安装或启用。Skill 不把清单 mcp 动作变成外部工具，也不自行扩大权限。推送、npm 发布与远程分发需依据用户的实际授权。

宿主和工具改变时同轮修订 Skill、参考资料、SDK、qwertysay 及官网中英文指南。协作交接保留契约、包版本、许可证、真实证据和剩余问题；私人计划、聊天、凭据和临时配置不进入 Git 或发行包。

## 语言插件与包管理环境

[语言包教程](/docs/language-packs)说明声明式模板、预装 @texpro/extension-translate-zh-cn、占位符校验与英文恢复。[npm／yarn 管理](/docs/extension-package-management)说明作者配置、分发包与经过审核的安装／更新／卸载同步。SDK 0.4.0 与 qwertysay 0.5.0 使用 @texpro；旧 @gardenialiu 版本保留独立历史。

## 下载发行 Skill

后续正式版与 Nightly 附带 `texpro-extension-development-v{应用版本}.skill`，这是包含完整技能目录与引用资源的 ZIP。核对实际 Release、来源与摘要，再用 AI 工具的导入功能；工具只接受 ZIP 时可重命名本地副本后解压。它不是 TeXPro 的 `.tpp` 桌面插件。旧发行版没有这个资产时，使用完整源码目录。

## 源码发布 npm 与构建安全

源码可直接发布 npm，texpro.source 指向目录（省略为包根），不必先内嵌 .tpp／.tpt。SDK 0.4.0、qwertysay 0.5.0 和对应宿主支持此路径；旧归档分发继续兼容。可运行 JS／静态文件安装后直接同步；需要编译的包在 qwertysay 选择「构建已安装的源码扩展」，单独确认信任后再同步到 TeXPro 审核。构建配置和编译器拥有用户权限；禁用安装脚本和临时目录都不是沙箱。完整的作者发布、用户安装／升级／卸载、工具链限制与风险见 [npm／yarn 管理扩展](/docs/extension-package-management)。


## 当前维护约束

随应用发行的 Skill 同步当前 SDK 0.5.0、qwertysay 0.6.0 与 catalogVersion 2。动态菜单的两个状态均使用语义键；语言切换在调用和展示时解析，避免缓存旧译文。更多菜单的重复插入组已移除，插入能力保留在工作台和命令面板。

首页末尾的同一下载列表可切换正式版／Nightly，系统包与 Skill 共用行样式，Skill 大小以 KB 显示。官网语言贡献使用声明文件、消息 JSON 与 Markdown，不在页面中增加语言分支。Skill 的 references/website-and-releases.md 说明相关集成边界。
