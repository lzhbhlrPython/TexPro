---
slug: dev-testing
title: 测试与冒烟
group: 开发
order: 13
summary: 单元测试用 node --test，集成脚本直接跑真实服务，界面回归拉起真 Electron 并把截图留在 artifacts/。三层各管一段，提交前至少过前两层。
---

## 三层验证

| 层 | 命令 | 跑什么 | 耗时 |
| --- | --- | --- | --- |
| 类型 | `npm run typecheck` | 全仓 `tsc --noEmit`，strict | 数秒 |
| 单元 | `npm run test:regression` | `node --test tests/*.test.cjs`，13 个文件 80 条用例 | 约 2.5 秒 |
| 界面 | `npm run smoke` 与 `test:*:ui` | 真启动 Electron，驱动真实交互并截图 | 十几秒起 |

单元测试全部是纯 Node，不加载 Electron，因此可以在任何有 Node 22 的机器上跑。界面回归需要先 `npm run build`，脚本自己不构建。

## 单元测试

`tests/` 下 13 个文件，用 `node:test` + `node:assert`，没有额外框架：

| 文件 | 覆盖 |
| --- | --- |
| `project-root.test.cjs` | 主文件判定：唯一 `\documentclass`、歧义、损坏配置 |
| `pdf-sync.test.cjs` | SyncTeX 坐标在缩放、裁切、旋转下的往返 |
| `reliability.test.cjs` | 服务提取后的 API、发布前置校验、Git 与历史的联动 |
| `writing-flow.test.cjs` | 写作输入：格式识别、Markdown 快捷键、字体与包选择 |
| `writing-reliability.test.cjs` | 引用重写、失败回滚、保存队列顺序 |
| `writing.test.cjs` | 写作块：页面版式、图表范围、表格单元格 |
| `continuity.test.cjs` | 整块移动、修订重建、注释与引用索引 |
| `music.test.cjs` | 乐谱：Unicode 往返、跨小节时值、分部共享 |
| `nightly.test.cjs` | 变更判定：时区边界、空提交、未来时间、合并 |
| `quit-watchdog.test.cjs` | 兜底只武装一次，且真的能杀掉卡住的父进程 |
| `inline.test.cjs` | 嵌套表格、转义定界符、行内预览回退 |
| `assets.test.cjs` | 素材与项目删除共用回收站，且不进索引 |
| `artwork.test.cjs` | 主题墨色下的插图渲染与透明度 |

写用例时优先断言「输出结构」而不是「屏幕文字」，前者稳定，后者会随文案改动碎掉。断言抛错信息比断言布尔值更有价值，失败时能直接看出差在哪。

## 加一条用例

```js
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveProjectRoot } = require('../electron/services/project-root.cjs');

test('configured root wins over detection', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-root-'));
  fs.writeFileSync(path.join(root, 'main.tex'), '\\documentclass{article}');
  fs.mkdirSync(path.join(root, '.texpro'));
  fs.writeFileSync(path.join(root, '.texpro', 'project.json'), '{"rootFile":"main.tex"}');
  const project = resolveProjectRoot(root);
  assert.equal(project.rootSource, 'configured');
  assert.ok(project.rootFile.endsWith('main.tex'));
});
```

服务层导出的是纯函数，可以直接 require；不要为了测试去启动 Electron，那属于冒烟层。

## 集成脚本

三个脚本各自带依赖，跑之前确认环境：

| 命令 | 覆盖 | 输出形态 |
| --- | --- | --- |
| `npm run test:compile` | 编译链：引擎、诊断解析、产物、清理 | 逐项 PASS / FAIL |
| `npm run test:import` | Markdown 与 Typst 导入的往返 | 逐项 PASS / FAIL，末尾汇总 checks |
| `npm run test:mcp` | 起 stdio MCP server，跑 initialize、tools、resources、prompts | 逐项 check，要求至少 12 个工具 |

`test:compile` 直接编译仓库里的 `demo/` 工程，构建产物落在它自己的构建目录；`test:import` 在临时目录建工程，跑完清理。`test:mcp` 可以用 `TEXPRO_MCP_SERVER` 指向别的 server 入口，默认是 `mcp/server.mjs`。

## 冒烟

