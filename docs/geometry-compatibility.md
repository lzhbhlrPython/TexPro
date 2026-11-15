# 几何图形与手写图稿兼容

几何是正文中的对象。默认 L1 原位呈现；复杂编辑按需打开已有工作室（L2），不按宏包新建页面。源码是唯一原件，支持与是否通过 TeXPro 工具插入无关。

## 适配职责

`electron/services/geometry-core.mjs` 描述完整环境、命令参数、依赖与驱动；`src/lib/texDocument.ts` 提供平衡范围。嵌套 TikZ／PGFPlots 只保留外层，注释和逐字示例不作为图形。裸 axis 包装在 TikZ 中；保留 Xy-pic／QCircuit 的间距修饰及 qtree 方括号树。共享 prooftree 与 Tree 语法按工程实际宏包声明消除歧义，不自动混装相冲突的实现。

图稿服务复用静态工程导言区、作者类、宏、库、字体及本地引擎。新增依赖仅用于预览文档；识别已有手写块、打开工作室和取消不会给原文补标记或改写包声明。原文修改使用已有写作目标、工程代数、原文校验与单次 CodeMirror transaction。工程或目标改变后拒绝旧结果。

## 覆盖范围

| 家族 | 入口与条件 |
| --- | --- |
| TikZ／tkz-euclide | tikzpicture、带分组参数的 tikz 命令；欧氏几何命令保留在原 TikZ 环境与导言区内 |
| 空间几何 | tikz-3dplot（先加载 TikZ）、PGFPlots addplot3；Lua graphdrawing 使用 LuaLaTeX |
| PGFPlots | axis、semilogxaxis、semilogyaxis、loglogaxis、polaraxis、groupplot；极坐标与图组补相应库 |
| picture／pict2e | 完整 picture 环境，保留工程 pict2e 扩展 |
| 关系图／树 | tikzcd、forest、xymatrix、xy、qtree／tikz-qtree 的 Tree |
| 证明树 | bussproofs／ebproof 的 prooftree、logicproof |
| 专业图稿 | circuitikz、chemfig、quantikz、Qcircuit、feynman／feynmandiagram |
| 集合／流程／时间结构 | venndiagram2sets／3sets、smartdiagram、ganttchart |
| PostScript | pspicture、pspicture*、psmatrix；PSTricks、pst-eucl、pst-3dplot 的图稿采用 XeLaTeX 与相应驱动依赖 |
| 乐谱 | 有／无元数据的 MusiXTeX music 环境，以及完整 startpiece／startextract 与结束命令；既有生成乐谱继续兼容 |

这张表说明语法家族和工具链入口，不是全部版本、选项、外部文件或拖拽编辑能力的保证。tkz-elements、luadraw 的 Lua 依赖可随工程传入，但当前本机未完成它们的真实编译验收。Asymptote、MetaPost、shell-escape 和外部生成步骤不自动开启，仍使用作者配置的构建动作及正式 PDF。

## 明暗主题与清晰度

正文与工作室共用 PDF.js 高密度图稿路径。透明画布必须在 PDF.js 创建默认不透明上下文前明确初始化 alpha，否则透明背景可能变黑。普通中性墨色生成遮罩后使用主题的 editor-text；paper／studio／night 切换不需要重新编译，也不改变正式 PDF。

检测到作者颜色时保留原像素与浅色承载面，不反相红色线、彩色元件或化学标注。混合内容不能简单整体滤镜翻色。图稿与乐谱分别检查真实图像解码、显示密度、主题、窄窗口和作者颜色；源码高亮另行验证。

## 手写源码与工作室

图形预览的「工作室」打开原始范围；光标在手写图形内时，图形／电路／逻辑／化学工作室命令也优先编辑当前块。MusiXTeX 不要求 TeXPro 注释或 JSON 元数据。图稿工作室、乐谱工作室、电路工具与图表源码面板使用有高亮、IME 与局部撤销的 CodeMirror，并在暂停输入后编译预览。

复杂手写 TeX 不一定能无损还原为节点或音符表单。此时保留完整源码与真实排版，在源码视图继续编辑；不假装已经还原成可拖拽模型。源码与可视编辑是同一工作室的两种模式，共用草稿与实时预览，不建立单独的源码工作室。切换模式不丢草稿或源码撤销。源码偏离生成模型后，可视模式改用从当前源码提取的参数控件，不恢复旧节点覆盖它；取消保留正文原文，应用修改才回写。既有带可靠模型的乐谱保留记谱辅助；手写变更与模型不一致时模型控件停用，原文仍可在同一工作室的源码模式修改。

乐谱预览传入工程导言区与引擎，独立构建目录存放辅助文件，编译以原工程为资源工作目录，继续执行 MusiXTeX 间距阶段。预览不是执行沙箱；未完成输入报错时保留源码草稿。图表源码修改后以该源码为准，可视模式展示该源码可识别的参数，不继续显示会覆盖它的旧数据表选项。当前无损参数包括字面量坐标、部分 MusiXTeX 音高／拍号／调号，以及简单 PGFPlots 函数表达式；不意味着完整图形都已恢复成可拖拽模型。

## 验证与扩展

在仓库根运行 `npm run test:geometry`，同一个服务逐例生成真实 PDF，最小导言区回退不能作为通过；安装完整 TeX Live／MiKTeX 中涉及的包以及 XeLaTeX、LuaLaTeX、驱动依赖后运行。增加家族时同时添加代表例子，不能用固定图片或只测识别代替编译。

运行 `npm run test:music` 检查谱面与间距、并发、缓存及取消；`node scripts/test-flow-ui.cjs --source-studio` 检查无标记电路／乐谱、工作室实时预览、高亮、精确替换和撤销。`--native-writing` 检查工程快照与连续章节。完成后运行完整基线、类型与构建。上述检查在本机执行，不等于三平台原生验收或公开发布。

内部适配表、源码组件与桌面会话不成为新插件 API 或外部 MCP 会话接口。现有扩展 apiVersion 1 和 MCP 有效调用保持兼容；新增只读工程上下文仍明确为磁盘来源。详见[写作引擎](writing-engine.md)。

宏包依据：[tkz-euclide](https://ctan.org/pkg/tkz-euclide)、[tkz-elements](https://ctan.org/pkg/tkz-elements)、[tikz-3dplot](https://ctan.org/pkg/tikz-3dplot)、[pict2e](https://ctan.org/pkg/pict2e)、[PSTricks](https://ctan.org/pkg/pstricks-base)、[Xy-pic](https://ctan.org/pkg/xypic)、[ebproof](https://ctan.org/pkg/ebproof)、[Quantikz](https://ctan.org/pkg/quantikz)。
