export function skipTexSpace(text, from) {
    let at = from;
    while (at < text.length) {
        if (/\s/.test(text[at]))
            at++;
        else if (text[at] === '%') {
            const end = text.indexOf('\n', at);
            at = end < 0 ? text.length : end + 1;
        }
        else
            break;
    }
    return at;
}
export function texGroup(text, from, open = '{', close = '}') {
    if (text[from] !== open)
        return null;
    let depth = 1;
    for (let at = from + 1; at < text.length; at++) {
        if (text[at] === '\\') {
            at++;
            continue;
        }
        if (text[at] === '%') {
            const end = text.indexOf('\n', at);
            if (end < 0)
                return null;
            at = end;
            continue;
        }
        if (text[at] === open)
            depth++;
        if (text[at] === close && --depth === 0)
            return { from, to: at + 1 };
    }
    return null;
}
/** TeX control sequences outside comments, verbatim environments and inline \verb. */
export function* texCommands(text) {
    for (let at = 0; at < text.length;) {
        if (text[at] === '%') {
            const end = text.indexOf('\n', at);
            at = end < 0 ? text.length : end + 1;
            continue;
        }
        if (text[at] !== '\\') {
            at++;
            continue;
        }
        const from = at++;
        if (/[a-zA-Z@]/.test(text[at] || ''))
            while (/[a-zA-Z@]/.test(text[at] || ''))
                at++;
        else
            at++;
        const name = text.slice(from + 1, at);
        if (name === 'verb') {
            if (text[at] === '*')
                at++;
            const delimiter = text[at++], end = text.indexOf(delimiter, at);
            at = end < 0 ? text.length : end + 1;
            continue;
        }
        yield { from, to: at, name };
        if (name === 'begin') {
            const group = texGroup(text, skipTexSpace(text, at));
            const env = group && text.slice(group.from + 1, group.to - 1);
            if (env && ['verbatim', 'verbatim*', 'lstlisting', 'minted'].includes(env)) {
                const close = `\\end{${env}}`, end = text.indexOf(close, group.to);
                at = end < 0 ? text.length : end + close.length;
            }
        }
    }
}
export function texEnvironments(text, names) {
    const stack = [], blocks = [];
    for (const command of texCommands(text)) {
        if (command.name !== 'begin' && command.name !== 'end')
            continue;
        const group = texGroup(text, skipTexSpace(text, command.to));
        if (!group)
            continue;
        const name = text.slice(group.from + 1, group.to - 1);
        if (['verbatim', 'verbatim*', 'lstlisting', 'minted'].includes(name))
            continue;
        if (command.name === 'begin')
            stack.push({ name, from: command.from, bodyFrom: group.to });
        else if (stack.at(-1)?.name === name) {
            const start = stack.pop();
            if (names.includes(name))
                blocks.push({ ...start, to: group.to, bodyTo: command.from });
        }
    }
    return blocks.sort((a, b) => a.from - b.from || b.to - a.to);
}
export function texDocumentStart(text) {
    for (const command of texCommands(text)) {
        if (command.name !== 'begin')
            continue;
        const group = texGroup(text, skipTexSpace(text, command.to));
        if (group && text.slice(group.from + 1, group.to - 1) === 'document')
            return { from: command.from, to: group.to };
    }
    return null;
}

export function texDocumentClass(text) {
    for (const command of texCommands(text)) {
        if (command.name === 'begin')
            break;
        if (command.name !== 'documentclass')
            continue;
        let at = skipTexSpace(text, command.to);
        const options = text[at] === '[' ? texGroup(text, at, '[', ']') : null;
        if (options)
            at = skipTexSpace(text, options.to);
        const group = texGroup(text, at);
        if (group)
            return { name: text.slice(group.from + 1, group.to - 1).trim(), command, options, group };
    }
    return null;
}
