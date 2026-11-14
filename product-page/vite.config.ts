import { syncNightly } from './scripts/sync-nightly.mjs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { syncStableReleases } from './scripts/fetch-stable-releases.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));

/**
 * 机器可读产物（llms.txt / llms-full.txt / sitemap.xml / robots.txt / feed.*）
 * 必须在构建期生成，而不是靠人记得先跑 npm script——所以挂进 Vite 生命周期，
 * 直接 `vite build` 或 `vite dev` 也会得到同样的文件。
 */
function contentFiles(): Plugin {
  const run = (script: string) =>
    execFileSync(process.execPath, [`scripts/${script}`], { cwd: here, stdio: 'inherit' });

  return {
    name: 'texpro-content-files',
    async buildStart() {
      run('check-locales.mjs');
      await syncStableReleases();
      await syncNightly();
      run('gen-feed.mjs');
      run('gen-llms.mjs');
    },
  };
}

export default defineConfig({
  base: `${(process.env.PAGES_BASE_PATH || '/').replace(/\/$/, '')}/`,
  plugins: [react(), contentFiles()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1600,
    license: { fileName: 'third-party-licenses.txt' },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },
  },
});
