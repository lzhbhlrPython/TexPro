'use strict';
const templates = {
  css: { source: 'src/theme.css', content: '.extensions-panel, .extension-tool { border-radius: var(--radius); }\n' },
  scss: { dependencies: { sass: '1.108.2' }, source: 'src/theme.scss', content: '$radius: 12px;\n.extensions-panel { border-radius: $radius; .extension-tool { border-radius: $radius; } }\n' },
  sass: { dependencies: { sass: '1.108.2' }, source: 'src/theme.sass', content: '$radius: 12px\n.extensions-panel\n  border-radius: $radius\n  .extension-tool\n    border-radius: $radius\n' },
  less: { dependencies: { less: '4.9.1' }, source: 'src/theme.less', content: '@radius: 12px;\n.extensions-panel { border-radius: @radius; .extension-tool { border-radius: @radius; } }\n' },
  stylus: { dependencies: { stylus: '0.64.0' }, source: 'src/theme.styl', content: 'radius = 12px\n.extensions-panel\n  border-radius radius\n  .extension-tool\n    border-radius radius\n' },
  'css-in-js': { dependencies: { '@vanilla-extract/css': '1.21.3', '@vanilla-extract/esbuild-plugin': '2.3.22' }, source: 'src/theme.css.ts', content: "import { globalStyle } from '@vanilla-extract/css';\nglobalStyle('.extensions-panel, .extension-tool', { borderRadius: 'var(--radius)' });\n" },
  tcss: { source: 'src/theme.tcss', content: '@var ink: #9c472b\n\n.extensions-panel:\n    color: ink\n' },
};
module.exports = { templates };
