import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import recovery from './i18n/bootstrap-en.json';
import { initialCatalog, initializeLocale } from './i18n/catalog';
import './styles/global.css';

void initializeLocale().then(() => {
  const { messages, fallback } = initialCatalog();
  addHeadLink('alternate', `${base}feed.xml`, 'application/rss+xml', messages['site.texpro.dev.blog'] ?? fallback['site.texpro.dev.blog']);
  ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  );
}).catch(error => {
  console.error('Language initialization failed', error);
  document.documentElement.lang = 'en';
  const root = document.getElementById('root');
  const text = document.createElement('p'), retry = document.createElement('button');
  text.textContent = recovery['bootstrap.language.failed'];
  retry.textContent = recovery['bootstrap.action.reload'];
  retry.addEventListener('click', () => window.location.reload());
  root?.replaceChildren(text, retry);
});

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

/* 生产构建才注册 Service Worker：首次访问后整站可离线打开 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      /* 离线能力失败不影响正常阅读 */
    });
  });
}
