// Pure source operations shared by the editor, native services and MCP.
export const placeholderKinds = ['text', 'figure', 'table', 'citation', 'data'];

function space(text, at) {
  while (at < text.length) {
    if (/\s/.test(text[at])) at++;
    else if (text[at] === '%') { const end = text.indexOf('\n', at); at = end < 0 ? text.length : end + 1; }
    else break;
  }
  return at;
}

function group(text, from, open = '{', close = '}') {
  if (text[from] !== open) return null;
  let depth = 1;
  for (let at = from + 1; at < text.length; at++) {
    if (text[at] === '\\') { at++; continue; }
    if (text[at] === '%') { const end = text.indexOf('\n', at); if (end < 0) return null; at = end; continue; }
    if (text[at] === open) depth++;
    if (text[at] === close && --depth === 0) return { from, to: at + 1 };
  }
  return null;
}

function scan(text) {
  const commands = [], comments = [], excluded = [];
  const skipDelimited = (from, start, delimiter) => {
    let end = text.indexOf(delimiter, start);
    while (end >= 0) {
      let slashes = 0; for (let i = end - 1; i >= 0 && text[i] === '\\'; i--) slashes++;
      if (slashes % 2 === 0) break;
      end = text.indexOf(delimiter, end + delimiter.length);
    }
    const to = end < 0 ? text.length : end + delimiter.length;
    excluded.push({ from, to, unfinished: end < 0 }); return to;
  };
  for (let at = 0; at < text.length;) {
    if (text[at] === '$') { const delimiter = text[at + 1] === '$' ? '$$' : '$'; at = skipDelimited(at, at + delimiter.length, delimiter); continue; }
    if (text[at] === '\\' && ['(', '['].includes(text[at + 1])) { at = skipDelimited(at, at + 2, text[at + 1] === '(' ? '\\)' : '\\]'); continue; }
    if (text[at] === '%') {
      const from = at, end = text.indexOf('\n', at); at = end < 0 ? text.length : end;
      comments.push({ from, to: at }); excluded.push({ from, to: at }); continue;
    }
    if (text[at] !== '\\') { at++; continue; }
    const from = at++;
    if (/[a-zA-Z@]/.test(text[at] || '')) while (/[a-zA-Z@]/.test(text[at] || '')) at++;
    else { at++; continue; }
    const name = text.slice(from + 1, at), token = { name, from, to: at };
    if (name === 'verb') {
      if (text[at] === '*') at++;
      const delimiter = text[at++], end = text.indexOf(delimiter, at);
      at = end < 0 ? text.length : end + 1; excluded.push({ from, to: at }); continue;
    }
    if (name === 'begin') {
      const env = group(text, space(text, at));
      if (env && ['verbatim', 'verbatim*', 'lstlisting', 'minted', 'comment', 'equation', 'equation*', 'align', 'align*', 'gather', 'gather*', 'displaymath', 'math', 'multline', 'multline*', 'eqnarray', 'eqnarray*', 'alignat', 'alignat*', 'flalign', 'flalign*', 'split', 'array', 'cases', 'matrix', 'pmatrix', 'bmatrix'].includes(text.slice(env.from + 1, env.to - 1))) {
        const closing = `\\end{${text.slice(env.from + 1, env.to - 1)}}`, end = text.indexOf(closing, env.to);
        at = end < 0 ? text.length : end + closing.length; excluded.push({ from, to: at, unfinished: end < 0 }); continue;
      }
    }
    if (['def', 'gdef', 'edef', 'xdef'].includes(name)) {
      const cursor = space(text, at), target = /^\\[a-zA-Z@]+/.exec(text.slice(cursor));
      token.definition = target?.[0];
      const bodyStart = text.indexOf('{', cursor + (target?.[0].length || 0)), body = bodyStart < 0 ? null : group(text, bodyStart);
      if (body) { at = body.to; excluded.push({ from, to: at }); }
    }
    if (['newcommand', 'renewcommand', 'providecommand', 'DeclareRobustCommand'].includes(name)) {
      let cursor = space(text, text[at] === '*' ? at + 1 : at);
      const target = group(text, cursor);
      const control = /^\\[a-zA-Z@]+/.exec(text.slice(cursor));
      token.definition = target ? text.slice(target.from + 1, target.to - 1).trim() : control?.[0];
      cursor = space(text, target?.to ?? cursor + (control?.[0].length || 0));
      for (let n = 0; n < 2 && text[cursor] === '['; n++) { const arg = group(text, cursor, '[', ']'); if (!arg) break; cursor = space(text, arg.to); }
      const body = group(text, cursor);
      if (body) { at = body.to; excluded.push({ from, to: at }); }
    }
    commands.push(token);
  }
  return { commands, comments, excluded };
}

