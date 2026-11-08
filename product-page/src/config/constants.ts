export const APP_NAME = 'TeXPro';
export const APP_VERSION = '0.1.0';

export const STORAGE_KEYS = {
  design: 'texpro:design',
} as const;

/**
 * 品牌色候选：全部取自 TeXPro 图标渐变的赤陶系（#E1845F → #BC4F30 → #7C2B18），
 * 外加应用「纸面」主题里更深一点的赭石与墨色，保证任何时候都还是 TeXPro 的配色。
 */
export const PRIMARY_COLORS = [
  { color: '#BC4F30', name: '赤陶' },
  { color: '#D97757', name: '陶土' },
  { color: '#B4532A', name: '赭石' },
  { color: '#7C2B18', name: '深赭' },
  { color: '#3A332C', name: '墨' },
];

/**
 * 外链集中在这里：上线前把仓库地址换成真实地址即可，页面其它位置不写死 URL。
 */
export const SITE_LINKS = {
  repo: 'https://github.com/texpro/texpro',
  releases: 'https://github.com/texpro/texpro/releases',
  docs: 'https://github.com/texpro/texpro#readme',
  issues: 'https://github.com/texpro/texpro/issues',
} as const;

/** 门户内容区定宽。 */
export const SITE_MAX_WIDTH = 1200;
