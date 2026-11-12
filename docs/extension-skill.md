# 扩展开发 Skill 的维护

仓库 skills/texpro-extension-development 包含 SKILL.md、agents/openai.yaml 与 references。它是 AI 工作流说明，不是 npm 包或桌面安装包；只引用公开 SDK 和工具契约，不自动授权安装、启用或发布。作者安装与提示词示例见[官网开发 Skill](https://texpro.pyliubaolin.top/docs/extension-skill)，中英同 slug。

作者优先运行 qwertysay 0.3.0 的中英引导；无人值守环境可使用完整兼容参数并记录等价选择，不伪造 TTY 或默认接受问题。最简主题不得被迫安装工具链；需要语言适配时按需读取 build-and-bridge，验收读 authoring。SDK 仍为 0.2.0 / API 1。

修改 Skill 时核对三个实际场景：有代码的选区处理、只有清单和 LICENSE 的最简配色、CSS/跨语言构建。保留 L0–L3、UTF-16、过期身份、撤销与 IME、Node 权限和主题伪装风险。明确真实编译、宿主调用、原生交互、打包与发布的证据差异。

验证 Skill front matter、相对引用和模板占位符；再核对对应脚手架及实际包测试，不能只检查文档标题就声称行为验收。更新公开任务指南及相关包 README，私人计划和会话不进入 Git。相关接口见[SDK](extension-development.md)，维护入口见[qwertysay](qwertysay.md)。
