---
slug: synctex
title: PDF 与源码双向定位
group: 使用
order: 4
summary: SyncTeX 把 PDF 的坐标映射回源码行。TeXPro 每轮编译都带 -synctex=1，正向跟随与反向点选都建立在这份映射上。
---

每轮编译都带 `-synctex=1`，所以不需要额外开关。正向查询是「源码第几行在 PDF 的哪里」，反向查询是「PDF 这个坐标来自哪一行」；两边都由本机 `synctex` 完成，精度就是 TeX 断行之后的精度。

## 一次定位的完整链路

- 编译成功后，构建目录里多出一份与主文件同名的 `.synctex.gz`。
- 正向查询读它，把「文件、行、列」换算成页面与矩形，PDF 面板据此高亮、滚动。
- 反向查询读同一份文件，把「页、x、y」换算成源文件与行号，编辑器据此选中。
- 映射在每轮成功编译后整份替换，不累积、不增量更新。

手动验证时可以直接调命令行，参数与 TeXPro 内部一致：

```bash
synctex view -i 128:1:main.tex -o .texpro/build/main.pdf
synctex edit -o 3:210:420:.texpro/build/main.pdf
```

`view` 输出 Page、x、y、h、v、W、H，`edit` 输出 Input、Line、Column。TeXPro 额外检查 `edit` 返回的源文件真实路径必须在工程内，否则拒绝跳转。

## 源码 → PDF

- 光标停在某处、PDF 面板开着、设置里的 PDF follows cursor 保持默认开启：停顿 650 毫秒后自动定位。
- 想立刻定位：`⇧⌘J`，或 `Build → Forward Search`。
- PDF 没打开时，手动定位会把面板打开；还没有编译产物时提示 "Compile first to enable SyncTeX"。
- 命中后 PDF 滚到对应位置，顶部横幅写 `Synced to page 3 · line 128`。

自动跟随只在「不编译中、有 PDF、有活动文件」时触发。两者都只在目标离开视口时才滚动，并把它停在视口约 40% 处；区别是手动定位用平滑滚动，自动跟随直接跳，避免边打字边看时画面持续滑动。

## PDF → 源码

在 PDF 上按住 `⌘`（Windows / Linux 为 `Ctrl`）单击，编辑器跳到对应行。反向选区则是按住 `⌘` 拖一个矩形，或先点工具栏的 Select PDF region 进入框选模式。

- 底部提示：`Hold ⌘ / Ctrl and click or drag to locate source`。
- 框选模式提示：`Drag to select a PDF region and locate its source. Esc cancels.`，`Esc` 退出。
- 区域最多取 7 个采样点并行反查。
- 结果按文件分组，取覆盖行数最多的文件，把最小到最大行整段选中。
- 几个点落在不同文件时提示 "Region crosses source files. Showing the largest matching range."。
- 找不到时提示 "No source location at this point"。

反向定位成功后会暂停自动正向跟随 1800 毫秒，否则同一动作会立刻被光标跟随覆盖回去。

## PDF 面板

| 控件 | 作用 |
| --- | --- |
| 上一页 / 下一页 | 翻页，标题旁显示当前页与总页数 |
| 缩放 | 35% 到 180%，步进 10%，默认 90% |
| Fit page width | 按面板宽度铺满一页 |
| 缩略图 | 侧栏页缩略图列表，点击翻到该页 |
| 搜索 | 至少 2 字符，显示 n/m 命中，Enter 与 Shift-Enter 跳转 |
| Select PDF region | 进入框选反查，Esc 退出 |
| Compare with previous compile | 与上一份 PDF 叠影，透明度 15% 到 90% |
| Two-page spread | 双页并排 |
| Presentation mode | 面板全屏 |
| Copy page text | 复制当前页文本 |
| Open PDF in default viewer | 交给系统阅读器 |
| Reveal PDF in Finder | 在文件管理器里定位产物 |

面板空态写 "No PDF yet"，按钮直接触发编译，并提示 `⌘↩ compile · ⌘-click PDF to jump back`。

## 精度与边界

- 粒度是行，不是字符。同一行里的多个公式都指向同一行号；反向点选也只落到行。
- 映射来自最近一次成功编译。改了源码没重编译，定位会偏，偏多少取决于改动了多少行。
- 反向查询要求源文件真实路径在工程内，`\input` 到工程外时会被拒绝，报 "SyncTeX source is outside the project"。
- 编译取消或失败时不更新映射，旧 PDF 与旧映射仍然成对，界面不会出现半张新图配旧行号。
- 从别处拷来的 PDF 没有可用映射：映射由 latexmk 在编译时写入，只对同一次编译的 PDF 有效。

## 常见坑

- 只在 PDF 面板打开时有意义；面板收起后自动跟随不会触发，但仍可以用 `⇧⌘J` 手动定位。
- 编译进行中不跟随：正在编译时打字，等状态栏从 Typesetting 变回 PDF ready 再看。
- 自动编译与光标跟随叠加时，刚保存就跳转可能对到上一版；停顿一拍再定位更稳。
- 区域反查跨文件时只给一个文件的范围，不是多文件合并结果。
- 双页与演示模式只改显示方式，不影响坐标换算。
- 缩放不改变映射：任意缩放级别下点击都按页面坐标换算。

## 与自动编译的配合

自动编译在停止输入 2.2 秒后触发，编译完成才更新 PDF 与映射。写长段时这会出现一个窗口：屏幕上的 PDF 仍是上一版，光标跟随也会对到旧位置。状态栏左边的 Typesetting 转圈是唯一可靠的信号，转完再读 PDF 就不会错位。

如果只想安静写作，把编译策略切到 Manual only，或在设置里关掉 PDF follows cursor，用 `⇧⌘J` 按需定位。

## 相关页面

- 编译与诊断：`/docs/compile`
- 写作模式与主题：`/docs/writing`
- 工程与文件：`/docs/project`
- 快捷键：`/docs/shortcuts`
