import { Button, Col, Row, Space, Typography } from 'antd';
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
  return <section className="section"><div className="shell">
    <SectionHeading eyebrow="site.download" title="site.build.channels" />
    <Row gutter={[24, 24]}>{channels.map(channel => <Col xs={24} md={12} key={channel.key}>
      <Space orientation="vertical">
        <Typography.Title level={3}>{channel.title}</Typography.Title>
        <Typography.Text>{channel.tag || msg('site.build.unavailable')}</Typography.Text>
        <Button href={channel.url || SITE_LINKS.releases} target="_blank" rel="noreferrer">{msg('site.open.releases')}</Button>
      </Space>
    </Col>)}</Row>
  </div></section>;
}
