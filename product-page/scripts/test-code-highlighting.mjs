import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, configFile: false, appType: 'custom', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, watch: null, ws: false } });
try {
  const { parseMarkdown } = await server.ssrLoadModule('/src/lib/markdown.ts');
  const { codeLanguage } = await server.ssrLoadModule('/src/lib/codeLanguages.ts');
  const { readableCodeColor } = await server.ssrLoadModule('/src/lib/codeColors.ts');
  const { highlightCode } = await server.ssrLoadModule('/src/lib/codeHighlighting.ts');
  const blocks = parseMarkdown('## Example\n\n```sh title="install"\nnpm install --ignore-scripts\n```\n\n```unknown-language\n<script>alert(1)</script>\n```\n\n```\nliteral\n```');
  assert.deepEqual(blocks.filter(block => block.kind === 'code'), [
    { kind: 'code', language: 'sh', text: 'npm install --ignore-scripts' },
    { kind: 'code', language: 'unknown-language', text: '<script>alert(1)</script>' },
    { kind: 'code', language: undefined, text: 'literal' },
  ]);
  const samples = {
    sh: 'npm install --ignore-scripts "@texpro/extension-translate-zh-cn@1.0.0"\n# next step\nnpm run sync:extensions',
    tex: '\\section{中文}\n\\[ E = mc^2 \\]',
    json: '{"name": "<script>alert(1)</script>", "version": 1}',
    jsonc: '{ // comment\n "value": true\n}',
    js: 'const message = "<img src=x onerror=alert(1)>";\nconsole.log(message);',
    ts: 'const value: number = 42;',
    jsx: 'const view = <div title="example">Hello</div>;',
    tsx: 'const view: JSX.Element = <div>Hello</div>;',
    css: '.example { color: red; }',
    scss: '$accent: red; .example { color: $accent; }',
    less: '@accent: red; .example { color: @accent; }',
    html: '<script>alert("literal")</script>',
    yaml: 'name: Example\nitems:\n  - enabled: true',
    toml: '[package]\nname = "example"',
    md: '## Example\n**bold** and `code`',
    diff: '-old\n+new',
    powershell: '$env:TEXPRO_APP_PATH = "C:\\Apps\\TeXPro\\TeXPro.exe"\nnpm run sync:extensions',
  };
  for (const [language, text] of Object.entries(samples)) {
    const tokens = await highlightCode(text, language);
    assert.ok(tokens?.length, `Expected ${language} grammar to load`);
    assert.equal(tokens.map(token => token.content).join(''), text, `${language} must preserve source`);
    assert.ok(tokens.some(token => token.color?.startsWith('var(--site-code-')), `${language} must use site tokens`);
  }
  for (const [background, foreground] of [['#FFFCF7','#2A231E'],['#1D1917','#E9E3DA']]) {
    for (const color of ['#52c41a','#faad14','#a3462c','rgba(0,0,0,0.65)','rgba(255,255,255,0.65)']) {
      const result = readableCodeColor(color, background, foreground);
      assert.match(result, /^rgb\(/);
      const light = channels => channels.map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      const ink = light(result.match(/\d+/g).map(Number));
      const paper = light([1, 3, 5].map(index => parseInt(background.slice(index, index + 2), 16)));
      assert.ok((Math.max(ink, paper) + .05) / (Math.min(ink, paper) + .05) >= 4.5, `${color} must remain readable on ${background}`);
    }
  }
  assert.equal(readableCodeColor('var(--custom)', '#ffffff', '#222222'), '#222222');
  const parallel = await Promise.all(Array.from({ length: 8 }, () => highlightCode(samples.sh, 'bash')));
  assert.ok(parallel.every(tokens => tokens.map(token => token.content).join('') === samples.sh));
  assert.equal(codeLanguage(' BASH '), 'shellscript');
  assert.equal(codeLanguage('ps1'), 'powershell');
  for (const language of [undefined, '', 'text', 'base64', '__proto__', 'not-a-language']) {
    assert.equal(await highlightCode('<img onerror=alert(1)>', language), undefined);
  }
  for (const source of ['a'.repeat(40_001), 'a'.repeat(2001), '\n'.repeat(1001)]) {
    assert.equal(await highlightCode(source, 'js'), undefined);
  }
  for (const source of ['const a = 1;\r\nconst b = 2;\r\n', 'const a = 1;\rconst b = 2;', '\n\n', '']) {
    const tokens = await highlightCode(source, 'js');
    assert.equal(tokens?.map(token => token.content).join('') ?? source, source);
  }
  console.log('PASS code fences, 17 Shiki grammars, aliases, literal source, CRLF, concurrent loading, plain/unknown languages and bounded inputs');
} finally {
  await server.close();
}
