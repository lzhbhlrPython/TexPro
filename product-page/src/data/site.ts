import type { SupportLevel } from '@/types';
export const MCP_METRIC = { value: '21', label: "site.mcp.tools", description: "site.mcp.tools.for.ai.clients.to.read.and.edit" } as const;

export interface NavItem {
  label: string;
  /** 首页锚点 */
  href?: string;
  /** 站内路由 */
  to?: string;
}

/** Header 只放跨页面入口，页内段落交给侧边栏（SectionRail）。 */
export const PAGE_LINKS: NavItem[] = [
  { to: '/blog', label: "site.blog" },
  { to: '/docs', label: "site.user.guide" },
  { to: '/developers', label: "site.developer.docs" },
];

export interface SectionLink {
  id: string;
  label: string;
}

/** 首页各段落的顺序，与 pages/home/index.tsx 的排布一致。 */
export const SECTION_LINKS: SectionLink[] = [
  { id: 'top', label: "site.top" },
  { id: 'capabilities', label: "site.capabilities" },
  { id: 'demo', label: "site.demo" },
  { id: 'showcase', label: "site.in.use" },
  { id: 'workflow', label: "site.workflow" },
  { id: 'failure', label: "site.errors" },
  { id: 'details', label: "site.small.touches" },
  { id: 'compare', label: "site.comparison" },
  { id: 'limits', label: "site.limits" },
  { id: 'local', label: "site.privacy" },
  { id: 'themes', label: "site.writing" },
  { id: 'migrate', label: "site.switching" },
  { id: 'proof', label: "site.evidence" },
  { id: 'download', label: "site.download" },
];

export const HERO_METRICS = [
  { value: '158', label: "site.metrics.regression.label", source: 'tests' },
  { value: '106', label: "site.ipc.channels.one.to.one.with.the.preload.bridge", source: 'ipc' },
  { value: '8', label: "site.installers.per.nightly.build.three.platforms", source: 'releases' },
  { value: MCP_METRIC.value, label: MCP_METRIC.label, source: 'mcp' },
] as const;

export const HERO_POINTS = ["site.no.sign.in.variant2", "site.compiles.offline", "site.files.stay.on.your.disk"] as const;

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
    capability: "site.typeset.result.inside.the.text",
    detail: "site.formulas.tables.tikz.figures.and.scores.render.in.place.variant2",
    texpro: 'yes',
    markdown: 'no',
    classic: 'no',
    cloud: 'partial',
  },
  {
    key: 'source',
    capability: "site.wysiwyg.that.is.still.real.latex",
    detail: "site.every.visual.element.is.still.compilable.source",
    texpro: 'yes',
    markdown: 'no',
    classic: 'partial',
    cloud: 'partial',
  },
  {
    key: 'project',
    capability: "site.local.project.multiple.files",
    detail: "site.main.file.detection.sub.files.bib.images.tree",
    texpro: 'yes',
    markdown: 'partial',
    classic: 'yes',
    cloud: 'yes',
  },
  {
    key: 'synctex',
    capability: "site.two.way.pdf.and.source.navigation",
    detail: "site.click.the.pdf.to.jump.to.the.originating.line",
    texpro: 'yes',
    markdown: 'no',
    classic: 'partial',
    cloud: 'partial',
  },
  {
    key: 'graphics',
    capability: "site.scores.curves.and.circuits.variant2",
    detail: "site.visual.panels.for.musixtex.pgfplots.and.tikz",
    texpro: 'yes',
    markdown: 'no',
    classic: 'no',
    cloud: 'no',
  },
  {
    key: 'writing',
    capability: "site.writing.modes.focus.typewriter.paper.themes",
    detail: "site.only.the.current.paragraph.stays.lit",
    texpro: 'yes',
    markdown: 'partial',
    classic: 'no',
    cloud: 'no',
  },
  {
    key: 'chinese',
    capability: "site.chinese.typesetting",
    detail: "site.ctex.indent.full.width.punctuation.and.cjk.line.spacing",
    texpro: 'yes',
    markdown: 'partial',
    classic: 'partial',
    cloud: 'partial',
  },
  {
    key: 'offline',
    capability: "site.local.first.optional.network.features",
    detail: "site.no.account.no.upload.no.usage.data",
    texpro: 'yes',
    markdown: 'yes',
    classic: 'yes',
    cloud: 'no',
  },
];

export const COMPARE_COLUMNS = [
  { key: 'texpro', label: 'TeXPro', highlight: true },
  { key: 'markdown', label: "site.markdown.editors", highlight: false },
  { key: 'classic', label: "site.classic.latex.ides", highlight: false },
  { key: 'cloud', label: "site.online.latex.services", highlight: false },
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
    detail: "site.universal.apple.silicon.and.intel.13",
    format: 'DMG',
    assetPattern: 'mac-universal\\.dmg$',
    variants: [
      { label: 'DMG', assetPattern: 'mac-universal\\.dmg$' },
      { label: 'ZIP', assetPattern: 'mac-universal\\.zip$', note: "site.portable" },
    ],
  },
  {
    key: 'windows',
    platform: 'Windows',
    detail: "site.x64.10.nsis.installer",
    format: 'EXE',
    assetPattern: 'windows-x64-setup\\.exe$',
    variants: [
      { label: 'EXE', assetPattern: 'windows-x64-setup\\.exe$', note: "site.nsis.installer" },
      { label: 'Portable', assetPattern: 'windows-x64-portable\\.exe$', note: "site.portable" },
      { label: 'ZIP', assetPattern: 'windows-x64\\.zip$', note: "site.unzip.and.run" },
    ],
  },
  {
    key: 'linux',
    platform: 'Linux',
    detail: "site.x64.appimage.plus.deb.rpm",
    format: 'AppImage',
    assetPattern: 'linux-x86_64\\.AppImage$',
    variants: [
      { label: 'AppImage', assetPattern: 'linux-x86_64\\.AppImage$', note: "site.portable" },
      { label: 'deb', assetPattern: 'linux-amd64\\.deb$', note: "site.debian.ubuntu" },
      { label: 'rpm', assetPattern: 'linux-x86_64\\.rpm$', note: "site.fedora.rhel" },
    ],
  },
];

export const FOOTER_GROUPS = [
  {
    title: "site.product",
    links: [
      { label: "site.capabilities", href: '#capabilities' },
      { label: "site.use.cases", href: '#showcase' },
      { label: "site.workflow", href: '#workflow' },
      { label: "site.comparison.variant2", href: '#compare' },
      { label: "site.what.it.does.not.do", href: '#limits' },
      { label: "site.switching.paths", href: '#migrate' },
    ],
  },
  {
    title: "site.resources",
    links: [
      { label: "site.user.guide", to: '/docs' },
      { label: "site.developer.docs", to: '/developers' },
      { label: "site.mcp.guide", to: '/docs/mcp' },
      { label: "site.faq", to: '/docs/faq' },
      { label: "site.changelog", to: '/changelog' },
      { label: "site.stable.releases", to: '/releases' },
      { label: "site.rss.feed", href: `${import.meta.env.BASE_URL}feed.xml`, external: true },
      { label: "site.for.ai", to: '/ai' },
    ],
  },
] as const;
