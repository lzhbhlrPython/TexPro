import { Annotation, EditorState } from '@codemirror/state';
import type { EditorHandle } from './EditorPane';

/** Buffer refreshes are separate from user input and must not create undo entries. */
export const externalWritingUpdate = Annotation.define<boolean>();
export function guardWritingChanges(canEdit: (source: string) => boolean) {
  return EditorState.transactionFilter.of(transaction => transaction.docChanged && !transaction.annotation(externalWritingUpdate) && !canEdit(transaction.startState.doc.toString()) ? [] : transaction);
}

export interface IncludedEditorHost {
  mount(container: HTMLElement, file: string, source: string, ancestry: string[]): (() => void) | null;
}

/** Route commands to the writing file, while the visible tab stays on its parent. */
export function composedEditorHandle(root: () => EditorHandle | null, focused: () => EditorHandle | null, file: (path: string) => EditorHandle | null): EditorHandle {
  return new Proxy({} as EditorHandle, {
    get(_target, key: keyof EditorHandle) {
      return (...args: unknown[]) => {
        let owner: string | undefined;
        if (['applyWriting', 'restoreWriting', 'restorePosition', 'toggleNote'].includes(key)) owner = (args[0] as { file?: string } | undefined)?.file;
        if (key === 'getSession') owner = args[0] as string | undefined;
        if (key === 'applyProjectChanges') owner = args[1] as string | undefined;
        const handle = owner ? file(owner) : focused() || root();
        if (!handle) return key === 'applyWriting' || key === 'toggleNote' ? false : null;
        return Reflect.apply(handle[key], handle, args);
      };
    },
  });
}
