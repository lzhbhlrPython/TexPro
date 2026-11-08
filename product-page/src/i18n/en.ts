/**
 * 中文原文 → 英文。翻译以「页面上出现的那一句」为键，
 * 这样组件里只需要 t('中文')，缺条目时自动回落成中文，不会白屏。
 */
export const EN: Record<string, string> = {
  // 导航与外框
  博客: 'Blog',
  文档: 'Docs',
  下载: 'Download',
  首页: 'Home',
  页面: 'Pages',
  本页: 'On this page',
  搜索: 'Search',
  '搜索文档与博客（⌘K）': 'Search docs and blog (⌘K)',
  '在 GitHub 查看源码': 'View source on GitHub',
  'GitHub 源码': 'GitHub',
  '下载 TeXPro': 'Download TeXPro',
  '打开导航菜单': 'Open menu',
  '本地优先 · 不建账号 · 不上传文件': 'Local-first · No account · Nothing uploaded',
  'TeXPro 首页': 'TeXPro home',

  // 首屏
  本地优先: 'Local-first',
  免登录: 'No sign-in',
  让: 'Make',
  像纸面一样好写: 'as natural as paper.',
  'TeXPro 把可视编辑、纸面排版和真正的 LaTeX 工程放进同一个窗口：公式、表格、TikZ 与乐谱在正文里直接出版面效果，PDF 与源码双向跳转，而文件始终留在你自己的磁盘上。':
    'TeXPro puts visual editing, paper-like typesetting and a real LaTeX project in one window: formulas, tables, TikZ and scores render in place, PDF and source jump both ways, and your files never leave your disk.',
  '看看能做什么': 'See what it does',
  'TeXPro 主界面：左侧项目树与主文件，中间可视编辑器，右侧 PDF 预览':
    'TeXPro main window: project tree on the left, visual editor in the middle, PDF preview on the right',
  '可视编辑器 · PDF 预览 · 双向 SyncTeX 同屏': 'Visual editor · PDF preview · two-way SyncTeX',
  数据上云: 'Data uploaded',
  '套纸面主题': 'paper themes',
  'SyncTeX 定位': 'SyncTeX mapping',
  '可视化面板': 'visual panels',
  双向: 'Two-way',
  '免登录使用': 'No sign-in',
  '离线可编译': 'Compiles offline',
  '文件留在本机磁盘': 'Files stay on your disk',

  // 能力
  能力: 'Capabilities',
  '写作在左，排版在右，中间没有来回切换': 'Write on the left, typeset on the right — no switching',
  '六件事决定了你每天写论文的手感：编辑、写作模式、编译、定位、绘图与协作。':
    'Six things decide how writing feels every day: editing, writing modes, compiling, navigation, drawing and collaboration.',
  原地可视编辑: 'In-place visual editing',
  '公式、表格、TikZ、插图与乐谱在正文里直接出版面效果；点一下回到源码，改完再点回来。':
    'Formulas, tables, TikZ, figures and scores render in place; click once for source, click back when done.',
  纸面感写作: 'Paper-like writing',
  '聚焦模式只留当前段落，打字机模式把光标稳在视线中间，长文写作不被面板打断。':
    'Focus mode dims everything but the current paragraph; typewriter mode keeps the caret in the middle. Long writing never gets cut by panels.',
  工程感知编译: 'Project-aware compiling',
  '自动识别主文件，latexmk 驱动 pdflatex / XeLaTeX / LuaLaTeX；错误进诊断面板，点一条就跳到出错行。':
    'Detects the main file, drives pdflatex / XeLaTeX / LuaLaTeX through latexmk; errors land in a diagnostics panel that jumps to the line.',
  双向SyncTeX: 'Two-way SyncTeX',
  'PDF 上单击定位源码，源码里 Shift+Cmd+J 定位版面；页码、行列与同步状态都在底部状态栏。':
    'Click in the PDF to locate the source, press Shift+Cmd+J in the source to locate the page; page, line and sync state live in the status bar.',
  乐谱与图形工坊: 'Scores and figures',
  'MusiXTeX 乐谱、pgfplots 曲线、TikZ 电路与逻辑图都有可视化面板，编辑时即时预览。':
    'MusiXTeX scores, pgfplots curves and TikZ circuits all have visual panels with live preview.',
  协作与可扩展: 'Collaboration and extensibility',
  'Git / Overleaf 工作流、内容寻址快照、局域网实时协作；对外提供 MCP server 与只读 Paper API。':
    'Git / Overleaf workflows, content-addressed snapshots, LAN collaboration; an MCP server and a read-only Paper API on the side.',

  // 演示
  演示: 'Demo',
  '点一下，视面就变回源码': 'Click once and the page turns back into source',
  '下面是同一份 LaTeX 的三块内容。点标题、公式或表格，它会当场翻成对应的源码；再点一次翻回来。渲染结果由构建期预生成，页面不加载数学库。':
    'Three pieces of one LaTeX document. Click the heading, the formula or the table: it flips to the matching source, click again to render. Markup is pre-rendered at build time; the page loads no math library.',
  视面: 'Preview',
  源码: 'Source',
  '也可以直接点左边的元素。表格的每一行、公式的每一处，都只是同一份 .tex 的不同呈现。':
    'You can also click the blocks on the left. Every row and every symbol is just another view of the same .tex.',
  全部还原: 'Reset',
  '光标离开公式，它显示成排版后的数学；点一下又回到源码。行内数学、行间公式和表格都走同一条规则。':
    'When the caret leaves a formula it shows as typeset math; click it and the source comes back. Same rule for inline math, display math and tables.',

  // 场景
  场景: 'In use',
  '它看起来像编辑器，用起来像排版系统': 'It looks like an editor, it works like a typesetting system',
  '以下都是真实运行截图：同一份 main.tex，没有经过任何美化。':
    'Real screenshots: the same main.tex, no retouching.',
  编辑: 'Editing',
  '表格和公式，就在段落中间': 'Tables and formulas, right inside the paragraph',
  '光标离开时，tabular 显示成真正的表格，行间公式显示成排版后的数学；点一下又回到源码。加一行、改对齐、删一列都在原位完成，不用在源码和预览之间来回跳。':
    'When the caret leaves, tabular becomes a real table and display math becomes typeset math; click and the source returns. Add a row, change alignment, delete a column in place — no jumping between source and preview.',
  '表格原位增删行列、切换对齐': 'Add or remove rows and columns in place',
  '渲染后的公式点击即回退源码': 'Click rendered math to get the source back',
  '导言区折叠成一张「导言卡」': 'The preamble collapses into one card',
  '可视编辑器中的表格：表头、对齐工具条与嵌套公式':
    'A table in the visual editor: header, alignment toolbar and nested formula',
  'tabular 在正文里直接呈现，工具条就在表格下方': 'tabular renders in place, with its toolbar right below',
  绘图: 'Drawing',
  '乐谱、曲线和电路图': 'Scores, curves and circuits',
  '除了公式，TeXPro 还能把 MusiXTeX 乐谱、pgfplots 坐标系、TikZ 电路与逻辑门渲染成图，并给出对应的可视化面板：改一个音符或电阻，页面里立刻变。':
    'Beyond formulas, TeXPro renders MusiXTeX scores, pgfplots axes and TikZ circuits with matching visual panels: change a note or a resistor and the page updates.',
  'MusiXTeX 乐谱预览': 'MusiXTeX score preview',
  'pgfplots 曲线在正文里成形': 'pgfplots curves take shape in the page',
  'TikZ 电路 / 逻辑图可视化编辑': 'Visual editing for TikZ circuits and logic gates',
  '同一篇文档中的乐谱、电路图与逻辑门示意图': 'Score, circuit and logic gate in one document',
  '乐谱、电路与逻辑门在正文中直接渲染': 'Scores, circuits and logic gates rendered in place',

  // 工作流
  工作流: 'Workflow',
  '从打开工程到定位到那一行，四步': 'From opening a project to that one line, in four steps',
  'TeXPro 不用你改变既有习惯：仍然是 main.tex，仍然是 latexmk，只是每一步都能看见结果。':
    'No habits to relearn: still main.tex, still latexmk — every step just shows its result.',
  打开工程: 'Open the project',
  '目录树、主文件自动识别，符号索引与 CWL 补全在打开时就绪。':
    'The tree, the main file, the symbol index and CWL completion are ready the moment it opens.',
  直接写: 'Write directly',
  '可视层负责版面，源码层保留真 LaTeX；光标落到哪里，哪里就回到源码。':
    'The visual layer handles layout, the source layer keeps real LaTeX; wherever the caret lands, source comes back.',
  一键编译: 'Compile once',
  'latexmk 增量构建，耗时、警告与完整日志就在底部状态栏，不用另开终端。':
    'Incremental latexmk builds; duration, warnings and the full log sit in the status bar, no extra terminal.',
  '点 PDF 回到源码': 'Click the PDF, land in source',
  'SyncTeX 双向定位：在 PDF 上单击一处，编辑器滚动并高亮到那一行。':
    'Two-way SyncTeX: click in the PDF and the editor scrolls to and highlights that line.',
  'PDF 就绪 · 2.0 s': 'PDF ready · 2.0 s',
  'SyncTeX 已启用': 'SyncTeX on',
  没有错误: 'No errors',
  '第 1 行，第 1 列 · 420 词': 'Line 1, Col 1 · 420 words',
  编译不阻塞写作: 'Compiling never blocks writing',
  '编译在后台进行，你可以继续输入；结果回来时只更新预览与诊断。':
    'Builds run in the background while you keep typing; results only refresh the preview and diagnostics.',
  旧结果不会写回新工程: 'Stale results never land in a new project',
  '切换工程或重新编译时，迟到的异步结果会被丢弃，不会覆盖当前文件。':
    'Switch projects or recompile and late async results are dropped instead of overwriting files.',
  一切操作可逆: 'Everything is reversible',
  '改写、移动、删除都留下内容寻址快照，随手可以翻回上一版。':
    'Edits, moves and deletes leave content-addressed snapshots; roll back whenever you want.',

  // 对比
  对比: 'Comparison',
  '和三类常见方案比，差在哪': 'Where it differs from three common approaches',
  '不想夸大：TeXPro 不是 Markdown 编辑器，也不是在线协作平台，它解决的是「真 LaTeX + 好写」这一件事。':
    'No overselling: TeXPro is not a Markdown editor and not an online collaboration platform — it solves one thing, real LaTeX that is pleasant to write.',
  'Markdown 编辑器': 'Markdown editors',
  '传统 LaTeX IDE': 'Classic LaTeX IDEs',
  '在线 LaTeX 服务': 'Online LaTeX services',
  支持: 'Supported',
  部分: 'Partial',
  不支持: 'Not supported',
  '左右滑动可查看完整对比': 'Swipe horizontally for the full comparison',
  '正文里直接出版面效果': 'Typeset result inside the text',
  '公式、表格、TikZ、插图与乐谱原地渲染': 'Formulas, tables, TikZ, figures and scores render in place',
  '所见即所得，同时是真 LaTeX': 'WYSIWYG that is still real LaTeX',
  '每个可视元素背后仍是可编译的源码': 'Every visual element is still compilable source',
  '本地工程与多文件': 'Local project, multiple files',
  '主文件识别、子文件、.bib、图片与目录树': 'Main-file detection, sub-files, .bib, images, tree',
  'PDF 与源码双向定位': 'Two-way PDF and source navigation',
  'PDF 上点一下回到出处的源码行': 'Click the PDF to jump to the originating line',
  '乐谱、曲线与电路图可视化': 'Scores, curves and circuits',
  'MusiXTeX、pgfplots、TikZ 都有可视化面板': 'Visual panels for MusiXTeX, pgfplots and TikZ',
  '写作模式（聚焦 / 打字机 / 纸面主题）': 'Writing modes (focus / typewriter / paper themes)',
  '长文写作时只留下当前段落': 'Only the current paragraph stays lit',
  '完全离线，文件不离开本机': 'Fully offline, files stay local',
  '不建账号、不上传、不收集使用数据': 'No account, no upload, no usage data',

  // 数据流向
  数据流向: 'Data flow',
  '文件不出本机，编译在你自己的机器上': 'Files stay on your machine, compiling runs on your machine',
  '没有服务端，也就没有「同步失败」和「额度用尽」。整条链路只经过三个地方。':
    'No server, so no failed syncs and no quotas. The whole chain touches three places.',
  你的工程: 'Your project',
  'main.tex、.bib、图片与子目录，就在你放它的地方': 'main.tex, .bib, images and sub-folders, right where you put them',
  磁盘: 'Disk',
  '本机 latexmk': 'local latexmk',
  'pdflatex / xelatex / lualatex，带 -synctex=1 增量构建': 'pdflatex / xelatex / lualatex, incremental, with -synctex=1',
  本机进程: 'Local process',
  'PDF 与预览': 'PDF and preview',
  'main.pdf 写回工程目录，双向定位用的也是它': 'main.pdf is written back to the project; two-way navigation uses it',
  账号: 'Account',
  上传: 'Upload',
  遥测: 'Telemetry',
  崩溃上报: 'Crash reports',
  'Git 远程': 'Git remote',
  'AI 服务（需你主动开启）': 'AI service (you turn it on)',
  全程不出现: 'Never appears',
  '可选的外连（都要你主动发起）：': 'Optional outbound connections (all started by you):',

  // 主题与模式
  写作: 'Writing',
  '同一份文档，三种光线': 'One document, three kinds of light',
  '主题只改变界面与纸面底色，不改动 LaTeX 内容；切换后重新编译即可。':
    'Themes only change the interface and paper colour, never the LaTeX; recompile after switching.',
  '暖白纸面，白天写长文默认的光线；侧栏压暗，正文永远是主角。':
    'Warm white paper, the default daylight for long writing; the sidebar stays dark so the text leads.',
  '整窗暗色，深夜改稿不刺眼；公式与图表保持原有对比度。':
    'A dark window for late edits; formulas and figures keep their contrast.',
  '米黄纸色，像摊开的一页旧稿，长时间阅读更松弛。':
    'A cream paper tone, like an old page left open — easier on long reads.',
  聚焦模式: 'Focus mode',
  '除当前段落外全部淡出，只留下一段正在写的字；状态栏会亮起「专注」。':
    'Everything but the current paragraph fades out; the status bar lights up with "Focus".',
  打字机模式: 'Typewriter mode',
  '光标固定在视线中央，页面随输入滚动，而不是视线跟着光标跑。':
    'The caret stays at eye level and the page scrolls instead of your eyes.',
  纸面留白: 'Paper margins',
  '正文按版心宽度排版，两侧留白，接近印刷后的阅读比例。':
    'Text sits in a measured column with real margins, close to the printed reading ratio.',
  '同一份文档的两种主题': 'The same document in two themes',
  Studio: 'Studio',
  Night: 'Night',
  Paper: 'Paper',

  // 迁移
  迁移: 'Switching',
  '从哪来，都只搬一次': 'Wherever you come from, you move once',
  '三条常见路径：没人要求你重写导言区，也没有导入配额。':
    'Three common paths: nobody asks you to rewrite the preamble, and there is no import quota.',
  从: 'From',
  '在线协作 / Overleaf': 'Online collaboration / Overleaf',
  '工程还是那个工程：main.tex、.bib、图片目录原样拿回来，主文件自动识别。':
    'The project stays the project: main.tex, .bib and image folders come back as they were; the main file is detected.',
  '本地编译不再等队列；Git 面板直接提交，想推回远端也行。':
    'Local builds no longer wait in a queue; commit from the Git panel and push back if you like.',
  'Markdown / Typst 笔记': 'Markdown / Typst notes',
  '导入时把标题层级、公式、表格、列表换成对应的 LaTeX 结构，剩下的正文照抄。':
    'Import converts headings, formulas, tables and lists into LaTeX structures and keeps the prose.',
  '同一份稿子既能继续用 Markdown 写，也能直接编译成投稿用的 PDF。':
    'Keep writing in Markdown, or compile straight to a submission PDF.',
  '不用改导言区，也不用换编译命令：仍然由 latexmk 驱动，pdflatex / xelatex / lualatex 都在。':
    'No preamble rewrite, no new build command: latexmk still drives it, with pdflatex / xelatex / lualatex.',
  '多了正文内的可视化、双向定位与写作模式；快捷键有一张对照表。':
    'You gain in-place visuals, two-way navigation and writing modes; there is a shortcut cheat sheet.',
  工程与文件: 'Projects and files',
  '导入、模板与素材': 'Import, templates and assets',
  快捷键: 'Shortcuts',

  // 下载
  '装到本机，十分钟开始写': 'Install locally, writing in ten minutes',
  '当前构建 v当前，随每次提交自动打包。安装包托管在 GitHub Releases。':
    'Build v当前, packaged on every commit. Installers live on GitHub Releases.',
  运行前提: 'Requirements',
  '需要本机已安装 TeX Live 或 MacTeX（pdflatex / xelatex / lualatex 任一即可）；TeXPro 会自动探测发行版与可执行文件。安装包未签名，每行右侧的复制按钮给出该安装包的 SHA256。':
    'TeX Live or MacTeX must be installed (any of pdflatex / xelatex / lualatex); TeXPro detects the distribution and binaries. Builds are unsigned — the copy button on each row gives that installer’s SHA256.',
  查看全部构建: 'All builds',
  从源码运行: 'Run from source',
  'Universal · Apple 芯片与 Intel · 13 以上': 'Universal · Apple silicon and Intel · 13+',
  'x64 · 10 以上 · NSIS 安装包': 'x64 · 10+ · NSIS installer',
  'x64 · AppImage，另有 deb / rpm': 'x64 · AppImage, plus deb / rpm',
  前往Releases: 'Releases',
  当前系统: 'This machine',
  '检测到你在 当前，已标出对应的安装包。': 'Detected 当前 — the matching installer is highlighted.',

  // 页脚
  产品: 'Product',
  资源: 'Resources',
  关于: 'About',
  使用场景: 'Use cases',
  版本对比: 'Comparison',
  迁移路径: 'Switching paths',
  开发博客: 'Dev blog',
  使用文档: 'User docs',
  开发文档: 'Developer docs',
  'MCP 教程': 'MCP guide',
  常见问题: 'FAQ',
  更新日志: 'Changelog',
  源码仓库: 'Source',
  问题反馈: 'Issues',
  '本地优先的 LaTeX 工作台。': 'A local-first LaTeX workbench.',
  '可视编辑、纸面排版与工程化编译，放在同一个窗口里。':
    'Visual editing, paper-like typesetting and project builds in one window.',
  夜间构建: 'Nightly',
  正式版: 'Stable',
  '版本 v当前': 'Version v当前',
  '本页无账号、无跟踪脚本，也不收集使用数据。':
    'No accounts, no tracking scripts, no usage data on this page.',

  // 搜索与更新日志
  '搜文档和博客，回车打开…': 'Search docs and blog, press enter to open…',
  '没有匹配的条目。换个词试试，或者按 Esc 关掉。':
    'Nothing matched. Try another word, or press Esc.',
  '↑↓ 选择 · ⏎ 打开 · Esc 关闭': '↑↓ select · ⏎ open · Esc close',
  安装包: 'Installer',
  体积: 'Size',
  '每个夜间构建，都是一次可追溯的提交': 'Every nightly build is a traceable commit',
  '版本号来自发布的 tag：nightly 的 tag 带日期（v0.1.0-20261109-Nightly），同一天重跑会覆盖当天产物。下面是当前这一版和它的全部安装包。':
    'Versions come from the release tag; nightly tags carry a date (v0.1.0-20261109-Nightly) and rerunning on the same day overwrites that day’s artifacts. Below is the current build and every installer it ships.',
  'GitHub Releases': 'GitHub Releases',
  看发布流程: 'Release process',
  '这次发布没有取到资产清单（GitHub 可能限流了），可以直接去 Releases 页看。':
    'No asset list this time (GitHub may be rate limiting); check the Releases page directly.',
  '安装包未签名。校验下载文件：': 'Installers are unsigned. Verify a download with ',
  '，与本表对比。更早的构建在 Releases 页按 tag 分组保留。':
    ' and compare with this table. Older builds stay grouped by tag on Releases.',

  // 博客
  '更新之后，写一篇': 'After shipping, write it down',
  'TeXPro 更新得很快，理由却容易丢。这里放开发过程中的记录：一个渲染决策为什么这么做、一条编译边界为什么收紧、一次发布为什么换方案。每篇都写给下一个接手的人——改了什么、为什么这么改、验证到哪一步、还欠什么。':
    'TeXPro moves fast, and the reasons get lost. These are the notes from building it: why a rendering decision was made, why a compile boundary was tightened, why a release changed shape. Each post is written for whoever picks this up next — what changed, why, how far it was verified, what is still missing.',
  '还没有文章。下一次开发之后，第一篇会出现在这里。':
    'No posts yet. After the next round of development, the first one will show up here.',
  '← 开发博客': '← Dev blog',
  '更早一篇': 'Older',
  '更新一篇': 'Newer',
  分钟: 'min',

  ' · 构建期快照': ' · build-time snapshot',
  'SHA256 已复制': 'SHA256 copied',
  主导航: 'Main navigation',
  切换语言: 'Switch language',
  '前往 Releases': 'Open Releases',
  发布于: 'Published',
  检测到你在: 'Detected',
  '浏览器不允许写剪贴板': 'The browser blocked clipboard access',
  '浏览器不允许写剪贴板，请到 Releases 页手动复制':
    'The browser blocked clipboard access — copy it from the Releases page instead.',
  版本: 'Version',
  '，已标出对应的安装包。': ' — the matching installer is highlighted.',
  '双向 SyncTeX': 'Two-way SyncTeX',
  隐私: 'Privacy',
  '这一篇的英文版还在翻译中，正文暂时以简体中文呈现。':
    'The English version of this page is still being translated; the body below is in Simplified Chinese for now.',
  'TeXPro 文档': 'TeXPro docs',
  文档目录: 'Documentation index',
  '上一页与下一页': 'Previous and next page',
  上一篇: 'Previous',
  下一篇: 'Next',
  本页目录: 'On this page',
  'TeXPro 开发博客': 'TeXPro dev blog',
  前后文章: 'Adjacent posts',
  更早: 'Older',
  更新: 'Newer',
  '缺素材也能先写完': 'Keep writing without the missing pieces',
  '配图、表格、引用没准备好时插占位符（⌘⇧H），在正文留下待补说明；修订备忘写进注释，不进 PDF。':
    'Drop a placeholder (⌘⇧H) for a figure, table or citation that is not ready yet; revision memos live in comments and never reach the PDF.',
  '中文写作排版': 'Chinese typesetting',
  '一条命令给主文件加上 CTeX：两字缩进、全角标点、中文行距；作者原有的字体与文档类不动。':
    'One command adds CTeX to the main file: two-character indent, full-width punctuation, Chinese line spacing — your fonts and document class stay untouched.',
  'CTeX 两字缩进、全角标点与中文行距': 'CTeX indent, full-width punctuation and CJK line spacing',
  'shasum -a 256 文件名': 'shasum -a 256 <file>',
  '拖动分割线对比；也可以聚焦后用 ← → 调整。':
    'Drag the divider to compare; or focus it and use ← → to adjust.',
  '这个链接没有对应的页面，可能是地址写错了。': 'This link has no page behind it — the address may be mistyped.',
  '回到产品首页': 'Back to the home page',
  '返回上一页': 'Go back',
  '安装包未签名。校验下载文件：shasum -a 256 <file>，与本表对比。更早的构建在 Releases 页按 tag 分组保留。':
    'Installers are unsigned. Verify a download with shasum -a 256 <file> and compare it with this table. Older builds stay on the Releases page, grouped by tag.',
  '细节': 'Details',
  '小巧思': 'Small touches',
  '把打断写作的地方，各挪开一次': 'Move each interruption out of the way, once',
  '不是新面板，也不是新流程：缺的东西留在段落里，排版交给一条命令，然后接着往下写。':
    'No new panel, no new workflow: what is missing stays in the paragraph, typesetting is one command away, and you keep writing.',
  '占位符与修订备忘': 'Placeholders and revision memos',
  '缺的那一步，留在原位': 'Leave the missing step in place',
  '中文排版，一条命令': 'Chinese typesetting in one command',
  '按 ⌘⇧H 就地插占位符（图 / 表 / 引用 / 数据），草稿 PDF 里留框、清单里可跳回；⌘⇧N 的修订备忘写进注释，读稿的人和 PDF 都不会被打断。':
    'Press ⌘⇧H to drop a placeholder (figure / table / citation / data) where the gap is: the draft PDF keeps a box and the list jumps back to it. Memos from ⌘⇧N live in comments, so neither readers nor the PDF are interrupted.',
  '两字缩进、全角标点、1.3 倍行距写进主文件，字体与文档类保持作者原样；子文件位置不变，随时可撤销。':
    'Two-character indent, full-width punctuation and 1.3× baseline spacing go into the main file while fonts and document class stay as the author wrote them; the child file never moves, and it is undoable.',
  '证据': 'Evidence',
  '可以核对的部分': 'The parts you can verify',
  '下面几行来自当前仓库与最近一次夜间构建，不是估算。':
    'The lines below come from the repository and the latest nightly build. Nothing here is estimated.',
  '89 个用例、14 个文件：主文件判定、SyncTeX 坐标、历史快照、保存与退出。':
    '89 tests across 14 files: main-file detection, SyncTeX coordinates, history snapshots, saving and quitting.',
  '87 个 IPC 通道，preload 与主进程逐条对应，读写都先过工程根目录白名单。':
    '87 IPC channels: preload mirrors the main process one for one, and every read or write passes the project-root allowlist first.',
  '每次夜间构建产出 16 个安装包，三个平台来自同一份 main。':
    'Every nightly build produces 16 installers; all three platforms come from the same main branch.',
  '21 篇文档，每篇都有中文与英文两版；缺译文时回落中文并在页头注明。':
    '21 documents, each in Chinese and English; when a translation is missing it falls back to Chinese with a note at the top.',
  'RSS 订阅': 'RSS feed',
  '可核对：': 'Verifiable: ',
  '89 条回归用例': '89 regression tests',
  '87 个 IPC 通道': '87 IPC channels',
  '每次夜构 16 个安装包': '16 installers per nightly',
  '21 篇文档，中英各一版': '21 documents in Chinese and English',
  '拖动分割线，对比 Studio 与 Night': 'Drag the divider to compare Studio and Night',
  '条回归用例，14 个文件：主文件判定、SyncTeX 坐标、历史快照、保存与退出。':
    'regression tests across 14 files: main-file detection, SyncTeX coordinates, history snapshots, saving and quitting.',
  '个 IPC 通道，preload 与主进程逐条对应，读写都先过工程根目录白名单。':
    'IPC channels: preload mirrors the main process one for one, and every read or write passes the project-root allowlist first.',
  '个安装包 / 次夜构，三个平台来自同一份 main。':
    'installers per nightly build, all three platforms from the same main branch.',
  '篇文档，每篇都有中文与英文两版；缺译文时回落中文并在页头注明。':
    'documents, each in Chinese and English; missing translations fall back to Chinese with a note at the top.',
  '首屏': 'Top',
  '页面段落': 'On this page',
};
