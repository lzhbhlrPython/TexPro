import { FloatButton } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import { Outlet } from 'react-router-dom';
import { SiteFooter } from '@/layouts/components/SiteFooter';
import { SiteHeader } from '@/layouts/components/SiteHeader';

export default function SiteLayout() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
      <FloatButton.BackTop visibilityHeight={640} icon={<ArrowUpOutlined />} />
    </div>
  );
}
