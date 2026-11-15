import { diagramBlocks, writingTable, type DiagramBlock, type WritingTable } from '../../texDocument';
import type { Projection, ProjectionProvider } from '../types';

export interface TableProjection { table: WritingTable | null }
export type DiagramProjection = DiagramBlock;
export const tablesProvider: ProjectionProvider = {
  id: 'tex.tables', priority: 120,
  project({ source }) {
    return source.environments.filter(block => ['tabular', 'tabularx', 'longtable'].includes(block.name)).map(block => ({ kind: 'table', from: block.from, to: block.to, data: { table: writingTable(source.text, block) } }));
  },
};
export const diagramsProvider: ProjectionProvider = {
  id: 'tex.diagrams', priority: 110,
  project({ source }) {
    return diagramBlocks(source.text).map(block => ({ kind: 'diagram', from: block.from, to: block.to, data: block } satisfies Projection<DiagramProjection>));
  },
};
