import { useEffect, useMemo, useState } from 'react';
import { Check, Clipboard, Plug, Terminal, Trash2, X } from 'lucide-react';
import { useI18n } from '../i18n';

interface Props {
  open: boolean;
  projectRoot: string | null;
  onClose: () => void;
}

const MCP_MARKET = [
  { id: 'texpro', name: 'TeXPro', description: "app.the.local.texpro.project.server", command: 'node', args: [] },
  { id: 'git', name: 'Git', description: "app.inspect.history.diffs.and.commit.state", command: 'npx', args: ['-y', '@modelcontextprotocol/server-git'] },
  { id: 'zotero', name: 'Zotero', description: "app.import.bibtex.from.a.zotero.library", command: 'npx', args: ['-y', 'zotero-mcp'] },
];

const MCP_RESOURCES = ['Project sources', 'Bibliography', 'Prompts: fix error, summarize, write section'];

const MCP_TOOLS = [
  'texpro_open_project', 'texpro_project_info', 'texpro_list_files', 'texpro_read_file',
  'texpro_write_file', 'texpro_search', 'texpro_project_symbols', 'texpro_diagnose',
  'texpro_compile', 'texpro_cancel_compile', 'texpro_synctex_forward', 'texpro_synctex_inverse',
  'texpro_render_tikz', 'texpro_list_assets', 'texpro_bib_lookup', 'texpro_template_preview',
];

