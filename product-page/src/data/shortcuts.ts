export interface ShortcutItem {
  keys: string;
  label: string;
}

export interface ShortcutGroup {
  title: string;
  items: ShortcutItem[];
}

/** 与 electron/main.cjs 的菜单加速键、编辑器 keymap 一一对应。 */
export const SHORTCUTS: ShortcutGroup[] = [
  {
    title: '文件',
    items: [
      { keys: '⌘ O', label: '打开文件夹' },
      { keys: '⌘ S', label: '保存当前文件' },
      { keys: '⌘ ⇧ W', label: '关闭工程' },
    ],
  },
  {
    title: '写作',
    items: [
      { keys: '⌘ K', label: '命令面板' },
      { keys: '⌘ ⇧ H', label: '插入占位符' },
      { keys: 'F4', label: '循环当前文件的占位符' },
      { keys: '⌘ ⇧ N', label: '插入修订备忘' },
    ],
  },
  {
    title: '编译与定位',
    items: [
      { keys: '⌘ ↩', label: '编译' },
      { keys: '⌘ J', label: 'Forward Search：源码跳到 PDF' },
      { keys: '⌘ ⇧ P', label: '收起 / 展开 PDF 预览' },
    ],
  },
  {
    title: '视图',
    items: [
      { keys: '⌘ \\', label: '收起 / 展开侧栏' },
      { keys: '⌘ ⇧ M', label: '切换可视模式' },
      { keys: '⌘ ⇧ F', label: '切换聚焦模式' },
      { keys: '⌘ ⇧ T', label: '切换打字机模式' },
      { keys: '⌘ ⇧ L', label: '切换日间 / 夜间' },
    ],
  },
];
