# Compiler and bridge work

Use this reference for SDK 0.3.0 / API 1 and qwertysay 0.4.0. Read docs/extension-authoring.md and the SDK public declarations for exact versions and protocol. Packaging/compilation tests do not imply a release; verify registry and deployment outcomes separately.

Authors use the bilingual qwertysay guide without arguments. Unattended scripts may use local qwertysay init with --language ts/js/coffee/purs/rescript/cljs/elm/scala/go or --type theme --style css/scss/sass/less/stylus/css-in-js/tcss. Install matching local SDK and CLI paths in one explicit npm install command. The generated README lists prerequisites: Java 21+ for modern ClojureScript, Java/sbt for Scala.js, matched Go/GopherJS and official tcss-cli for Thematic CSS. TCSS is not Textual CSS. Never silently replace a missing compiler with a hand-written output file.

Explicit build may execute compiler/project code and download toolchain dependencies. Init/check/pack and MCP inspection never build or run package entries. Stage dist/package with only manifest, license/notices, runtime entry or static CSS and assets. Use .tpp for plugins and .tpt for themes; .tcss/.scss/.elm/etc are author sources, not installable artifacts. CSS-in-JS evaluation JS never enters .tpt. Keep source-root stale-build/failure checks and legacy self-contained directory compatibility.

For Elm and asynchronous bindings, use defineJsonExtension and typed JSON envelopes. Preserve request ids, UTF-16 ranges, controlled services, cancellation, timeout and disposal. defineTextTransform is a starter for a compiled string-to-string function; it does not restrict the full SDK. Do not call editor internals or bypass host proposals/capability checks. Disk services do not read unsaved buffers.

Run the real compiler matrix and the zero-skip host baseline. Inspect actual archives and invoke compiled plugins in the isolated host. An emitted template is not a passing compiler test. Report native platforms separately. Keep upstream runtime licenses: original SDK/CLI MIT does not relicense embedded Scala, Go, Elm, ClojureScript or PureScript libraries. Authors remain responsible for added dependencies.

Read-only MCP format/inspection tools do not expose plugin invocation. Further external execution needs an explicit enable/allowlist/schema contract and lifecycle tests; do not automatically register every mcp action.
