# 更新设置预览来源

2026-11-14，本机 macOS 的真实 Electron 渲染截图，由 `node scripts/test-flow-ui.cjs --updates` 和 `webContents.capturePage()` 生成，保留原始图片，不拼接或重绘。

- en-paper.png：英文、paper，受控 Nightly 响应与已校验下载完成状态；说明内的 script 文本用于验证不执行 HTML，版本和链接为测试夹具，不能作为发布证明。
- zh-night.png：简体中文、night，受控无更高版本响应，保留本次运行中已下载的文件状态。
- zh-studio.png：简体中文、studio，检查前状态与已取消下载。
- zh-progress.png：简体中文、night，受控慢速下载的进度与取消入口。

截图验证现有设置布局、三主题和实际译文。下载使用主进程真实流式服务与小型受控响应；文件定位由测试捕获，不执行安装包。真实 GitHub 查询单独核对，未下载真实安装包，不代替 Windows／Linux 原生安装验收。
