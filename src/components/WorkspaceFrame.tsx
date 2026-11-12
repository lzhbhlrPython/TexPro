import { useRef, type ReactNode, type RefObject } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useDialogFocus } from '../hooks/useDialogFocus';
import { useI18n } from '../i18n';
export function WorkspaceFrame({ title, className, children, onClose, sectionRef, testId, dataStrokes }: { title: string; className: string; children: ReactNode; onClose: () => void; sectionRef?: RefObject<HTMLElement | null>; testId?: string; dataStrokes?: number }) {
  const ownRef = useRef<HTMLElement>(null), ref = sectionRef || ownRef, { t } = useI18n();
  const exit = () => { onClose(); requestAnimationFrame(() => { if (!document.querySelector('[role="dialog"]')) document.querySelector<HTMLElement>('.cm-content')?.focus({ preventScroll: true }); }); };
  useDialogFocus(true, ref, exit);
  return <div className="workspace-layer"><section ref={ref} className={`task-workspace ${className}`} data-testid={testId} data-strokes={dataStrokes} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
    <nav className="workspace-navigation" aria-label={t('Workspace navigation')}><button onClick={exit}><ArrowLeft size={14} />{t('Back to writing')}</button><span>{title}</span></nav>
    {children}
  </section></div>;
}
