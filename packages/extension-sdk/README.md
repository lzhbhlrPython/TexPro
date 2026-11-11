# TeXPro extension SDK — API 1 preview

Local package distribution. The SDK is maintained in this repository and is not published to npm yet. See [extension architecture](../../docs/extensions.md) for authoring, lifecycle and trust boundaries. Package types are in `index.d.ts`; `defineExtension()` is an optional authoring helper. Self-contained `.cjs`/`.mjs` entries need no SDK runtime dependency.

Inspired by Koishi's disposable plugin lifecycle and service organization. This implementation is original TeXPro code, not a Koishi-compatible runtime. No Koishi source or console UI is included.

Executable extensions are trusted Node code in a separate fault-isolation process. API capability declarations are not an OS security sandbox. Themes, completions and templates can be distributed without executable code.
