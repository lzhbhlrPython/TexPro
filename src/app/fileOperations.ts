import { ChangeSet, Text } from '@codemirror/state';
import { textChange } from '../lib/labelRename';
import type { OpenDoc, ProjectFileOperation } from '../types';

export function movedPath(file: string, operation: Pick<ProjectFileOperation, 'oldPath' | 'path'>): string {
  const suffix = file.slice(operation.oldPath.length);
  return file === operation.oldPath || file.startsWith(operation.oldPath) && /^[\\/]/.test(suffix) ? operation.path + suffix : file;
}

/** Rebase file-system edits over typing received while the IPC was in flight. */
export function reconcileFiles(docs: Record<string, OpenDoc>, operation: ProjectFileOperation) {
  const next: Record<string, OpenDoc> = {}, edits: Record<string, ChangeSet> = {};
  let conflicts = 0;
  for (const doc of Object.values(docs)) {
    const file = movedPath(doc.path, operation), update = operation.updates.find(item => item.oldPath === doc.path);
    let content = doc.content, savedContent = doc.savedContent;
    if (update) {
      const typing = textChange(update.before, content);
      const concurrent = ChangeSet.of(typing, update.before.length);
      const safe = update.changes.filter(change => {
        const overlap = typing.from !== typing.to && change.from < typing.to && change.to > typing.from || typing.from === typing.to && typing.insert.length > 0 && typing.from > change.from && typing.from < change.to;
        if (overlap) conflicts++;
        return !overlap;
      });
      const change = ChangeSet.of(safe, update.before.length).map(concurrent);
      content = change.apply(Text.of(content.split('\n'))).toString();
      savedContent = update.after;
      edits[doc.path] = change;
    }
    next[file] = { ...doc, path: file, content, savedContent, dirty: content !== savedContent };
  }
  return { docs: next, edits, conflicts };
}
