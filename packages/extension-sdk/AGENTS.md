# SDK maintenance

This package is independently installed from npm. Keep `lib/` and public entry points free of Electron, React, TeXPro source paths and hidden network/install actions. Desktop wrappers share this exact validation core; do not maintain a second implementation.

Keep public types, generated TypeScript/JavaScript/theme projects, `.tpp`/`.tpt` checks, qwertysay CLI help and both READMEs aligned. Run the standalone tests, root zero-skip baseline, and install the actual npm tarball in a temporary clean directory. Verify scaffold, TypeScript build, archive and rejection paths. Record actual publication state; a tarball is not an npm release. Existing explicit publication authorization governs the requested release; do not invent a second approval requirement.

Preserve MIT notices and third-party dependency licenses. Explain Node permission and theme spoofing risks. Publish only explicit package files; never include temporary profiles, test outputs, credentials or private task notes.

The JSON bridge carries serializable API 1 requests, services, cancellation and disposal; keep native runtime identity/capability checks authoritative. Read-only inspection/capability modules must not import compilers or extension entries, because standalone MCP consumes them outside ASAR. Keep public index/package-tools declarations aligned with runtime exports and preserve third-party runtime notices in generated artifacts.

Host locale catalogues use `catalogVersion: 2` with stable semantic IDs in JSON. Reject old phrase-key packs explicitly; no alias compatibility layer. Keep SDK reference, qwertysay locale scaffolds, builtin Chinese and read-only MCP contracts aligned. UI labels and technical IDs are separate; never insert a message ID into generated author content. Long prose belongs in whole localized Markdown documents, not per-sentence UI keys. Validate placeholders, missing/unknown keys, old-pack rejection, actual tarballs and host recovery before reporting completion.

Message IDs describe a feature and purpose; wording changes must not rename them. Keep types derived from the source catalogue and check all consumers before deleting or renaming a key. Do not hide missing keys with broad string types, unchecked casts or phrase lookups. English source lives in `lib/locale-source.json`; the builtin Chinese package has its own JSON, and functional plugins own their own dictionaries. Follow the root internationalization rules and `docs/language-packs.md` for loading, recovery and validation.
