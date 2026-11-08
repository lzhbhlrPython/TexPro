---
slug: dev-arch
title: 进程与信任边界
group: 开发
order: 11
summary: 主进程碰文件系统，preload 只转发白名单通道，渲染层拿不到 Node。87 条 IPC、一套路径闸门、一份收紧的 CSP，构成了这个应用全部的信任边界。
---

## 三个进程

| 进程 | 入口 | 职责 |
| --- | --- | --- |
| 主进程 | `electron/main.cjs`（921 行） | 窗口、菜单、87 个 IPC handler、服务层调用、退出清理 |
| preload | `electron/preload.cjs`（108 行） | `contextBridge` 暴露 `window.texpro`，每个方法只是一行写死通道名的 invoke |
| 渲染层 | `src/main.tsx` → `src/App.tsx`（2846 行） | React 19 界面、CodeMirror、PDF.js、全部状态编排 |

窗口参数集中在 `createWindow()`（`electron/main.cjs:286-311`）：

```js
webPreferences: {
  preload: path.join(__dirname, 'preload.cjs'),
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: false,
  spellcheck: false,
  backgroundThrottling: false,
}
```

`sandbox: false` 让 preload 可以用 Node 的 `require`，服务层则始终在主进程里跑。`contextIsolation: true` 仍然把 preload 与页面隔离，页面只拿到 `window.texpro` 这一层。`backgroundThrottling: false` 让后台窗口里的编译与预览不被节流。

## 87 条 IPC 的分布

`ipcMain.handle` 与 `preload.cjs` 里的 `ipcRenderer.invoke` 都是 87 处，一一对应；另有 4 个订阅（`compile:output`、`mcp:elicitation`、`menu:action`、`window:prepare-close`）与 1 个单向发送 `ipcRenderer.send('window:close-ready')`。

| 域 | 数量 | 代表通道 |
| --- | --- | --- |
| `project:` | 19 | `open`、`symbols`、`impact`、`move-dir`、`graph`、`diagnose` |
| `mcp:` | 8 | `client-call`、`configs`、`respond-elicitation` |
| `git:` | 7 | `status`、`commit`、`overleaf-clone` |
| `history:` | 6 | `list`、`restore`、`clear` |
| `assets:` | 5 | `list`、`import`、`save-buffer`、`rasterize-svg` |
| `file:` / `templates:` | 8 | `stat`、`read`、`write`、`exists`、`preview`、`save` |
| 各 3 条 | 18 | `shell:`、`secret:`、`collab:`、`zotero:`、`paper-api:`、`tex:` |
| 各 2 条 | 10 | `compile:`、`sync:`、`app:`、`dialog:`、`bib:` |
| 单体 | 6 | `pdf:read`、`music:preview`、`tikz:render`、`backup:run`、`spell:words`、`menu:set-language` |

新通道按域取名，`invoke` 只做转发，业务逻辑一律落在 `electron/services/`。

## 路径闸门

主进程维护一个 `allowedRoots` 集合（`electron/main.cjs:27`），打开工程时把根目录记进去。所有碰文件的 handler 第一件事是过 `isAllowed()`：

```js
function isAllowed(file) {
  const resolved = path.resolve(file);
  for (const root of allowedRoots) {
    if (resolved === root || resolved.startsWith(root + path.sep)) return true;
  }
  return false;
}
```

前缀校验挡 `../` 逃逸，符号链接逃逸由各服务里 `realpath` 的地方单独兜。错误文案是契约的一部分，渲染层靠它区分「没开工程」与「越界」：`Project is not open`、`File is outside the open project`、`Asset is outside the project`、`Directory is outside the project`、`Invalid project path`。

## 自定义协议

渲染层要显示项目里的图片与 PDF 预览图，走 `texpro-asset://` 而不是 `file://`。`protocol.handle` 在 `app.whenReady()` 里注册，缺 `path` 参数回 400，`isAllowed()` 不通过回 403，其余交给 `net.fetch` 并把 CORS 头按 dev 或生产分别写。

渲染层拿不到路径拼接权：`app:assetUrl` 先过 `isAllowed()`，通过才返回编码后的 URL，否则返回 `null`。图片、PDF 缩略图、TikZ 预览共用这条链路。

## 服务层 11 个文件

