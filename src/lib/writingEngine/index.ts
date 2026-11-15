import { createWritingEngine } from './engine';
import { mathProvider } from './providers/math';
import { graphicsProvider } from './providers/graphics';
import { createFormatProvider } from './providers/format';
import { tablesProvider, diagramsProvider } from './providers/structure';
import { flowProvider } from './providers/flow';

export { createWritingEngine } from './engine';
export type * from './types';
export type { MathProjection } from './providers/math';
export type { GraphicProjection } from './providers/graphics';
export type { FormatProjection } from './providers/format';
export type { TableProjection, DiagramProjection } from './providers/structure';
export const createTexWritingEngine = () => createWritingEngine([tablesProvider, diagramsProvider, mathProvider, graphicsProvider, createFormatProvider(), flowProvider]);
