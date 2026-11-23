'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const katex = require('katex');
const modules = new Map();
function load(file) {
  file = path.resolve(__dirname, '../src/lib', file + '.ts');
  if (modules.has(file)) return modules.get(file);
  const context = { exports: {}, require: name => name === 'katex' ? { default: katex } : name.endsWith('.mjs') ? require(path.resolve(path.dirname(file), name)) : load(path.relative(path.resolve(__dirname, '../src/lib'), path.resolve(path.dirname(file), name))) };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, context, { filename: file });
  modules.set(file, context.exports); return context.exports;
}
const { loadProjectWriting, projectGraphic, projectMathMacros, projectTextFormats } = load('writingEngine/project');
const { texVisualFields, applyTexVisualField } = load('texVisualEdits');

test('visual controls preserve handwritten source and reject stale or invalid edits', () => {
  const source = String.raw`% \draw (8,9);
\verb|\draw (3,4);|
\newcommand{\example}{\draw (6,7);}
\draw[red] (-1.5, 2) -- (3, -.4) node {Keep {unknown} (99,98)};
\begin{music}\generalmeter{\meterfrac{4}{4}}\Notes \qu{c}\en\end{music}`;
  const fields = texVisualFields(source);
  assert.deepEqual(Array.from(fields.filter(field => field.axis), field => field.value), ['-1.5', '2', '3', '-.4']);
  const x = fields.find(field => field.axis === 'x');
  assert.equal(applyTexVisualField(source, x, '5'), source.replace('(-1.5, 2)', '(5, 2)'));
  assert.equal(applyTexVisualField(source.replace('-1.5', '12.5'), x, '5'), null);
  assert.equal(applyTexVisualField(source, x, '\\evil'), null);
  const pitch = fields.find(field => field.kind === 'pitch');
  assert.equal(applyTexVisualField(source, pitch, 'd'), source.replace('\\qu{c}', '\\qu{d}'));
  const meter = fields.find(field => field.command === 'meterfrac');
  assert.equal(applyTexVisualField(source, meter, '0'), null);
  assert.equal(applyTexVisualField(source, meter, '3.5'), null);
});
const main = '/paper/main.tex';
const fixture = {
  [main]: String.raw`% !TeX program = xelatex
\documentclass{ctexart}
\input{样式/style}
\begin{document}
\input{sections/chapter}
\end{document}`,
  '/paper/样式/style.tex': String.raw`\input{样式/macros.tex}
\graphicspath{{images/}{figures/}}
\definecolor{Signal}{HTML}{99520C}
\DeclareRobustCommand{\sig}[1]{{\color{Signal}#1}}`,
  '/paper/样式/macros.tex': String.raw`\newcommand{\unit}[1]{\,\mathrm{#1}}
\newcommand{\strong}[1]{\textbf{#1}}`,
  '/paper/sections/chapter.tex': 'Body.',
};
const files = [...Object.keys(fixture), '/paper/images/实验.png', '/paper/images/chart.pdf', '/paper/figures/chart.png'];

test('closed main inherits nested preamble inputs without reading chapter bodies', async () => {
  const reads = [];
  const context = await loadProjectWriting(main, files, async file => { reads.push(file); return fixture[file]; });
  assert.equal(context.incomplete, false);
  assert.deepEqual(reads, [main, '/paper/样式/style.tex', '/paper/样式/macros.tex']);
  assert.match(context.preamble, /newcommand\{\\unit\}/);
  assert.doesNotMatch(context.preamble, /Body\./);
  assert.equal(projectGraphic('实验', context), '/paper/images/实验.png');
  assert.equal(projectGraphic('chart', context), '/paper/images/chart.pdf');
  assert.equal(projectGraphic('images/实验.png', context), '/paper/images/实验.png');
  assert.equal(projectGraphic('missing', context), null);
  assert.equal(projectGraphic('../../private.png', context), null);
  assert.equal(projectGraphic('\\dynamic', context), null);
  const macros = projectMathMacros(context.preamble);
  assert.match(katex.renderToString(String.raw`3\unit{V}`, { macros, throwOnError: true }), /mathrm/);
  assert.equal(projectTextFormats(context.preamble).sig.color, '#99520C');
  assert.equal(projectTextFormats(context.preamble).strong.class, 'cm-bold');
});

