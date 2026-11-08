import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/* 站点自身的元信息：manifest 与 RSS 都按 BASE_URL 拼，兼容 Pages 子路径 */
const base = import.meta.env.BASE_URL;

function addHeadLink(rel: string, href: string, type?: string, title?: string) {
  const link = document.createElement('link');
  link.rel = rel;
  link.href = href;
  if (type) link.type = type;
  if (title) link.title = title;
  document.head.appendChild(link);
}

addHeadLink('manifest', `${base}manifest.webmanifest`);
addHeadLink('alternate', `${base}feed.xml`, 'application/rss+xml', 'TeXPro 开发博客');

/* 生产构建才注册 Service Worker：首次访问后整站可离线打开 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      /* 离线能力失败不影响正常阅读 */
    });
  });
}
