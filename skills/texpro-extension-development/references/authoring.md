# Authoring and review checks

## Choosing an extension point

Read the current `PackageManifest`, `ExtensionContext`, `InvocationContext` and `ExtensionResult` types before implementing. Provider kinds do not imply access to internal application modules. Completion and hover providers have editor adapters; diagnostic and transform results use the host tool and checked writing port. Other providers use the explicit tool workflow. `mcp` data providers are experimental and are not automatically exposed through external stdio MCP.

Commands, settings and panel schemas are declared in the manifest. An L2 panel groups declared actions; an L3 panel uses the shared workspace frame. Avoid duplicate commands with the same task. A plugin owns its registrations and storage namespace; unregistering must remove access to its contributions.

## Regression scenarios

- Change the document while a request is pending; the old result must not apply. Editing and then undoing to identical text must still invalidate the old document identity.
- Apply multiple ranges as one transaction, undo once and redo once. Test Unicode offsets and IME composition.
- Disable or uninstall during a call. No result, diagnostic, completion or theme may survive its owner.
- Change projects and reopen the same path. Previous project generations must remain invalid.
- Preview a theme, cancel, apply, restart, disable, uninstall and restore a built-in theme. Check token/style/font cleanup and PDF colors. Test the native View reset command and `--safe-mode`; styles can conceal controls even without JavaScript. Reject remote CSS resources, traversal and expansion bombs.
- Reject path traversal, symlinks, corrupt ZIPs, oversized output, overlapping edits, undeclared handlers and incompatible API versions.

## Distribution and handoff

Include license and source attribution in the package. Keep each output archive outside the source directory. Dependency code must carry its own notices; TeXPro's MIT license does not override third-party licenses. Koishi is design inspiration unless code is actually copied; copied code needs its own license review and attribution.

Record exact build/validation commands and whether native and packaged tests ran. A local package does not imply a published marketplace or npm SDK. Archive integrity checks detect changes; they do not authenticate an author's identity.