test('snapshot overrides and style changes invalidate rendered math, without changing source', async () => {
  const before = await loadProjectWriting(main, files, async file => fixture[file]);
  const changed = { ...fixture, '/paper/样式/macros.tex': String.raw`\newcommand{\unit}[1]{\mathbf{#1}}` };
  const after = await loadProjectWriting(main, files, async file => changed[file]);
  const render = context => katex.renderToString(String.raw`3\unit{V}`, { macros: projectMathMacros(context.preamble), throwOnError: true });
  assert.notEqual(render(before), render(after));
  assert.match(fixture[main], /\\input\{样式\/style\}/);
});

test('conditional, commented, verbatim and macro-body inputs are never read', async () => {
  const source = String.raw`\documentclass{article}
% \input{secret}
\verb|\input{secret}|
\begin{verbatim}\input{secret}\end{verbatim}
\newcommand{\example}{\input{secret}}
\def\other#1{\input{secret}}
\iffalse\input{secret}\fi
\input{safe}
\begin{document}`;
  const reads = [];
  const context = await loadProjectWriting(main, [main, '/paper/safe.tex', '/paper/secret.tex'], async file => { reads.push(file); return file === main ? source : '\\newcommand{\\ok}{1}'; });
  assert.deepEqual(reads, [main, '/paper/safe.tex']);
  assert.equal(projectMathMacros(context.preamble)['\\ok'], '1');
  assert.equal(projectMathMacros(context.preamble)['\\example'], undefined);
});

test('cycles, missing dependencies, oversized context and unreadable files degrade without recursive reads', async () => {
  const source = '\\documentclass{article}\n\\input{cycle}\n\\input{missing}\n\\begin{document}';
  const reads = [];
  const context = await loadProjectWriting(main, [main, '/paper/cycle.tex'], async file => { reads.push(file); return file === main ? source : '\\input{main}'; });
  assert.equal(context.incomplete, true); assert.equal(reads.length, 2);
  assert.equal((await loadProjectWriting(main, [main], async () => { throw Error('denied'); })).incomplete, true);
  assert.equal((await loadProjectWriting(main, [main], async () => 'x'.repeat(2_000_001))).preamble, '');
});

test('explicit project working directory controls graphics and inputs when main is nested', async () => {
  const context = await loadProjectWriting('/paper/source/main.tex', ['/paper/source/main.tex', '/paper/style.tex', '/paper/images/a.png'], async file => file.endsWith('main.tex') ? '\\documentclass{article}\n\\input{style}\n\\begin{document}' : '\\newcommand{\\ok}{1}', '/paper');
  assert.equal(projectMathMacros(context.preamble)['\\ok'], '1');
  assert.equal(projectGraphic('images/a.png', context), '/paper/images/a.png');
});

test('unsupported macro forms remain unsupported and unsafe text colors cannot enter markup', () => {
  const source = String.raw`\newcommand{\optional}[2][x]{#1+#2}
\newcommand{\safe}[1]{\frac{#1}{2}}
\providecommand{\safe}[1]{ignored}
\newcommand{\danger}{\csname input\endcsname}
\newcommand{\layout}[1]{\textbf{#1}\par}
\definecolor{bad}{HTML}{red;display:none}
\newcommand{\colored}[1]{{\color{bad}#1}}`;
  const macros = projectMathMacros(source);
  assert.equal(macros['\\optional'], undefined); assert.equal(macros['\\danger'], undefined);
  assert.equal(macros['\\safe'], String.raw`\frac{#1}{2}`);
  assert.equal(projectTextFormats(source).layout, undefined); assert.equal(projectTextFormats(source).colored, undefined);
});

const { createWritingEngine } = load('writingEngine/engine');
const { createTexWritingEngine } = load('writingEngine/index');

test('projection pipeline preserves exact offsets and excludes comments, verbatim and preamble examples', () => {
  const source = String.raw`\documentclass{article}
\newcommand{\example}{$hidden$}
\begin{document}
% $comment$ \includegraphics{images/实验.png}
\verb|$literal$|
\begin{verbatim}$verbatim$\end{verbatim}
Escaped \$5 and $\frac{a}{b}$.
\begin{align}x&=1\\ y&=2\label{eq:a}\end{align}
\textbf{nested $x$}.
\end{document}`;
  const result = createTexWritingEngine().compile({ text: source, preamble: '' });
  assert.equal(result.failures.length, 0);
  const math = result.projections.filter(node => node.kind === 'math').sort((a, b) => a.from - b.from);
  assert.equal(math.length, 3);
  assert.equal(source.slice(math[0].from, math[0].to), String.raw`$\frac{a}{b}$`);
  assert.match(math[1].data.tex, /begin\{aligned\}/); assert.equal(math[1].data.label, 'eq:a');
  assert.equal(math[2].data.tex, 'x');
  const format = result.projections.find(node => node.kind === 'format');
  assert.equal(source.slice(format.data.contentFrom, format.data.contentTo), 'nested $x$');
});

