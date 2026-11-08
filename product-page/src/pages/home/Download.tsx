import { DownloadOutlined, GithubOutlined } from '@ant-design/icons';
import { Button, Space, Typography, theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { APP_VERSION, SITE_LINKS } from '@/config/constants';
import { DOWNLOADS } from '@/data/site';

const { Text, Title } = Typography;

export function Download() {
  const { token } = theme.useToken();

  return (
    <section className="section section-download" id="download">
      <div className="shell">
        <SectionHeading
          eyebrow="下载"
          title="装到本机，十分钟开始写"
          description={`当前构建 v${APP_VERSION}，随每次提交自动打包。安装包托管在 GitHub Releases。`}
        />

        <div className="download-list">
          {DOWNLOADS.map((target) => (
            <div className="download-row" key={target.key} style={{ borderColor: token.colorBorderSecondary }}>
              <div className="download-main">
                <span className="download-platform" style={{ color: token.colorTextHeading }}>
                  {target.platform}
                </span>
                <span className="download-detail" style={{ color: token.colorTextSecondary }}>
                  {target.detail}
                </span>
              </div>
              <span className="download-format" style={{ color: token.colorTextTertiary }}>
                {target.format}
              </span>
              <Button
                type="link"
                icon={<DownloadOutlined />}
                href={SITE_LINKS.releases}
                target="_blank"
                rel="noreferrer"
                style={{ paddingInline: 0, justifySelf: 'end' }}
              >
                下载
              </Button>
            </div>
          ))}
        </div>

        <div className="download-note">
          <div>
            <Title level={4} style={{ margin: '0 0 6px', fontSize: 15 }}>
              运行前提
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              需要本机已安装 TeX Live 或 MacTeX（pdflatex / xelatex / lualatex 任一即可）；TeXPro
              会自动探测发行版与可执行文件。
            </Text>
          </div>
          <Space wrap>
            <Button
              type="primary"
              icon={<GithubOutlined />}
              href={SITE_LINKS.releases}
              target="_blank"
              rel="noreferrer"
            >
              查看全部构建
            </Button>
            <Button href={SITE_LINKS.docs} target="_blank" rel="noreferrer">
              从源码运行
            </Button>
          </Space>
        </div>
      </div>
    </section>
  );
}
