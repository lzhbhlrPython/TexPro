import { createBrowserRouter } from 'react-router-dom';
import SiteLayout from '@/layouts/SiteLayout';
import HomePage from '@/pages/home';
import DocsPage from '@/pages/docs';
import AiPage from '@/pages/ai';
import BlogIndexPage from '@/pages/blog';
import BlogPostPage from '@/pages/blog/post';
import ChangelogPage from '@/pages/changelog';
import DownloadPage from '@/pages/download';
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
      { path: 'changelog', element: <ChangelogPage />, handle: { title: '更新日志 · TeXPro' } },
      { path: 'blog', element: <BlogIndexPage />, handle: { title: '开发博客 · TeXPro' } },
      { path: 'blog/:slug', element: <BlogPostPage />, handle: { title: '开发博客 · TeXPro' } },
      { path: 'ai', element: <AiPage />, handle: { title: 'TeXPro · AI 入口' } },
      { path: 'download', element: <DownloadPage />, handle: { title: '下载 · TeXPro' } },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    handle: { title: '页面不存在' },
  },
], { basename: import.meta.env.BASE_URL });