`npm run smoke` 会先 build，再以 `TEXPRO_SMOKE=1` 启动。主进程在这个模式下做三件事：加 Chromium 降级开关（`no-sandbox`、`disable-gpu` 等）、把 userData 指到 `.texpro-userdata`、加载 `electron/smoke.cjs`。

```js
module.exports = function installSmoke(mainWindow, { app, isSmokeWelcome }) { ... }
```

冒烟脚本接管窗口，按顺序打开演示工程、编译、翻页、搜索、打开各个工作室，每步用 `webContents.capturePage()` 截图落盘。截图目录取 `TEXPRO_ARTIFACTS`，默认是仓库根 `artifacts/`；打包后的应用默认写 userData 下的 `artifacts/`。

常见产物：`smoke-welcome.png`、`smoke.png`、`smoke-lower.png`、`smoke-table.png`、`smoke-inline.png`、`smoke-math.png`、`smoke-compiled.png`、`smoke-pdf-search.png`、`smoke-pdf-thumbs.png`、`smoke-pdf-diff.png`、`smoke-templates.png`、`smoke-chart.png`、`smoke-layout.png`、`smoke-packages.png`、`smoke-commands.png`、`smoke-completions.png`。`TEXPRO_PERF=1` 时额外做一次性能采样。

> 截图是证据而不是快照比对：冒烟会检查关键 DOM 状态与文件系统结果，图片留给人看。

## 界面回归

`scripts/test-ui.cjs` 与 `scripts/test-flow-ui.cjs` 是同一套东西的两种入口，都只有二十几行，逻辑很薄：

- `mkdtemp` 建临时 userData，设 `TEXPRO_SMOKE=1`、`TEXPRO_REGRESSION=1`、`TEXPRO_USER_DATA`、`TEXPRO_ARTIFACTS`、`TEXPRO_EXIT_REPORT`
- `delete env.ELECTRON_RUN_AS_NODE`，`spawn(require('electron'), ['.'])`，`stdio: 'inherit'`
- 退出后读 exit-report：若信号是 `SIGKILL` 但报告里 `quit: true` 且 pid 匹配、退出码 0，判 PASS（这是 quit watchdog 兜底生效的正常路径），否则按退出码判定

`test-ui` 超时 120 秒，`test-flow-ui` 180 秒且强制 `TEXPRO_FLOW_REGRESSION=1`。分支开关：`--music`、`--writing`、`--assets`、`--continuity`，对应 npm 脚本 `test:music:ui` 等。`TEXPRO_CLOSE_ONLY=1` 只测关闭，`TEXPRO_QUIT_METHOD=quit` 用 `app.quit()` 代替 `window.close()`。

`test-ui` 与 `test-flow-ui` 都假设 `dist/` 已是最新。改完渲染层直接跑，看到白屏先想是不是忘了 build。

## 退出链路

关窗协议与退出兜底各有一个测试面：`electron/window-close.cjs` 由 flow 回归端到端覆盖（真实输入在 `window.close()` 时落盘、未保存则弹确认），`electron/quit-watchdog.cjs` 由 `tests/quit-watchdog.test.cjs` 验证武装时机与 SIGKILL 路径。改这两处时至少跑一次 `npm run test:flow:ui`。

## 提交前清单

- `npm run typecheck` 零错误
- `npm run test:regression` 全绿（80 条，允许 skip）
- 改到界面的，跑对应冒烟，看 `artifacts/` 里新截图
- 改到编译、导入、MCP 的，跑对应集成脚本
- 文案改动确认中英两份都在
- 没把 `dist/`、`artifacts/`、`.texpro-userdata/` 带进提交

## 陷阱

- 冒烟不自动 build：直接 `npm run test:ui` 跑的是旧产物
- 截图看着没变不等于没跑：确认文件的修改时间与数量
- 在单测里 require Electron 相关模块：会拖起原生依赖，测试变慢且不可移植
- 并发跑多个 UI 回归：它们共用 `artifacts/` 目录，文件名会互相覆盖

## 验证

```bash
npm run typecheck && npm run test:regression
npm run build && npm run smoke
npm run test:flow:ui
```

第一条每次提交都跑；第二条改到渲染层或编译链时跑；第三条改到关闭、保存或协作时跑。CI 的 nightly 只跑 typecheck、test:regression 与 build，界面验收仍要靠本地，见 `/docs/dev-release`。
