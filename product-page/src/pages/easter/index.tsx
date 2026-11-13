import { CodeHighlight } from '@/components/CodeHighlight';
import { useEffect, useLayoutEffect, useState } from 'react';
import { App, Button, theme } from 'antd';
import { useMessages } from '@/i18n';
import { useThemeMode } from '@/lib/theme';
import { ROSE_BASE64 } from './rose';
import { LocalizedMarkdown } from '@/components/LocalizedMarkdown';

/** 彩蛋页：路由懒加载，主包不含这段代码，头像与玫瑰字符串也只在打开时才会被读到。 */
export default function QwertyPage() {
  const msg = useMessages();
  const { token } = theme.useToken();
  const { setOverride } = useThemeMode();

  // 这一页强制夜间：用临时覆盖，不写 localStorage；离开时清空即还原。
  useLayoutEffect(() => {
    setOverride('dark');
    return () => setOverride(null);
  }, [setOverride]);
  const { message } = App.useApp();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ROSE_BASE64);
      setCopied(true);
      message.success(msg("site.copied"));
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      message.error(msg("site.copy.failed.select.it.manually"));
    }
  };

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Qwerty · TeXPro';

    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);

    return () => {
      document.title = previousTitle;
      meta.remove();
    };
  }, []);


  return (
    <article
      className="qwerty"
      style={{ ['--qwerty-bg' as string]: `url(${import.meta.env.BASE_URL}easter/texpad-night.webp)` }}
    >
      <div className="shell qwerty-inner">
        <p className="qwerty-eyebrow">{msg("site.easter.egg")}</p>
        <div className="qwerty-head">
          <h1 className="qwerty-title">Qwerty</h1>
          <span
            className="qwerty-avatar"
            role="img"
            aria-label={msg("site.qwerty.a.girl.with.long.brown.hair.holding.a")}
            style={{ backgroundImage: `url(${import.meta.env.BASE_URL}easter/texpad.webp)` }}
          />
        </div>
        <p className="qwerty-lede">{msg("site.a.letter.from.the.editor.to.you.still.revising")}</p>

        <div className="qwerty-prose">
          <LocalizedMarkdown document="qwerty" />
        </div>

        <div className="qwerty-code-block">
          <pre className="qwerty-code" aria-label="base64">
            <CodeHighlight text={ROSE_BASE64} language="text" />
          </pre>
          <Button
            type="text"
            size="small"
            className="qwerty-copy"
            onClick={copy}
            aria-label={msg("site.copy.code")}
            style={{ color: token.colorTextTertiary, background: token.colorBgContainer }}
          >
            {copied ? msg("site.copied") : msg("site.copy")}
          </Button>
        </div>
      </div>
    </article>
  );
}
