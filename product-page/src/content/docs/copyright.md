---
slug: copyright
title: 版权与许可
group: 关于
order: 18
summary: TeXPro 的 MIT 许可、本站内容、第三方依赖与字体许可、商标与隐私说明。
---

## 三句话版本

- 应用本体是 MIT 许可：可以商用、修改、再分发，保留版权与许可声明即可。
- 你的论文、图片与导出的 PDF 归你，TeXPro 不主张任何权利。
- 应用不附账号、不做遥测；联网只发生在你主动触发的动作里。

下面是完整说明。它不是法律意见；涉及商用或再分发时，建议同时阅读仓库根目录的 `LICENSE` 原文。

## 应用本体：MIT 许可

TeXPro 以 MIT 许可发布，版权声明为：

```text
Copyright (c) 2026 TeXPro contributors
```

MIT 是宽松许可，允许你把 TeXPro 用在哪里、改成什么样，也允许你把它并入闭源产品。

### 你可以

- 在个人、教学或商业环境中使用，不付费、不需要授权码
- 阅读、修改源码，按自己的需要增删功能
- 再分发原版或修改版，包括打包进自己的发行版
- 将代码并入其他项目，包括不公开源码的项目
- 在修改版上使用不同的名称与图标（需自行承担商标风险）

### 你需要

- 在副本或衍生作品中保留版权声明与 MIT 许可全文
- 在分发时附上 `LICENSE`，通常放在安装目录或关于页面

MIT 不要求你公开修改后的源码，也不要求你用同样的许可发布衍生作品。它也不提供任何形式的担保，这一点在下一节展开。

### 分发修改版时

如果你发布的版本与官方构建有明显差异，建议在名称或说明中标注「非官方构建」，避免用户把问题归到上游。使用 TeXPro 名称与图标属于商标问题，不在 MIT 授权范围内，详见下文「TeX、LaTeX 与相关名称」。

## 软件按「现状」提供

MIT 许可中的免责条款适用于整个应用：

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

用日常语言说：

- 不保证编译结果正确，也不保证排版符合期刊要求
- 不保证应用没有缺陷，或能在你的系统上无中断运行
- 不保证数据不会因误操作、磁盘故障或第三方工具而丢失
- 作者与贡献者不对使用或无法使用本软件造成的损失负责

因此，重要论文请使用 Git、备份或工程快照保留历史；提交期刊前用目标模板再编译一次。应用提供快照、版本历史与备份入口，但它们不能替代你自己的备份策略。

## 本站内容

产品页与应用在同一个仓库，站点源码同样以 MIT 许可提供。页面上的文字、结构、样式与示例可以复用、改写，也可以用于商业项目。

需要保留的仍然只有版权与许可声明。以下内容不随 MIT 授权：

- 「TeXPro」名称、应用图标与官方构建的视觉标识
- 页面截图中出现的第三方界面、字体与素材（归各自权利人）

页面截图来自真实运行窗口，使用仓库内的 `demo/` 演示工程，没有合成或伪造的界面。引用截图时请注明来源，并避免让人误以为你的产品是官方版本。

## 第三方依赖

TeXPro 站在大量开源项目上。下表列出主要依赖及其真实许可证；版本是撰写时的主版本，精确版本以 `package.json` 与 `package-lock.json` 为准。

| 组件 | 版本 | 许可证 | 用途 |
| --- | --- | --- | --- |
| rtex-ts / realtime-tex Lua/TeX | 0.1.0 / 0.0.7 | MIT | 实时段落排版与上下文捕获 |
| fontkit | 2.0.4 | MIT | TeX 字形轮廓 |
| Electron | 44.x | MIT | 桌面运行时与原生菜单 |
| React / React DOM | 19.x | MIT | 渲染层界面 |
| CodeMirror | 6.x | MIT | 源码编辑器与扩展 |
| KaTeX | 0.19.x | MIT | 公式预览 |
| PDF.js（pdfjs-dist） | 6.x | Apache-2.0 | PDF 渲染与文本层 |
| Yjs | 13.x | MIT | 局域网协作的 CRDT |
| y-codemirror.next / y-protocols | 0.3.x / 0.1.x | MIT | 协作与编辑器绑定 |
| Lucide（lucide-react） | 0.544.x | ISC | 界面图标 |
| Ant Design | 6.x | MIT | 本站组件库 |
| Vite | 8.x（应用）/ 7.x（本站） | MIT | 构建与开发服务器 |
| TypeScript | 5.9.x | Apache-2.0 | 类型检查与编译 |
| ws | 8.x | MIT | 本地协作 WebSocket |
| perfect-freehand | 1.2.x | MIT | 手绘笔迹 |
| react-router-dom | 7.x | MIT | 本站路由 |
| dayjs | 1.11.x | MIT | 日期格式化 |

