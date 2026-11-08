import type { ReactNode } from 'react';
import { Typography, theme } from 'antd';

const { Title, Paragraph, Text } = Typography;

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
}: SectionHeadingProps) {
  const { token } = theme.useToken();

  return (
    <div className={`section-head${align === 'center' ? ' is-center' : ''}`}>
      <Text className="eyebrow" style={{ color: token.colorPrimary }}>
        {eyebrow}
      </Text>
      <Title
        level={2}
        className="section-title"
        style={{
          color: token.colorTextHeading,
          margin: '10px 0 12px',
          // 用内联字号覆盖 Typography 的 level 默认值，窄屏随视口收缩。
          fontSize: 'clamp(22px, 3vw, 34px)',
          lineHeight: 1.32,
        }}
      >
        {title}
      </Title>
      {description ? (
        <Paragraph
          className="section-desc"
          style={{ color: token.colorTextSecondary, margin: 0 }}
        >
          {description}
        </Paragraph>
      ) : null}
    </div>
  );
}
