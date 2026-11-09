import { useEffect } from 'react';
import { useT } from '@/i18n';

/** 彩蛋页：路由懒加载，主包不含这段代码，图片也只在第一次打开时请求。 */
export default function TexPadPage() {
  const t = useT();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'TeXPad · TeXPro';

    // 不给爬虫与构建脚本任何线索
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
    <article className="texpad">
      <div className="shell texpad-inner">
        <figure className="texpad-figure">
          <span className="texpad-glow" aria-hidden="true" />
          <img
            className="texpad-image"
            src={`${import.meta.env.BASE_URL}easter/texpad.webp`}
            alt={t('TeXPad 娘：棕色长发的女孩，抱着一本写着 LaTeX 的书。')}
            width={760}
            height={1013}
            decoding="async"
          />
        </figure>

        <div className="texpad-copy">
          <p className="texpad-eyebrow">{t('彩蛋')}</p>
          <h1 className="texpad-title">{t('TeXPad 娘')}</h1>
          <p className="texpad-lede">{t('她不是吉祥物，也不是客服。她只是一个比喻：写作这件事，本来可以轻一点。')}</p>

          <dl className="texpad-notes">
            <div>
              <dt>{t('手里的书')}</dt>
              <dd>{t('一本 LaTeX 手册，翻到「排版」那一章就停住了；后面的页角还折着。')}</dd>
            </div>
            <div>
              <dt>{t('斗篷上的麦穗')}</dt>
              <dd>{t('取自纸的纤维与 \\alpha 的尾巴。风大的时候，她会按住它。')}</dd>
            </div>
            <div>
              <dt>{t('裙摆的花括号')}</dt>
              <dd>{t('提醒你：任何一段文字，都还在一个 {} 里面。')}</dd>
            </div>
            <div>
              <dt>{t('腰间的笔')}</dt>
              <dd>{t('只写一句话，写完就收起来。她不喜欢把纸写满。')}</dd>
            </div>
          </dl>

          <p className="texpad-close">
            {t('她不出现在任何页面上，也不进构建脚本。你找到她，她才存在；关掉这一页，她就回到草稿里。')}
          </p>
          <p className="texpad-foot">{t('彩蛋 · 仅此一页，不设入口。')}</p>
          <p className="texpad-credit">{t('插画：GPT-Image 2.6 生成，作者提供。')}</p>
        </div>
      </div>
    </article>
  );
}
