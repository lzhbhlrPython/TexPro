import type { TexCommand } from './tex-source-core.mjs';
export interface ProjectWritingContext {
  rootFile: string;
  preamble: string;
  files: readonly string[];
  base: string;
  incomplete: boolean;
  dependencies: string[];
  revision?: number;
}
export function declarations(text: string): Generator<TexCommand>;
export function loadProjectWriting(main: string, files: readonly string[], read: (path: string) => Promise<string>, base?: string): Promise<ProjectWritingContext>;
export function projectMathMacros(preamble: string): Record<string, string>;
export function projectTextFormats(preamble: string): Record<string, { class?: string; color?: string }>;
export function projectGraphic(name: string, context: ProjectWritingContext): string | null;
