'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
const { createRequire } = require('node:module');
const { execFileSync } = require('node:child_process');
const { readPackage, validateManifest, validatePackageType, relative, directoryFiles, languages, styles } = require('@texpro/extension-sdk/package-tools');
const { templates: styleTemplates } = require('./templates/styles.cjs');
const SDK = '@texpro/extension-sdk';
const SKIP = new Set(['node_modules', 'dist', 'output', 'target', 'elm-stuff', 'lib']);

function rootDirectory(directory) {
  const root = path.resolve(directory);
  if (fs.lstatSync(root).isSymbolicLink() || !fs.statSync(root).isDirectory()) throw new Error('Choose a regular source directory');
  if (fs.existsSync(path.join(root, 'package-lock.json')) && fs.existsSync(path.join(root, 'yarn.lock'))) throw new Error('Use only one package manager lockfile');
  return fs.realpathSync(root);
}
function config(root) {
  const value = JSON.parse(fs.readFileSync(path.join(root, 'qwertysay.build.json'), 'utf8'));
  if (value.version !== 1 || !['plugin', 'theme'].includes(value.type) || Object.keys(value).some(key => !['version', 'type', 'language', 'style'].includes(key)) ||
      (value.type === 'plugin' ? !Object.hasOwn(languages, value.language) || value.style !== undefined : !Object.hasOwn(styles, value.style) || value.language !== undefined)) throw new Error('Invalid qwertysay.build.json');
  return value;
}
function fingerprint(root) {
  const hash = createHash('sha256'); let total = 0, count = 0;
  function visit(dir, prefix) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith('.') || SKIP.has(entry.name) || entry.name === 'spago.lock' || entry.name.endsWith('.res.js')) continue;
      const name = prefix + entry.name; relative(name);
      if (entry.isSymbolicLink()) throw new Error('Build sources cannot contain symbolic links');
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full, name + '/');
      else if (entry.isFile()) {
        const size = fs.statSync(full).size;
        if (++count > 300 || (total += size) > 16 * 1024 * 1024) throw new Error('Author sources exceed package limits');
        hash.update(name); hash.update('\0'); hash.update(fs.readFileSync(full));
      } else throw new Error('Unsupported build source');
    }
  }
  visit(root, ''); return hash.digest('hex');
}
function safeDirectory(root, name) {
  const full = path.join(root, name);
  let cursor = root;
  for (const part of name.split('/')) {
    cursor = path.join(cursor, part);
    if (fs.existsSync(cursor)) {
      if (fs.lstatSync(cursor).isSymbolicLink() || !fs.statSync(cursor).isDirectory()) throw new Error('Build output must use regular directories');
    } else fs.mkdirSync(cursor);
  }
  return full;
}
function artifactDirectory(directory) {
  const root = rootDirectory(directory);
  if (!fs.existsSync(path.join(root, 'qwertysay.build.json'))) return root; // API 0.1/direct directory compatibility.
  config(root);
  const output = path.join(root, 'dist/package');
  if (!fs.existsSync(output)) throw new Error('No build output. Run qwertysay build first');
  for (const part of ['dist', 'dist/package']) if (fs.lstatSync(path.join(root, part)).isSymbolicLink()) throw new Error('Build output cannot be a symbolic link');
  const state = JSON.parse(fs.readFileSync(path.join(output, '.qwertysay-output'), 'utf8'));
  if (state.source !== fingerprint(root)) throw new Error('Build is stale. Run qwertysay build again');
  return output;
}
async function build(directory) {
  const root = rootDirectory(directory), options = config(root);
  const manifest = validateManifest(JSON.parse(fs.readFileSync(path.join(root, 'texpro.extension.json'), 'utf8')));
  if (options.type === 'plugin' && manifest.entry !== 'index.cjs') throw new Error('Build manifest entry must be index.cjs');
  const before = fingerprint(root), outputParent = safeDirectory(root, 'dist'), output = path.join(outputParent, 'package');
  if (fs.existsSync(output)) {
    if (fs.lstatSync(output).isSymbolicLink() || !fs.existsSync(path.join(output, '.qwertysay-owned'))) throw new Error('Refusing to replace an unowned dist/package');
    fs.rmSync(path.join(output, '.qwertysay-output'), { force: true }); // A failed rebuild cannot leave an apparently fresh artifact.
  }
  const work = safeDirectory(root, '.qwertysay'), compiled = safeDirectory(root, '.qwertysay/compiled');
  const stage = path.join(work, randomUUID()); fs.mkdirSync(stage);
  const projectRequire = createRequire(path.join(root, 'package.json'));
  const env = { ...process.env, PATH: path.join(root, 'node_modules/.bin') + path.delimiter + process.env.PATH };
  function command(file, args) { execFileSync(file, args, { cwd: root, env, stdio: 'inherit', timeout: 240000 }); }
  function npmBin(name, bin = name) {
    const pkg = projectRequire.resolve(name + '/package.json'), meta = JSON.parse(fs.readFileSync(pkg, 'utf8'));
    const entry = typeof meta.bin === 'string' ? meta.bin : meta.bin?.[bin];
    if (!entry) throw new Error('Missing compiler executable: ' + name);
    const executable = path.join(path.dirname(pkg), entry), args = Array.prototype.slice.call(arguments, 2);
    if (name === 'elm' && process.platform !== 'win32') command(executable, args);
    else command(process.execPath, [executable, ...args]);
  }
  try {
    fs.copyFileSync(path.join(root, 'LICENSE'), path.join(stage, 'LICENSE'));
    fs.writeFileSync(path.join(stage, 'texpro.extension.json'), JSON.stringify(manifest, null, 2) + '\n');
    for (const name of ['README.md', 'THIRD_PARTY_NOTICES.md']) if (fs.existsSync(path.join(root, name))) fs.copyFileSync(path.join(root, name), path.join(stage, name));
    if (fs.existsSync(path.join(root, 'assets'))) {
      if (fs.lstatSync(path.join(root, 'assets')).isSymbolicLink()) throw new Error('Assets cannot be a symbolic link');
      for (const [name, data] of directoryFiles(path.join(root, 'assets'))) {
        const target = path.join(stage, 'assets', name); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, data);
      }
    }
    if (options.type === 'theme') {
      const template = styleTemplates[options.style], source = path.join(root, template.source), dest = path.join(stage, 'theme.css');
      const text = fs.readFileSync(source, 'utf8');
      if (options.style === 'css') fs.writeFileSync(dest, text);
      else if (['scss', 'sass'].includes(options.style)) {
        const result = projectRequire('sass').compile(source, { sourceMap: false, style: 'expanded' }); fs.writeFileSync(dest, result.css);
      } else if (options.style === 'less') {
        const result = await projectRequire('less').render(text, { filename: source, javascriptEnabled: false }); fs.writeFileSync(dest, result.css);
      } else if (options.style === 'stylus') {
        const css = await new Promise((resolve, reject) => projectRequire('stylus').render(text, { filename: source }, (error, value) => error ? reject(error) : resolve(value))); fs.writeFileSync(dest, css);
      } else if (options.style === 'css-in-js') {
        const { vanillaExtractPlugin } = projectRequire('@vanilla-extract/esbuild-plugin');
        await require('esbuild').build({ absWorkingDir: root, entryPoints: [source], bundle: true, outfile: path.join(compiled, 'theme.js'), plugins: [vanillaExtractPlugin()], sourcemap: false });
        fs.copyFileSync(path.join(compiled, 'theme.css'), dest); // The evaluation JS never enters a .tpt.
      } else if (options.style === 'tcss') command('tcss', ['compile', source, '-o', dest]);
    } else {
      let entry;
      switch (options.language) {
        case 'ts': npmBin('typescript', 'tsc', '-p', 'tsconfig.json'); entry = '.qwertysay/compiled/index.cjs'; break;
        case 'js': entry = 'src/index.cjs'; break;
        case 'coffee': fs.writeFileSync(path.join(compiled, 'index.cjs'), projectRequire('coffeescript').compile(fs.readFileSync(path.join(root, 'src/index.coffee'), 'utf8'), { bare: true, filename: 'src/index.coffee' })); entry = '.qwertysay/compiled/index.cjs'; break;
        case 'purs': npmBin('spago', 'spago', 'build'); entry = 'src/entry.cjs'; break;
        case 'rescript': npmBin('rescript', 'rescript', 'build'); entry = 'src/entry.cjs'; break;
        case 'cljs': npmBin('shadow-cljs', 'shadow-cljs', 'release', 'plugin'); entry = 'src/entry.cjs'; break;
        case 'elm': npmBin('elm', 'elm', 'make', 'src/Plugin.elm', '--output=.qwertysay/compiled/author.js', '--optimize'); entry = 'src/entry.cjs'; break;
        case 'scala':
          if (process.env.TEXPRO_SBT_LAUNCHER) command('java', ['-jar', process.env.TEXPRO_SBT_LAUNCHER, 'fastLinkJS']);
          else if (process.platform === 'win32') throw new Error('On Windows set TEXPRO_SBT_LAUNCHER to sbt-launch.jar and put java on PATH');
          else command('sbt', ['--batch', 'fastLinkJS']);
          entry = 'src/entry.cjs'; break;
        case 'go': command('gopherjs', ['build', '-o', '.qwertysay/compiled/author.cjs', './src']); entry = 'src/entry.cjs'; break;
      }
      const result = await require('esbuild').build({ absWorkingDir: root, entryPoints: [entry], bundle: true, platform: 'node', target: 'node20', format: 'cjs', outfile: path.join(stage, 'index.cjs'), sourcemap: false, legalComments: 'inline', metafile: true });
      const notices = [fs.existsSync(path.join(stage, 'THIRD_PARTY_NOTICES.md')) ? fs.readFileSync(path.join(stage, 'THIRD_PARTY_NOTICES.md'), 'utf8') : '# Bundled third-party notices\n'];
      const licenses = new Set();
      for (const input of Object.keys(result.metafile.inputs)) {
        let cursor = path.dirname(path.resolve(root, input));
        while (cursor !== path.dirname(cursor)) {
          const license = fs.readdirSync(cursor).find(name => /^licen[cs]e(?:\.(?:md|txt))?$/i.test(name));
          if (license) {
            const file = path.join(cursor, license);
            if (!licenses.has(file)) { licenses.add(file); notices.push(`\n## ${path.basename(cursor)}\n\n${fs.readFileSync(file, 'utf8')}\n`); }
            break;
          }
          cursor = path.dirname(cursor);
        }
      }
      const sdkRoot = path.dirname(projectRequire.resolve(SDK));
      const sdkLicense = path.join(sdkRoot, 'LICENSE');
      if (!licenses.has(sdkLicense)) notices.push('\n## TeXPro extension SDK\n\n' + fs.readFileSync(sdkLicense, 'utf8'));
      const bundledNotices = path.join(__dirname, '../notices', options.language + '.txt');
      if (fs.existsSync(bundledNotices)) notices.push(fs.readFileSync(bundledNotices, 'utf8'));
      if (options.language === 'purs') {
        const packages = path.join(root, '.spago/p');
        for (const name of fs.readdirSync(packages).sort()) {
          const directory = path.join(packages, name);
          const license = fs.readdirSync(directory).find(file => /^licen[cs]e(?:\.(?:md|txt))?$/i.test(file));
          if (license) notices.push(`\n## PureScript ${name}\n\n${fs.readFileSync(path.join(directory, license), 'utf8')}`);
        }
      }
      fs.writeFileSync(path.join(stage, 'THIRD_PARTY_NOTICES.md'), notices.join('\n'));
    }
    const inspected = readPackage(stage);
    validatePackageType(inspected.manifest, options.type === 'theme' ? 'output.tpt' : 'output.tpp', inspected.files);
    if (fingerprint(root) !== before) throw new Error('Sources changed during build; rebuild before packaging');
    fs.writeFileSync(path.join(stage, '.qwertysay-output'), JSON.stringify({ source: before }));
    fs.writeFileSync(path.join(stage, '.qwertysay-owned'), 'qwertysay\n');
    if (fs.existsSync(output)) fs.rmSync(output, { recursive: true });
    fs.renameSync(stage, output);
    return { output, manifest };
  } finally { fs.rmSync(stage, { recursive: true, force: true }); }
}
module.exports = { build, artifactDirectory, fingerprint };
