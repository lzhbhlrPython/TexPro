/* TeXPro 产品页 Service Worker：首次访问后整站可离线打开。
   只用运行时缓存，不预生成资产清单——发版换了 hash 也不会命中旧文件。 */
const CACHE = 'texpro-site-v2';
const SHELL = ['./', './index.html'];

async function precache() {
  const cache = await caches.open(CACHE);
  await cache.addAll(SHELL);

  // 入口 HTML 里的脚本与样式才是真正要跑起来的东西：一起预缓存，首访后即可离线
  try {
    const response = await fetch('./index.html', { cache: 'reload' });
    const html = await response.text();
    const assets = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1]);
    await Promise.all(
      assets.map((asset) =>
        cache.add(new URL(asset, self.location.href).href).catch(() => undefined),
      ),
    );
  } catch {
    /* 预缓存失败也保留外壳缓存 */
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('texpro-site-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) return;

  // 导航请求：先网络，失败回落到离线时缓存的入口
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('./index.html')) || Response.error()),
    );
    return;
  }

  // 其余同源资源：缓存优先，命中后顺带更新
  event.respondWith(
    caches.match(request).then((cached) => {
      const validContent = response => {
        const type = response?.headers.get('content-type') || '';
        if (request.destination === 'image') return type.startsWith('image/');
        if (/\.json(?:$|\?)/.test(request.url)) return type.includes('json');
        return true;
      };
      const usable = cached && cached.ok && validContent(cached) ? cached : undefined;
      if (cached && !usable) caches.open(CACHE).then(cache => cache.delete(request));
      const network = fetch(request)
        .then((response) => {
          if (response.ok && validContent(response)) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => usable || Response.error());
      return usable || network;
    }),
  );
});
