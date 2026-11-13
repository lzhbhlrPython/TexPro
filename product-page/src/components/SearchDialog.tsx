import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileTextOutlined, SearchOutlined } from '@ant-design/icons';
import { Input, Modal, Typography, theme } from 'antd';
import { searchAll } from '@/lib/search';
import { useLocale, useMessages } from '@/i18n';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

/** ⌘K / Ctrl+K 打开的站内搜索：文档 + 博客。 */
export function SearchDialog({ open, onClose }: Props) {
  const navigate = useNavigate();
  const msg = useMessages();
  const { locale } = useLocale();
  const { token } = theme.useToken();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const hits = useMemo(() => searchAll(query, 8, locale, msg), [query, locale, msg]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={620}
      destroyOnHidden
      styles={{ body: { paddingTop: 4 } }}
      title={null}
      closable={false}
    >
      <Input
        autoFocus
        variant="borderless"
        size="large"
        prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
        placeholder={msg("site.search.docs.and.blog.press.enter.to.open")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((prev) => Math.min(prev + 1, Math.max(hits.length - 1, 0)));
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((prev) => Math.max(prev - 1, 0));
          } else if (event.key === 'Enter') {
            const hit = hits[active] ?? hits[0];
            if (hit) go(hit.to);
          }
        }}
        style={{ fontSize: 17 }}
      />

      <div className="search-results" ref={listRef}>
        {query && hits.length === 0 ? (
          <p className="search-empty" style={{ color: token.colorTextTertiary }}>
            {msg("site.nothing.matched.try.another.word.or.press.esc")}
          </p>
        ) : null}

        {hits.map((hit, index) => (
          <button
            type="button"
            key={hit.id}
            className={`search-hit${index === active ? ' is-active' : ''}`}
            onMouseEnter={() => setActive(index)}
            onClick={() => go(hit.to)}
            style={{
              background: index === active ? token.colorFillSecondary : undefined,
            }}
          >
            <span className="search-hit-icon">
              <FileTextOutlined />
            </span>
            <span className="search-hit-body">
              <span className="search-hit-title" style={{ color: token.colorText }}>
                {hit.title}
              </span>
              <span className="search-hit-summary" style={{ color: token.colorTextSecondary }}>
                {hit.summary}
              </span>
            </span>
            <Text type="secondary" className="search-hit-meta">
              {hit.meta}
            </Text>
          </button>
        ))}
      </div>

      <div className="search-foot" style={{ borderColor: token.colorBorderSecondary }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {msg("site.select.open.esc.close")}
        </Text>
      </div>
    </Modal>
  );
}
