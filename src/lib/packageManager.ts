import { isCtexClass, texDocumentClass } from './texDocument';

export interface PackageSpec {
  name: string;
  options: string;
}

export interface DocumentSetup {
  className: string;
  classOptions: string;
  packages: PackageSpec[];
}

export interface PackageCatalogItem {
  name: string;
  description: string;
  category: string;
  options?: string;
}

export interface ClassCatalogItem {
  name: string;
  description: string;
  category: string;
  engine?: 'pdflatex' | 'xelatex' | 'lualatex';
}

export const classCatalog: ClassCatalogItem[] = [
  { name: 'article', description: "app.short.papers.notes.and.journal.style.articles", category: "app.standard" },
  { name: 'report', description: "app.multi.chapter.reports.with.chapters.and.appendices", category: "app.standard" },
  { name: 'book', description: "app.books.and.theses.with.front.matter.and.chapters", category: "app.standard" },
  { name: 'beamer', description: "app.presentation.slides", category: "app.presentation" },
  { name: 'memoir', description: "app.highly.configurable.book.report.class", category: "app.extended" },
  { name: 'scrartcl', description: "app.koma.script.article", category: "app.koma.script" },
  { name: 'scrreprt', description: "app.koma.script.report", category: "app.koma.script" },
  { name: 'ctexart', description: "app.chinese.article.with.ctex.typography", category: "app.chinese", engine: 'xelatex' },
  { name: 'ctexrep', description: "app.chinese.report.with.ctex.typography", category: "app.chinese", engine: 'xelatex' },
  { name: 'ctexbook', description: "app.chinese.book.with.ctex.typography", category: "app.chinese", engine: 'xelatex' },
  { name: 'standalone', description: "app.single.tikz.equation.images.with.tight.cropping", category: "app.graphics" },
  { name: 'IEEEtran', description: "app.ieee.conference.and.journal.papers", category: "app.academic" },
  { name: 'elsarticle', description: "app.elsevier.journal.submissions", category: "app.academic" },
  { name: 'revtex4-2', description: "app.aps.aip.physics.journals", category: "app.academic" },
  { name: 'acmart', description: "app.acm.conference.and.journal.papers", category: "app.academic" },
  { name: 'ltjsarticle', description: "app.japanese.article.with.luatex.ja", category: "app.japanese", engine: 'lualatex' },
];

export const packageCatalog: PackageCatalogItem[] = [
  { name: 'amsmath', description: "app.core.display.math.environments.and.alignment", category: "app.math" },
  { name: 'amssymb', description: "app.ams.symbol.fonts", category: "app.math" },
  { name: 'mathtools', description: "app.extensions.and.fixes.for.amsmath", category: "app.math" },
  { name: 'bm', description: "app.bold.math.symbols", category: "app.math" },
  { name: 'siunitx', description: "app.numbers.units.and.quantities", category: "app.math" },
  { name: 'physics', description: "app.derivatives.bra.ket.and.vector.notation", category: "app.math" },
  { name: 'mhchem', description: "app.chemical.formulae.and.equations", category: "app.science", options: 'version=4' },
  { name: 'chemfig', description: "app.chemical.structure.diagrams", category: "app.science" },
  { name: 'geometry', description: "app.page.size.and.margins", category: "app.layout", options: 'margin=2.5cm' },
  { name: 'setspace', description: "app.line.spacing", category: "app.layout" },
  { name: 'microtype', description: "app.micro.typographic.adjustments", category: "app.layout" },
  { name: 'fancyhdr', description: "app.headers.and.footers", category: "app.layout" },
  { name: 'titlesec', description: "app.section.heading.formatting", category: "app.layout" },
  { name: 'titling', description: "app.title.block.formatting", category: "app.layout" },
  { name: 'parskip', description: "app.paragraph.spacing.instead.of.indentation", category: "app.layout" },
  { name: 'multicol', description: "app.multiple.columns", category: "app.layout" },
  { name: 'graphicx', description: "app.include.images", category: "app.graphics" },
  { name: 'xcolor', description: "app.colour.support", category: "app.graphics" },
  { name: 'tikz', description: "app.programmable.vector.graphics", category: "app.graphics" },
  { name: 'pgfplots', description: "app.plots.and.axes", category: "app.graphics", options: 'compat=1.18' },
  { name: 'circuitikz', description: "app.circuit.diagrams", category: "app.graphics" },
  { name: 'booktabs', description: "app.professional.table.rules", category: "app.tables" },
  { name: 'tabularx', description: "app.tables.with.automatic.column.widths", category: "app.tables" },
  { name: 'longtable', description: "app.tables.spanning.pages", category: "app.tables" },
  { name: 'multirow', description: "app.cells.spanning.multiple.rows", category: "app.tables" },
  { name: 'makecell', description: "app.line.breaks.and.formatting.inside.table.cells", category: "app.tables" },
  { name: 'threeparttable', description: "app.table.notes.with.controlled.width", category: "app.tables" },
  { name: 'hyperref', description: "app.clickable.links.pdf.metadata.and.bookmarks", category: "app.references" },
  { name: 'cleveref', description: "app.automatic.cross.reference.names", category: "app.references" },
  { name: 'natbib', description: "app.author.year.citations", category: "app.references" },
  { name: 'biblatex', description: "app.flexible.bibliography.processing", category: "app.references", options: 'backend=biber' },
  { name: 'csquotes', description: "app.context.sensitive.quotation.marks", category: "app.references" },
  { name: 'url', description: "app.breakable.urls", category: "app.references" },
  { name: 'enumitem', description: "app.control.list.spacing.and.labels", category: "app.lists" },
  { name: 'listings', description: "app.source.code.listings", category: "app.code" },
  { name: 'minted', description: "app.syntax.highlighted.code.via.pygments", category: "app.code" },
  { name: 'algorithm2e', description: "app.algorithm.pseudocode", category: "app.code" },
  { name: 'algorithmicx', description: "app.algorithmic.pseudocode", category: "app.code" },
  { name: 'ctex', description: "app.chinese.typesetting.for.non.ctex.classes", category: "app.language", options: 'UTF8,fontset=fandol' },
  { name: 'fontspec', description: "app.opentype.truetype.fonts.with.xelatex.or.lualatex", category: "app.language" },
  { name: 'polyglossia', description: "app.multilingual.typesetting.with.xelatex", category: "app.language" },
  { name: 'babel', description: "app.language.specific.typography", category: "app.language" },
  { name: 'luatexja', description: "app.japanese.typesetting.with.lualatex", category: "app.language" },
  { name: 'indentfirst', description: "app.indent.the.first.paragraph.after.a.heading", category: "app.language" },
  { name: 'xeCJK', description: "app.cjk.fonts.and.line.breaking.for.xelatex", category: "app.language" },
  { name: 'caption', description: "app.caption.formatting", category: "app.floats" },
  { name: 'subcaption', description: "app.subfigures.and.subtables", category: "app.floats" },
  { name: 'float', description: "app.the.h.float.placement.modifier", category: "app.floats" },
  { name: 'wrapfig', description: "app.text.wrapping.around.figures", category: "app.floats" },
  { name: 'tcolorbox', description: "app.styled.boxes.and.callouts", category: "app.design" },
  { name: 'mdframed', description: "app.framed.and.shaded.environments", category: "app.design" },
  { name: 'fontawesome5', description: "app.font.awesome.icons", category: "app.design" },
  { name: 'acronym', description: "app.acronym.lists", category: "app.utilities" },
  { name: 'glossaries', description: "app.glossaries.and.symbols", category: "app.utilities" },
  { name: 'appendix', description: "app.appendix.numbering.and.formatting", category: "app.utilities" },
  { name: 'todo', description: "app.todo.notes.in.the.margin", category: "app.utilities" },
  { name: 'lineno', description: "app.line.numbers.for.review", category: "app.utilities" },
];

