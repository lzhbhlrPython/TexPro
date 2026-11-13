import { SITE_LINKS } from '@/config/constants';

const REPO = SITE_LINKS.repo.replace(/\/$/, '');

export interface Claim {
  /** 对应能力卡片的键，用于把脚注挂回原位。 */
  id: string;
  file: string;
  href: string;
  note: string;
}

/**
 * 页面上的数字与形容词都指向真实文件。
 * 只写文件路径，不写行号：行号会随重构漂移，路径不会。
 */
export const CLAIMS: Claim[] = [
  {
    id: 'visual',
    file: 'src/editor/visual.ts',
    href: `${REPO}/blob/main/src/editor/visual.ts`,
    note: "site.the.visual.layer.projects.source.into.clickable.elements.and",
  },
  {
    id: 'writing',
    file: 'src/editor/writing.ts',
    href: `${REPO}/blob/main/src/editor/writing.ts`,
    note: "site.focus.mode.typewriter.scrolling.and.paragraph.ranges",
  },
  {
    id: 'compile',
    file: 'electron/services/tex.cjs',
    href: `${REPO}/blob/main/electron/services/tex.cjs`,
    note: "site.main.file.resolution.latexmk.invocation.and.log.to.diagnostic",
  },
  {
    id: 'synctex',
    file: 'electron/services/tex.cjs',
    href: `${REPO}/blob/main/electron/services/tex.cjs`,
    note: "site.forward.and.inverse.synctex.coordinate.mapping",
  },
  {
    id: 'music',
    file: 'electron/services/music.cjs',
    href: `${REPO}/blob/main/electron/services/music.cjs`,
    note: "site.musixtex.score.generation.and.preview.rendering",
  },
  {
    id: 'mcp',
    file: 'mcp/server.mjs',
    href: `${REPO}/blob/main/mcp/server.mjs`,
    note: "site.stdio.mcp.server.21.tools.plus.resources.and.prompts",
  },
];

export const CLAIM_BY_ID = new Map(CLAIMS.map((claim, index) => [claim.id, { ...claim, number: index + 1 }]));
