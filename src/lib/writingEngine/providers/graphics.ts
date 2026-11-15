import { skipTexSpace, texGroup } from '../../texDocument';
import { projectGraphic } from '../project';
import type { Projection, ProjectionProvider } from '../types';

export interface GraphicProjection { path: string; name: string }
export const graphicsProvider: ProjectionProvider = {
  id: 'tex.graphics', priority: 90,
  project({ source, project }) {
    if (!project) return [];
    const result: Projection<GraphicProjection>[] = [];
    for (const command of source.commands) {
      if (command.name !== 'includegraphics') continue;
      let at = skipTexSpace(source.text, command.to);
      if (source.text[at] === '*') at = skipTexSpace(source.text, at + 1);
      if (source.text[at] === '[') { const options = texGroup(source.text, at, '[', ']'); if (!options) continue; at = skipTexSpace(source.text, options.to); }
      const group = texGroup(source.text, at); if (!group) continue;
      const name = source.text.slice(group.from + 1, group.to - 1).trim();
      const path = projectGraphic(name, project);
      if (path) result.push({ kind: 'graphic', from: command.from, to: group.to, data: { path, name } });
    }
    return result;
  },
};
