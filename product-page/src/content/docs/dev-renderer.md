---
slug: dev-renderer
title: 渲染层与连续写作
group: 开发
order: 12
summary: 按编辑状态、源码投影、异步身份与可选面板理解渲染层，不以大文件行数代替架构。
---

## 模块职责

| 入口 | 职责 |
| --- | --- |
| src/App.tsx、src/app/ | 工程、缓冲区、保存队列、编译和关闭编排 |
| src/editor/EditorPane.tsx | CodeMirror 实例、每文件会话与输入回写 |
| src/editor/visual.ts | 公式、表格、标题、图示等源码投影 |
| src/editor/writingTargets.ts | 辅助操作的源范围映射与失效保护 |
| src/editor/writingSession.ts | 编辑状态与位置恢复 |
| src/components/PdfPane.tsx | PDF.js 阅读与双向定位 |
| src/app/lazyTools.tsx | 可选辅助工具的延迟加载与错误隔离 |
| src/styles/、src/i18n.ts | 主题、各表面样式及双语文案 |

App.tsx 仍承载较多编排，拆分应沿已有边界进行，不一次性更换状态架构。样式已按写作、PDF、图示、乐谱等拆分，不全部追加到 app.css。

## 源码与投影

CodeMirror transaction 修改原文并进入历史；decoration 显示可视结果。扫描范围须处理平衡括号、嵌套、注释和逐字环境，复杂内容保留源码入口。更新可视层不应重建整个文档或丢失组合输入。

简单表格可以原位编辑单元格，复杂表格回到 TeX。乐谱、电路、结构式等同属正文流程，工具面板是可选辅助，不是日常写作的前置步骤。

## 保存与异步回写

saveQueue.ts 保证写盘顺序，保存期间继续输入仍需保持脏状态。编译先保存全部相关缓冲区，再重读工程主文件。

异步结果回来时检查工程、文件、请求序号及源范围。writingTargets 允许周围编辑映射位置，但目标原文改变后拒绝旧结果。取消请求不能替代接收端检查。IME 组合期间避免替换正在输入的投影。

## 预览与主题

数学使用 KaTeX；完整 TeX、图稿和乐谱使用本机编译及 PDF.js 显示路径。主编译和辅助预览分别管理取消、缓存和结果身份，成功编译才发布预览缓存。

studio 是暗工具栏和亮纸，night 的正文也暗，paper 是亮界面。单色图稿可以适配主题，作者图色和正式 PDF 保持原义。设计规范见[设计语言](/docs/dev-design)。

## 验证

```sh
npm run typecheck
npm run test:regression
npm run build
```

涉及输入、选择、焦点、滚动和撤销时补跑相应原生界面回归。切工程、关闭、IME、异步失败和工具取消都要有明确行为；仅截图正常不代表连续写作通过。
