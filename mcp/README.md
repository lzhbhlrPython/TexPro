# TeXPro MCP server

A standalone stdio MCP server exposing TeXPro's project, compile, diagnostics, SyncTeX, TikZ, asset and Bib capabilities to MCP clients.

## Configure

```json
{
  "mcpServers": {
    "texpro": {
      "command": "node",
      "args": [
        "/absolute/path/to/TeXPro/mcp/server.mjs",
        "--project",
        "/absolute/path/to/your-paper"
      ]
    }
  }
}
```

The project can also be supplied with `TEXPRO_PROJECT_ROOT`. The server prints logs to stderr only; stdout is reserved for JSON-RPC.

The app exposes the exact path in **More → MCP server**.

## Tools

| Tool | Purpose |
|---|---|
| `texpro_extension_capabilities` | Read supported authoring formats, toolchains, suffixes and MCP limits; no project required |
| `texpro_inspect_extension` | Inspect a built directory or `.tpp`/`.tpt` inside the open project, without executing it |
| `texpro_open_project` | Open a project directory |
| `texpro_project_info` | Root, main file, candidates, selection status/error, build dir |
| `texpro_list_files` | Project tree |
| `texpro_read_file` | Read UTF-8 source |
| `texpro_write_file` | Write source inside the project |
| `texpro_search` | Search project sources |
| `texpro_project_symbols` | Labels, cites, packages, images |
| `texpro_ctex_typography` | Read-only typography proposal for the real main file |
| `texpro_writing_aids` | List placeholders/memos and current source hashes |
| `texpro_edit_writing_aid` | Explicit hash-guarded writing-aid changes |
| `texpro_diagnose` | TeX tools and project health |
| `texpro_compile` | Run latexmk and return diagnostics |
| `texpro_cancel_compile` | Cancel the active MCP compile |
| `texpro_synctex_forward` | Source → PDF page/coordinates |
| `texpro_synctex_inverse` | PDF page/coordinates → source |
| `texpro_render_tikz` | Render TikZ/pgfplots preview |
| `texpro_list_assets` | List project assets |
| `texpro_bib_lookup` | DOI / arXiv → BibTeX |
| `texpro_template_preview` | Compile template → PNG data URL |

## Project main file

The desktop app and MCP share `.texpro/project.json`: `rootFile` selects the main `.tex`/`.ltx` relative to the project, and `directories.build` selects output storage. Without `rootFile`, a unique uncommented `\documentclass` candidate is required. Multiple candidates require a choice; an invalid or missing configured main fails explicitly. An active file or child `% !TeX root` comment does not override the project's entry. Project info and compilation refresh the on-disk selection each time, so desktop changes are visible without restarting MCP.

## Security

- All paths are resolved inside the configured project. `..`, absolute paths and symlink escapes are rejected where possible.
- Saved-document writes through `texpro_write_file` and `texpro_edit_writing_aid` require explicit user intent; writing-aid changes also require current hashes. Compilation/rendering may create build/cache artifacts.
- Compilation is local and uses `latexmk`; no cloud service is contacted.
- The server does not expose arbitrary shell execution.

## Test

```bash
npm run test:mcp
```

The test starts the real stdio server against `demo/`, performs initialize, tools/list, project info, search, read and doctor calls.

## Packaging

`mcp/**` and its TeX/history/Git/file-filter service dependencies are explicitly unpacked by Electron Builder; in a packaged build the UI reports the path under `Contents/Resources/app.asar.unpacked/mcp/server.mjs`. These dependencies remain ordinary files so the server can run in Node.js, while Electron can still resolve the same services through ASAR. The packaging check verifies both the renderer archive and these unpacked files.

### Writing aids and Chinese typography

- `texpro_writing_aids` lists placeholders, revision memos (including legacy TODO notes), UTF-16 offsets and saved-file SHA-256 hashes across the project.
- `texpro_edit_writing_aid` takes `file`, `action` and `expectedHash`. Actions: `insert-placeholder` (`offset`, `kind`, `text`, `expectedMainHash`), `resolve-placeholder` (`offset`, replacement TeX in `text`), `add-memo` (`line`, `text`), `complete-memo` / `reopen-memo` (`line`). Read fresh hashes first. Placeholder support is installed in the resolved main file, not the child being edited.
- `texpro_ctex_typography` returns a preview of the actual main file with Chinese body typography; it does not save. Review it before using `texpro_write_file`. Existing author fonts are preserved.

These tools operate on **saved files**, not unsaved editor buffers. Save before handing work to an external client and review external changes when returning. Unresolved placeholders produce draft compile warnings and block arXiv submission packaging. Memos are `% MEMO:` / `% MEMO-DONE:` source comments and never enter the PDF.

## Extension authoring inspection

`texpro_extension_capabilities` returns the SDK's shared language/style catalog, `.tpp`/`.tpt` suffixes and trust boundaries without requiring an open project. `texpro_inspect_extension` accepts `{ "path": "extensions/example.tpp" }` or a project-relative **built** directory such as `extensions/example/dist/package`. It returns the validated manifest, SHA-256, package kind, file count, size and risk notices. Absolute/outside paths and symlink escapes are rejected. Inspection never imports an entry, compiles sources, installs, trusts, enables or invokes a plugin. Use the actual built directory; author sources such as `.purs`, `.elm` or `.tcss` are not installable packages.

The manifest's `mcp` action remains an experimental in-app provider, not automatic external `tools/list` registration. A future bridge could add explicitly enabled tool allowlists, stable schemas, cancellation and hash-guarded edit proposals; these invocation features are not implemented by the inspection tools. The standalone server reads disk, not unsaved editor buffers.

SDK/CLI `0.2.0` provides this authoring expansion; `0.1.0` contains the original scaffolds. See [the authoring contract](../docs/extension-authoring.md). Normal Node execution outside ASAR also requires the shared SDK validation modules and the complete PostCSS dependency closure; unpack patterns and dependency checks are maintained alongside these imports.

Test the real inspection protocol and non-execution/path boundaries with `node --test tests/mcp-extensions.test.cjs`. This supplements `npm run test:mcp`; neither test publishes or deploys anything.

### Language packs and npm distribution

Extension capabilities now describe `contributes.locales`, data-only JSON messages, English fallback, the preinstalled `@texpro/extension-translate-zh-cn` package, and the `texpro.package` npm wrapper field. Package inspection uses the same SDK validation as the host, including language placeholders and package suffix rules. These tools remain read-only: they never download registry packages, run npm/Yarn, compile, sync, install, uninstall, enable or execute extensions. A language contribution is not an MCP tool. See the [language guide](../docs/language-packs.md) and [package-management contract](../docs/extension-package-management.md).
