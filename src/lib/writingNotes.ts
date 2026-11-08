import { parseWritingAids, toggleMemoLine } from '../../electron/services/writing-aids-core.mjs';

export interface WritingNote { file: string; line: number; text: string; done: boolean }

export function writingNotes(text: string, file: string): WritingNote[] {
  return parseWritingAids(text, file).memos;
}

export function toggleWritingNote(line: string, expected: WritingNote): string | null {
  return toggleMemoLine(line, expected);
}
