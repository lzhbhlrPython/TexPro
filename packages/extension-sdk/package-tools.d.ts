import type { PackageManifest, ThemeContribution } from './index';
export declare const API_VERSION: 1;
export declare const LOCALE_CATALOG_VERSION: 2;
export declare const CAPABILITIES: readonly string[];
export declare const PROVIDERS: readonly string[];
export declare const BASES: readonly string[];
export declare const TOKEN_NAMES: readonly string[];
export interface AuthoringFormat { name: string; source: string; toolchain: string }
export declare const languages: Readonly<Record<'ts' | 'js' | 'coffee' | 'purs' | 'rescript' | 'cljs' | 'elm' | 'scala' | 'go', AuthoringFormat>>;
export declare const styles: Readonly<Record<'css' | 'scss' | 'sass' | 'less' | 'stylus' | 'css-in-js' | 'tcss', AuthoringFormat>>;
export declare function authoringCapabilities(): {
  apiVersion: 1; bridgeVersion: 1; languages: typeof languages; styles: typeof styles;
  locales: { catalogVersion: 2; keys: 'semantic message IDs'; longText: 'localized Markdown documents'; contribution: string; format: string; code: false; fallback: 'en'; preinstalled: string };
  distribution: { registry: string; field: string; sourceField: string; sourceDefault: '.'; trustedLocalBuild: true; compilerInstallScripts: string; reviewRequired: true; executesInstallScripts: false };
  artifacts: { plugin: '.tpp'; theme: '.tpt' }; runtime: { plugin: string; theme: string }; security: string[];
  mcp: { inspectOnly: true; executesCompilers: false; invokesPlugins: false; readsUnsavedBuffers: false };
};
export declare function validateManifest(value: unknown): PackageManifest;
export declare function validateTheme(value: unknown): ThemeContribution;
export declare function validateConfig(manifest: PackageManifest, value: unknown): Record<string, string | number | boolean>;
export declare function relative(value: string): string;
export declare function directoryFiles(directory: string, excluded?: (name: string) => boolean): Map<string, Uint8Array>;
export declare function buildSourceFiles(directory: string): Map<string, Uint8Array>;
export declare function sourceFingerprint(directory: string): string;
export interface NpmSource { root: string; metadata: { name: string; version: string; [key: string]: unknown }; source: string; mode: 'archive' | 'source' | 'build'; files?: Map<string, Uint8Array>; manifest?: PackageManifest; sourceDigest?: string }
export declare function npmSource(directory: string): NpmSource;
export declare function preparedPath(value: NpmSource): string;
export declare function readNpmExtension(directory: string): NpmSource & ReturnType<typeof readPackage>;
export declare function inspectFiles(files: Map<string, Uint8Array>): { manifest: PackageManifest; digest: string };
export declare function readPackage(source: string): { manifest: PackageManifest; digest: string; files: Map<string, Uint8Array>; development: boolean };
export declare function packageKind(manifest: PackageManifest): 'plugin' | 'theme';
export declare function validatePackageType(manifest: PackageManifest, file: string, files: Map<string, Uint8Array>): void;
export declare function inspectPackage(source: string): { manifest: PackageManifest; digest: string; kind: 'plugin' | 'theme'; development: boolean; requiresBuild?: boolean; npm?: { name: string; version: string }; fileCount: number; bytes: number; executable: boolean; warnings: string[] };
export declare function pack(files: Map<string, string | Uint8Array>): Uint8Array;
export declare function unpack(bytes: Uint8Array): Map<string, Uint8Array>;
export declare function crc32(bytes: Uint8Array): number;
export declare const LIMIT: number;
export declare function compileTheme(theme: ThemeContribution, files: Map<string, Uint8Array>): string;
export declare function themeStyles(manifest: PackageManifest, files: Map<string, Uint8Array>): Record<string, string>;
export declare function atomicJson(file: string, value: unknown): void;

export declare const sourceMessages: Readonly<Record<string, string>>;
export declare function localeId(id: string): string;
export declare function validateMessages(value: unknown, source?: Record<string, string>): Record<string, string>;
export declare function localeContributions(manifest: PackageManifest, files: Map<string, Uint8Array>): import('./index').LanguagePack[];
export declare function messageCoverage(messages: Record<string, string>): { total: number; translated: number; missing: string[]; unknown: string[] };
