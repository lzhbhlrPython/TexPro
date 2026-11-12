import type { LucideIcon } from 'lucide-react';
export interface AppCommand {
  id: string; label: string; detail?: string; shortcut?: string; group?: string; keywords?: string;
  icon: LucideIcon; run: () => void;
}
export function commandRegistry(...sources: AppCommand[][]): AppCommand[] {
  const ids = new Set<string>();
  return sources.flat().map(command => {
    if (!command.id || ids.has(command.id) || typeof command.run !== 'function') throw new Error(`Invalid or duplicate command: ${command.id}`);
    ids.add(command.id); return command;
  });
}
