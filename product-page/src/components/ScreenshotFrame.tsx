import { PreviewImage } from './PreviewImage';
import { theme } from 'antd';
import type { CSSProperties } from 'react';

interface ScreenshotFrameProps {
  src: string;
  alt: string;
  caption?: string;
  /** 首屏图片同步加载，其余懒加载。 */
  eager?: boolean;
  /** 原图宽高，用于在图片加载前预留位置（避免布局跳动）。 */
  width?: number;
  height?: number;
  style?: CSSProperties;
}

export function ScreenshotFrame({
  src,
  alt,
  caption,
  eager = false,
  width,
  height,
  style,
}: ScreenshotFrameProps) {
  const { token } = theme.useToken();

  return (
    <figure
      className="shot"
      style={{
        borderColor: token.colorBorderSecondary,
        background: token.colorBgContainer,
        boxShadow: token.boxShadowSecondary,
        borderRadius: token.borderRadiusLG,
        ...style,
      }}
    >
      <PreviewImage
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        style={{ borderRadius: token.borderRadiusLG }}
      />
      {caption ? (
        <figcaption style={{ color: token.colorTextTertiary, borderTopColor: token.colorBorderSecondary }}>
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
