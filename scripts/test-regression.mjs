import { spawn } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = readdirSync(new URL('../tests/', import.meta.url)).filter(name => name.endsWith('.test.cjs')).sort().map(name => `tests/${name}`);
const child = spawn(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: root, stdio: ['inherit', 'pipe', 'inherit'] });
let output = '';
child.stdout.on('data', chunk => { output += chunk; process.stdout.write(chunk); });
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => {
  const skipped = /^# skipped (\d+)$/m.exec(output), todo = /^# todo (\d+)$/m.exec(output);
  if (!skipped || !todo || Number(skipped[1]) || Number(todo[1])) {
    console.error('Regression baseline requires complete results with zero skipped tests and zero TODOs.'); process.exitCode = 1;
  } else process.exitCode = code || 0;
});
