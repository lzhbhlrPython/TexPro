export interface GeometryAdapter {
  readonly id: string;
  readonly environments: readonly string[];
  readonly commands: readonly string[];
  readonly packages: readonly string[];
  readonly kind: 'tikz' | 'circuit' | 'chemistry';
  readonly wrapper?: string;
  readonly argument?: 'bracket';
  readonly terminator?: string;
  readonly driver?: 'postscript';
}
export const geometryAdapters: readonly GeometryAdapter[];
export function geometryPackages(preamble: string): Set<string>;
export function geometryAdapter(source: string, preamble?: string): GeometryAdapter | undefined;
export function geometryPreviewSource(source: string, preamble?: string): string;
