import { formatShortcut } from '../i18n';
import { useState } from 'react';
import {
  AlertCircle,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Play,
  Square,
  Search,
} from 'lucide-react';
import type { CompileResult, OpenDoc, Project, Settings } from '../types';
import { Logo } from './Logo';
import { formatDuration } from '../lib/latex';
import { useI18n } from '../i18n';
import { MoreMenu, type MoreAction } from './MoreMenu';

interface Props {
  project: Project | null;
  doc: OpenDoc | null;
  settings: Settings;
  compiling: boolean;
  compileResult: CompileResult | null;
  hasPdf: boolean;
  sidebarOpen: boolean;
  pdfOpen: boolean;
  moreActions: MoreAction[];
  onCompile: () => void;
  onCancel: () => void;
  onToggleSidebar: () => void;
  onTogglePdf: () => void;
  onOpenFolder: () => void;
  onCloseProject: () => void;
  onOpenMain: () => void;
  onShowProblems: () => void;
  onOpenPalette: () => void;
}

export function TitleBar({
  project,
  doc,
  settings,
  compiling,
  compileResult,
  hasPdf,
  sidebarOpen,
  pdfOpen,
  moreActions,
  onCompile,
  onCancel,
  onToggleSidebar,
  onTogglePdf,
  onOpenFolder,
  onCloseProject,
  onOpenMain,
  onShowProblems,
  onOpenPalette,
}: Props) {
  const { msg } = useI18n();
  const [moreOpen, setMoreOpen] = useState(false);
  const fileName = doc?.path.split('/').pop() || msg("app.no.document");

  return (
    <header className="titlebar minimal-titlebar">
      <div className="titlebar-left">
        <button className="brand" onClick={project ? onCloseProject : onOpenFolder} title={msg(project ? "app.close.project.and.return.to.welcome" : "app.open.project.o")} aria-label={msg(project ? "app.close.project.and.return.to.welcome" : "app.open.project.o")}>
          <Logo size={22} />
        </button>
        {project && <button
          className={`icon-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title={msg("app.toggle.sidebar.variant2")}
          aria-label={msg("app.toggle.sidebar.variant2")}
        >
          <PanelLeft size={15} />
        </button>}
        <div className="titlebar-document">
          <div className="titlebar-file-row">
            <FileText size={12} className="titlebar-file-icon" />
            <span className="titlebar-file-name">{project ? fileName : msg("app.your.writing.desk")}</span>
            {doc?.dirty && <span className="dirty-dot" title={msg("app.unsaved.changes")} />}
          </div>
          {project && (
            <button className="titlebar-project" onClick={onOpenFolder} title={msg("app.switch.project")}>
              {project.name}
              <ChevronDown size={10} />
            </button>
          )}
        </div>
      </div>

      <div className="titlebar-right">
        {project && <button className={`titlebar-main-file ${project.rootFile ? '' : 'needs-selection'}`} onClick={onOpenMain} title={project.rootFile || msg("app.choose.main.file")}>
          <span>{msg("app.main.file")}</span><strong>{project.rootFile?.slice(project.root.length + 1) || msg("app.choose.main.file")}</strong>
        </button>}
        <button className="workbench-tools-btn" onClick={onOpenPalette} title={msg("app.search.tools.k")} aria-keyshortcuts="Meta+k Control+k">
          <Search size={14} /><span>{msg("app.tools")}</span><kbd>{formatShortcut('⌘K')}</kbd>
        </button>
        {project && (compiling ? (
          <div className="compile-status">
            <Loader2 size={11} className="spin" />
            <span>{msg("app.typesetting")}</span>
          </div>
        ) : compileResult && !compileResult.ok ? (
          <button className="compile-status compile-status-error" onClick={onShowProblems} title={compileResult.error || undefined}>
            <AlertCircle size={11} />
            <span>{msg("app.compile.failed")}{compileResult.errorCount ? ` · ${compileResult.errorCount}` : ''}</span>
          </button>
        ) : (
          <button className="compile-status" onClick={onShowProblems} title={msg("app.show.build.diagnostics")} aria-label={msg("app.show.build.diagnostics")}>
            {compileResult ? (
              <>
                <Check size={11} className="success-text" />
                <span>{formatDuration(compileResult.duration)}{compileResult.warningCount ? ` · ${compileResult.warningCount} ${msg("app.warnings.variant2")}` : ''}</span>
              </>
            ) : hasPdf ? (
              <span className="muted">{msg("app.pdf.preview")}</span>
            ) : null}
          </button>
        ))}

        {project && <button
          data-testid="toggle-pdf"
          className={`icon-btn ${pdfOpen ? 'active' : ''}`}
          onClick={onTogglePdf}
          title={msg("app.toggle.pdf.preview")}
          aria-label={msg("app.toggle.pdf.preview")}
        >
          <PanelRight size={15} />
        </button>}

        {project && <button
          className={`compile-btn subtle-compile ${compiling ? 'cancel-build' : ''}`}
          onClick={compiling ? onCancel : onCompile}
          disabled={!project}
          title={compiling ? msg("app.cancel.compilation") : `${msg("app.compile.main.file.saves.all.changes")} · ${project?.rootFile?.split('/').pop() || msg("app.choose.main.file")} (${formatShortcut('⌘↩')})`}
        >
          {compiling ? <Square size={11} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
          <span>{compiling ? msg("app.cancel") : msg("app.compile")}</span>
        </button>}

        <button
          className={`icon-btn ${moreOpen ? 'active' : ''}`}
          data-testid="more-menu"
          onClick={(event) => { event.currentTarget.focus(); setMoreOpen((value) => !value); }}
          title={msg("app.more")}
          aria-label={msg("app.more")}
          aria-expanded={moreOpen}
          aria-haspopup="dialog"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <MoreMenu open={moreOpen} actions={moreActions} onClose={() => setMoreOpen(false)} />
    </header>
  );
}