| 文件 | 行数 | 负责 |
| --- | --- | --- |
| `services/tex.cjs` | 2013 | 工程、编译、SyncTeX、符号、搜索、素材、TikZ、arXiv、模板、Zotero |
| `services/history.cjs` | 174 | 内容寻址快照：列表、读取、恢复、清理 |
| `services/mcp-client.cjs` | 132 | 应用内连接 MCP server，含 elicitation 回调 |
| `services/project-operations.cjs` | 119 | 改名、移动前的引用影响分析与重写 |
| `services/git.cjs` | 98 | 状态、读文件、init、commit、pull、push、Overleaf 克隆 |
| `services/collab.cjs` | 87 | 局域网协作：Yjs over WebSocket |
| `services/project-root.cjs` | 76 | 主文件策略：configured 到 detected 到 ambiguous |
| `services/paper-api.cjs` | 56 | 只读 HTTP API，绑回环加 token |
| `services/` 其余 3 个 | 51 | `font-report` 字体覆盖、`project-files` 文本判定、`music` 乐谱源码 |

`tex.cjs` 末尾把 `history`、`git` 的导出展开进同一个命名空间：`module.exports = { parseDiagnostics, renderMusicPreview, ...history, ...git, openProject, ... }`。调用方只 require 一个模块，代价是模块边界在导出层消失，新增函数名要确认不撞车。

## 网络面

- **Paper API**：只绑回环，启动时 `randomBytes(18)` 生成 bearer token，每个请求校验 `Authorization`
- **协作**：`WebSocketServer({ port: 4177, host: '0.0.0.0' })`，房间号是 4 字节 hex，目前只校验房间存在，没有口令与角色，只在手动开启时启动
- **AI**：密钥存系统安全存储，配置了才由渲染层发起请求
- **MCP**：stdio，不走网络；路径校验复用同一套规则

## 内容安全策略

生产 CSP 不是写在 `index.html` 里的，而是 `vite.config.ts` 的自定义插件 `texpro-production-csp` 在 build 时注入：

```text
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data: texpro-asset:; font-src 'self' data:; worker-src 'self' blob:;
connect-src 'self' ws: http: https:; frame-src 'self' texpro-asset:;
media-src 'self' texpro-asset: data:; object-src 'none'; base-uri 'self'; form-action 'none'
```

`style-src` 放开 `unsafe-inline` 是因为内联样式；`connect-src` 放宽是因为要连本机编译服务与用户自配的 AI 端点；`worker-src blob:` 是 PDF.js worker 需要。改 CSP 时同步检查 `/docs/dev-release` 里的产物校验。

## 关闭协议

关窗不是直接退出，是三轮协商：`electron/window-close.cjs` 拦下 `close`，生成 `randomUUID` 作为 pending 并通知渲染层；渲染层 `saveAll()` 后回 `window:close-ready`，主进程只在 sender 匹配且 id 对得上时接受；15 秒没回音就弹原生确认框，`finish()` 用 `setImmediate` 重入 teardown，避免在 IPC 回调里拆窗口。

macOS 上还有 `electron/quit-watchdog.cjs`：退出时 spawn 一个 detached 子进程，5 秒后父进程还活着就 `kill -KILL`，兜住 Chromium 原生 shutdown 卡死。

## 改动指南

新增一条 IPC 要改三处：

- `electron/main.cjs` 的 `registerIpc()`：`ipcMain.handle('channel', ...)`，第一行做路径校验
- `electron/preload.cjs`：加同名通道的 invoke 包装，需要订阅就加 `subscribe()`
- `src/api.ts`：在 `TexProApi` 里补方法签名

漏了 preload 是运行时未定义，漏了类型是编译期报错。四处数字要一起变：main 的 handler 数、preload 的 invoke 数、`api.ts` 的方法数，以及本文的 87。

新增一个服务要改四处：

- 在 `electron/services/` 写 `.cjs`，用命名导出，不要副作用
- `package.json` 的 `asarUnpack` 加路径（服务若会被 spawn 或按路径加载）
- `scripts/verify-release.cjs` 的 required 列表加一行，否则打包校验不认它
- `main.cjs` 顶部 require 并在 handler 里调用

第 2、3 步最容易漏：本地开发一切正常，装出来的包才报错。

## 陷阱

- 在渲染层拼路径再传进来：一律传绝对路径，由主进程做 `isAllowed` 判定
- 在 preload 里写业务逻辑：preload 没有 Node 权限，且会扩大注入面
- 直接 `window.open` 或站内导航：`setWindowOpenHandler` 只放行 http(s) 给系统浏览器，其余 deny
- 忘记 `sender.isDestroyed()` 就往回发流式输出：`compile:output` 在窗口关闭后会抛

## 验证

```bash
grep -c "ipcMain.handle" electron/main.cjs && grep -c "ipcRenderer.invoke" electron/preload.cjs
npm run typecheck
```

两条 grep 都应当是 87。改过服务层或打包配置后再跑 `npm run verify:release`，细节见 `/docs/dev-release`。
