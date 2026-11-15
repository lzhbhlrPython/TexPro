/** Offsets are UTF-16 indices into the original TeX string. */
export interface TexRange { from: number; to: number }
export interface TexCommand extends TexRange { name: string }
export interface TexEnvironment extends TexRange { name: string; bodyFrom: number; bodyTo: number }
export function skipTexSpace(text: string, from: number): number;
export function texGroup(text: string, from: number, open?: string, close?: string): TexRange | null;
export function texCommands(text: string): Generator<TexCommand>;
export function texEnvironments(text: string, names: readonly string[]): TexEnvironment[];
export function texDocumentStart(text: string): TexRange | null;
export function texDocumentClass(text: string): { name: string; command: TexCommand; options: TexRange | null; group: TexRange } | null;
