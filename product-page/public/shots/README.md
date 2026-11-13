# Screenshot provenance

2026-11-12: macOS arm64, Electron 44.9.1, branch codex/realtime-tex. Captured by `npm run test:extensions:ui` using a temporary profile and temporary demo project. Extension screenshots install the actual examples/extensions packages; the drawing screenshot waits for the TeX preview. Native traffic-light clearance is checked geometrically; webContents captures exclude native window controls. Themes show the same demo source after restoring the repository demo/main.tex. No generated or composited UI. Only JPEG conversion and proportional resizing (sips, maximum 1600px).

| Published asset | Raw capture | Raw SHA-256 |
| --- | --- | --- |
| diagram.jpg | artifacts/flow-diagram-workspace.png | 4c9313c951f0b57c08f5c9cb774b61b9b2bdfdd1099ea50d23e916849541f7d2 |
| extensions.jpg | artifacts/flow-extensions-zh.png | 190e4a868ce692c8cc531de5fc09342209cf5fcafeadb5cb9d1caf2d761127e0 |
| theme-paper.jpg | artifacts/flow-preview-paper.png | b35b5aba852e719764e7cee51dd6a1d776d15137e1ce739af8e0cb25f9f7af5c |
| theme-studio.jpg | artifacts/flow-preview-studio.png | 7d1d4b3192ba30192f5214a65ec4c7ead3f2799ec24d18d381ab5b6f06adc22a |
| theme-night.jpg | artifacts/flow-preview-night.png | f88eaee90629ae6e63f47f4a7527b97598cc5221b013ac60d5c3c83456386b94 |

hero.jpg, table.jpg, focus.jpg and typewriter.jpg are retained earlier application captures; this update does not claim to recapture them.

2026-11-13：`extensions.jpg` 更新为包含预装简体中文语言插件的真实扩展面板，由本轮完整 `test:extensions:ui` 临时工程捕获。仅 JPEG 转换和最大 1600px 等比缩放。原始 `artifacts/flow-extensions-zh.png` SHA-256：`5215577a8fa1242e002202540585bac8257b5e004e7b6d8128dae6c02bdffbed`。语言切换与同步安装／卸载的原始截图副本见 `docs/screenshots/language-preferences.png`、`language-preinstalled.png`、`extensions-sync-install.png` 与 `extensions-sync-remove.png`；它们没有更改日常作者工程。

2026-11-13（语言目录第 2 版）：`extensions.jpg` 更新自本轮实际 `test:extensions:ui`，使用临时用户目录与测试工程；原始 `artifacts/flow-extensions-zh.png` SHA-256：`447c71c1271fe6b8dd3928ef28c58e83f35ece603c576782dfa8815c07295044`。仅 JPEG 转换及最大 1600px 等比缩放。该次验证包含语义键语言插件、原生菜单、中英切换、第三语种、停用／卸载回退与主题恢复；相应语言偏好和扩展同步截图副本同轮更新到 `docs/screenshots/`。
