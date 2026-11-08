import { Button, Result, Space } from 'antd';
import { useT } from '@/i18n';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const t = useT();

  return (
    <Result
      status="404"
      title="404"
      subTitle={t('这个链接没有对应的页面，可能是地址写错了。')}
      style={{ paddingTop: 72, paddingBottom: 72 }}
      extra={
        <Space>
          <Button type="primary" onClick={() => navigate('/')}>
            {t('回到产品首页')}
          </Button>
          <Button onClick={() => navigate(-1)}>{t('返回上一页')}</Button>
        </Space>
      }
    />
  );
}
