---
slug: mcp
title: "MCP: handing the project to AI"
group: AI 协作
order: 15
summary: TeXPro ships an MCP server that lets external AI clients read the project, look up symbols, run compiles, and locate positions in the PDF. This page covers how to connect it, what it can do once connected, and where it is restricted.
---

## Two directions, don't mix them up

**TeXPro → other MCP servers**: the in-app MCP panel can mount external servers (filesystem, database, search…), bringing their capabilities into TeXPro. The configuration lives in `mcp-servers.json` in the user data directory.

**Other AI clients → TeXPro**: `mcp/server.mjs` is a standalone stdio server that exposes project capabilities such as compiling, searching, and locating. Claude Desktop, Cursor, Codex, and any MCP-capable client can connect.

This page is mainly about the second direction.

## What it is

`mcp/server.mjs` is a plain Node script: it does not depend on an Electron window and does not need the app to be running. The protocol is MCP's stdio transport — one JSON-RPC message per line, with logs written to stderr so they never pollute the protocol stream.

Launch arguments:

```bash
node /path/to/mcp/server.mjs --project /path/to/your-paper
```

You can also set the initial project with the `TEXPRO_PROJECT_ROOT` environment variable. Without it the server still starts, but the first call has to be `texpro_open_project`.

## Connecting a client

For Claude Desktop, add one entry to the config file:

```json
{
  "mcpServers": {
    "texpro": {
      "command": "node",
      "args": [
        "/Applications/TeXPro.app/Contents/Resources/app.asar.unpacked/mcp/server.mjs",
        "--project",
        "/Users/you/papers/paper-1"
      ]
    }
  }
}
```

There are two cases for the path:

| Scenario | server.mjs path |
| --- | --- |
| Development repository | `<repository>/mcp/server.mjs` |
| Installed app | `<app>/Contents/Resources/app.asar.unpacked/mcp/server.mjs` (on Linux / Windows it is `resources/app.asar.unpacked/mcp/`) |

`--project` points at your project directory, not a single `.tex` file. Restart the client after editing the config, and the tool list should show the `texpro_*` family.

## What it can do

### Reading the project

| Tool | Purpose |
| --- | --- |
| `texpro_open_project` | Open / switch the project root |
| `texpro_project_info` | Root file, compile root, engine, modules and directory structure |
| `texpro_list_files` | List a directory (recursive, depth limit 8) |
| `texpro_read_file` | Read a text file |
| `texpro_search` | Full-project text search (case sensitivity optional, limit 200 results) |
| `texpro_project_symbols` | Symbol index for sections, labels, citations, commands and so on |
| `texpro_bib_lookup` | Look up bib entries by key or fuzzy term |

### Writing to the project

`texpro_write_file` really writes to disk, with a 2 MB limit per call and text files only. Before writing, read first with `texpro_read_file` so the model sees the current content before changing it and avoids a wholesale overwrite.

### Compiling and diagnostics

`texpro_compile` takes a file, an engine (`pdflatex` / `xelatex` / `lualatex`) and a build directory, and returns the full output with duration, page count, warnings, and errors. `texpro_diagnose` runs static checks (missing graphics, missing packages, undefined references and so on). `texpro_cancel_compile` interrupts a slow compile.

### Locating and drawing

`texpro_synctex_forward(file, line, column)` turns a source line into a page number and coordinates; `texpro_synctex_inverse(page, x, y)` goes from PDF coordinates back to a file and line. `texpro_render_tikz` renders a TikZ snippet into an image, and `texpro_template_preview` renders a template preview.

## Resources and prompts

Besides tools, the server provides two more kinds of MCP capability:

- **resources**: expose text files in the project (`.tex` `.ltx` `.bib` `.md` `.txt` `.sty` `.cls`) as `texpro://project/<relative path>`, so clients can mount them as context
- **prompts**: `fix-latex-error` (fix an error from the log), `summarize-project` (write a summary following the structure), `write-section` (write one section from an outline)

## Typical usage

### Have the AI fix a compile error

```text
1. texpro_compile               → get the error log
2. read prompts/fix-latex-error → locate it following the prompt
3. texpro_read_file             → look at the context
4. texpro_write_file            → change the smallest span
5. texpro_compile               → verify again
```

Step 5 is the key one: after a change it must recompile, otherwise the model is only guessing.

### Have the AI add a section from an outline

First call `texpro_project_symbols` to get the existing structure and numbering, then `texpro_read_file` to read how neighbouring sections are written (person, tense, math typesetting habits), and then write. Afterwards run `texpro_diagnose` to check that references are closed.

### Have the AI find which source produced Figure 3

