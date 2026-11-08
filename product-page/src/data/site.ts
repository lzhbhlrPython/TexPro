import type { SupportLevel } from '@/types';

export interface NavItem {
  label: string;
  /** 首页锚点 */
  href?: string;
  /** 站内路由 */
  to?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '#capabilities', label: '能力' },
  { href: '#showcase', label: '场景' },
  { href: '#workflow', label: '工作流' },
  { href: '#compare', label: '对比' },
  { to: '/docs', label: '文档' },
  { href: '#download', label: '下载' },
];

export const HERO_METRICS = [
  { value: '0', label: '数据上云' },
  { value: '3', label: '套纸面主题' },
  { value: '双向', label: 'SyncTeX 定位' },
  { value: '30+', label: '可视化面板' },
] as const;

export const HERO_POINTS = ['免登录使用', '离线可编译', '文件留在本机磁盘'] as const;

export interface CompareRow {
  key: string;
  capability: string;
  detail: string;
  texpro: SupportLevel;
  markdown: SupportLevel;
  classic: SupportLevel;
  cloud: SupportLevel;
}

export const COMPARE_ROWS: CompareRow[] = [
  {
    key: 'render',
    capability: '正文里直接出版面效果',
    detail: '公式、表格、TikZ、插图与乐谱原地渲染',
    texpro: 'yes',
    markdown: 'no',
    classic: 'no',
    cloud: 'partial',
  },
  {
    key: 'source',
    capability: '所见即所得，同时是真 LaTeX',
    detail: '每个可视元素背后仍是可编译的源码',
    texpro: 'yes',
    markdown: 'no',
    classic: 'partial',
    cloud: 'partial',
  },
  {
    key: 'project',
    capability: '本地工程与多文件',
    detail: '主文件识别、子文件、.bib、图片与目录树',
    texpro: 'yes',
    markdown: 'partial',
    classic: 'yes',
    cloud: 'yes',
  },
  {
    key: 'synctex',
    capability: 'PDF 与源码双向定位',
    detail: 'PDF 上点一下回到出处的源码行',
    texpro: 'yes',
    markdown: 'no',
    classic: 'partial',
    cloud: 'partial',
  },
  {
    key: 'graphics',
    capability: '乐谱、曲线与电路图可视化',
    detail: 'MusiXTeX、pgfplots、TikZ 都有可视化面板',
    texpro: 'yes',
    markdown: 'no',
    classic: 'no',
    cloud: 'no',
  },
  {
    key: 'writing',
    capability: '写作模式（聚焦 / 打字机 / 纸面主题）',
    detail: '长文写作时只留下当前段落',
    texpro: 'yes',
    markdown: 'partial',
    classic: 'no',
    cloud: 'no',
  },
  {
    key: 'offline',
    capability: '完全离线，文件不离开本机',
    detail: '不建账号、不上传、不收集使用数据',
    texpro: 'yes',
    markdown: 'yes',
    classic: 'yes',
    cloud: 'no',
  },
];

export const COMPARE_COLUMNS = [
  { key: 'texpro', label: 'TeXPro', highlight: true },
  { key: 'markdown', label: 'Markdown 编辑器', highlight: false },
  { key: 'classic', label: '传统 LaTeX IDE', highlight: false },
  { key: 'cloud', label: '在线 LaTeX 服务', highlight: false },
] as const;

export interface DownloadTarget {
  key: string;
  platform: string;
  detail: string;
  format: string;
}

export const DOWNLOADS: DownloadTarget[] = [
  { key: 'mac-arm', platform: 'macOS', detail: 'Apple 芯片 · arm64 · 13 以上', format: 'DMG' },
  { key: 'mac-intel', platform: 'macOS', detail: 'Intel · x64 · 13 以上', format: 'DMG' },
  { key: 'windows', platform: 'Windows', detail: 'x64 · 10 以上', format: 'EXE' },
  { key: 'linux', platform: 'Linux', detail: 'x64 · AppImage', format: 'AppImage' },
];

export const FOOTER_GROUPS = [
  {
    title: '产品',
    links: [
      { label: '能力', href: '#capabilities' },
      { label: '使用场景', href: '#showcase' },
      { label: '工作流', href: '#workflow' },
      { label: '版本对比', href: '#compare' },
    ],
  },
  {
    title: '资源',
    links: [
      { label: '使用文档', to: '/docs' },
      { label: '更新日志', href: 'https://github.com/texpro/texpro/releases', external: true },
      { label: '问题反馈', href: 'https://github.com/texpro/texpro/issues', external: true },
    ],
  },
] as const;
