'use strict';

// Data only: also consumed by standalone MCP; never loads a compiler or author code.
const languages = Object.freeze({
  ts: { name: 'TypeScript', source: '.cts', toolchain: 'Node.js + TypeScript' },
  js: { name: 'JavaScript', source: '.cjs', toolchain: 'Node.js' },
  coffee: { name: 'CoffeeScript', source: '.coffee', toolchain: 'Node.js + CoffeeScript' },
  purs: { name: 'PureScript', source: '.purs', toolchain: 'PureScript + Spago' },
  rescript: { name: 'ReScript', source: '.res', toolchain: 'Node.js + ReScript' },
  cljs: { name: 'ClojureScript', source: '.cljs', toolchain: 'Java 21+ + shadow-cljs' },
  elm: { name: 'Elm', source: '.elm', toolchain: 'Elm 0.19.3; JSON ports bridge' },
  scala: { name: 'Scala.js', source: '.scala', toolchain: 'Java + sbt + Scala.js' },
  go: { name: 'GopherJS', source: '.go', toolchain: 'GopherJS + its matching Go version' },
});
const styles = Object.freeze({
  css: { name: 'CSS', source: '.css', toolchain: 'Node.js (copy)' },
  scss: { name: 'SCSS', source: '.scss', toolchain: 'Dart Sass' },
  sass: { name: 'Sass', source: '.sass', toolchain: 'Dart Sass (indented syntax)' },
  less: { name: 'Less', source: '.less', toolchain: 'Less' },
  stylus: { name: 'Stylus', source: '.styl', toolchain: 'Stylus' },
  'css-in-js': { name: 'CSS-in-JS (static)', source: '.css.ts', toolchain: 'vanilla-extract + esbuild' },
  tcss: { name: 'Thematic CSS', source: '.tcss', toolchain: 'Official tcss-cli (Cargo); not Textual CSS' },
});
function authoringCapabilities() {
  return { apiVersion: 1, bridgeVersion: 1, languages, styles, artifacts: { plugin: '.tpp', theme: '.tpt' },
    locales: { contribution: 'contributes.locales', format: 'JSON strings', code: false, fallback: 'en', preinstalled: '@texpro/extension-translate-zh-cn' },
    distribution: { registry: 'https://registry.npmjs.org', field: 'texpro.package', reviewRequired: true, executesInstallScripts: false },
    runtime: { plugin: 'Self-contained .cjs/.mjs in trusted Node process', theme: 'Validated static CSS, configuration and local assets only' },
    security: ['Build commands execute trusted developer toolchains; never run them on untrusted sources.', 'Node plugins have user file, network and process permissions. Process isolation is not a sandbox.', 'Themes can hide controls or imitate trusted UI. File suffixes do not certify safety.'],
    mcp: { inspectOnly: true, executesCompilers: false, invokesPlugins: false, readsUnsavedBuffers: false } };
}
module.exports = { authoringCapabilities, languages, styles };
