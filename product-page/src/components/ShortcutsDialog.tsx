import { useMemo, useState } from 'react';
import { Input, Modal } from 'antd';
import { SHORTCUTS } from '@/data/shortcuts';
import { useMessages } from '@/i18n';

interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
}

/** 快捷键浮层：数据来自 main.cjs 的菜单加速键与编辑器 keymap。 */
export function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const msg = useMessages();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return SHORTCUTS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!keyword) return true;
        return (
          item.keys.toLowerCase().includes(keyword) ||
          item.label.includes(query.trim()) ||
          msg.text(item.label).toLowerCase().includes(keyword)
        );
      }),
    })).filter((group) => group.items.length > 0);
  }, [query, msg]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      title={msg("site.keyboard.shortcuts")}
      destroyOnHidden
    >
      <Input
        allowClear
        autoFocus
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={msg("site.search.shortcuts")}
      />
      <div className="shortcut-groups">
        {groups.map((group) => (
          <section className="shortcut-group" key={group.title}>
            <h4 className="shortcut-title">{msg.text(group.title)}</h4>
            <dl className="shortcut-list">
              {group.items.map((item) => (
                <div className="shortcut-row" key={item.keys}>
                  <dt>
                    <kbd className="shortcut-key">{item.keys}</kbd>
                  </dt>
                  <dd>{msg.text(item.label)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        {groups.length === 0 ? (
          <p className="shortcut-empty">{msg("site.no.shortcut.matches")}</p>
        ) : null}
      </div>
    </Modal>
  );
}
