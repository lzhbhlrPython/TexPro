import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import SiteLayout from '@/layouts/SiteLayout';
import HomePage from '@/pages/home';
import DocsPage from '@/pages/docs';
import AiPage from '@/pages/ai';
import BlogIndexPage from '@/pages/blog';
import BlogPostPage from '@/pages/blog/post';
import ChangelogPage from '@/pages/changelog';
import ReleasesPage from '@/pages/releases';
import DownloadPage from '@/pages/download';
import NotFoundPage from '@/pages/exception/NotFound';

// 彩蛋页单独分包：没有走到这一步，主包不包含它的代码
const TexPadPage = lazy(() => import('@/pages/easter'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SiteLayout />,
    handle: { title: 'site.page.home.title' },
    children: [
      { index: true, element: <HomePage /> },
      { path: 'docs', element: <DocsPage section="use" />, handle: { title: "site.user.guide.texpro" } },
      { path: 'developers', element: <DocsPage section="develop" />, handle: { title: "site.developer.docs.texpro" } },
      { path: 'docs/:slug', element: <DocsPage />, handle: { title: 'site.page.docs.title' } },
      { path: 'releases', element: <ReleasesPage />, handle: { title: "site.stable.releases.texpro" } },
      { path: 'changelog', element: <ChangelogPage />, handle: { title: 'site.page.changelog.title' } },
      { path: 'blog', element: <BlogIndexPage />, handle: { title: 'site.page.blog.title' } },
      { path: 'blog/:slug', element: <BlogPostPage />, handle: { title: 'site.page.blog.title' } },
      { path: 'ai', element: <AiPage />, handle: { title: 'site.page.ai.title' } },
      { path: 'download', element: <DownloadPage />, handle: { title: 'site.page.download.title' } },
      {
        path: 'texpad',
        element: (
          <Suspense fallback={null}>
            <TexPadPage />
          </Suspense>
        ),
        handle: { title: 'TeXPad · TeXPro' },
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
    handle: { title: 'site.page.missing.title' },
  },
], { basename: import.meta.env.BASE_URL });
