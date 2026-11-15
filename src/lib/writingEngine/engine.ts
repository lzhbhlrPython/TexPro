import type { ProjectionProvider, WritingFrame, WritingPlan, WritingSource } from './types';
import { scanWritingSource } from './source';

/** Immutable provider order, isolated failures and a bounded per-editor scan cache. */
export function createWritingEngine(providers: readonly ProjectionProvider[]) {
  const ids = new Set<string>();
  for (const provider of providers) {
    if (!/^[a-z][a-z0-9.-]*$/.test(provider.id) || ids.has(provider.id) || !Number.isFinite(provider.priority)) throw new Error('Invalid writing provider registration');
    ids.add(provider.id);
  }
  const ordered = [...providers].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  let source: WritingSource | undefined;
  let previous: { text: string; preamble: string; filePath?: string; project: WritingFrame['project']; plan: WritingPlan } | undefined;
  return {
    compile(input: Omit<WritingFrame, 'source'> & { text: string }): WritingPlan {
      if (previous?.text === input.text && previous.preamble === input.preamble && previous.project === input.project && previous.filePath === input.filePath) return previous.plan;
      if (!source || source.text !== input.text) source = scanWritingSource(input.text);
      const frame: WritingFrame = { source, preamble: input.preamble, project: input.project, filePath: input.filePath };
      const projections: Array<WritingPlan['projections'][number]> = [], failures: Array<WritingPlan['failures'][number]> = [];
      for (const provider of ordered) {
        try {
          const output = provider.project(frame);
          if (output.length > 20_000) throw new Error('Projection budget exceeded');
          for (const projection of output) {
            const { from, to } = projection;
            if (!Number.isInteger(from) || !Number.isInteger(to) || from < source.bodyFrom || to <= from || to > source.text.length || !projection.kind) throw new Error('Invalid source range');
          }
          // Containers may contain comments. Only a token starting inside a
          // protected region is ineligible; its provider owns balanced parsing.
          projections.push(...output.filter(projection => !source!.protectedRanges.some(range => projection.from >= range.from && projection.from < range.to)).map(projection => ({ ...projection, provider: provider.id })));
        } catch (error) {
          failures.push({ provider: provider.id, reason: error instanceof Error ? error.message : String(error) });
        }
      }
      const plan: WritingPlan = { projections, failures };
      previous = { text: input.text, preamble: input.preamble, filePath: input.filePath, project: input.project, plan };
      return plan;
    },
  };
}
