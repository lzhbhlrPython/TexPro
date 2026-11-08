import { ChangeSet, Text } from '@codemirror/state';
import { ensurePlaceholderSupport, placeholderSource, writingPositionAllowed, type PlaceholderKind } from '../../electron/services/writing-aids-core.mjs';
import { textChange } from './labelRename';

export function planPlaceholder(sources: Record<string, string>, main: string, file: string, selection: { from: number; to: number }, kind: PlaceholderKind, description: string) {
  const source = sources[file], mainSource = sources[main];
  if (source === undefined || mainSource === undefined) throw new Error('Choose main file');
  if (!writingPositionAllowed(source, selection.from) || !writingPositionAllowed(source, selection.to)) throw new Error('Insert placeholders in document prose.');
  const supported = ensurePlaceholderSupport(mainSource), insert = placeholderSource(kind, description);
  const changes: Record<string, ChangeSet> = {};
  const support = textChange(mainSource, supported);
  const body = { ...selection, insert };
  if (main === file) changes[file] = ChangeSet.of(supported === mainSource ? body : [support, body], source.length);
  else {
    changes[file] = ChangeSet.of(body, source.length);
    if (supported !== mainSource) changes[main] = ChangeSet.of(support, mainSource.length);
  }
  const before = Object.fromEntries(Object.keys(changes).map(path => [path, sources[path]]));
  const after = Object.fromEntries(Object.entries(changes).map(([path, change]) => [path, change.apply(Text.of(sources[path].split('\n'))).toString()]));
  const from = selection.from + (main === file ? supported.length - mainSource.length : 0) + `\\texproplaceholder[${kind}]{`.length;
  return { before, after, changes, from, to: from + insert.length - `\\texproplaceholder[${kind}]{`.length - 1 };
}