export function parseWritingAids(text, file = '') {
  const { commands, comments } = scan(text), placeholders = [], memos = [];
  const document = commands.find(token => token.name === 'begin' && text.slice(space(text, token.to), space(text, token.to) + 10) === '{document}');
  const hasClass = commands.some(token => token.name === 'documentclass');
  const bodyStart = document ? space(text, document.to) + 10 : hasClass ? text.length : 0;
  const line = from => text.slice(0, from).split('\n').length;
  for (const command of commands) {
    if (command.name !== 'texproplaceholder' || command.from < bodyStart) continue;
    let at = space(text, command.to), kind = 'text';
    if (text[at] === '[') {
      const option = group(text, at, '[', ']'); if (!option) continue;
      kind = text.slice(option.from + 1, option.to - 1).trim(); at = space(text, option.to);
    }
    const body = group(text, at); if (!body) continue;
    placeholders.push({ file, from: command.from, to: body.to, line: line(command.from), kind: placeholderKinds.includes(kind) ? kind : 'text', text: text.slice(body.from + 1, body.to - 1), contentFrom: body.from + 1, contentTo: body.to - 1, source: text.slice(command.from, body.to) });
  }
  for (const comment of comments) {
    if (text.slice(text.lastIndexOf('\n', comment.from - 1) + 1, comment.from).trim()) continue;
    const match = /^%\s*(MEMO-DONE|MEMO|TODO|FIXME|NOTE|DONE)\s*:\s*(.*)$/i.exec(text.slice(comment.from, comment.to));
    if (match) memos.push({ file, from: comment.from, to: comment.to, line: line(comment.from), text: match[2].replace(/\r$/, ''), done: /^(MEMO-DONE|DONE)$/i.test(match[1]), marker: match[1].toUpperCase(), source: text.slice(comment.from, comment.to) });
  }
  return { placeholders, memos };
}

export function writingPositionAllowed(text, offset) {
  if (!Number.isInteger(offset) || offset < 0 || offset > text.length) return false;
  const { commands, excluded } = scan(text);
  if (excluded.some(range => offset >= range.from && (offset < range.to || range.unfinished && offset === range.to))) return false;
  const document = commands.find(token => token.name === 'begin' && text.slice(space(text, token.to), space(text, token.to) + 10) === '{document}');
  return document ? offset >= space(text, document.to) + 10 : !commands.some(token => token.name === 'documentclass');
}

export const placeholderPreamble = String.raw`% TeXPro placeholders begin
\providecommand{\texproplaceholder}[2][text]{%
  \begingroup
  \setlength{\fboxsep}{0.4em}%
  \def\texprokind{#1}\def\texprofigure{figure}\def\texprotable{table}%
  \ifx\texprokind\texprofigure
    \fbox{\parbox[c][4\baselineskip][c]{\dimexpr\linewidth-2\fboxsep-2\fboxrule\relax}{\centering #2}}%
  \else\ifx\texprokind\texprotable
    \fbox{\parbox[c][3\baselineskip][c]{\dimexpr\linewidth-2\fboxsep-2\fboxrule\relax}{\centering #2}}%
  \else
    \fbox{\normalfont\strut #2}%
  \fi\fi
  \endgroup}
% TeXPro placeholders end
`;

export function ensurePlaceholderSupport(text) {
  const { commands } = scan(text);
  if (commands.some(token => token.definition === '\\texproplaceholder')) return text;
  const document = commands.find(token => token.name === 'begin' && text.slice(space(text, token.to), space(text, token.to) + 10) === '{document}');
  if (!document) throw new Error('Choose a main file with a document environment.');
  return text.slice(0, document.from) + placeholderPreamble + text.slice(document.from);
}

export function escapePlaceholderText(text) {
  return String(text).replace(/\r?\n/g, ' ').replace(/[\\{}%#$&_~^]/g, char => ({ '\\': '\\textbackslash{}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}' })[char] || '\\' + char);
}

export function placeholderSource(kind, text) {
  if (!placeholderKinds.includes(kind)) throw new Error('Invalid placeholder kind');
  return `\\texproplaceholder[${kind}]{${escapePlaceholderText(text)}}`;
}

export function toggleMemoLine(line, expected) {
  const match = /^(\s*%\s*)(MEMO-DONE|MEMO|TODO|FIXME|NOTE|DONE)(\s*:\s*)(.*)$/i.exec(line);
  if (!match || match[4].trim() !== expected.text.trim() || /^(MEMO-DONE|DONE)$/i.test(match[2]) !== expected.done) return null;
  const marker = /^MEMO/i.test(match[2]) ? expected.done ? 'MEMO' : 'MEMO-DONE' : expected.done ? 'TODO' : 'DONE';
  return match[1] + marker + match[3] + match[4];
}

export const ctexBodySettings = String.raw`\ctexset{autoindent=2, punct=quanjiao, space=auto}
\setlength{\parskip}{0pt plus 1pt}`;

export const ctexWritingSettings = String.raw`% TeXPro Chinese typography begin
${ctexBodySettings}
\linespread{1.3}
% TeXPro Chinese typography end`;

export function applyCtexTypography(source) {
  const text = source.replace(/^% TeXPro Chinese typography begin\r?\n[\s\S]*?^% TeXPro Chinese typography end(?:\r?\n|$)/gm, '');
  const { commands } = scan(text);
  const document = commands.find(token => token.name === 'begin' && text.slice(space(text, token.to), space(text, token.to) + 10) === '{document}');
  if (!document) throw new Error('Choose a main file with a document environment.');
  const chinese = commands.some(token => {
    if (token.from > document.from) return false;
    let at = space(text, token.to);
    if (text[at] === '[') { const option = group(text, at, '[', ']'); if (option) at = space(text, option.to); }
    const arg = group(text, at), names = arg ? text.slice(arg.from + 1, arg.to - 1).split(',').map(name => name.trim()) : [];
    return token.name === 'documentclass' && names.some(name => /^ctex(?:art|rep|book|beamer)$/.test(name)) || ['usepackage', 'RequirePackage'].includes(token.name) && names.includes('ctex');
  });
  return text.slice(0, document.from) + (chinese ? '' : '\\usepackage[UTF8,fontset=fandol]{ctex}\n') + ctexWritingSettings + '\n' + text.slice(document.from);
}
