import type { TexCommand, TexEnvironment, TexRange } from '../texDocument';
import type { ProjectWritingContext } from './project';

/** Source offsets always address the original, unmodified CodeMirror document. */
export interface WritingSource {
  readonly text: string;
  readonly bodyFrom: number;
  readonly commands: readonly TexCommand[];
  readonly environments: readonly TexEnvironment[];
  readonly protectedRanges: readonly TexRange[];
}

export interface WritingFrame {
  readonly filePath?: string;
  readonly source: WritingSource;
  readonly project?: ProjectWritingContext;
  readonly preamble: string;
}

export interface Projection<Data = unknown> extends TexRange {
  readonly kind: string;
  readonly data: Data;
}

/** Internal extension contract. Providers neither edit source nor access the DOM. */
export interface ProjectionProvider {
  readonly id: string;
  readonly priority: number;
  project(frame: WritingFrame): readonly Projection[];
}

export interface WritingPlan {
  readonly projections: readonly (Projection & { readonly provider: string })[];
  readonly failures: readonly { provider: string; reason: string }[];
}