function splitPackageNames(value: string): string[] {
  return value.split(',').map((name) => name.trim()).filter(Boolean);
}

export function parseDocumentSetup(text: string): DocumentSetup {
  const declaration = texDocumentClass(text);
  const className = declaration?.name || 'article';
  const classOptions = declaration?.options ? text.slice(declaration.options.from + 1, declaration.options.to - 1).trim() : '';
  const begin = text.indexOf('\\begin{document}');
  const preamble = begin >= 0 ? text.slice(0, begin) : text;
  const packages: PackageSpec[] = [];
  const seen = new Set<string>();
  for (const line of preamble.split('\n')) {
    if (/^\s*%/.test(line)) continue;
    const match = /\\usepackage(?:\[([^\]]*)\])?\{([^}]+)\}/.exec(line);
    if (!match) continue;
    for (const name of splitPackageNames(match[2])) {
      if (seen.has(name)) continue;
      seen.add(name);
      packages.push({ name, options: match[1]?.trim() || '' });
    }
  }
  return { className, classOptions, packages };
}

export function buildDocumentSetup(text: string, setup: DocumentSetup): string {
  const declaration = texDocumentClass(text);
  if (!declaration) return text;
  const options = setup.classOptions.trim();
  const classLine = `\\documentclass${options ? `[${options}]` : ''}{${setup.className}}`;
  let output = text.slice(0, declaration.command.from) + classLine + text.slice(declaration.group.to);

  const begin = output.indexOf('\\begin{document}');
  if (begin < 0) return output;
  const preamble = output.slice(0, begin);
  const rest = output.slice(begin);
  const lines = preamble.split('\n');
  const packageLines: number[] = [];
  for (let index = 0; index < lines.length; index++) {
    if (/^\s*%/.test(lines[index])) continue;
    if (/\\usepackage(?:\[[^\]]*\])?\{[^}]+\}/.test(lines[index])) packageLines.push(index);
  }

  const rendered = setup.packages
    .filter((item) => item.name.trim())
    .map((item) => `\\usepackage${item.options.trim() ? `[${item.options.trim()}]` : ''}{${item.name.trim()}}`);

  if (packageLines.length) {
    const first = packageLines[0];
    const filtered = lines.filter((_line, index) => !packageLines.includes(index));
    const insertAt = first - packageLines.filter((index) => index < first).length;
    filtered.splice(insertAt, 0, ...rendered);
    output = filtered.join('\n') + rest;
  } else {
    const classLineIndex = lines.findIndex((line) => /\\documentclass/.test(line));
    lines.splice(classLineIndex >= 0 ? classLineIndex + 1 : 0, 0, ...rendered);
    output = lines.join('\n') + rest;
  }
  return output;
}

export function addPackage(setup: DocumentSetup, item: PackageCatalogItem): DocumentSetup {
  if (item.name === 'ctex' && isCtexClass(setup.className)) return setup;
  if (setup.packages.some((pkg) => pkg.name === item.name)) return setup;
  return { ...setup, packages: [...setup.packages, { name: item.name, options: item.options || '' }] };
}

export function removePackage(setup: DocumentSetup, name: string): DocumentSetup {
  return { ...setup, packages: setup.packages.filter((pkg) => pkg.name !== name) };
}

export function movePackage(setup: DocumentSetup, name: string, direction: -1 | 1): DocumentSetup {
  const index = setup.packages.findIndex((pkg) => pkg.name === name);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= setup.packages.length) return setup;
  const packages = [...setup.packages];
  [packages[index], packages[target]] = [packages[target], packages[index]];
  return { ...setup, packages };
}
