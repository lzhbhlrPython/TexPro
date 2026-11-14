'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const { createHash } = require('node:crypto');
const HOSTS = new Set(['github.com', 'release-assets.githubusercontent.com', 'objects.githubusercontent.com']);

class UpdateDownload {
  constructor(directory, { fetchImpl = fetch, timeoutMs = 15 * 60 * 1000, idleMs = 30000 } = {}) {
    this.directory = directory; this.fetch = fetchImpl; this.timeoutMs = timeoutMs; this.idleMs = idleMs;
    this.state = { status: 'idle' }; this.job = null; this.file = null;
  }
  snapshot() { return { ...this.state }; }
  start(release) {
    if (this.job) return this.snapshot();
    if (!release) { this.state = { status: 'error', error: 'noRelease' }; return this.snapshot(); }
    if (this.state.status === 'ready' && this.state.version === release.version && this.state.digest === release.digest) return this.snapshot();
    const digest = /^sha256:([a-f\d]{64})$/i.exec(release.digest || '')?.[1];
    if (!digest) { this.state = { status: 'error', error: 'checksumUnavailable' }; return this.snapshot(); }
    if (!Number.isSafeInteger(release.size) || release.size <= 0 || release.size > 4 * 1024 ** 3 ||
        path.basename(release.assetName) !== release.assetName || !/^TeXPro-[\w.-]+\.(?:dmg|exe|AppImage)$/.test(release.assetName) ||
        !release.downloadUrl.startsWith('https://github.com/lzhbhlrPython/TexPro/releases/download/')) {
      this.state = { status: 'error', error: 'noRelease' }; return this.snapshot();
    }
    const job = { controller: new AbortController(), cancelled: false, timedOut: false };
    this.job = job; this.file = null;
    this.state = { status: 'downloading', version: release.version, assetName: release.assetName, digest: release.digest, received: 0, total: release.size };
    job.done = this.run(job, release, digest);
    return this.snapshot();
  }
  async run(job, release, digest) {
    let folder, handle, reader, idle;
    const timeout = () => { job.timedOut = true; job.controller.abort(); };
    const timer = setTimeout(timeout, this.timeoutMs);
    const touch = () => { clearTimeout(idle); idle = setTimeout(timeout, this.idleMs); };
    let failure;
    try {
      await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
      if ((await fs.lstat(this.directory)).isSymbolicLink()) throw new Error('storage');
      const space = await fs.statfs(this.directory);
      if (space.bavail * space.bsize < release.size + 32 * 1024 ** 2) throw new Error('storage');
      folder = await fs.mkdtemp(path.join(this.directory, 'download-'));
      const partial = path.join(folder, release.assetName + '.part');
      handle = await fs.open(partial, 'wx', 0o600);
      let url = release.downloadUrl, response;
      touch();
      for (let redirects = 0; redirects <= 5; redirects++) {
        const target = new URL(url);
        if (target.protocol !== 'https:' || !HOSTS.has(target.hostname) || target.username || target.password || target.port) throw new Error('network');
        response = await this.fetch(url, { signal: job.controller.signal, redirect: 'manual', credentials: 'omit' });
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location || redirects === 5) throw new Error('network');
        url = new URL(location, url).href;
      }
      if (!response.ok || !response.body) throw new Error('network');
      const length = response.headers.get('content-length');
      if (length !== null && Number(length) !== release.size) throw new Error('size');
      reader = response.body.getReader();
      const hash = createHash('sha256'); let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (job.controller.signal.aborted) throw new Error('cancelled');
        if (done) break;
        touch(); received += value.length;
        if (received > release.size) throw new Error('size');
        hash.update(value);
        // FileHandle.write may perform a partial write.
        for (let offset = 0; offset < value.length;) offset += (await handle.write(value, offset, value.length - offset)).bytesWritten;
        this.state = { ...this.state, received };
      }
      if (received !== release.size) throw new Error('size');
      this.state = { ...this.state, status: 'verifying' };
      if (hash.digest('hex') !== digest.toLowerCase()) throw new Error('checksum');
      await handle.sync(); await handle.close(); handle = null;
      if (job.controller.signal.aborted) throw new Error('cancelled');
      const file = path.join(folder, release.assetName);
      await fs.rename(partial, file);
      if (job.controller.signal.aborted) throw new Error('cancelled');
      this.file = file;
      this.state = { ...this.state, status: 'ready' };
    } catch (error) {
      failure = job.cancelled ? 'cancelled' : job.timedOut ? 'timeout' : ['checksum', 'size', 'network', 'storage'].includes(error.message) ? error.message : ['EACCES', 'EPERM', 'ENOSPC', 'EDQUOT', 'EIO', 'ENOENT', 'EEXIST'].includes(error.code) ? 'storage' : 'network';
    } finally {
      clearTimeout(timer); clearTimeout(idle);
      await reader?.cancel().catch(() => {});
      await handle?.close().catch(() => {});
      if (failure && folder) await fs.rm(folder, { recursive: true, force: true }).catch(() => {});
      if (failure) this.state = { ...this.state, status: failure === 'cancelled' ? 'cancelled' : 'error', error: failure };
      this.job = null;
    }
  }
  async cancel() {
    const job = this.job;
    if (job) { job.cancelled = true; job.controller.abort(); await job.done; }
    return this.snapshot();
  }
  async reveal(show) {
    if (this.state.status !== 'ready' || !this.file) return { ok: false };
    try {
      const stat = await fs.lstat(this.file);
      if (!stat.isFile() || stat.isSymbolicLink() || stat.size !== this.state.total) throw new Error('Missing installer');
      show(this.file); return { ok: true };
    } catch { this.file = null; this.state = { ...this.state, status: 'error', error: 'storage' }; return { ok: false }; }
  }
}
module.exports = { UpdateDownload };
