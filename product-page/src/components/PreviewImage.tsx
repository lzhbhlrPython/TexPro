import { useState, type ImgHTMLAttributes } from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useMessages } from '@/i18n';

export function siteAssetUrl(src: string): string {
  const base = import.meta.env.BASE_URL;
  if (!src.startsWith('/') || src.startsWith('//')) return src;
  return base !== '/' && src.startsWith(base) ? src : `${base}${src.slice(1)}`;
}
/** Retry a failed cached image once; a persistent failure has a visible, accessible recovery action. */
export function PreviewImage({ src, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & { src: string }) {
  return <ImageRequest key={src} src={src} {...props} />;
}
function ImageRequest({ src, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> & { src: string }) {
  const msg = useMessages();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const url = siteAssetUrl(src);
  const request = attempt ? `${url}${url.includes('?') ? '&' : '?'}texpro-retry=${attempt}` : url;
  return <>
    <img {...props} src={request} onError={() => { if (!attempt) setAttempt(1); else setFailed(true); }} />
    {failed ? <div className="preview-image-error" role="status">
      <span>{msg('site.image.load.failed')}</span>
      <Button type="text" size="small" icon={<ReloadOutlined aria-hidden />} aria-label={msg('site.action.retry')} onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>{msg('site.action.retry')}</Button>
    </div> : null}
  </>;
}
