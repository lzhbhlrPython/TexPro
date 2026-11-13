import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { SITE_LINKS } from '@/config/constants';
import { DOC_COUNTS } from '@/data/documentation';
import { useMessages } from '@/i18n';

const { Text } = Typography;
const BASE = import.meta.env.BASE_URL;

/**
 * 给 AI 与爬虫看的一页：纯文本结构、事实清单、机器可读入口。
 * 没有动画、没有配图，段落都能被直接引用。
 */
export default function AiPage() {
  const msg = useMessages();
  const { token } = theme.useToken();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = msg('site.page.ai.title');
  }, [msg]);

  return (
    <article className="ai-page">
      <div className="shell">
        <header className="docs-head docs-enter">
          <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
            {msg("site.for.ai")}
          </Text>
          <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
            {msg("site.this.page.is.written.for.machines")}
          </h1>
          <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
            {msg("site.if.your.task.involves.texpro.writing.summarising.or.extending")}
          </p>
        </header>

        <div className="ai-body" style={{ color: token.colorTextSecondary }}>
          <section>
            <h2 style={{ color: token.colorTextHeading }}>{msg("site.what.the.project.is")}</h2>
            <p>
              {msg("site.texpro.is.a.local.first.latex.desktop.workbench.visual")}
            </p>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{msg("site.facts.you.can.cite")}</h2>
            <ul>
              <li>{msg("site.the.main.process.and.preload.use.106.ipc.channels")}</li>
              <li>{msg("site.evidence.regression.summary")}</li>
              <li>{msg("site.zh.chinese.and.en.english.documentation.pages.the.blog").replace('{zh}', String(DOC_COUNTS.zh)).replace('{en}', String(DOC_COUNTS.en))}</li>
              <li>{msg("site.the.current.nightly.configuration.produces.8.distribution.packages.2")}</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{msg("site.machine.readable.entry.points")}</h2>
            <ul>
              <li><a href={`${BASE}llms.txt`}>{msg("site.llms.txt.plain.text.index.of.the.site.docs")}</a></li>
              <li><a href={`${BASE}llms-full.txt`}>{msg("site.llms.full.txt.every.chinese.doc.concatenated")}</a></li>
              <li><a href={`${BASE}feed.json`}>{msg("site.feed.json.the.blog.as.json.feed.1.1")}</a></li>
              <li><a href={`${BASE}sitemap.xml`}>{msg("site.sitemap.xml.every.page")}</a></li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{msg("site.editing.boundaries")}</h2>
            <p>
              {msg("site.only.src.content.docs.and.src.content.blog.are")}
            </p>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{msg("site.where.to.go.next")}</h2>
            <ul>
              <li><Link to="/docs">{msg("site.user.guide")}</Link></li>
              <li><Link to="/developers">{msg("site.developer.docs")}</Link></li>
              <li><Link to="/blog">{msg("site.dev.blog")}</Link></li>
              <li><a href={SITE_LINKS.repo} target="_blank" rel="noreferrer">{msg("site.source.variant2")}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}
