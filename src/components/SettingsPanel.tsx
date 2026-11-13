import { availableLanguages, formatShortcut } from '../i18n';
import { BarChart3, LayoutTemplate, PenTool, X } from 'lucide-react';
import type { Settings, ThemeName } from '../types';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
  onOpenTemplates: () => void;
  onOpenChart: () => void;
  onOpenTikz: () => void;
}

const themes: Array<{ id: ThemeName; label: string; color: string }> = [
  { id: 'studio', label: "app.studio", color: '#1b1b1e' },
  { id: 'night', label: "app.night", color: '#111214' },
  { id: 'paper', label: "app.paper", color: '#f4efe5' },
];

export function SettingsPanel({
  open,
  settings,
  onChange,
  onClose,
  onOpenTemplates,
  onOpenChart,
  onOpenTikz,
}: Props) {
  const { msg, language } = useI18n();
  const languages = availableLanguages();
  const target = languages.find(item => item.id !== language);
  if (!open) return null;

  const Toggle = ({
    checked,
    onChange: setChecked,
    label,
    detail,
  }: {
    checked: boolean;
    onChange: (value: boolean) => void;
    label: string;
    detail: string;
  }) => (
    <div className="setting-row">
      <span className="setting-copy">
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle ${checked ? 'on' : ''}`}
        onClick={() => setChecked(!checked)}
      >
        <span />
      </button>
    </div>
  );

  return (
    <div className="settings-scrim" onMouseDown={onClose}>
      <aside className="settings-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="settings-header">
          <div>
            <span className="settings-eyebrow">{msg("app.preferences")}</span>
            <h2>{msg("app.make.it.yours")}</h2>
          </div>
          <button className="icon-btn" onClick={onClose} title={msg("app.close")}>
            <X size={16} />
          </button>
        </header>

        <div className="settings-body">
          <div className="settings-section">
            <div className="settings-section-title">{msg("app.language")}</div>
            <div className="select-row">
              <span>{msg("app.interface.language")}</span>
              {languages.length <= 2 ? <button className="secondary-btn" data-testid="language-switch" disabled={!target} onClick={() => target && onChange({ language: target.id })}>{target?.title || 'English'}</button> : <select aria-label={msg("app.interface.language")} value={language} onChange={event => onChange({ language: event.target.value })}>{languages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>}
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{msg("app.appearance")}</div>
            <div className="theme-grid">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-card ${settings.theme === theme.id ? 'active' : ''}`}
                  onClick={() => onChange({ theme: theme.id })}
                >
                  <span className="theme-swatch" style={{ background: theme.color }} />
                  <span>{msg.text(theme.label)}</span>
                </button>
              ))}
            </div>
            <div className="setting-row compact-row">
              <span className="setting-copy">
                <strong>{msg("app.toggle.light.dark")}</strong>
                <small>{msg("app.toggle.light.dark.theme")} · {formatShortcut('⌘⇧L')}</small>
              </span>
              <button
                className="secondary-btn"
                onClick={() => onChange({ theme: settings.theme === 'paper' ? 'night' : 'paper' })}
              >
                {settings.theme === 'paper' ? msg("app.night") : msg("app.day")}
              </button>
            </div>
            <label className="range-row">
              <span>{msg("app.editor.font.size")} <em>{settings.fontSize}px</em></span>
              <input
                type="range"
                min={13}
                max={22}
                step={1}
                value={settings.fontSize}
                onChange={(event) => onChange({ fontSize: Number(event.target.value) })}
              />
            </label>
            <label className="range-row">
              <span>{msg("app.reading.width")} <em>{settings.editorWidth}px</em></span>
              <input
                type="range"
                min={620}
                max={980}
                step={20}
                value={settings.editorWidth}
                onChange={(event) => onChange({ editorWidth: Number(event.target.value) })}
              />
            </label>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{msg("app.writing")}</div>
            <Toggle
              label={msg("app.visual.editing")}
              detail={msg("app.render.math.headings.tables.and.images.inline")}
              checked={settings.visual}
              onChange={(value) => onChange({ visual: value })}
            />
            <Toggle
              label={msg("app.collapse.preamble")}
              detail={msg("app.fold.documentclass.and.package.setup.into.one.card")}
              checked={settings.collapsePreamble}
              onChange={(value) => onChange({ collapsePreamble: value })}
            />
            <Toggle
              label={msg("app.focus.mode")}
              detail={msg("app.dim.every.paragraph.except.the.one.you.are.writing")}
              checked={settings.focus}
              onChange={(value) => onChange({ focus: value })}
            />
            <Toggle
              label={msg("app.typewriter.scrolling")}
              detail={msg("app.keep.the.caret.at.a.fixed.vertical.position")}
              checked={settings.typewriter}
              onChange={(value) => onChange({ typewriter: value })}
            />
            <Toggle
              label={msg("app.smart.paste")}
              detail={msg("app.convert.web.content.markdown.and.spreadsheet.tables.to.tex")}
              checked={settings.smartPaste}
              onChange={(value) => onChange({ smartPaste: value })}
            />
            <Toggle
              label={msg("app.markdown.input.shortcuts")}
              detail={msg("app.convert.headings.lists.and.inline.formatting.while.typing.undo")}
              checked={settings.smartInput}
              onChange={(value) => onChange({ smartInput: value })}
            />
            <Toggle
              label={msg("app.spell.check")}
              detail={msg("app.underline.likely.misspellings.in.prose.ignoring.commands.and.math")}
              checked={settings.spellcheck}
              onChange={(value) => onChange({ spellcheck: value })}
            />
            <Toggle
              label={msg("app.show.line.numbers")}
              detail={msg("app.display.a.gutter.with.source.line.numbers")}
              checked={settings.showLineNumbers}
              onChange={(value) => onChange({ showLineNumbers: value })}
            />
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{msg("app.build")}</div>
            <label className="select-row">
              <span>{msg("app.default.engine")}</span>
              <select
                value={settings.engine}
                onChange={(event) => onChange({ engine: event.target.value as Settings['engine'] })}
              >
                <option value="pdflatex">pdfLaTeX</option>
                <option value="xelatex">XeLaTeX</option>
                <option value="lualatex">LuaLaTeX</option>
              </select>
            </label>
            <label className="select-row">
              <span>{msg("app.compile.strategy")}</span>
              <select
                value={settings.compileMode}
                onChange={(event) => onChange({ compileMode: event.target.value as Settings['compileMode'] })}
              >
                <option value="idle">{msg("app.after.idle")}</option>
                <option value="pdfOpen">{msg("app.only.when.pdf.is.open")}</option>
                <option value="manual">{msg("app.manual.only")}</option>
              </select>
            </label>
            <Toggle
              label={msg("app.auto.save")}
              detail={msg("app.write.changes.to.disk.shortly.after.editing")}
              checked={settings.autoSave}
              onChange={(value) => onChange({ autoSave: value })}
            />
            <Toggle
              label={msg("app.pdf.follows.cursor")}
              detail={msg("app.forward.search.after.the.cursor.settles")}
              checked={settings.followCursor}
              onChange={(value) => onChange({ followCursor: value })}
            />
            <div className="settings-subhead">{msg("app.optional.ai")}</div>
            <Toggle
              label={msg("app.enable.ai.assistant")}
              detail={msg("app.off.by.default.requests.are.sent.only.when.you")}
              checked={settings.aiEnabled}
              onChange={(value) => onChange({ aiEnabled: value })}
            />
            <label className="settings-text-row">
              <span>{msg("app.api.key")}</span>
              <input type="password" value={settings.aiApiKey} onChange={(event) => onChange({ aiApiKey: event.target.value })} placeholder="sk-…" />
            </label>
            <p className="settings-hint">{msg("app.the.api.key.is.encrypted.with.the.os.keychain")}</p>
            <label className="settings-text-row">
              <span>{msg("app.model")}</span>
              <input value={settings.aiModel} onChange={(event) => onChange({ aiModel: event.target.value })} placeholder="gpt-4o-mini" />
            </label>
            <label className="settings-text-row">
              <span>{msg("app.base.url")}</span>
              <input value={settings.aiBaseUrl} onChange={(event) => onChange({ aiBaseUrl: event.target.value })} placeholder="https://api.openai.com/v1" />
            </label>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{msg("app.tools")}</div>
            <div className="settings-tool-grid">
              <button onClick={onOpenTemplates}>
                <LayoutTemplate size={15} />
                <span>{msg("app.templates")}</span>
              </button>
              <button onClick={onOpenChart}>
                <BarChart3 size={15} />
                <span>{msg("app.chart.studio")}</span>
              </button>
              <button onClick={onOpenTikz}>
                <PenTool size={15} />
                <span>TikZ Studio</span>
              </button>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-section-title">{msg("app.shortcuts")}</div>
            <div className="shortcut-grid">
              <span>{msg("app.compile")}</span><kbd>{formatShortcut('⌘ ↩')}</kbd>
              <span>{msg("app.save")}</span><kbd>{formatShortcut('⌘ S')}</kbd>
              <span>{msg("app.command.palette")}</span><kbd>{formatShortcut('⌘ K')}</kbd>
              <span>{msg("app.toggle.light.dark")}</span><kbd>{formatShortcut('⌘ ⇧ L')}</kbd>
              <span>{msg("app.visual.mode")}</span><kbd>{formatShortcut('⌘ ⇧ M')}</kbd>
              <span>{msg("app.focus.mode")}</span><kbd>{formatShortcut('⌘ ⇧ F')}</kbd>
              <span>{msg("app.typewriter.scrolling")}</span><kbd>{formatShortcut('⌘ ⇧ T')}</kbd>
              <span>{msg("app.toggle.pdf.preview")}</span><kbd>{formatShortcut('⌘ ⌥ P')}</kbd>
              <span>{msg("app.toggle.sidebar.variant2")}</span><kbd>{formatShortcut('⌘ \\')}</kbd>
              <span>{msg("app.forward.search.pdf")}</span><kbd>{formatShortcut('⌘ ⇧ J')}</kbd>
              <span>{msg("app.insert.placeholder")}</span><kbd>{formatShortcut('⌘ ⇧ H')}</kbd>
              <span>{msg("app.next.previous.placeholder")}</span><kbd>F4 / ⇧F4</kbd>
              <span>{msg("app.leave.a.revision.memo")}</span><kbd>{formatShortcut('⌘ ⇧ N')}</kbd>
              <span>{msg("app.revision.memos")}</span><kbd>{formatShortcut('⌘ ⇧ U')}</kbd>
              <span>{msg("app.apply.chinese.writing.typography")}</span><kbd>{formatShortcut('⌘ ⌥ ⇧ C')}</kbd>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
