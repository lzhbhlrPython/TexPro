# 应用更新检查

用户操作见官网[安装与第一个工程](../product-page/src/content/docs/zh/start.md)。检查属于 L2，复用偏好设置；没有更新中心或后台启动检查。`includeNightlyUpdates` 为本机设置，默认 false，旧设置加载时补齐并规范为布尔值。

## 服务与信任边界

`electron/services/app-updates.cjs` 提供可注入 fetch 的独立服务；`app:check-updates` 仅接受主窗口和布尔参数，当前版本来自 `app.getVersion()`，平台／架构来自主进程。preload 与 `src/api.ts` 提供专用接口，`src/types.ts` 声明结果；不提供任意 URL 获取或命令执行。主进程使用 Electron net.fetch，支持系统网络环境；公开端点不需要 token，不携带工程内容。

服务固定访问 `lzhbhlrPython/TexPro` 的 GitHub Releases。正式版独立查询 `/latest`，404 表示没有正式发布。包含 Nightly 时分页查询列表，每页 100、最多 10 页；超过上限返回错误，不能根据不完整历史宣称最新。请求总超时 20 秒，每个响应最多 8 MiB。并发检查返回 busy；错误包含网络、超时、限流、异常响应、历史超限和不支持的当前版本，不回退旧快照冒充实时结果。GitHub 接口契约见[官方 Releases API](https://docs.github.com/en/rest/releases/releases)。

## 版本和资产

接受三段数字正式版本、`v{base}-YYYYMMDD-Nightly` 与旧 `{base}-nightly.YYYYMMDD`。旧固定 nightly 标签从资产文件名提取版本。排除草稿和其他预发布；按数字基础版本、同基础版本正式版优先、Nightly 日期排序。只在候选版本严格更高时提供更新，避免降级。

仅采用 uploaded 且大小大于零的兼容安装包：macOS DMG（对应架构或 universal）、Windows 对应架构 setup.exe、Linux 对应架构 AppImage（x64 同时匹配实际 x86_64 名称）。下载和发布页 URL 从固定仓库、tag 和资产名构造，不信任响应内任意下载 URL。发布说明最多 20,000 字符，以纯文本显示，不执行 HTML。版本查询在关闭设置或切换渠道后忽略旧结果；下载任务独立于面板存活，不编辑文档、不执行安装或退出。

相同版本的重新构建无法检测，尤其是同日 Nightly 或维护者授权的正式版替换。检查不会为其提供自动重新安装；用户从 Release 手动获取。MCP 面向工程磁盘与写作操作，此应用维护能力不新增外部 MCP 工具。

## 验证

`tests/app-updates.test.cjs` 使用可控响应覆盖版本排序、分页、缺少安装包、旧 Nightly、正式版晋升与失败。完整基线执行 `npm run test:regression`，并执行类型、桌面构建及 `node scripts/test-flow-ui.cjs --updates` 原生设置交互检查。真实网络只验证查询与资产识别；不会下载或安装应用，不能代替三平台安装验收。

## 应用内下载安装包

`electron/services/update-download.cjs` 以单任务状态机管理 idle／downloading／verifying／ready／cancelled／error。主进程保存最新成功查询得到的可更新 release；`app:update-download` 不接受 URL 或目标路径，不能由渲染层指定任意文件。专用 status、cancel、reveal IPC 校验主窗口身份，类型与 preload 同步。渲染层只在设置打开时每 500ms 顺序读取状态，避免重叠轮询和过期回写。

`autoDownloadUpdates` 默认为 false，只有用户主动检查发现更新后才自动下载。没有启动检查、定时检查或安装器执行；关闭面板不取消下载，退出中断。下载中禁用渠道切换，取消后可切换；重开设置恢复主进程任务状态，跨应用重启不恢复，不提供断点续传。

候选保留 GitHub 的 size 与 digest，应用内下载要求有效 sha256。在用户数据目录 updates 下生成独占目录，以 wx 和 0600 写入 .part，预检可用空间，限制安装包最大 4 GiB，整体超时 15 分钟、空闲超时 30 秒。仅允许 HTTPS 的 github.com、release-assets.githubusercontent.com、objects.githubusercontent.com，逐跳检查重定向，最多五次，不带凭据。流式读取、SHA256 与逐字节计数，不在内存聚合大安装包；完整性通过后同步落盘并重命名为安装包原名。摘要缺失、网络、大小、哈希、磁盘与超时错误分别反馈。取消和失败清理本次目录；强制结束可能遗留 .part，已完成文件保留在缓存。

reveal 只定位主进程记录且仍为普通文件、大小一致的已完成安装包，不调用 openPath 或执行程序。大小和 SHA256 证明下载与发布资产一致，不代替开发者签名。没有新增 electron-updater、元数据、签名凭据或打包机制。下载完整性与取消回归见 tests/update-download.test.cjs；原生设置验收仍用 `node scripts/test-flow-ui.cjs --updates`。
