import { useId } from 'react';

interface BrandMarkProps {
  /** 显示边长（px） */
  size?: number;
  className?: string;
}

/**
 * TeXPro 应用图标：赤陶渐变底 + 奶油色 T 字 + 桃色折角。
 * 与 Electron 主程序 `build/icon.svg` 同源，保证网页与桌面端是同一个标志。
 */
export function BrandMark({ size = 30, className }: BrandMarkProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const bgId = `texpro-bg-${uid}`;
  const shineId = `texpro-shine-${uid}`;

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="44 44 936 936"
      role="img"
      aria-label="TeXPro"
      focusable="false"
    >
      <defs>
        <linearGradient id={bgId} x1="130" y1="80" x2="890" y2="960" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E1845F" />
          <stop offset="0.48" stopColor="#BC4F30" />
          <stop offset="1" stopColor="#7C2B18" />
        </linearGradient>
        <linearGradient id={shineId} x1="180" y1="80" x2="760" y2="520" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" stopOpacity="0.28" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="44" y="44" width="936" height="936" rx="214" fill={`url(#${bgId})`} />
      <rect x="44" y="44" width="936" height="936" rx="214" fill={`url(#${shineId})`} />
      <rect
        x="58"
        y="58"
        width="908"
        height="908"
        rx="200"
        fill="none"
        stroke="#FFD9C6"
        strokeOpacity="0.18"
        strokeWidth="3"
      />
      <path
        d="M252 324c0-35 28-63 63-63h394c35 0 63 28 63 63v7c0 35-28 63-63 63H315c-35 0-63-28-63-63v-7Z"
        fill="#FFF7EE"
      />
      <path
        d="M449 370c0-26 21-47 47-47h32c26 0 47 21 47 47v383c0 26-21 47-47 47h-32c-26 0-47-21-47-47V370Z"
        fill="#FFF7EE"
      />
      <path
        d="M636 555c22-22 57-22 79 0l101 101c22 22 22 57 0 79l-101 101c-22 22-57 22-79 0-22-22-22-57 0-79l61-61-61-61c-22-22-22-57 0-80Z"
        fill="#FFD4BE"
      />
      <circle cx="813" cy="238" r="24" fill="#FFD4BE" fillOpacity="0.9" />
    </svg>
  );
}
