import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import type { AppUpdateResult } from '../types';

export function UpdateSettings({ includeNightly, onChange }: { includeNightly: boolean; onChange: (value: boolean) => void }) {
  const { msg } = useI18n();
  const [version, setVersion] = useState('');
  const [result, setResult] = useState<AppUpdateResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    let active = true;
    window.texpro.getInfo().then(info => { if (active) setVersion(info.version); }).catch(() => {});
    return () => { active = false; generation.current++; };
  }, []);
  useEffect(() => { generation.current++; setResult(null); setChecking(false); setOpenFailed(false); }, [includeNightly]);
  async function check() {
    const request = ++generation.current;
    setChecking(true); setResult(null); setOpenFailed(false);
    try {
      const next = await window.texpro.checkForUpdates(includeNightly);
      if (request === generation.current) { setResult(next); setVersion(next.currentVersion); }
    } catch {
      if (request === generation.current) setResult({ ok: false, currentVersion: version, error: 'network' });
    } finally { if (request === generation.current) setChecking(false); }
  }
  async function open(url: string) {
    const request = generation.current;
    try {
      const response = await window.texpro.openExternal(url);
      if (request === generation.current) setOpenFailed(!response.ok);
    } catch { if (request === generation.current) setOpenFailed(true); }
  }
  const errors = {
    network: 'app.updates.error.network', timeout: 'app.updates.error.timeout', rateLimit: 'app.updates.error.rate.limit',
    invalidResponse: 'app.updates.error.invalid.response', historyLimit: 'app.updates.error.history.limit',
    unsupportedVersion: 'app.updates.error.unsupported.version', busy: 'app.updates.error.busy',
  } as const;
  return <section className="settings-section updates-section" aria-labelledby="updates-title">
    <div className="settings-section-title" id="updates-title">{msg('app.updates.title')}</div>
    <p>{msg('app.updates.current', { version: version || '—' })}</p>
    <label className="setting-row">
      <span className="setting-copy"><strong>{msg('app.updates.include.nightly')}</strong><small>{msg('app.updates.nightly.detail')}</small></span>
      <input type="checkbox" checked={includeNightly} onChange={event => onChange(event.target.checked)} />
    </label>
    <p className="muted">{msg('app.updates.detail')}</p>
    <div className="update-actions"><button className="secondary-btn" disabled={checking} onClick={() => void check()} data-testid="check-updates">
      {msg(checking ? 'app.updates.checking' : 'app.updates.check')}
    </button>
    <button className="secondary-btn" onClick={() => void open('https://github.com/lzhbhlrPython/TexPro/releases')}>{msg('app.updates.releases')}</button></div>
    <div role="status" aria-live="polite" aria-busy={checking}>
      {result && (!result.ok ? <p>{msg(errors[result.error])}</p> : <>
        <p>{msg(result.status === 'available' ? 'app.updates.available' : result.status === 'current' ? 'app.updates.current.channel' : 'app.updates.unavailable')}</p>
        {result.release && <>
          <p>{msg('app.updates.latest', { version: result.release.version })}</p>
          <div className="update-actions"><button className="secondary-btn" onClick={() => void open(result.release!.url)}>{msg('app.updates.release.notes')}</button>
          {result.status === 'available' && <button className="secondary-btn" onClick={() => void open(result.release!.downloadUrl)}>{msg('app.updates.download')}</button>}</div>
          {result.release.notes && <details><summary>{msg('app.updates.release.notes')}</summary><p className="update-notes">{result.release.notes}</p></details>}
        </>}
      </>)}
      {openFailed && <p>{msg('app.updates.error.open')}</p>}
    </div>
  </section>;
}
