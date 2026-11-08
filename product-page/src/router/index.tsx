import { createBrowserRouter } from 'react-router-dom';
import SiteLayout from '@/layouts/SiteLayout';
import HomePage from '@/pages/home';
import DocsPage from '@/pages/docs';
import NotFoundPage from '@/pages/exception/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SiteLayout />,
    handle: { title: 'TeXPro · 本地优先的 LaTeX 工作台' },
    children: [
      { index: true, element: <HomePage /> },
      { path: 'docs', element: <DocsPage />, handle: { title: '文档 · TeXPro' } },
      { path: 'docs/:slug', element: <DocsPage />, handle: { title: '文档 · TeXPro' } },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    handle: { title: '页面不存在' },
  },
], { basename: import.meta.env.BASE_URL });
