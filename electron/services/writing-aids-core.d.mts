export type PlaceholderKind = 'text' | 'figure' | 'table' | 'citation' | 'data';
export interface WritingPlaceholder { file: string; from: number; to: number; line: number; kind: PlaceholderKind; text: string; contentFrom: number; contentTo: number; source: string }
export interface RevisionMemo { file: string; from: number; to: number; line: number; text: string; done: boolean; marker: string; source: string }
export const placeholderKinds: PlaceholderKind[];
export const placeholderPreamble: string;
export function parseWritingAids(text: string, file?: string): { placeholders: WritingPlaceholder[]; memos: RevisionMemo[] };
export function writingPositionAllowed(text: string, offset: number): boolean;
export function ensurePlaceholderSupport(text: string): string;
export function placeholderSource(kind: PlaceholderKind, text: string): string;
export function escapePlaceholderText(text: string): string;
export function toggleMemoLine(line: string, expected: { text: string; done: boolean }): string | null;
export const ctexBodySettings: string;
export const ctexWritingSettings: string;
export function applyCtexTypography(source: string): string;
