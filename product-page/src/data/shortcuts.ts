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
    title: "site.file",
    items: [
      { keys: '⌘ O', label: "site.open.folder" },
      { keys: '⌘ S', label: "site.save.current.file" },
      { keys: '⌘ ⇧ W', label: "site.close.project" },
    ],
  },
  {
    title: "site.writing",
    items: [
      { keys: '⌘ K', label: "site.command.palette" },
      { keys: '⌘ ⇧ H', label: "site.insert.placeholder" },
      { keys: 'F4', label: "site.cycle.placeholders.in.file" },
      { keys: '⌘ ⇧ N', label: "site.insert.revision.memo" },
    ],
  },
  {
    title: "site.build.and.jump",
    items: [
      { keys: '⌘ ↩', label: "site.compile" },
      { keys: '⌘ J', label: "site.forward.search.source.to.pdf" },
      { keys: '⌘ ⇧ P', label: "site.toggle.pdf.preview" },
    ],
  },
  {
    title: "site.view",
    items: [
      { keys: '⌘ \\', label: "site.toggle.sidebar" },
      { keys: '⌘ ⇧ M', label: "site.toggle.visual.mode" },
      { keys: '⌘ ⇧ F', label: "site.toggle.focus.mode" },
      { keys: '⌘ ⇧ T', label: "site.toggle.typewriter.mode" },
      { keys: '⌘ ⇧ L', label: "site.toggle.light.dark" },
    ],
  },
];
