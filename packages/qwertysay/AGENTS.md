# qwertysay maintenance

Read the root AGENTS.md and the SDK maintenance rules. This is the independent `@texpro/qwertysay` npm package and `qwertysay` CLI. Consume the SDK public `package-tools` export; never duplicate validators or import Electron/project source. Init/check/pack never install, use the network or execute author code; explicit build runs trusted compiler/project code and may resolve dependencies. Keep compilers out of the Electron runtime. Never overwrite existing author files, keep output outside source, preserve author licenses and explain Node/CSS risks.

Verify TS/JS/theme scaffolds, actual compilation, suffix checks and rejection paths. Test actual SDK and CLI tarballs in a clean temporary directory before publishing; verify registry versions after publication. Keep bilingual READMEs, generated instructions, Skill and site docs aligned. Publication follows explicit user authorization; do not imply an npm release from a local tarball.

Keep language/style templates modular. Stage only runtime files and notices in dist/package; .tpt contains static CSS, never its CSS-in-JS generator. Validate changed/failed builds, output ownership, Unicode offsets and compiled host invocation. Run the real compiler matrix without skips; missing tools are failures. Keep prerelease source instructions distinct from published npm versions.
