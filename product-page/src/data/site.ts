import type { SupportLevel } from '@/types';
export const MCP_METRIC = { value: '21', label: '个 MCP 工具', description: '个 MCP 工具，供 AI 客户端读写工程、编译与定位。' } as const;

export interface NavItem {
  label: string;
  /** 首页锚点 */
  href?: string;
  /** 站内路由 */
  to?: string;
}

/** Header 只放跨页面入口，页内段落交给侧边栏（SectionRail）。 */
export const PAGE_LINKS: NavItem[] = [
  { to: '/blog', label: '博客' },
  { to: '/docs', label: '使用文档' },
  { to: '/developers', label: '开发文档' },
];

export interface SectionLink {
  id: string;
  label: string;
}

/** 首页各段落的顺序，与 pages/home/index.tsx 的排布一致。 */
export const SECTION_LINKS: SectionLink[] = [
  { id: 'top', label: '首屏' },
  { id: 'capabilities', label: '能力' },
  { id: 'demo', label: '演示' },
  { id: 'showcase', label: '场景' },
  { id: 'workflow', label: '工作流' },
  { id: 'failure', label: '出错' },
  { id: 'details', label: '小巧思' },
  { id: 'compare', label: '对比' },
  { id: 'limits', label: '边界' },
  { id: 'local', label: '隐私' },
  { id: 'themes', label: '写作' },
  { id: 'migrate', label: '迁移' },
  { id: 'proof', label: '证据' },
  { id: 'download', label: '下载' },
];

export const HERO_METRICS = [
  { value: '137', label: '条回归用例', source: 'tests' },
  { value: '106', label: '个 IPC 通道', source: 'ipc' },
  { value: '8', label: '个安装包 / 次夜构', source: 'releases' },
  { value: MCP_METRIC.value, label: MCP_METRIC.label, source: 'mcp' },
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
    key: 'chinese',
    capability: '中文写作排版',
    detail: 'CTeX 两字缩进、全角标点与中文行距',
    texpro: 'yes',
    markdown: 'partial',
    classic: 'partial',
    cloud: 'partial',
  },
  {
    key: 'offline',
    capability: '本地优先，联网能力按需启用',
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

export interface DownloadVariant {
  /** 展示名，如 DMG / ZIP / AppImage */
  label: string;
  /** 在发布的安装包清单里认领对应文件（文件名以版本号开头） */
  assetPattern: string;
  /** 需要额外说明时填，例如「免安装」 */
  note?: string;
}

export interface DownloadTarget {
  key: 'mac' | 'windows' | 'linux';
  platform: string;
  detail: string;
  format: string;
  /** 主安装包，列在下载区那一行 */
  assetPattern: string;
  /** 该平台的全部安装包形态 */
  variants: DownloadVariant[];
}

export const DOWNLOADS: DownloadTarget[] = [
  {
    key: 'mac',
    platform: 'macOS',
    detail: 'Universal · Apple 芯片与 Intel · 13 以上',
    format: 'DMG',
    assetPattern: 'mac-universal\\.dmg$',
    variants: [
      { label: 'DMG', assetPattern: 'mac-universal\\.dmg$' },
      { label: 'ZIP', assetPattern: 'mac-universal\\.zip$', note: '免安装' },
    ],
  },
  {
    key: 'windows',
    platform: 'Windows',
    detail: 'x64 · 10 以上 · NSIS 安装包',
    format: 'EXE',
    assetPattern: 'windows-x64-setup\\.exe$',
    variants: [
      { label: 'EXE', assetPattern: 'windows-x64-setup\\.exe$', note: 'NSIS 安装包' },
      { label: 'Portable', assetPattern: 'windows-x64-portable\\.exe$', note: '免安装' },
      { label: 'ZIP', assetPattern: 'windows-x64\\.zip$', note: '解压即用' },
    ],
  },
  {
    key: 'linux',
    platform: 'Linux',
    detail: 'x64 · AppImage，另有 deb / rpm',
    format: 'AppImage',
    assetPattern: 'linux-x86_64\\.AppImage$',
    variants: [
      { label: 'AppImage', assetPattern: 'linux-x86_64\\.AppImage$', note: '免安装' },
      { label: 'deb', assetPattern: 'linux-amd64\\.deb$', note: 'Debian / Ubuntu' },
      { label: 'rpm', assetPattern: 'linux-x86_64\\.rpm$', note: 'Fedora / RHEL' },
    ],
  },
];

export const FOOTER_GROUPS = [
  {
    title: '产品',
    links: [
      { label: '能力', href: '#capabilities' },
      { label: '使用场景', href: '#showcase' },
      { label: '工作流', href: '#workflow' },
      { label: '版本对比', href: '#compare' },
      { label: '它不做什么', href: '#limits' },
      { label: '迁移路径', href: '#migrate' },
    ],
  },
  {
    title: '资源',
    links: [
      { label: '使用文档', to: '/docs' },
      { label: '开发文档', to: '/developers' },
      { label: 'MCP 教程', to: '/docs/mcp' },
      { label: '常见问题', to: '/docs/faq' },
      { label: '更新日志', to: '/changelog' },
      { label: '正式版本列表', to: '/releases' },
      { label: 'RSS 订阅', href: `${import.meta.env.BASE_URL}feed.xml`, external: true },
      { label: '给 AI 的入口', to: '/ai' },
    ],
  },
] as const;
