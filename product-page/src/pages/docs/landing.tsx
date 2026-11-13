import { useEffect, type CSSProperties } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, BookOutlined, CodeOutlined } from '@ant-design/icons';
import { Button, theme } from 'antd';
import { navFor, topicsFor } from '@/content/docs';
import { documentationHome, type DocumentationSection } from '@/content/docs/sections.mjs';
import { CodeHighlight } from '@/components/CodeHighlight';
import { Reveal } from '@/components/Reveal';
import { useLocale, useT } from '@/i18n';

const GROUP_DESCRIPTIONS: Record<string, string> = {
  开始: '准备工具，创建你的第一个工程。',
  使用: '把输入、预览与修改留在同一条写作路径里。',
  参考: '需要时查阅工程、导出、快捷键与扩展管理。',
  关于: '了解产品边界、版权与许可。',
  开发: '从本地环境到宿主契约、扩展开发与发布验证。',
  'AI 协作': '通过明确的接口与约束，让 AI 参与工程与开发。',
};

export default function DocsLanding({ section }: { section: DocumentationSection }) {
  const t = useT();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { token } = theme.useToken();
  const developer = section === 'develop';
  const groups = navFor(locale, section);
  const topics = topicsFor(locale, section);
  const featured = (developer ? ['extension-development', 'qwertysay', 'mcp'] : ['start', 'writing', 'compile'])
    .map(slug => topics.find(topic => topic.slug === slug)).filter(topic => topic !== undefined);
  const label = developer ? '开发文档' : '使用文档';

  useEffect(() => { document.title = `${t(label)} · TeXPro`; }, [locale, label, t]);

  const layoutTokens = {
    '--site-doc-xs': `${token.marginXS}px`, '--site-doc-sm': `${token.marginSM}px`,
    '--site-doc-md': `${token.margin}px`, '--site-doc-lg': `${token.marginLG}px`,
    '--site-doc-xl': `${token.marginXL}px`, '--site-doc-xxl': `${token.marginXXL}px`,
    '--site-doc-font-sm': `${token.fontSizeSM}px`, '--site-doc-font': `${token.fontSize}px`,
    '--site-doc-font-lg': `${token.fontSizeLG}px`, '--site-doc-h1': `${token.fontSizeHeading1}px`,
    '--site-doc-h2': `${token.fontSizeHeading2}px`, '--site-doc-h3': `${token.fontSizeHeading3}px`,
  } as CSSProperties;
  return <article className={`docs-landing docs-landing--${section}`} style={layoutTokens}>
    <div className="shell">
      <header className="docs-landing-hero">
        <Reveal className="docs-landing-intro">
          <p className="eyebrow" style={{ color: token.colorPrimary }}>
            {developer ? <CodeOutlined /> : <BookOutlined />} {t(label)}
          </p>
          <h1 style={{ color: token.colorTextHeading }}>{t(developer ? '理解边界，构建新的能力。' : '从第一个工程，到写作与交付。')}</h1>
          <p className="docs-landing-lede" style={{ color: token.colorTextSecondary }}>{t(developer
            ? '面向扩展作者、应用贡献者和 AI 协作者。找到公共 API、工具链、架构与验证依据，再开始修改。'
            : '面向每天使用 TeXPro 写作的人。从安装开始，按正在完成的任务找到操作步骤。')}</p>
          <div className="docs-landing-actions">
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={() => navigate(`/docs/${developer ? 'dev-setup' : 'start'}`)}>{t(developer ? '配置开发环境' : '开始第一个工程')}</Button>
            <Link to={documentationHome(developer ? 'use' : 'develop')}>{t(developer ? '寻找使用文档' : '前往开发文档')} <ArrowRightOutlined /></Link>
          </div>
        </Reveal>
        <Reveal delay={60} className="docs-landing-entry" style={{ background: token.colorBgContainer, borderColor: token.colorBorderSecondary }}>
          <p className="eyebrow" style={{ color: token.colorTextTertiary }}>{t(developer ? '公共 API · 明确的信任边界' : '把注意力留给正文')}</p>
          {developer ? <pre className="docs-landing-code" tabIndex={0}><CodeHighlight language="js" text={"const { defineTextTransform } =\n  require('@texpro/extension-sdk');\n\nmodule.exports = defineTextTransform(\n  text => text.toUpperCase()\n);"} /></pre> : <p className="docs-landing-note" style={{ color: token.colorTextHeading }}>{t('写下内容，查看排版，继续修改。')}</p>}
          <nav aria-label={t('快速进入')}>
            {featured.map((topic, index) => <Link key={topic.slug} to={`/docs/${topic.slug}`} style={{ color: token.colorText }}><span className="docs-entry-number" style={{ color: token.colorTextTertiary }}>0{index + 1}</span><span>{topic.title}</span><ArrowRightOutlined style={{ color: token.colorPrimary }} /></Link>)}
          </nav>
        </Reveal>
      </header>

      <section className="docs-directory" aria-label={t('按任务浏览')}>
        <Reveal className="docs-directory-heading"><h2 style={{ color: token.colorTextHeading }}>{t(developer ? '从契约到实现' : '按任务找到答案')}</h2><p style={{ color: token.colorTextSecondary }}>{t(developer ? '扩展开发与应用维护各有入口，共享同一套公开约束。' : '不用先理解应用架构，也能完成日常写作。')}</p></Reveal>
        <div className="docs-directory-groups">
          {groups.map((group, index) => {
            return <Reveal key={group.group} delay={(index % 2) * 60} className="docs-directory-group" style={{ borderColor: token.colorBorderSecondary }}>
              <h3 style={{ color: token.colorTextHeading }}>{group.label}</h3>
              <p style={{ color: token.colorTextSecondary }}>{t(GROUP_DESCRIPTIONS[group.group] ?? '')}</p>
              <ul>{group.items.map(item => <li key={item.slug}><Link to={`/docs/${item.slug}`} style={{ color: token.colorText }}><span>{item.title}</span><ArrowRightOutlined style={{ color: token.colorTextTertiary }} /></Link></li>)}</ul>
            </Reveal>;
          })}
        </div>
      </section>
    </div>
  </article>;
}
