# 文档导航

新会话从根目录 [AGENTS.md](../AGENTS.md) 开始，再按任务阅读下面的入口。本文整理于 2026-11-10；运行状态、测试结果与发布状态应在每次交付时重新核对。

## 阅读顺序

1. [PRODUCT.md](../PRODUCT.md)：产品定位、用户和连续写作原则。
2. [DESIGN.md](../DESIGN.md)：Google DESIGN.md 格式的设计语言、真实 token 来源和 Material Design 参考。
3. [开发指南](development.md)：环境、命令、按任务定位代码、验证和接手步骤。
4. [架构](architecture.md)与[技术契约](technical-contracts.md)：模块职责、数据流及不可破坏的约束。
5. [文档维护](documentation.md)：官网、中英文、生成产物和历史记录的维护方式。

前端开发同时遵守 [前端设计与实现约束](frontend.md)，不要只读视觉 token。

## 按问题查阅

| 问题 | 入口 |
| --- | --- |
| 保存、改名、关闭、退出 | [写作可靠性](writing-reliability.md) |
| 实时 LuaLaTeX 预览、rtex-ts 嵌入与打包 | [实时 TeX 预览](realtime-tex.md) |
| 连续编辑、选择、粘贴、修订 | [写作](writing.md) |
| 乐谱源码、依赖与预览 | [乐谱](music.md) |
| 素材与文件树联动 | [素材](assets.md) |
| Nightly、Pages、版本刷新 | [产品页部署](product-page-deployment.md)及 `.github/workflows/` |
| 外部 AI 读写工程 | [MCP 接口](../mcp/README.md) |
| 已知交互边界 | [交互审计及后续状态](interaction-audit.md) |
| 官网结构、内容和构建 | [产品页维护说明](../product-page/README.md) |

## 文档的职责

`AGENTS.md` 规定协作；`PRODUCT.md` 解释产品；`DESIGN.md` 规定视觉与交互语言；本目录说明工程实现；官网文档帮助使用者和开发者完成任务；博客解释历史决策。不要把同一段约束复制到每篇文章。

源码与配置是实现现状的证据。设计要求不代表旧界面已经全部符合，历史测试结果不代表当前验证通过。发现不一致时同时修正文档并记录实际限制，不通过删掉风险说明来制造一致。