test('provider registration, isolation, deterministic order and cache invalidation form a reusable contract', () => {
  let calls = 0;
  const providers = [
    { id: 'custom.good', priority: 1, project: frame => { calls++; return [{ kind: 'custom', from: 0, to: 1, data: frame.preamble }]; } },
    { id: 'custom.bad', priority: 2, project: () => [{ kind: 'bad', from: 0, to: 99, data: null }] },
    { id: 'custom.throw', priority: 3, project: () => { throw Error('broken renderer'); } },
  ];
  const engine = createWritingEngine(providers);
  const first = engine.compile({ text: 'abc', preamble: 'one' });
  assert.equal(first.projections.length, 1); assert.equal(first.projections[0].provider, 'custom.good');
  assert.equal(first.failures.length, 2);
  assert.equal(engine.compile({ text: 'abc', preamble: 'one' }), first); assert.equal(calls, 1);
  assert.notEqual(engine.compile({ text: 'abc', preamble: 'two' }), first); assert.equal(calls, 2);
  assert.throws(() => createWritingEngine([providers[0], providers[0]]), /registration/);
});

test('project macros and graphics flow through independent providers using the same source model', async () => {
  const project = await loadProjectWriting(main, files, async file => fixture[file]);
  const text = String.raw`Anchor.
\includegraphics{images/实验.png}
\sig{R1} and $3\unit{V}$`;
  const result = createTexWritingEngine().compile({ text, preamble: project.preamble, project });
  const graphic = result.projections.find(node => node.kind === 'graphic');
  assert.equal(graphic.data.path, '/paper/images/实验.png');
  assert.equal(result.projections.find(node => node.kind === 'format').data.color, '#99520C');
  assert.equal(result.failures.length, 0);
});

