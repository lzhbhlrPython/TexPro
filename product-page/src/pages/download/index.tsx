import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button, Flex, Space, Typography, theme } from 'antd';
import { ArrowLeftOutlined, CheckCircleFilled, DownloadOutlined, LoadingOutlined } from '@ant-design/icons';
import { SITE_LINKS } from '@/config/constants';
import { DOWNLOADS } from '@/data/site';
import { useRelease } from '@/hooks/useRelease';
import { usePlatform } from '@/lib/platform';
import { findAsset, formatSize } from '@/lib/release';
import { useLocalize, useT } from '@/i18n';

const { Text } = Typography;

type Phase = 'checking' | 'packing' | 'ready';

const STEPS = ['正在核对版本', '正在准备安装包', '准备完成'];

const INSTALL_FIRST_STEP = {
  mac: '打开安装包，把 TeXPro 拖进「应用程序」；首次打开请在系统设置里允许。',
  windows: '双击 EXE 按向导安装，或直接解压便携版运行。',
  linux: 'AppImage 赋可执行权限后直接运行；deb / rpm 用包管理器安装。',
} as const;

export default function DownloadPage() {
  const { token } = theme.useToken();
  const t = useT();
  const localize = useLocalize();
  const [params] = useSearchParams();
  const release = useRelease();
  const detected = usePlatform();

  const targets = localize(DOWNLOADS);
  const requested = params.get('platform');
  const target = targets.find((item) => item.key === requested) ?? targets.find((item) => item.key === detected) ?? targets[0];

  const primary = useMemo(
    () => findAsset(release.assets, release.version, new RegExp(target.assetPattern)),
    [release.assets, release.version, target.assetPattern],
  );

  const [phase, setPhase] = useState<Phase>('checking');

  useEffect(() => {
    setPhase('checking');
    const toPacking = window.setTimeout(() => setPhase('packing'), 520);
    const toReady = window.setTimeout(() => setPhase('ready'), 1180);
    return () => {
      window.clearTimeout(toPacking);
      window.clearTimeout(toReady);
    };
  }, [target.key, release.version]);

  useEffect(() => {
    document.title = `${t('下载')} · TeXPro`;
  }, [t]);

  const variants = target.variants
    .map((variant) => ({
      ...variant,
      asset: findAsset(release.assets, release.version, new RegExp(variant.assetPattern)),
    }))
    // 主推荐格式已经在上面那张卡片里，这里不再重复
    .filter((variant) => variant.asset?.url !== primary?.url);

  return (
    <div className="dl-page">
      <div className="shell">
        <Link to="/#download" className="dl-page-back">
          <ArrowLeftOutlined /> {t('回到下载区')}
        </Link>

        <header className="dl-page-hero">
          <Text className="eyebrow" style={{ color: token.colorPrimary }}>
            {t('下载')}
          </Text>
          <h1 className="dl-page-title">
          <span>{t('你的 LaTeX 编辑器')}</span>
          <span className="dl-page-title-tail">{t('正在路上')}</span>
        </h1>
          <p className="dl-page-lede">
            {t('安装包已经准备好。接下来只是把它装进本机，再让 TeXPro 认识你本机上的 TeX。')}
          </p>
          <div className="dl-page-meta">
            <span>{release.version}</span>
            <span>·</span>
            <span>{target.platform}</span>
            <span>·</span>
            <span>{primary ? formatSize(primary.size) ?? '' : ''}</span>
          </div>
        </header>

        <ol className="dl-route" aria-live="polite">
          {STEPS.map((label, index) => {
            const done = phase === 'ready' ? true : index === 0 && phase !== 'checking';
            const active =
              (index === 0 && phase === 'checking') ||
              (index === 1 && phase === 'packing') ||
              (index === 2 && phase === 'ready' && false);
            return (
              <li key={label} className={`dl-route-step${done ? ' is-done' : ''}${active ? ' is-active' : ''}`}>
                <span className="dl-route-mark">
                  {done ? <CheckCircleFilled /> : active ? <LoadingOutlined /> : null}
                </span>
                <span className="dl-route-label">{t(label)}</span>
              </li>
            );
          })}
        </ol>

        <section className="dl-page-card">
          <div className="dl-page-file">
            <span className="dl-page-file-name">{primary?.name ?? `${target.platform} · ${target.format}`}</span>
            <span className="dl-page-file-size">{primary ? formatSize(primary.size) ?? '' : ''}</span>
          </div>
          <Flex gap={10} wrap align="center">
            <Button
              type="primary"
              size="large"
              className="dl-cta"
              icon={<DownloadOutlined />}
              href={primary?.url ?? SITE_LINKS.releases}
              target="_blank"
              rel="noreferrer"
            >
              {t('立即下载')}
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('按下去会打开 GitHub Releases 上的安装包；也可以先核对上面的体积。')}
            </Text>
          </Flex>
        </section>

        <section className="dl-page-block">
          <h2 className="dl-page-h2">{t('同一个平台的其它格式')}</h2>
          <ul className="dl-variant-list">
            {variants.map((variant) => (
              <li key={variant.label} className="dl-variant-row">
                <span className="dl-variant-label">{variant.label}</span>
                {variant.note ? <span className="dl-variant-note">{t(variant.note)}</span> : null}
                <span className="dl-variant-size">{variant.asset ? formatSize(variant.asset.size) ?? '—' : '—'}</span>
                <a href={variant.asset?.url ?? SITE_LINKS.releases} target="_blank" rel="noreferrer">
                  {t('下载')}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="dl-page-block">
          <h2 className="dl-page-h2">{t('装好之后的四步')}</h2>
          <ol className="dl-page-steps">
            <li>
              <div>
                <strong>{t('装进本机')}</strong>
                <span>{t(INSTALL_FIRST_STEP[target.key])}</span>
              </div>
            </li>
            <li>
              <div>
                <strong>{t('确认 TeX 发行版')}</strong>
                <span>{t('需要 TeX Live 或 MacTeX；在终端跑一次 latexmk -v 就能确认。')}</span>
              </div>
            </li>
            <li>
              <div>
                <strong>{t('打开演示工程')}</strong>
                <span>{t('首次启动带有 demo 工程，按 ⌘↩ 编译一次，看 PDF 是否出现。')}</span>
              </div>
            </li>
            <li>
              <div>
                <strong>{t('换成你自己的稿子')}</strong>
                <span>{t('「文件 → 打开文件夹」指向论文目录，TeXPro 会自己认主文件。')}</span>
              </div>
            </li>
          </ol>
        </section>

        <Space wrap className="dl-page-actions">
          <Button href={SITE_LINKS.releases} target="_blank" rel="noreferrer">
            {t('查看全部构建')}
          </Button>
          <Button type="text" href="/#download">
            {t('回到下载区')}
          </Button>
        </Space>
      </div>
    </div>
  );
}
