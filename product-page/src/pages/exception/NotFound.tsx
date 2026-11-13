import { Button, Result, Space } from 'antd';
import { useMessages } from '@/i18n';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const msg = useMessages();

  return (
    <Result
      status="404"
      title="404"
      subTitle={msg("site.this.link.has.no.page.behind.it.the.address")}
      style={{ paddingTop: 72, paddingBottom: 72 }}
      extra={
        <Space>
          <Button type="primary" onClick={() => navigate('/')}>
            {msg("site.back.to.the.home.page")}
          </Button>
          <Button onClick={() => navigate(-1)}>{msg("site.go.back")}</Button>
        </Space>
      }
    />
  );
}
