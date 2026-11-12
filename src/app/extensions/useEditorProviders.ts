import { useEffect, useRef } from 'react';
import type { Completion } from '@codemirror/autocomplete';
import type { InstalledExtension, ExtensionSnapshot, ExtensionAction } from '../../../packages/extension-sdk';
import type { WritingEditorPort } from '../writingPort';
import type { Project } from '../../types';
import { registerEditorProviders } from '../../editor/extensionProviders';
import { validateResult } from './contracts';
export function useEditorProviders(items: InstalledExtension[], current: () => { editor: WritingEditorPort | null; project: Project | null; generation: number }, language: string) {
  const latest = useRef({ items, current, language }); latest.current = { items, current, language };
  useEffect(() => {
    async function query(kind: 'completion' | 'hover', source: string, position: number) {
      const env = latest.current.current(), identity = env.editor?.getDocumentIdentity();
      if (!env.editor || env.editor.getContent() !== source) return [];
      const snapshot: ExtensionSnapshot = { language: latest.current.language, source, file: env.editor.getPath(), selection: { from: position, to: position }, ...(env.project ? { project: { root: env.project.root, name: env.project.name, rootFile: env.project.rootFile } } : {}) };
      const providers = latest.current.items.filter(item => item.enabled && !item.error).flatMap(item => (item.manifest.contributes.actions || []).filter(action => action.kind === kind).map(action => ({ item, action }))).slice(0, 8);
      const values = await Promise.all(providers.map(async ({ item, action }) => {
        try {
          const result = validateResult(await window.texpro.extensionsInvoke(item.manifest.id, action.id, snapshot, { position }), source);
          const now = latest.current.current();
          if (now.generation !== env.generation || now.editor?.getDocumentIdentity() !== identity || !latest.current.items.some(value => value.enabled && value.manifest.id === item.manifest.id && value.digest === item.digest)) return null;
          return { result, owner: item.manifest.id, digest: item.digest, generation: env.generation };
        } catch { return null; } // Optional provider failure never interrupts native completion.
      }));
      return values.filter(value => value !== null);
    }
    return registerEditorProviders({
      async completions(context) {
        const match = context.matchBefore(/\\[a-zA-Z@]*$/); if (!match || !context.explicit && match.text.length < 2) return null;
        const values = await query('completion', context.state.doc.toString(), context.pos);
        if (context.aborted) return null;
        const options: Completion[] = values.flatMap(value => (value.result.completions || []).map(item => ({ label: item.label, detail: item.detail, type: 'text', apply(view, _completion, from, to) {
          if (view.composing || latest.current.current().generation !== value.generation || !latest.current.items.some(owner => owner.enabled && !owner.error && owner.manifest.id === value.owner && owner.digest === value.digest)) return;
          const at = item.template.indexOf('|'), text = item.template.replaceAll('|', '');
          view.dispatch({ changes: { from, to, insert: text }, selection: { anchor: from + (at < 0 ? text.length : at) }, userEvent: 'input.complete' });
        } })));
        return options.length ? { from: match.from, options, validFor: /^\\?[a-zA-Z@]*$/ } : null;
      },
      async hover(source, position) { const values = await query('hover', source, position); return values.map(value => value.result.content || value.result.message || '').filter(Boolean).join('\n\n') || null; },
    });
  }, []);
}
