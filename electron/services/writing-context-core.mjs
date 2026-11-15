import { dirname, joinPath } from './writing-path-core.mjs';
import { skipTexSpace, texCommands, texDocumentStart, texGroup } from './tex-source-core.mjs';
const pathKey = file => {
    const normalized = joinPath('', file);
    return /^(?:[A-Za-z]:\/|\/\/)/.test(normalized) ? normalized.toLowerCase() : normalized;
};
/** Static, top-level declarations only. Never execute conditionals or macro bodies. */
export function* declarations(text) {
    let end = 0, conditional = 0;
    for (const command of texCommands(text)) {
        if (command.from < end)
            continue;
        // Skip any group between control sequences, including parameterized \def.
        for (let at = end; at < command.from; at++) {
            if (text[at] === '%') {
                const newline = text.indexOf('\n', at);
                at = newline < 0 ? text.length : newline;
            }
            else if (text[at] === '\\')
                at++;
            else if (text[at] === '{') {
                const group = texGroup(text, at);
                end = group?.to ?? text.length;
                at = end - 1;
            }
        }
        if (command.from < end)
            continue;
        end = command.to;
        if (/^if/.test(command.name)) {
            conditional++;
            continue;
        }
        if (command.name === 'fi') {
            conditional = Math.max(0, conditional - 1);
            continue;
        }
        if (!conditional)
            yield command;
        let at = skipTexSpace(text, command.to);
        if (text[at] === '*')
            at = skipTexSpace(text, at + 1);
        while (text[at] === '{' || text[at] === '[') {
            const group = texGroup(text, at, text[at], text[at] === '{' ? '}' : ']');
            if (!group) {
                end = text.length;
                break;
            }
            end = group.to;
            at = skipTexSpace(text, group.to);
        }
    }
}
/** Bounded reads through the existing authorized file API; open buffers win. */
export async function loadProjectWriting(main, files, read, base = dirname(main)) {
    const known = new Map(files.map(file => [pathKey(file), file]));
    const context = { base, files, rootFile: main, preamble: '', incomplete: false, dependencies: [] };
    let bytes = 0, count = 0;
    const expand = async (file, stack) => {
        const key = pathKey(file), actual = known.get(key);
        if (stack.has(key) || stack.size >= 16 || ++count > 64 || !actual) {
            context.incomplete = true;
            return '';
        }
        if (!context.dependencies.includes(actual))
            context.dependencies.push(actual);
        let text;
        try {
            text = await read(actual);
        }
        catch {
            context.incomplete = true;
            return '';
        }
        bytes += text.length;
        if (bytes > 2_000_000) {
            context.incomplete = true;
            return '';
        }
        text = text.slice(0, texDocumentStart(text)?.from ?? text.length);
        const next = new Set(stack).add(key), replacements = [];
        for (const command of declarations(text)) {
            if (command.name !== 'input' && command.name !== 'include')
                continue;
            const group = texGroup(text, skipTexSpace(text, command.to));
            if (!group) {
                context.incomplete = true;
                continue;
            }
            const name = text.slice(group.from + 1, group.to - 1).trim();
            if (!name || /[\\#%{}]/.test(name)) {
                context.incomplete = true;
                continue;
            }
            const target = joinPath(base, /\.[^/]+$/.test(name) ? name : `${name}.tex`);
            replacements.push({ from: command.from, to: group.to, text: await expand(target, next) });
        }
        for (const replacement of replacements.reverse())
            text = text.slice(0, replacement.from) + '\n' + replacement.text + '\n' + text.slice(replacement.to);
        return text;
    };
    context.preamble = await expand(main, new Set());
    return context;
}
/** A conservative subset of LaTeX definitions understood by KaTeX. */
export function projectMathMacros(preamble) {
    const macros = Object.create(null);
    for (const command of declarations(preamble)) {
        if (!['newcommand', 'renewcommand', 'providecommand', 'DeclareRobustCommand'].includes(command.name))
            continue;
        let at = skipTexSpace(preamble, command.to);
        if (preamble[at] === '*')
            at = skipTexSpace(preamble, at + 1);
        const nameGroup = texGroup(preamble, at);
        if (!nameGroup)
            continue;
        const name = preamble.slice(at + 1, nameGroup.to - 1).trim();
        if (!/^\\[A-Za-z]+$/.test(name))
            continue;
        at = skipTexSpace(preamble, nameGroup.to);
        if (preamble[at] === '[') {
            const count = texGroup(preamble, at, '[', ']');
            if (!count || !/^[0-9]$/.test(preamble.slice(at + 1, count.to - 1)))
                continue;
            at = skipTexSpace(preamble, count.to);
            if (preamble[at] === '[')
                continue; // optional arguments need TeX's parser
        }
        const body = texGroup(preamble, at);
        if (!body)
            continue;
        const value = preamble.slice(at + 1, body.to - 1);
        if (value.length > 4096 || /\\(?:input|include|def|gdef|edef|let|write|read|csname|catcode|global|newcommand|renewcommand)\b/.test(value))
            continue;
        if (command.name !== 'providecommand' || !Object.hasOwn(macros, name))
            macros[name] = value;
    }
    return macros;
}
/** Text-only, single-argument wrappers, with no layout or expansion side effects. */
export function projectTextFormats(preamble) {
    const colors = Object.create(null), result = Object.create(null);
    for (const command of declarations(preamble)) {
        if (command.name !== 'definecolor')
            continue;
        const groups = [];
        let at = skipTexSpace(preamble, command.to);
        for (let index = 0; index < 3; index++) {
            const group = texGroup(preamble, at);
            if (!group)
                break;
            groups.push(preamble.slice(at + 1, group.to - 1));
            at = skipTexSpace(preamble, group.to);
        }
        if (groups[1] === 'HTML' && /^[\da-f]{6}$/i.test(groups[2]))
            colors[groups[0]] = '#' + groups[2];
    }
    const classes = { textbf: 'cm-bold', textit: 'cm-italic', emph: 'cm-italic', texttt: 'cm-inline-code', textsc: 'cm-smallcaps', underline: 'cm-underline' };
    for (const [name, body] of Object.entries(projectMathMacros(preamble))) {
        const format = /^\\(textbf|textit|emph|texttt|textsc|underline)\{#1\}$/.exec(body.trim());
        const color = /^\{\\color\{([A-Za-z]+)\}#1\}$/.exec(body.trim());
        if (format)
            result[name.slice(1)] = { class: classes[format[1]] };
        else if (color && colors[color[1]])
            result[name.slice(1)] = { color: colors[color[1]] };
    }
    return result;
}
export function projectGraphic(name, context) {
    if (!name || /[\\#%{}]/.test(name))
        return null;
    const directories = [context.base];
    for (const command of declarations(context.preamble)) {
        if (command.name !== 'graphicspath')
            continue;
        const paths = texGroup(context.preamble, skipTexSpace(context.preamble, command.to));
        if (!paths)
            continue;
        let at = skipTexSpace(context.preamble, paths.from + 1);
        while (at < paths.to - 1) {
            const group = texGroup(context.preamble, at);
            if (!group)
                break;
            const directory = context.preamble.slice(at + 1, group.to - 1);
            if (!/[\\#%{}]/.test(directory))
                directories.push(joinPath(context.base, directory));
            at = skipTexSpace(context.preamble, group.to);
        }
    }
    const extensions = /\.[^/]+$/.test(name) ? [''] : ['.pdf', '.png', '.jpg', '.jpeg'];
    for (const directory of directories)
        for (const extension of extensions) {
            const file = joinPath(directory, name + extension);
            const actual = context.files.find(candidate => pathKey(candidate) === pathKey(file));
            if (actual) return actual;
        }
    return null;
}
