import { ArrowUpOutlined } from '@ant-design/icons';
import { Reveal } from '@/components/Reveal';
import { Button, Col, Row, Typography } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { useMessages } from '@/i18n';
import stable from '@/config/stable-releases.json';
import nightly from '@/config/nightly-release.json';
import { SITE_LINKS } from '@/config/constants';

export function BuildChannels() {
  const msg = useMessages();
  const latest = [...stable.releases].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
  const channels = [
    { key: 'stable', title: msg('site.stable.releases'), tag: latest?.tag, url: latest?.url },
    { key: 'nightly', title: 'Nightly', tag: nightly.releaseTag, url: nightly.releaseTag ? `${SITE_LINKS.releases}/tag/${encodeURIComponent(nightly.releaseTag)}` : undefined },
  ];
  return <section className="section section-build-channels"><div className="shell">
    <SectionHeading eyebrow="site.download" title="site.build.channels" />
    <Row gutter={[24, 24]}>{channels.map(channel => <Col xs={24} md={12} key={channel.key}>
      <Reveal className="build-channel" delay={channel.key === 'stable' ? 0 : 60}>
        <Typography.Title level={3} className="build-channel-title">{channel.title}</Typography.Title>
        <p className="build-channel-description">{msg(channel.key === 'stable' ? 'site.build.stable.description' : 'site.build.nightly.description')}</p>
        <Typography.Text className="build-channel-version">{channel.tag || msg('site.build.unavailable')}</Typography.Text>
        <Button type="link" className="build-channel-link" icon={<ArrowUpOutlined rotate={45} />} href={channel.url || SITE_LINKS.releases} target="_blank" rel="noreferrer">{msg('site.open.releases')}</Button>
      </Reveal>
    </Col>)}</Row>
  </div></section>;
}
