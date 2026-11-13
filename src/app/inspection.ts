import type { TexProApi } from '../api';
type InspectionApi = Pick<TexProApi, 'diagnoseProject' | 'projectGraph' | 'projectSymbols' | 'searchProject'>;
export type ProjectDiagnosis = Awaited<ReturnType<TexProApi['diagnoseProject']>>;
export interface InspectionIssue { severity: 'error' | 'warning' | 'info'; title: string; detail: string; file: string; line: number }
const pending = new Map<string, Promise<ProjectDiagnosis>>();
/** Share concurrent disk inspections; never retain completed reports as a stale cache. */
export function projectDiagnosis(api: InspectionApi, root: string) {
  const existing = pending.get(root); if (existing) return existing;
  const request = api.diagnoseProject(root); pending.set(root, request);
  void request.finally(() => { if (pending.get(root) === request) pending.delete(root); }).catch(() => {});
  return request;
}
export async function reviewProject(api: InspectionApi, root: string): Promise<InspectionIssue[]> {
  const [diagnosis, graph, symbols, todos] = await Promise.all([projectDiagnosis(api, root), api.projectGraph(root), api.projectSymbols(root), api.searchProject(root, 'TODO', false)]);
  const issues: InspectionIssue[] = diagnosis.issues.map(issue => ({ severity: issue.severity, title: issue.kind || 'Project issue', detail: issue.message, file: issue.file, line: issue.line }));
  for (const node of graph.nodes.filter(node => node.orphan)) issues.push({ severity: 'warning', title: node.type === 'label' ? 'Orphan label' : 'Orphan citation', detail: node.label, file: node.file, line: node.line });
  for (const todo of todos) issues.push({ severity: 'info', title: 'TODO', detail: todo.text.trim(), file: todo.file, line: todo.line });
  if (!symbols.labels.length) issues.push({ severity: 'warning', title: "app.no.labels", detail: "app.no.labels.were.found.cross.references.may.be.fragile", file: '', line: 0 });
  return issues;
}
