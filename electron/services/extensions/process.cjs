'use strict';
const { fork } = require('node:child_process');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
class ExtensionProcess {
  constructor(directory, manifest, config, service, onFailure = () => {}) {
    this.pending = new Map(); this.closed = false; this.manifest = manifest;
    const file = path.join(__dirname, 'worker.cjs').replace(/app\.asar([/\\])/, 'app.asar.unpacked$1');
    this.child = fork(file, [], { execArgv: [], env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, stdio: ['ignore', 'pipe', 'pipe', 'ipc'], windowsHide: true });
    this.child.stdout.resume(); this.child.stderr.resume();
    this.ready = new Promise((resolve, reject) => { this.resolveReady = resolve; this.rejectReady = reject; });
    this.timer = setTimeout(() => this.fail(new Error('Extension activation timed out')), 5000);
    this.child.on('error', error => this.fail(error));
    this.child.on('exit', code => { if (!this.closed) this.fail(new Error(`Extension process exited (${code})`)); });
    this.onFailure = onFailure;
    this.child.on('message', async message => {
      if (this.closed || !message || typeof message !== 'object') return;
      if (message.type === 'ready') { clearTimeout(this.timer); this.resolveReady(); }
      else if (message.type === 'failure') this.fail(new Error(message.error));
      else if (message.type === 'result') {
        const request = this.pending.get(message.id); if (!request) return;
        clearTimeout(request.timer); this.pending.delete(message.id);
        if (Buffer.byteLength(JSON.stringify(message.result ?? {})) > 4 * 1024 * 1024) request.reject(new Error('Extension result too large'));
        else message.error ? request.reject(new Error(message.error)) : request.resolve(message.result);
      } else if (message.type === 'service') {
        const request = this.pending.get(message.invocation); if (!request) return;
        try { const result = await service(message.name, message.args, request.context); if (!this.closed) this.child.send({ type: 'service-result', id: message.id, result }); }
        catch (error) { if (!this.closed) this.child.send({ type: 'service-result', id: message.id, error: error.message }); }
      }
    });
    this.child.send({ type: 'init', manifest, config, entry: path.join(directory, manifest.entry) });
  }
  async invoke(action, context, input = {}) {
    await this.ready; if (this.closed) throw new Error('Extension is disabled');
    if (this.pending.size >= 4) throw new Error('Extension is busy; try again');
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => this.fail(new Error('Extension action timed out')), 10000);
      this.pending.set(id, { resolve, reject, timer, context });
      this.child.send({ type: 'invoke', id, action, context, input });
    });
  }
  event(event, payload) { if (!this.closed) this.child.send({ type: 'event', event, payload }); }
  fail(error) { if (this.closed) return; this.onFailure(error.message); this.stop(error); }
  stop(error = new Error('Extension was stopped')) {
    if (this.closed) return;
    this.closed = true; clearTimeout(this.timer); this.rejectReady(error);
    for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(error); }
    this.pending.clear();
    if (this.child.connected) this.child.send({ type: 'stop' }, () => {});
    const timer = setTimeout(() => this.child.kill('SIGKILL'), 300); timer.unref(); this.child.once('exit', () => clearTimeout(timer));
  }
}
module.exports = { ExtensionProcess };
