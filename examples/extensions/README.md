# Local extension examples

- `writing-kit`: trusted executable API 1 example. Commands, checked edit proposals, diagnostics, automatic completion/hover, text preview, plain-text import, source export, BibTeX output, CSV-to-PGFPlots and an explicitly accepted compile request. Data providers are invoked in the host tool; the `mcp` kind is experimental and is not automatically exposed through external MCP stdio.
- `quiet-paper`: data-only theme, completion and project template. No executable entry or capabilities.

From the repository root:

```sh
node scripts/pack-extension.cjs examples/extensions/quiet-paper /tmp/quiet-paper.tpt
node scripts/pack-extension.cjs examples/extensions/writing-kit /tmp/writing-kit.tpp
```

Use **Extensions → Install package…**, inspect, install, then enable. For executable code, review the package and confirm trust. For development, choose **Load development directory…**; reload installs a fresh disabled snapshot. Existing configuration/data are retained. Delete the output file or choose a new name before packing again; packaging never silently overwrites.

These are original MIT examples inspired by Koishi's lifecycle design, not Koishi plugins. See `packages/extension-sdk/index.d.ts`, `docs/extensions.md` and the development skill for the exact contract and current limits.

分发扩展名为 `.tpp`（插件）与 `.tpt`（主题），底层均为 ZIP 归档。`.tpt` 只接受主题配置、CSS 与资源，不接受可执行入口、动作或其他插件贡献；将代码包改名为 `.tpt` 会拒绝，扩展名不代表安全认证。
