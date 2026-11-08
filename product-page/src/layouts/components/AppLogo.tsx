import { BrandMark } from '@/components/BrandMark';
import { APP_NAME } from '@/config/constants';

interface AppLogoProps {
  compact?: boolean;
  textColor?: string;
  accentColor?: string;
  size?: number;
}

/**
 * 品牌组合：TeXPro 应用图标 + 衬线字标。
 * 图标与桌面端同一个（见 components/BrandMark.tsx），字标只有字色可换。
 */
export function AppLogo({ compact = false, textColor, accentColor, size = 30 }: AppLogoProps) {
  return (
    <span className="brand">
      <BrandMark size={size} className="brand-mark" />
      {compact ? (
        <span className="visually-hidden">{APP_NAME}</span>
      ) : (
        <span className="brand-word" style={textColor ? { color: textColor } : undefined}>
          TeX
          <em style={accentColor ? { color: accentColor } : undefined}>Pro</em>
        </span>
      )}
    </span>
  );
}
