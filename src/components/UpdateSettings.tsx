import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { AppUpdateResult, UpdateDownloadState } from '../types';

interface Props {
  includeNightly: boolean;
  autoDownload: boolean;
  onChange: (value: boolean) => void;
  onAutoDownloadChange: (value: boolean) => void;
}
export function UpdateSettings({ includeNightly, autoDownload, onChange, onAutoDownloadChange }: Props) {
  const { msg } = useI18n();
  const [version, setVersion] = useState('');
  const [result, setResult] = useState<AppUpdateResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);
  const [download, setDownload] = useState<UpdateDownloadState>({ status: 'idle' });
  const generation = useRef(0);
  const downloadRequest = useRef(0);
  const busy = download.status === 'downloading' || download.status === 'verifying';
  useEffect(() => {
    let active = true, timer: ReturnType<typeof setTimeout>;
    window.texpro.getInfo().then(info => { if (active) setVersion(info.version); }).catch(() => {});
    async function poll() {
      const request = downloadRequest.current;
      try {
        const state = await window.texpro.updateDownloadStatus();
        if (active && request === downloadRequest.current) setDownload(state);
      } catch { if (active) setDownload({ status: 'error', error: 'network' }); }
      if (active) timer = setTimeout(() => void poll(), 500);
    }
    void poll();
    return () => { active = false; clearTimeout(timer); generation.current++; downloadRequest.current++; };
  }, []);
  useEffect(() => { generation.current++; setResult(null); setChecking(false); setOpenFailed(false); }, [includeNightly]);
  async function downloadAction(cancel = false) {
    const request = ++downloadRequest.current;
    try {
      const state = await (cancel ? window.texpro.cancelUpdateDownload() : window.texpro.downloadUpdate());
      if (request === downloadRequest.current) setDownload(state);
    } catch { if (request === downloadRequest.current) setDownload({ status: 'error', error: 'network' }); }
  }
  async function check() {
    const request = ++generation.current;
    setChecking(true); setResult(null); setOpenFailed(false);
    try {
      const next = await window.texpro.checkForUpdates(includeNightly);
      if (request === generation.current) {
        setResult(next); setVersion(next.currentVersion);
        if (autoDownload && next.ok && next.status === 'available') await downloadAction();
      }
    } catch {
      if (request === generation.current) setResult({ ok: false, currentVersion: version, error: 'network' });
    } finally { if (request === generation.current) setChecking(false); }
  }
  async function open(url?: string) {
    const request = generation.current;
    try {
      const response = await (url ? window.texpro.openExternal(url) : window.texpro.revealUpdateDownload());
      if (request === generation.current) setOpenFailed(!response.ok);
    } catch { if (request === generation.current) setOpenFailed(true); }
  }
  const errors = {
    network: 'app.updates.error.network', timeout: 'app.updates.error.timeout', rateLimit: 'app.updates.error.rate.limit',
    invalidResponse: 'app.updates.error.invalid.response', historyLimit: 'app.updates.error.history.limit',
    unsupportedVersion: 'app.updates.error.unsupported.version', busy: 'app.updates.error.busy',
  } as const;
  const downloadErrors = {
    noRelease: 'app.updates.download.error.release', checksumUnavailable: 'app.updates.download.error.digest',
    checksum: 'app.updates.download.error.checksum', size: 'app.updates.download.error.size',
    network: 'app.updates.download.error.network', timeout: 'app.updates.download.error.timeout',
    storage: 'app.updates.download.error.storage', cancelled: 'app.updates.download.cancelled',
  } as const;
  const release = result?.ok ? result.release : null;
  const percent = Math.min(100, Math.floor((download.received || 0) * 100 / (download.total || 1)));
  return <section className="settings-section updates-section" aria-labelledby="updates-title">
    <div className="settings-section-title" id="updates-title">{msg('app.updates.title')}</div>
    <p>{msg('app.updates.current', { version: version || '—' })}</p>
    <label className="setting-row">
      <span className="setting-copy"><strong>{msg('app.updates.include.nightly')}</strong><small>{msg('app.updates.nightly.detail')}</small></span>
      <input type="checkbox" checked={includeNightly} disabled={busy} onChange={event => onChange(event.target.checked)} />
    </label>
    <label className="setting-row">
      <span className="setting-copy"><strong>{msg('app.updates.auto.download')}</strong><small>{msg('app.updates.auto.download.detail')}</small></span>
      <input type="checkbox" checked={autoDownload} onChange={event => onAutoDownloadChange(event.target.checked)} />
    </label>
    <p className="muted">{msg('app.updates.detail')}</p>
    <div className="update-actions">
      <button className="secondary-btn" disabled={checking || busy} onClick={() => void check()} data-testid="check-updates">
        {msg(checking ? 'app.updates.checking' : 'app.updates.check')}
      </button>
      <button className="secondary-btn" onClick={() => void open('https://github.com/lzhbhlrPython/TexPro/releases')}>{msg('app.updates.releases')}</button>
    </div>
    <div role="status" aria-live="polite" aria-busy={checking}>
      {result && (!result.ok ? <p>{msg(errors[result.error])}</p> : <>
        <p>{msg(result.status === 'available' ? 'app.updates.available' : result.status === 'current' ? 'app.updates.current.channel' : 'app.updates.unavailable')}</p>
        {release && <>
          <p>{msg('app.updates.latest', { version: release.version })}</p>
          <div className="update-actions">
            <button className="secondary-btn" onClick={() => void open(release.url)}>{msg('app.updates.release.notes')}</button>
            {result.status === 'available' && <>
              <button className="secondary-btn" disabled={busy || (download.status === 'ready' && download.version === release.version && download.digest === release.digest)} onClick={() => void downloadAction()}>{msg('app.updates.download')}</button>
              <button className="secondary-btn" onClick={() => void open(release.downloadUrl)}>{msg('app.updates.browser.download')}</button>
            </>}
          </div>
          {release.notes && <details><summary>{msg('app.updates.release.notes')}</summary><p className="update-notes">{release.notes}</p></details>}
        </>}
      </>)}
    </div>
    {download.status !== 'idle' && <div className="update-download" data-testid="update-download">
      {download.assetName && <p>{download.assetName}</p>}
      {busy && <>
        <progress aria-label={msg('app.updates.download.progress')} max={100} value={percent} />
        <p role="status">{download.status === 'verifying' ? msg('app.updates.download.verifying') : msg('app.updates.download.percent', { percent })}</p>
        <button className="secondary-btn" onClick={() => void downloadAction(true)}>{msg('app.updates.download.cancel')}</button>
      </>}
      {download.status === 'ready' && <>
        <p role="status">{msg('app.updates.download.ready')}</p>
        <button className="secondary-btn" onClick={() => void open()}>{msg('app.updates.download.reveal')}</button>
      </>}
      {download.status === 'cancelled' && <p role="status">{msg('app.updates.download.cancelled')}</p>}
      {download.status === 'error' && <p role="status">{msg(downloadErrors[download.error || 'network'])}</p>}
    </div>}
    {openFailed && <p role="alert">{msg('app.updates.error.open')}</p>}
  </section>;
}
