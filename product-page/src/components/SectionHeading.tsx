import type { ReactNode } from 'react';
import { Typography, theme } from 'antd';
import { Reveal } from '@/components/Reveal';
import { useMessages } from '@/i18n';

const { Title, Paragraph, Text } = Typography;

interface SectionHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
}

/**
 * 章节头：小标 + 标题 + 一句说明，全部左对齐、单列。
 * 每节共用这个结构，页面靠留白分节，不靠卡片和横线堆层级。
 */
export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  const { token } = theme.useToken();
  const msg = useMessages();

  return (
    <Reveal className="section-head">
      <Text className="eyebrow" style={{ color: token.colorPrimary }}>
        {msg.text(eyebrow)}
      </Text>
      <Title
        level={2}
        className="section-title"
        style={{
          color: token.colorTextHeading,
          margin: '8px 0 0',
          fontSize: 'clamp(22px, 2.6vw, 32px)',
          lineHeight: 1.3,
        }}
      >
        {typeof title === 'string' ? msg.text(title) : title}
      </Title>
      {description ? (
        <Paragraph className="section-desc" style={{ color: token.colorTextSecondary, margin: 0 }}>
          {typeof description === 'string' ? msg.text(description) : description}
        </Paragraph>
      ) : null}
    </Reveal>
  );
}