test('native fallback paragraphs stop at chapter inputs in both directions', () => {
  const { nativeWritingRegions } = load('writingEngine/native');
  const text = String.raw`\documentclass{article}
\begin{document}
\clearpage\part{First}
\input{first}
\include{second}
\clearpage\part{Second}
\input{third}
\unknown{After the input}
\end{document}`;
  const regions = nativeWritingRegions(text, main);
  assert.equal(regions.length, 3);
  for (const region of regions) assert.doesNotMatch(text.slice(region.from, region.to), /\\(?:input|include)\{/);
  assert.ok(regions.some(region => text.slice(region.from, region.to).includes('unknown')));
});

test('automatic native source reads reject symlink escapes, wrong types and oversized dependencies', () => {
  const os = require('node:os');
  const { readWritingSource } = require('../electron/services/writing-source.cjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-source-test-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'texpro-source-outside-'));
  try {
    fs.writeFileSync(path.join(root, 'style.tex'), 'source');
    assert.equal(readWritingSource(root, path.join(root, 'style.tex')), 'source');
    fs.writeFileSync(path.join(outside, 'secret.tex'), 'private');
    fs.symlinkSync(path.join(outside, 'secret.tex'), path.join(root, 'link.tex'));
    assert.throws(() => readWritingSource(root, path.join(root, 'link.tex')), /outside/);
    fs.writeFileSync(path.join(root, 'data.tex'), 'x'.repeat(2_000_001));
    assert.throws(() => readWritingSource(root, path.join(root, 'data.tex')), /large/);
    assert.throws(() => readWritingSource(root, path.join(root, 'binary.png')), /Invalid/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); fs.rmSync(outside, { recursive: true, force: true }); }
});

test('Windows drive and separator variants preserve canonical file identities', async () => {
  const files = ['C:\\Paper\\main.tex', 'C:\\Paper\\style.tex', 'C:\\Paper\\images\\实验.png'];
  const context = await loadProjectWriting(files[0], files, async file => file === files[0] ? '\\documentclass{article}\n\\input{style}\n\\begin{document}' : '\\newcommand{\\ok}{1}', 'C:\\Paper');
  assert.equal(context.incomplete, false);
  assert.equal(projectMathMacros(context.preamble)['\\ok'], '1');
  assert.equal(projectGraphic('images/实验.png', context), files[2]);
  const { dirname, joinPath } = require('../electron/services/writing-path-core.mjs');
  assert.equal(joinPath('C:\\Paper\\sections', '../images/a.png'), 'C:/Paper/images/a.png');
  assert.equal(dirname('C:\\main.tex'), 'C:\\');
});

test('continuous flow removes only recognized wrappers, retaining unsupported widths and paragraph splits', () => {
  const text = String.raw`Anchor.
\Needspace{4\baselineskip}
\begin{center}\begin{minipage}{\linewidth}\raggedright
{\small Supplement.}\par\smallskip
\end{minipage}\end{center}
\begin{minipage}{0.4\linewidth}Side by side.\end{minipage}
One\par Two.`;
  const plan = createTexWritingEngine().compile({ text, preamble: '' });
  assert.equal(plan.failures.length, 0);
  const flow = plan.projections.filter(node => node.kind === 'flow').map(node => text.slice(node.from, node.to));
  assert.ok(flow.includes(String.raw`\begin{minipage}{\linewidth}`));
  assert.ok(!flow.some(value => value.includes('0.4')));
  assert.equal(flow.filter(value => value === '\\par').length, 1);
  const small = plan.projections.find(node => node.kind === 'format');
  assert.equal(text.slice(small.data.contentFrom, small.data.contentTo), 'Supplement.');
});


test('native fallback discovers custom environments, failed math and imported masters without rewriting source', async () => {
  const { nativeWritingRegions } = load('writingEngine/native');
  const text = '\\section{Title}\n\nOrdinary prose.\n\n\\begin{custombox}\nCustom \\arbitrary{macro}.\n\\end{custombox}\n\nFailed $\\undefined{x}$ math.\n';
  const regions = nativeWritingRegions(text, '/paper/chapter.tex');
  assert.ok(regions.some(region => text.slice(region.from, region.to).includes('begin{custombox}')));
  assert.ok(regions.some(region => text.slice(region.from, region.to).includes('undefined')));
  assert.ok(!regions.some(region => text.slice(region.from, region.to).includes('Ordinary prose')));
  const project = await loadProjectWriting(main, Object.keys(fixture), async file => fixture[file]);
  const master = nativeWritingRegions(fixture[main], main, project);
  assert.equal(master.length, 0, 'master includes compose continuous child views, never full PDF pages');
});

const { loadWritingComposition, writingIncludes } = load('writingEngine/includes');
test('chapter composition preserves files, unsaved inputs, cycles and dependency failures', async () => {
  const project = await loadProjectWriting(main, files, async file => fixture[file]);
  const composition = await loadWritingComposition(main, fixture[main], project, async file => fixture[file] + ' unsaved');
  assert.equal(composition.sources['/paper/sections/chapter.tex'], 'Body. unsaved');
  assert.equal(composition.incomplete, false);
  const cycle = await loadWritingComposition(main, '\\input{sections/chapter}', project, async () => '\\input{main}');
  assert.equal(cycle.incomplete, true);
  assert.equal(writingIncludes('\\newcommand{\\example}{\\input{sections/chapter}}', project).length, 0);
});
test('geometry grammars preserve nested structures and resolve proof/tree package variants', () => {
  const { diagramBlocks } = load('texDocument');
  const { geometryAdapter, geometryPreviewSource } = require('../electron/services/geometry-core.mjs');
  const source = String.raw`% \chemfig{ignored}
\begin{forest}[A [B] [C]]\end{forest}
\xymatrix@R=2em{A \ar[r] & B}
\Tree [.S [.NP A ] [.VP B ] ]
\begin{tikzpicture}\begin{axis}\addplot{x};\end{axis}\end{tikzpicture}`;
  const blocks = diagramBlocks(source);
  assert.equal(blocks.length, 4);
  assert.equal(blocks[0].adapter, 'forest'); assert.equal(blocks[1].adapter, 'xy');
  assert.equal(blocks[3].adapter, 'tikz');
  assert.equal(geometryAdapter('\\begin{prooftree}x\\end{prooftree}', '\\usepackage{ebproof}').id, 'ebproof');
  assert.equal(geometryAdapter('\\Tree [.A B ]').id, 'qtree');
  assert.match(geometryPreviewSource('\\Tree [.A B ]', '\\usepackage{tikz-qtree}'), /begin\{tikzpicture\}/);
});
