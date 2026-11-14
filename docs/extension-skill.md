# 扩展开发 Skill 的维护

仓库 skills/texpro-extension-development 包含 SKILL.md、agents/openai.yaml 与 references。它是 AI 工作流说明，不是 npm 包或桌面安装包；只引用公开 SDK 和工具契约，不自动授权安装、启用或发布。作者安装与提示词示例见[官网开发 Skill](https://texpro.pyliubaolin.top/docs/extension-skill)，中英同 slug。

作者优先运行 qwertysay 0.6.0 的中英引导；无人值守环境可使用完整兼容参数并记录等价选择，不伪造 TTY 或默认接受问题。最简主题不得被迫安装工具链；需要语言适配时按需读取 build-and-bridge，验收读 authoring。SDK 仍为 0.5.0 / API 1。

修改 Skill 时核对三个实际场景：有代码的选区处理、只有清单和 LICENSE 的最简配色、CSS/跨语言构建。保留 L0–L3、UTF-16、过期身份、撤销与 IME、Node 权限和主题伪装风险。明确真实编译、宿主调用、原生交互、打包与发布的证据差异。

验证 Skill front matter、相对引用和模板占位符；再核对对应脚手架及实际包测试，不能只检查文档标题就声称行为验收。更新公开任务指南及相关包 README，私人计划和会话不进入 Git。相关接口见[SDK](extension-development.md)，维护入口见[qwertysay](qwertysay.md)。

## Release 归档

正式版与 Nightly 提供 `texpro-extension-development-v{应用版本}.skill`，这是带顶层技能目录的 ZIP。从真实 GitHub Release 下载，检查来源／摘要，按 AI 工具的导入机制安装；工具只接受 ZIP 时可在本地改扩展名后解压。不把 `.skill` 当作 TeXPro 的 `.tpp` 插件安装。旧版本没有该资产时仍可复制仓库中的完整目录。发布脚本会核对全部 Skill 源文件与引用，拒绝私有文件和符号链接。

语言包与 npm／yarn 管理的 AI 交接另读 Skill 的 references/languages-and-distribution.md；维护英文恢复、占位符、单锁文件、逐项审核、卸载保留数据及真实发布证据。

近期约束按当前源码维护：动态命令／分组保存语义键并在展示时翻译，验证所有切换状态；更多菜单不重复工作台的插入组。官网语言文件发现不限定中英两种，正式版／Nightly 与 Skill 复用首页末尾下载行、Skill 显示 KB。具体发行与官网集成读 references/website-and-releases.md；这些规则不扩大普通扩展作者的发布权限。
