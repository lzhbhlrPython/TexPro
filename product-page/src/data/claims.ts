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
    note: '可视层把源码投影成可点元素，光标落回时退回源码。',
  },
  {
    id: 'writing',
    file: 'src/editor/writing.ts',
    href: `${REPO}/blob/main/src/editor/writing.ts`,
    note: '聚焦、打字机与段落范围的实现。',
  },
  {
    id: 'compile',
    file: 'electron/services/tex.cjs',
    href: `${REPO}/blob/main/electron/services/tex.cjs`,
    note: '主文件解析、latexmk 调用、日志到诊断的转换。',
  },
  {
    id: 'synctex',
    file: 'electron/services/tex.cjs',
    href: `${REPO}/blob/main/electron/services/tex.cjs`,
    note: 'SyncTeX 正向与反向的坐标换算。',
  },
  {
    id: 'music',
    file: 'electron/services/music.cjs',
    href: `${REPO}/blob/main/electron/services/music.cjs`,
    note: 'MusiXTeX 乐谱源码生成与预览渲染。',
  },
  {
    id: 'mcp',
    file: 'mcp/server.mjs',
    href: `${REPO}/blob/main/mcp/server.mjs`,
    note: 'stdio MCP 服务：21 个工具，另有资源与提示词；路径限制在工程内。',
  },
];

export const CLAIM_BY_ID = new Map(CLAIMS.map((claim, index) => [claim.id, { ...claim, number: index + 1 }]));
