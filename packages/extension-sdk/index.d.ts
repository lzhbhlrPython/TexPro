/** API 1. Executable packages are trusted Node extensions; the SDK is not a security sandbox. */
export type Localized = string | { en: string; zh: string };
export type Capability = 'document.read' | 'document.write' | 'project.read' | 'build.request' | 'storage' | 'network' | 'theme.styles';
export type ActionKind = 'command' | 'diagnostic' | 'transform' | 'completion' | 'hover' | 'preview' | 'import' | 'export' | 'bibliography' | 'asset' | 'mcp';
export interface ExtensionAction { id: string; title: Localized; kind: ActionKind; level?: 'L1' | 'L2' | 'L3'; description?: Localized }
export interface ThemeContribution { id: string; title: Localized; base: 'paper' | 'studio' | 'night'; tokens: Record<string, string>; stylesheet?: string }
export interface CompletionContribution { label: string; template: string; detail?: string; type?: string }
export interface TemplateContribution { id: string; title: Localized; source: string; engine: 'pdflatex' | 'xelatex' | 'lualatex' }
export interface SettingContribution { key: string; title: Localized; type: 'string' | 'boolean' | 'number'; default: string | boolean | number }
export interface PanelContribution { id: string; title: Localized; level: 'L2' | 'L3'; actions: string[] }
export interface PackageManifest {
  id: string; name: Localized; version: string; apiVersion: 1; author: string; license: string;
  description?: Localized; entry?: string; capabilities: Capability[];
  contributes: {
    actions?: ExtensionAction[]; themes?: ThemeContribution[]; completions?: CompletionContribution[];
    snippets?: CompletionContribution[]; templates?: TemplateContribution[]; panels?: PanelContribution[]; settings?: SettingContribution[];
  };
}
export interface InstalledExtension { manifest: PackageManifest; enabled: boolean; digest: string; config: Record<string, string | boolean | number>; development: boolean; canRollback: boolean; error: string | null; themeStyles?: Record<string, string> }
export interface ExtensionSnapshot {
  language: 'en' | 'zh'; source: string; file?: string; selection: { from: number; to: number };
  project?: { root: string; name: string; rootFile?: string | null };
}
export interface ExtensionDiagnostic { from: number; to: number; severity: 'error' | 'warning' | 'info'; message: string }
export interface ExtensionResult {
  message?: string;
  edits?: Array<{ from: number; to: number; insert: string }>;
  diagnostics?: ExtensionDiagnostic[];
  completions?: CompletionContribution[];
  /** A text/TeX preview; never interpreted as arbitrary HTML. */
  content?: string;
  /** Export output; saving is an explicit host action. */
  output?: { name: string; content: string };
  /** Import result; project creation is an explicit host action. */
  project?: { name: string; engine: 'pdflatex' | 'xelatex' | 'lualatex'; files: Array<{ path: string; content: string }> };
  action?: 'compile';
}
export interface InvocationContext extends ExtensionSnapshot {
  readonly signal: AbortSignal;
  services: {
    call(name: 'storage.get', args: { key: string }): Promise<unknown>;
    call(name: 'storage.set', args: { key: string; value: unknown }): Promise<boolean>;
    /** Reads saved disk content, not editor buffers. */
    call(name: 'project.readFile', args: { path: string }): Promise<string>;
    call(name: 'project.symbols', args?: Record<string, never>): Promise<unknown>;
  };
}
export interface ExtensionContext {
  readonly apiVersion: 1;
  readonly config: Readonly<Record<string, string | boolean | number>>;
  handle(id: string, handler: (context: InvocationContext, input: Record<string, unknown>) => ExtensionResult | Promise<ExtensionResult>): () => void;
  on(event: 'projectChanged' | 'buildFinished', listener: (payload: unknown) => void | Promise<void>): () => void;
  onDispose(dispose: () => void | Promise<void>): void;
  log(message: string): void;
}
export interface Extension { activate(context: ExtensionContext): void | (() => void | Promise<void>) | Promise<void | (() => void | Promise<void>)> }
export declare const API_VERSION: 1;
export declare function defineExtension(activate: Extension['activate']): Extension;