几点补充：

- MIT 与 ISC 都要求保留版权与许可声明；Apache-2.0 还要求保留 NOTICE（如随包提供），并在修改文件时说明变更。TeXPro 以原样依赖使用这些库，没有打补丁。
- 上表不是完整清单。间接依赖与开发依赖（如 electron-builder、Vite 插件、类型定义）同样遵循各自许可，完整文本在 `node_modules/<包名>/LICENSE`。
- 构建产物中的第三方代码仍受原许可约束。再分发安装包时，请一并保留 `LICENSE` 与依赖声明；Electron 的许可信息在 `LICENSES.chromium.html` 中。
- 如果你新增依赖，请选择与 MIT 兼容的许可，并在 PR 中说明；AGPL 类依赖需要单独评估，仓库目前刻意没有采用 `codemirror-lang-latex`（AGPL-3.0-or-later）。

## 实时预览的来源与许可

实时预览内置独立 MIT 包 [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts)，TypeScript 层高度参考 Henry Yang 与 realtime-tex contributors 的 [realtime-tex](https://github.com/HenryXiaoYang/realtime-tex)。Lua/TeX 支持代码原样保留，参考版本为 0.0.7、revision `fcff7a5c7f33a288ecf40db886843754c62bbdfd`。保留原作者 `Copyright (c) 2026 Henry Yang and the realtime-tex contributors` 及 MIT 全文，改写不改变这部分贡献的归属。

研究灵感来自 Clemens Lode 的 [Real-Time LuaTeX: Recompiling Large Documents in 1 ms](https://www.tug.org/tug2026/preprints/lode-realtime.pdf)，TUG 2026。引用不是官方背书，上游性能也不是本应用实测指标。宿主用 fontkit（MIT，Devon Govett）提取字形轮廓；TeX 发行版和字体由用户另行安装，各自许可不变。

再分发须保留根 `THIRD_PARTY_NOTICES.md`、rtex-ts 的 LICENSE、UPSTREAM、第三方声明，以及 vendor 中的上游许可证和文件清单。安装包中的 rtex-ts 位于 `app.asar.unpacked/node_modules/rtex-ts/`。详见[实时预览与嵌入](/docs/realtime-tex)。

## 字体许可

TeXPro 的字体策略分两部分，因为应用与产品页并不相同。

### 应用内

应用安装包不附带字体文件。界面使用系统字体：macOS 上是 SF Pro 与苹方，Windows / Linux 上回退到系统无衬线字体；编辑器优先使用本机的 New York、Charter、宋体类字体，缺省时回退到 Georgia 或系统衬线字体。

这意味着：

- 字体许可由操作系统与你安装的字体决定，TeXPro 不再单独授权
- 换一台机器，字形可能不同；排版以编译时本机字体为准
- 想在 PDF 中稳定使用某款商用字体，需要你自行购买并安装

### 本站与文档页面

本站正文使用思源宋体（Noto Serif SC），遵循 SIL Open Font License 1.1。字体通过 jsDelivr 上的 `@fontsource/noto-serif-sc` 分包加载，中文子集按需下载，不随站点仓库分发字体二进制。

SIL OFL 1.1 允许：

- 免费使用，包括商业网站与印刷品
- 嵌入文档与 PDF
- 修改字形并再分发
- 与其它软件捆绑，只要不单独售卖字体

需要遵守：

- 再分发字体文件时保留 OFL 许可与版权声明
- 修改版不得使用原字体的保留名称（Reserved Font Name），具体以字体随附的 `OFL.txt` 为准
- 不能把字体本身当作主要商品出售

### PDF 中的字体

导出的 PDF 由本机 TeX 发行版排版，嵌入哪些字体由文档、宏包与系统字体决定。TeXPro 不替换也不额外打包字体。使用期刊指定字体或商用字体时，请确认你拥有相应授权；把 PDF 公开分发前，尤其要检查图片、图表与字体的来源。

乐谱功能依赖本机的 MusiXTeX / musixtnt，它们随 TeX 发行版提供，不随 TeXPro 安装包分发，许可遵循发行版自身的说明。

## TeX、LaTeX 与相关名称

- TeX 是 American Mathematical Society 的商标
- LaTeX 由 LaTeX Project 维护；其名称与蜂鸟标识用于指代该项目及其软件，标识不在 LPPL 授权范围内，使用前请阅读官方说明
- TeXPro 与 TeX、LaTeX 没有隶属关系，也未获得其背书
- 文档中提到这些名称，只为说明文件格式与编译链的兼容性
- TeXPro 的名称与图标属于本项目；MIT 许可不包含商标授权
- Typora、TeXstudio、Overleaf 等名称属于各自权利人，提及它们仅用于比较或说明互操作

如果你在自己的产品中描述「兼容 LaTeX」，请确保表述准确，并避免暗示官方认证。

## 你的内容归你

你在 TeXPro 中创建或编辑的一切，版权归你（或原权利人）：

- `.tex`、`.bib`、图片、图表与其它工程文件
- 编译生成的 PDF、导出的 Markdown / Typst / HTML
- 你撰写的文字、注释与批注

TeXPro 不对这些内容主张任何许可或所有权。应用只在你的工程目录、应用数据目录，以及你明确选择的导出与备份位置读写文件；没有把文档上传到自家服务器的行为。

需要注意的边界：

- 导出文件可能包含你引用的第三方图片、字体或表格，公开前请自行清权
- AI 生成的内容是否受版权保护、归谁所有，取决于你使用的模型服务条款与当地法律；发布前请核对
- 协作场景下，文档的归属由参与者自行约定，应用不介入
- 仓库中的 `demo/` 演示工程随仓库以 MIT 提供，仅用于展示，除非文件内另有说明

## 隐私

TeXPro 是一个本地应用，没有账号系统，也没有云端同步服务。

- 不要求注册、登录或手机号
- 不包含遥测、分析、崩溃上报或广告 SDK
- 产品页是静态站点，没有统计脚本与 Cookie 横幅

联网只发生在你主动触发的动作里：

| 动作 | 连接位置 | 发送内容 |
| --- | --- | --- |
| AI 助手 | 你配置的模型端点（默认 OpenAI） | 上下文框里的文本 |
| DOI / arXiv 元数据 | Crossref、arXiv API | 你输入的 DOI 或 arXiv ID |
| Git / Overleaf | 你配置的远端 | 仓库内容与提交信息 |
| 备份 | 你选择的 iCloud Drive、WebDAV 或 SSH 主机 | 工程文件 |
| Zotero 文献 | 本机 `127.0.0.1:23119` | 本地查询，不出机器 |
| 局域网协作 | 本机启动的 WebSocket 服务 | 文档更新，不经第三方 |
| 外部链接 | 你的浏览器 | 由目标站点处理 |

AI 的 API 密钥由主进程用系统钥匙串（Electron `safeStorage`）加密，保存在应用数据目录的 `secrets.json`，文件权限为仅当前用户可读；密钥不会写入浏览器 localStorage，也不会进入工程文件或 Git 仓库。只有你点击运行，才会把上下文框中的文字发给你配置的端点；应用不会自动调用模型。

产品页通过 GitHub Pages 托管，字体从 jsDelivr 加载。这两个服务会按其自身策略记录访问日志（如 IP 与 User-Agent），TeXPro 不额外收集或分析这些数据。

## 如何报告版权问题

如果你认为仓库中的代码、文档、截图或演示素材侵犯了你的权利，请在 GitHub Issues 中提出：

- 仓库地址：`https://github.com/lzhbhlrPython/TexStudioPro`
- 说明涉及的文件、页面或版本
- 提供权利证明或原始出处链接
- 说明你希望的处置方式：署名、替换或移除

维护者会核对后处理。涉及商标误用、冒充官方构建的情况也可以用同一渠道反馈。请勿在公开 Issue 中粘贴 API 密钥、未公开的稿件或他人的个人信息。

> 本页会随依赖与许可变化更新；已发布版本仍以其随附的 `LICENSE` 为准。本页不构成法律意见。
