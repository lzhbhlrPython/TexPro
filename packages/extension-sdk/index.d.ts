/** API 1. Executable packages are trusted Node extensions; the SDK is not a security sandbox. */
export type Localized = string | { en: string; [language: string]: string };
export type Capability = 'document.read' | 'document.write' | 'project.read' | 'build.request' | 'storage' | 'network' | 'theme.styles';
export type ActionKind = 'command' | 'diagnostic' | 'transform' | 'completion' | 'hover' | 'preview' | 'import' | 'export' | 'bibliography' | 'asset' | 'mcp';
export interface ExtensionAction { id: string; title: Localized; kind: ActionKind; level?: 'L1' | 'L2' | 'L3'; description?: Localized }
export interface ThemeContribution { id: string; title: Localized; base: 'paper' | 'studio' | 'night'; tokens: Record<string, string>; stylesheet?: string }
export interface CompletionContribution { label: string; template: string; detail?: string; type?: string }
export interface TemplateContribution { id: string; title: Localized; source: string; engine: 'pdflatex' | 'xelatex' | 'lualatex' }
export interface SettingContribution { key: string; title: Localized; type: 'string' | 'boolean' | 'number'; default: string | boolean | number }
export interface PanelContribution { id: string; title: Localized; level: 'L2' | 'L3'; actions: string[] }
export interface LocaleContribution { catalogVersion: 2; id: string; title: string; messages: string }
export interface LanguagePack { catalogVersion: 2; id: string; title: string; messages: Record<string, string> }
export interface PackageManifest {
  id: string; name: Localized; version: string; apiVersion: 1; author: string; license: string;
  description?: Localized; entry?: string; capabilities: Capability[];
  contributes: {
    locales?: LocaleContribution[]; actions?: ExtensionAction[]; themes?: ThemeContribution[]; completions?: CompletionContribution[];
    snippets?: CompletionContribution[]; templates?: TemplateContribution[]; panels?: PanelContribution[]; settings?: SettingContribution[];
  };
}
export interface InstalledExtension { manifest: PackageManifest; enabled: boolean; digest: string; config: Record<string, string | boolean | number>; development: boolean; canRollback: boolean; error: string | null; origin?: { environment: string; root: string; name: string; version: string; lockDigest: string }; builtin?: boolean; locales?: LanguagePack[]; themeStyles?: Record<string, string> }
export interface ExtensionSnapshot {
  language: string; source: string; file?: string; selection: { from: number; to: number };
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

/** JSON bridge v1; string messages retain UTF-16 source offsets. Not a sandbox. */
export interface JsonTransport { send(message: string): void; dispose?(): void | Promise<void> }
export type BridgeHostMessage =
  | { type: 'init'; apiVersion: 1; config: ExtensionContext['config'] }
  | { type: 'invoke'; id: number; action: string; context: ExtensionSnapshot; input: Record<string, unknown> }
  | { type: 'cancel'; id: number }
  | { type: 'event'; event: 'projectChanged' | 'buildFinished'; payload: unknown }
  | { type: 'service-result'; id: number; callId: string; result?: unknown; error?: string }
  | { type: 'dispose' };
export type BridgePluginMessage =
  | { type: 'result'; id: number; result?: ExtensionResult; error?: string }
  | { type: 'service'; id: number; callId: string; name: 'storage.get' | 'storage.set' | 'project.readFile' | 'project.symbols'; args?: unknown }
  | { type: 'log'; message: string };
export declare function defineJsonExtension(options: {
  actions: string[];
  start(receive: (message: string) => void): JsonTransport | Promise<JsonTransport>;
}): Extension;
/** Starter adapter for a compiled language's text transform; use the JSON bridge for full messages/services. */
export declare function defineTextTransform(transform: (text: string) => string | Promise<string>, action?: string): Extension;
