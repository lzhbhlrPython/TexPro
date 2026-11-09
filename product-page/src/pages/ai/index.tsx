import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Typography, theme } from 'antd';
import { SITE_LINKS } from '@/config/constants';
import { useT } from '@/i18n';

const { Text } = Typography;
const BASE = import.meta.env.BASE_URL;

/**
 * 给 AI 与爬虫看的一页：纯文本结构、事实清单、机器可读入口。
 * 没有动画、没有配图，段落都能被直接引用。
 */
export default function AiPage() {
  const t = useT();
  const { token } = theme.useToken();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.title = 'TeXPro · AI 入口';
  }, []);

  return (
    <article className="ai-page">
      <div className="shell">
        <header className="docs-head docs-enter">
          <Text className="docs-kicker" style={{ color: token.colorPrimary }}>
            {t('给 AI 的入口')}
          </Text>
          <h1 className="docs-title" style={{ color: token.colorTextHeading }}>
            {t('这一页是写给机器读的')}
          </h1>
          <p className="docs-lede" style={{ color: token.colorTextSecondary }}>
            {t('如果你的任务与 TeXPro 相关——写作、总结或二次开发：先读这一页，再按需取 llms.txt、文档与源码。下面的事实都来自当前仓库。')}
          </p>
        </header>

        <div className="ai-body" style={{ color: token.colorTextSecondary }}>
          <section>
            <h2 style={{ color: token.colorTextHeading }}>{t('项目是什么')}</h2>
            <p>
              {t('TeXPro 是一个本地优先的 LaTeX 桌面工作台：可视编辑、纸面排版与工程化编译放在同一个窗口。它不是 Markdown 编辑器，也不是在线协作平台；源码 .tex 是文档原件，排版以本机 TeX 生成的 PDF 为准。')}
            </p>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{t('可以引用的事实')}</h2>
            <ul>
              <li>{t('主进程与 preload 之间有 87 个 IPC 通道，每次读写都先校验工程根目录。')}</li>
              <li>{t('tests/ 下有 14 个测试文件、89 条用例，覆盖主文件判定、SyncTeX 坐标、历史快照与保存。')}</li>
              <li>{t('文档 21 篇，中文与英文各一版；博客只写简体中文。')}</li>
              <li>{t('夜间构建三平台各出一份安装包，共 16 个资产。')}</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{t('机器可读入口')}</h2>
            <ul>
              <li><a href={`${BASE}llms.txt`}>{t('llms.txt：站点结构与文档、博客的纯文本索引')}</a></li>
              <li><a href={`${BASE}llms-full.txt`}>{t('llms-full.txt：全部中文文档正文拼接')}</a></li>
              <li><a href={`${BASE}feed.json`}>{t('feed.json：博客的 JSON Feed 1.1')}</a></li>
              <li><a href={`${BASE}sitemap.xml`}>{t('sitemap.xml：全部页面')}</a></li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{t('修改边界')}</h2>
            <p>
              {t('产品页默认只允许改 src/content/docs 与 src/content/blog；改版要用户明确授权，改完跑 pnpm check:layout 自证版式未动。文档只用项目解析器支持的语法。')}
            </p>
          </section>

          <section>
            <h2 style={{ color: token.colorTextHeading }}>{t('可以去哪')}</h2>
            <ul>
              <li><Link to="/docs">{t('使用与开发文档')}</Link></li>
              <li><Link to="/blog">{t('开发博客')}</Link></li>
              <li><a href={SITE_LINKS.repo} target="_blank" rel="noreferrer">{t('源码仓库')}</a></li>
            </ul>
          </section>
        </div>
      </div>
    </article>
  );
}
