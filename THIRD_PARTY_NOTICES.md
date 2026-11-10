# Third-party notices / 第三方声明

## rtex-ts and realtime-tex

TeXPro embeds the independent MIT package [rtex-ts](https://github.com/lzhbhlrPython/rtex-ts), a TypeScript adaptation closely derived from [realtime-tex](https://github.com/HenryXiaoYang/realtime-tex). rtex-ts retains unmodified upstream Lua/TeX support files at revision `fcff7a5c7f33a288ecf40db886843754c62bbdfd` (0.0.7). It is not an official upstream port and does not require the Rust rtex executable or VS Code.

TeXPro 内置独立 MIT 包 rtex-ts。TypeScript 会话层高度参考 realtime-tex，Lua/TeX 支持文件原样保留。原作者为 Henry Yang 与 realtime-tex contributors；改写不抹去上游贡献。来源映射、完整许可证和文件哈希随包保留在 `node_modules/rtex-ts/UPSTREAM.md`、`LICENSE`、`THIRD_PARTY_NOTICES.md` 和 `vendor/realtime-tex/`。在 Electron 安装包中位于 `app.asar.unpacked/node_modules/rtex-ts/`。

Research inspiration / 研究灵感：Clemens Lode, [Real-Time LuaTeX: Recompiling Large Documents in 1 ms](https://www.tug.org/tug2026/preprints/lode-realtime.pdf), TUG 2026. The paper and Rust project's performance figures are not rtex-ts or TeXPro benchmarks. Citation does not imply endorsement.

The retained rtex-ts/realtime-tex license follows:

```text
MIT License

Copyright (c) 2026 rtex-ts contributors
Copyright (c) 2026 Henry Yang and the realtime-tex contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## fontkit

The host uses [fontkit](https://github.com/foliojs/fontkit), MIT, for drawing the actual TeX glyph outlines. It does not replace TeX shaping with browser text. The published package names Devon Govett as its author and declares MIT in `package.json` and `README.md`; its README contains an MIT label, not the full permission text. Attribution: Copyright (c) Devon Govett and contributors. Retain that attribution together with the complete MIT permission and disclaimer reproduced above, and the separate notices supplied by its dependencies. This attribution does not claim an upstream copyright year absent from the distributed package.

宿主使用 fontkit 读取实际字形轮廓，保留其版权和 MIT 许可；间接依赖也分别遵循自身许可。发行包保留依赖自带声明。LuaLaTeX、TeX Live、宏包及字体由用户另行安装，遵循各自许可，不因本项目 MIT 协议而改变。

Other dependencies retain their own licenses, including Electron/Chromium and PDF.js. See the bilingual copyright guide on the product site and each distributed dependency for the full list. Your source documents and exported PDFs remain yours.
