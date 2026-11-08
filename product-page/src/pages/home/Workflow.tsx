import { CheckCircleFilled, SyncOutlined } from '@ant-design/icons';
import { Col, Grid, Row, Steps, Typography, theme } from 'antd';
import { SectionHeading } from '@/components/SectionHeading';

const { Text } = Typography;
const { useBreakpoint } = Grid;

const STEPS = [
  {
    title: '打开工程',
    description: '目录树、主文件自动识别，符号索引与 CWL 补全在打开时就绪。',
  },
  {
    title: '直接写',
    description: '可视层负责版面，源码层保留真 LaTeX；光标落到哪里，哪里就回到源码。',
  },
  {
    title: '一键编译',
    description: 'latexmk 增量构建，耗时、警告与完整日志就在底部状态栏，不用另开终端。',
  },
  {
    title: '点 PDF 回到源码',
    description: 'SyncTeX 双向定位：在 PDF 上单击一处，编辑器滚动并高亮到那一行。',
  },
];

const STATUS_ITEMS = [
  { icon: <CheckCircleFilled />, label: 'PDF 就绪 · 2.0 s', tone: 'success' as const },
  { icon: <SyncOutlined />, label: 'xelatex', tone: 'default' as const },
  { icon: <CheckCircleFilled />, label: 'SyncTeX 已启用', tone: 'success' as const },
  { icon: <CheckCircleFilled />, label: '没有错误', tone: 'success' as const },
];

export function Workflow() {
  const { token } = theme.useToken();
  const screens = useBreakpoint();
  const horizontal = Boolean(screens.lg);

  return (
    <section className="section" id="workflow">
      <div className="shell">
        <SectionHeading
          eyebrow="工作流"
          title="从打开工程到定位到那一行，四步"
          description="TeXPro 不用你改变既有习惯：仍然是 main.tex，仍然是 latexmk，只是每一步都能看见结果。"
        />

        <div style={{ marginTop: 40 }}>
          <Steps
            current={3}
            responsive={false}
            orientation={horizontal ? 'horizontal' : 'vertical'}
            items={STEPS.map((step) => ({
              title: step.title,
              content: step.description,
            }))}
          />
        </div>

        <div
          className="status-bar"
          style={{
            background: token.colorFillQuaternary,
            borderColor: token.colorBorderSecondary,
            borderRadius: token.borderRadiusLG,
            marginTop: 40,
          }}
        >
          <div className="status-left">
            {STATUS_ITEMS.map((item) => (
              <span
                key={item.label}
                className="status-item"
                style={{ color: item.tone === 'success' ? token.colorSuccess : token.colorTextSecondary }}
              >
                {item.icon}
                {item.label}
              </span>
            ))}
          </div>
          <div className="status-right">
            <Text type="secondary" style={{ fontSize: 12 }}>
              第 1 行，第 1 列 · 420 词
            </Text>
          </div>
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 40 }}>
          {[
            {
              title: '编译不阻塞写作',
              desc: '编译在后台进行，你可以继续输入；结果回来时只更新预览与诊断。',
            },
            {
              title: '旧结果不会写回新工程',
              desc: '切换工程或重新编译时，迟到的异步结果会被丢弃，不会覆盖当前文件。',
            },
            {
              title: '一切操作可逆',
              desc: '改写、移动、删除都留下内容寻址快照，随手可以翻回上一版。',
            },
          ].map((item) => (
            <Col xs={24} md={8} key={item.title}>
              <div className="mini-block" style={{ borderLeftColor: token.colorBorderSecondary }}>
                <Text strong>{item.title}</Text>
                <Text type="secondary" style={{ display: 'block', marginTop: 6, fontSize: 13 }}>
                  {item.desc}
                </Text>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