export function McpPanel({ open, projectRoot, onClose }: Props) {
  const { msg } = useI18n();
  const [mcpPath, setMcpPath] = useState('');
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<{ id: string; tools: Array<{ name: string; description?: string }> } | null>(null);
  const [busy, setBusy] = useState(false);
  const [callTool, setCallTool] = useState('');
  const [callArgs, setCallArgs] = useState('{}');
  const [callResult, setCallResult] = useState('');
  const [clientError, setClientError] = useState('');
  const [configs, setConfigs] = useState<Array<{ id: string; name: string; command: string; args: string[] }>>([]);
  const [customName, setCustomName] = useState('My server');
  const [customCommand, setCustomCommand] = useState('npx');
  const [customArgs, setCustomArgs] = useState('-y some-mcp-server');
  const [tab, setTab] = useState<'tools' | 'clients' | 'call'>('tools');

  useEffect(() => {
    if (!open) return;
    void window.texpro.getInfo().then((info) => setMcpPath(info.mcpPath)).catch(() => undefined);
    void window.texpro.mcpConfigs().then(setConfigs).catch(() => undefined);
  }, [open]);

  const config = useMemo(() => JSON.stringify({
    mcpServers: {
      texpro: {
        command: 'node',
        args: [mcpPath || '/path/to/TeXPro/mcp/server.mjs', '--project', projectRoot || '/path/to/project'],
      },
    },
  }, null, 2), [mcpPath, projectRoot]);

  const connect = async (preset: { id: string; name: string; command: string; args: string[] }) => {
    if (!projectRoot || busy) return;
    setBusy(true);
    setClientError('');
    try {
      const args = preset.id === 'texpro' ? [mcpPath, '--project', projectRoot] : preset.args;
      const result = await window.texpro.mcpConnect(preset.id, { command: preset.command, args, cwd: projectRoot });
      setActive({ id: preset.id, tools: result.tools });
      setCallTool(result.tools[0]?.name || '');
      setTab('call');
      setCallResult('');
    } catch (error) {
      setClientError(String(error));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    if (!active) return;
    await window.texpro.mcpDisconnect(active.id);
    setActive(null);
    setCallResult('');
  };

  const call = async () => {
    if (!active || !callTool || busy) return;
    setBusy(true);
    setClientError('');
    try {
      let parsed = {};
      try { parsed = JSON.parse(callArgs || '{}'); } catch { throw new Error(msg("app.arguments.must.be.valid.json")); }
      const result = await window.texpro.mcpCall(active.id, callTool, parsed);
      setCallResult(JSON.stringify(result, null, 2));
    } catch (error) {
      setClientError(String(error));
    } finally {
      setBusy(false);
    }
  };

  const installPreset = async (preset: { id: string; name: string; command: string; args: string[] }) => {
    const next = await window.texpro.mcpSaveConfig({ id: preset.id, name: preset.name, command: preset.command, args: preset.args });
    setConfigs(next);
  };

  const removeConfig = async (id: string) => {
    setConfigs(await window.texpro.mcpRemoveConfig(id));
    if (active?.id === id) await disconnect();
  };

  const saveCustom = async () => {
    if (!customName.trim() || !customCommand.trim()) return;
    const config = { id: customName.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-'), name: customName.trim(), command: customCommand.trim(), args: customArgs.split(/\s+/).filter(Boolean) };
    setConfigs(await window.texpro.mcpSaveConfig(config));
    setCustomName('My server');
    setCustomArgs('');
  };

  if (!open) return null;

  return (
    <div className="modal-scrim" onMouseDown={onClose}>
      <section className="mcp-studio" data-testid="mcp-panel" onMouseDown={(event) => event.stopPropagation()}>
        <header className="studio-header">
          <div className="studio-heading">
            <div className="studio-icon"><Plug size={18} /></div>
            <div>
              <span className="modal-eyebrow">{msg("app.integration")}</span>
              <h2>{msg("app.texpro.mcp.server")}</h2>
            </div>
          </div>
          <div className="studio-header-actions">
            <span className="studio-engine ok"><Terminal size={11} /> stdio</span>
            <button className="icon-btn" onClick={onClose} title={msg("app.close")}><X size={16} /></button>
          </div>
        </header>

        <div className="mcp-body">
          <div className="mcp-config">
            <div className="pane-label"><Plug size={12} /> {msg("app.client.configuration")}</div>
            <p className="mcp-hint">{msg("app.add.this.to.claude.desktop.or.another.mcp.client")}</p>
            <pre className="mcp-code">{config}</pre>
            <button className="primary-btn" onClick={async () => { await navigator.clipboard?.writeText(config); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }}>
              {copied ? <Check size={12} /> : <Clipboard size={12} />} {copied ? msg("app.copied") : msg("app.copy.config")}
            </button>
          </div>
          <div className="mcp-tools">
            <div className="mcp-tabs">
              <button className={tab === 'tools' ? 'active' : ''} onClick={() => setTab('tools')}>{msg("app.tools")}<span>{MCP_TOOLS.length}</span></button>
              <button className={tab === 'clients' ? 'active' : ''} onClick={() => setTab('clients')}>{msg("app.mcp.clients")}<span>{active ? 1 : 0}</span></button>
              <button className={tab === 'call' ? 'active' : ''} onClick={() => setTab('call')} disabled={!active}>{msg("app.call.a.tool")}</button>
            </div>
            {tab === 'tools' && (
              <>
                <div className="pane-label"><Terminal size={12} /> {msg("app.exposed.tools")}<span className="pane-hint">{MCP_TOOLS.length}</span></div>
                <div className="mcp-tool-list">{MCP_TOOLS.map((name) => <span key={name}>{name}</span>)}</div>
                <div className="pane-label mcp-resource-label"><Terminal size={12} /> {msg("app.resources.prompts")}<span className="pane-hint">{MCP_RESOURCES.length}</span></div>
                <div className="mcp-tool-list">{MCP_RESOURCES.map((name) => <span key={name}>{msg.text(name)}</span>)}</div>
                <div className="mcp-warning">
                  <strong>{msg("app.write.access.is.explicit")}</strong>
                  <p>{msg("app.the.server.only.operates.inside.the.project.passed.with")}</p>
                </div>
              </>
            )}
            {tab === 'clients' && (
              <>
                <div className="pane-label"><Terminal size={12} /> {msg("app.mcp.clients")}<span className="pane-hint">{active ? 1 : 0}</span></div>
                <div className="mcp-market">
                  {[...MCP_MARKET.map((preset) => ({ ...preset, installed: configs.some((item) => item.id === preset.id), custom: false })), ...configs.map((config) => ({ ...config, description: "app.saved.custom.server", installed: true, custom: true }))].map((preset) => (
                    <div key={preset.id} className={`mcp-market-card ${active?.id === preset.id ? 'connected' : ''}`}>
                      <div>
                        <strong>{preset.name}</strong>
                        <span>{msg.text(preset.description)}</span>
                        <code>{preset.command} {preset.id === 'texpro' ? 'mcp/server.mjs' : preset.args.join(' ')}</code>
                      </div>
                      <div className="mcp-card-actions">
                        <button className="mini-btn" onClick={() => active?.id === preset.id ? void disconnect() : void connect(preset)} disabled={busy || !projectRoot}>
                          {active?.id === preset.id ? msg("app.disconnect") : msg("app.connect")}
                        </button>
                        {preset.custom ? (
                          <button className="mini-btn danger" onClick={() => void removeConfig(preset.id)} title={msg("app.remove.server")}><Trash2 size={11} /></button>
                        ) : preset.installed ? (
                          <button className="mini-btn" onClick={() => void removeConfig(preset.id)} title={msg("app.uninstall")}>{msg("app.installed")}</button>
                        ) : (
                          <button className="mini-btn" onClick={() => void installPreset(preset)} title={msg("app.install.preset")}>{msg("app.install")}</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mcp-custom">
                  <input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder={msg("app.server.name")} />
                  <input value={customCommand} onChange={(event) => setCustomCommand(event.target.value)} placeholder="command" />
                  <input value={customArgs} onChange={(event) => setCustomArgs(event.target.value)} placeholder={msg("app.arguments")} />
                  <button className="mini-btn" onClick={() => void saveCustom()}>{msg("app.save.server")}</button>
                </div>
                <p className="mcp-hint mcp-security">{msg("app.only.connect.mcp.servers.you.trust.they.run.as")}</p>
                {clientError && <div className="ai-error">{clientError}</div>}
              </>
            )}
            {tab === 'call' && (
              <>
                <div className="pane-label"><Terminal size={12} /> {msg("app.call.a.tool")}<span className="pane-hint">{active?.tools.length || 0}</span></div>
                {active ? (
                  <div className="mcp-call">
                    <select value={callTool} onChange={(event) => setCallTool(event.target.value)}>
                      {active.tools.map((tool) => <option key={tool.name} value={tool.name}>{tool.name}</option>)}
                    </select>
                    <textarea value={callArgs} onChange={(event) => setCallArgs(event.target.value)} spellCheck={false} />
                    <button className="secondary-btn" onClick={() => void call()} disabled={busy || !callTool}>{busy ? msg("app.running") : msg("app.call.tool")}</button>
                    {callResult && <pre className="mcp-call-result">{callResult}</pre>}
                  </div>
                ) : <div className="panel-empty">{msg("app.connect.an.mcp.client.first")}</div>}
              </>
            )}
          </div>
        </div>

        <footer className="studio-footer">
          <span className="studio-hint">{msg("app.the.mcp.server.is.a.separate.stdio.process.and")}</span>
          <div className="spacer" />
          <button className="primary-btn" onClick={onClose}>{msg("app.done")}</button>
        </footer>
      </section>
    </div>
  );
}
