import { useCallback, useEffect, useState } from 'react';
import type { SchematicMode } from '../lib/schematic';
export function useWorkspaces(projectKey: string | null) {
  const [active, setActive] = useState<'schematic' | 'ink' | 'template' | null>(null);
  const [mode, setMode] = useState<SchematicMode>('circuit');
  useEffect(() => { setActive(null); }, [projectKey]);
  const setInkOpen = useCallback((open: boolean) => setActive(current => open ? 'ink' : current === 'ink' ? null : current), []);
  const setWorkshopOpen = useCallback((open: boolean) => setActive(current => open ? 'template' : current === 'template' ? null : current), []);
  const setSchematicMode = useCallback((next: SchematicMode | null) => { if (next) setMode(next); setActive(current => next ? 'schematic' : current === 'schematic' ? null : current); }, []);
  return { inkOpen: active === 'ink', workshopOpen: active === 'template', schematicMode: active === 'schematic' ? mode : null, setInkOpen, setWorkshopOpen, setSchematicMode };
}