`texpro_synctex_inverse(3, x, y)` gives the file and line number directly, far more reliable than making the model search the whole document.

## Security boundaries

- **Path gate**: every parameter that carries a path goes through `path.resolve` and then a prefix comparison, and must fall inside the current project root. Going outside reports `Path is outside the project: …`
- **Symlinks**: the real root is additionally compared with `realpath`, preventing a symlink from escaping the project, reporting `Path escapes the project through a symlink: …`
- **Ignored directories**: `.git`, `.texpro`, `node_modules`, `dist`, `build`, `out` take no part in search or listing
- **No network**: the server only reads and writes local files and calls the local TeX; it makes no network requests
- **No window**: it does not need the app to be running and is unaffected by UI state

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Tool list is empty | The client is not connected: check that `node` is on PATH, or write an absolute path |
| `No project is open` | `--project` was not passed and `texpro_open_project` has not been called yet |
| Compile reports latexmk not found | The environment running the server has no TeX distribution; the MCP server does not bundle TeX with the app |
| Write rejected | The path is outside the project, the file is not text, or it exceeds 2 MB |
| Mojibake in Chinese | The file is not UTF-8; the server reads and writes UTF-8 |

> When debugging, just run `node mcp/server.mjs --project .` and type a JSON-RPC line into the terminal — faster than guessing inside a client.

## How it differs from the built-in AI assistant

TeXPro also has an optional AI assistant (enabled only after a key is entered in settings), and it and MCP are two different paths:

| | Built-in AI assistant | MCP server |
| --- | --- | --- |
| Who calls it | The app itself, in a panel while writing | An external client (Claude Desktop, Cursor, Codex…) |
| Context | The text you selected plus a summary of the current project | Decided by the client, which can read the whole project |
| Key | Stored in the system keychain, only for the model you configured | Unrelated to TeXPro; the client's own model is used |
| Can it change files | Inserts into the document only after you confirm | Yes, straight to disk with `texpro_write_file` |

Both can be enabled at once; if you do not want an external client, simply do not configure MCP, and nothing else is affected.

## Typing a request by hand

To debug "the client won't connect", the fastest route is to run it yourself in a terminal:

```bash
node mcp/server.mjs --project /path/to/paper
```

Then type JSON one line at a time, following the protocol. Handshake first, then list tools, then call:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"cli","version":"0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"texpro_project_info","arguments":{}}}
```

Logs go to stderr and never mix into responses. The `content` field of a response holds text blocks, and `isError` flags a failed call — in a CLI those two fields are enough.

## Concurrency and performance

- **Stateless sessions**: every call re-resolves paths and caches no file contents; reading the same file repeatedly hits the disk repeatedly
- **Compiling is heavy**: one `texpro_compile` starts `latexmk`, and a full build can take over ten seconds; for batch edits, change everything and compile once rather than compiling after each line
- **Cancellation**: `texpro_cancel_compile` cancels only the run currently in progress for the current project
- **Large projects**: `texpro_search` and `texpro_list_files` walk directories with a depth limit of 8; search results are capped at 200, and anything beyond needs a narrower query

## Versions and compatibility

Server and client negotiate an MCP protocol version; an outdated client fails the handshake, which shows up as an empty tool list or an immediate disconnect. Upgrading the client usually fixes it.

The parameter names of `texpro_*` tools are a stable interface — renaming a parameter breaks compatibility; adding a tool or a new optional parameter is safe.

## Writing aid tools

Newly added: `texpro_writing_aids`, `texpro_edit_writing_aid`, and `texpro_ctex_typography`, used respectively to list placeholders and revision memos, to protect edits by hash, and to preview the Chinese typesetting of the root file. For full usage see [Placeholders and revision memos](/docs/writing-aids) and [CTeX Chinese typesetting](/docs/ctex-typography). These tools operate on saved files and never read an unsaved editor buffer.

## Read-only extension authoring inspection

`texpro_extension_capabilities` reports plugin languages, theme styles, toolchains and `.tpp`/`.tpt` artifact suffixes without an open project. `texpro_inspect_extension` accepts a built directory or artifact inside the current project, e.g. `{"path":"extensions/example/dist/package"}`. It returns the manifest, digest, size and risk notices, rejecting outside paths and symlink escapes. It never builds, imports an entry, installs, trusts, enables or invokes a plugin.

Experimental manifest `mcp` actions still do not become external tools automatically. Controlled invocation can be developed further with explicit enabling and tool allowlists. The standalone service reads disk, not unsaved buffers. Authoring builds use SDK `0.2.0` and qwertysay `0.3.0`, distinct from the original `0.1.0`; see the [SDK](/docs/extension-development) and [qwertysay](/docs/qwertysay) guides.
