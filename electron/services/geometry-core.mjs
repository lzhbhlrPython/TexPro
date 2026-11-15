import { skipTexSpace, texCommands, texGroup } from './tex-source-core.mjs';

/** Package adapters describe source grammar and rendering dependencies, not UI pages. */
export const geometryAdapters = Object.freeze([
  { id: 'tikz', environments: ['tikzpicture'], commands: ['tikz'], packages: ['tikz'], kind: 'tikz' },
  { id: 'circuitikz', environments: ['circuitikz'], commands: [], packages: ['circuitikz'], kind: 'circuit' },
  { id: 'chemfig', environments: [], commands: ['chemfig'], packages: ['chemfig'], kind: 'chemistry' },
  { id: 'tikz-cd', environments: ['tikzcd'], commands: [], packages: ['tikz-cd'], kind: 'tikz' },
  { id: 'forest', environments: ['forest'], commands: [], packages: ['forest'], kind: 'tikz' },
  { id: 'quantikz', environments: ['quantikz'], commands: [], packages: ['quantikz'], kind: 'circuit' },
  { id: 'pgfplots', environments: ['axis', 'semilogxaxis', 'semilogyaxis', 'loglogaxis', 'polaraxis', 'groupplot'], commands: [], packages: ['pgfplots'], kind: 'tikz', wrapper: 'tikzpicture' },
  { id: 'picture', environments: ['picture'], commands: [], packages: [], kind: 'tikz' },
  { id: 'pstricks', environments: ['pspicture', 'pspicture*', 'psmatrix'], commands: [], packages: ['pstricks', 'pst-node'], kind: 'tikz', driver: 'postscript' },
  { id: 'xy', environments: ['xy'], commands: ['xymatrix'], packages: ['xy'], kind: 'tikz' },
  { id: 'qcircuit', environments: [], commands: ['Qcircuit'], packages: ['qcircuit'], kind: 'circuit' },
  { id: 'tikz-qtree', environments: [], commands: ['Tree'], packages: ['tikz-qtree'], kind: 'tikz', argument: 'bracket', wrapper: 'tikzpicture' },
  { id: 'qtree', environments: [], commands: ['Tree'], packages: ['qtree'], kind: 'tikz', argument: 'bracket' },
  { id: 'bussproofs', environments: ['prooftree'], commands: [], packages: ['bussproofs'], kind: 'tikz' },
  { id: 'ebproof', environments: ['prooftree', 'prooftree*'], commands: [], packages: ['ebproof'], kind: 'tikz' },
  { id: 'logicproof', environments: ['logicproof'], commands: [], packages: ['logicproof'], kind: 'tikz' },
  { id: 'smartdiagram', environments: [], commands: ['smartdiagram'], packages: ['smartdiagram'], kind: 'tikz' },
  { id: 'venndiagram', environments: ['venndiagram2sets', 'venndiagram3sets'], commands: [], packages: ['venndiagram'], kind: 'tikz' },
  { id: 'pgfgantt', environments: ['ganttchart'], commands: [], packages: ['pgfgantt'], kind: 'tikz' },
  { id: 'tikz-feynman', environments: ['feynman'], commands: ['feynmandiagram'], packages: ['tikz-feynman'], kind: 'tikz', wrapper: 'tikzpicture', terminator: ';' },
]);

/** Resolve ambiguous grammars from the author's package declarations. */
export function geometryPackages(preamble) {
  const packages = new Set();
  for (const command of texCommands(preamble)) {
    if (!['usepackage', 'RequirePackage'].includes(command.name)) continue;
    let at = skipTexSpace(preamble, command.to);
    if (preamble[at] === '[') { const option = texGroup(preamble, at, '[', ']'); if (!option) continue; at = skipTexSpace(preamble, option.to); }
    const group = texGroup(preamble, at); if (!group) continue;
    for (const name of preamble.slice(group.from + 1, group.to - 1).split(',')) packages.add(name.trim());
  }
  return packages;
}
export function geometryAdapter(source, preamble = '') {
  const packages = geometryPackages(preamble);
  const choose = candidates => candidates.find(candidate => candidate.packages.some(name => packages.has(name))) || candidates.find(candidate => !['ebproof', 'tikz-qtree'].includes(candidate.id)) || candidates[0];
  for (const command of texCommands(source)) {
    if (command.name === 'begin') {
      const group = texGroup(source, skipTexSpace(source, command.to));
      const name = group && source.slice(group.from + 1, group.to - 1);
      const adapter = choose(geometryAdapters.filter(candidate => candidate.environments.includes(name)));
      if (adapter) return adapter;
    }
    const name = /^(?:xymatrix|Qcircuit)@/.test(command.name) ? command.name.split('@')[0] : command.name;
    const adapter = choose(geometryAdapters.filter(candidate => candidate.commands.includes(name)));
    if (adapter) return adapter;
  }
}
export function geometryPreviewSource(source, preamble = '') {
  const adapter = geometryAdapter(source, preamble);
  // The feynmandiagram command owns its TikZ picture; only the environment needs wrapping.
  return adapter?.wrapper && !source.trimStart().startsWith('\\feynmandiagram') ? `\\begin{${adapter.wrapper}}\n${source}\n\\end{${adapter.wrapper}}` : source;
}
