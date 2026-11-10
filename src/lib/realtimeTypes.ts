export interface RealtimePage { page: number; width: number; height: number; svg: string | null }
export interface RealtimeDocument { path: string; text: string }
export interface RealtimeVersions { source_revision: number; context_revision: number; engine_generation: number; layout_version: number }
export interface RealtimeEvent {
  sessionId: string;
  kind: 'layout' | 'paragraph' | 'state' | 'error' | 'diagnostics';
  pages?: RealtimePage[];
  pdf?: Uint8Array;
  total?: number;
  state?: string;
  error?: string;
  versions?: RealtimeVersions;
  partial?: boolean;
  diagnostics?: Array<{ severity: string; message: string; file?: string; line?: number }>;
}
