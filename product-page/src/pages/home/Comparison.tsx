import { CheckCircleFilled, MinusCircleOutlined } from '@ant-design/icons';
import { Table, Tag, Typography, theme, type TableProps } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';
import { COMPARE_COLUMNS, COMPARE_ROWS, type CompareRow } from '@/data/site';
import type { SupportLevel } from '@/types';
import { useMessages, useLocalizedFields } from '@/i18n';

const { Text } = Typography;

export function Comparison() {
  const msg = useMessages();
  const localize = useLocalizedFields();
  const rows = localize(COMPARE_ROWS, ["capability","detail"]);
  const columnsMeta = localize([...COMPARE_COLUMNS], ["label"]);
  const { token } = theme.useToken();

  const renderSupport = (level: SupportLevel) => {
    if (level === 'yes') {
      return (
        <span className="compare-cell">
          <CheckCircleFilled style={{ color: token.colorSuccess }} />
          <span className="visually-hidden">{msg("site.supported")}</span>
        </span>
      );
    }

    if (level === 'partial') {
      return (
        <Tag color="warning" variant="filled" style={{ marginInlineEnd: 0 }}>
          {msg("site.partial")}
        </Tag>
      );
    }

    return (
      <span className="compare-cell">
        <MinusCircleOutlined style={{ color: token.colorTextQuaternary }} />
        <span className="visually-hidden">{msg("site.not.supported")}</span>
      </span>
    );
  };

  const columns: TableProps<CompareRow>['columns'] = [
    {
      title: msg("site.capabilities"),
      dataIndex: 'capability',
      key: 'capability',
      width: 320,
      render: (_, row) => (
        <div>
          <Text strong style={{ fontSize: 13.5 }}>
            {row.capability}
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {row.detail}
            </Text>
          </div>
        </div>
      ),
    },
    ...columnsMeta.map((column) => ({
      title: column.highlight ? (
        <Text strong style={{ color: token.colorPrimary }}>
          {column.label}
        </Text>
      ) : (
        column.label
      ),
      dataIndex: column.key,
      key: column.key,
      align: 'center' as const,
      width: 150,
      onCell: () => (column.highlight ? { style: { background: token.colorPrimaryBg } } : {}),
      render: (level: SupportLevel) => renderSupport(level),
    })),
  ];

  return (
    <section className="section section-alt" id="compare" style={{ background: token.colorFillQuaternary }}>
      <div className="shell">
        <SectionHeading
          eyebrow="site.comparison"
          title="site.where.it.differs.from.three.common.approaches"
          description="site.no.overselling.texpro.is.not.a.markdown.editor.and"
        />

        <div
          className="compare-wrap"
          style={{
            background: token.colorBgContainer,
            borderColor: token.colorBorderSecondary,
            borderRadius: token.borderRadiusLG,
            boxShadow: token.boxShadowTertiary,
            marginTop: 40,
          }}
        >
          <Table<CompareRow>
            rowKey="key"
            columns={columns}
            dataSource={rows}
            pagination={false}
            size="middle"
            scroll={{ x: 760 }}
            rowClassName={(_, index) => (index % 2 === 1 ? 'compare-row-alt' : '')}
          />
          <p className="compare-hint" style={{ color: token.colorTextTertiary }}>
            {msg("site.swipe.horizontally.for.the.full.comparison")}
          </p>
        </div>
      </div>
    </section>
  );
}
