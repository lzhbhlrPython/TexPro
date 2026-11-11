'use strict';
// Executable extensions are trusted Node code. This process is a fault boundary, not a sandbox.
const handlers = new Map(), listeners = new Map(), disposers = [], active = new Map(), calls = new Map();
let sequence = 0, initialized = false, configuration = {};
function send(value) { if (process.connected) process.send(value); }
function service(name, args, invocation) {
  const id = ++sequence;
  return new Promise((resolve, reject) => { calls.set(id, { resolve, reject }); send({ type: 'service', id, name, args, invocation }); });
}
async function stop() {
  for (const controller of active.values()) controller.abort();
  for (const dispose of disposers.reverse()) { try { await dispose(); } catch { /* continue cleanup */ } }
  handlers.clear(); listeners.clear(); process.exit(0);
}
process.on('disconnect', () => void stop());
process.on('message', async message => {
  try {
    if (message.type === 'init' && !initialized) {
      initialized = true; configuration = Object.freeze(message.config);
      const context = Object.freeze({
        apiVersion: 1,
        config: configuration,
        handle(id, handler) {
          if (typeof handler !== 'function' || handlers.has(id) || !message.manifest.contributes.actions.some(a => a.id === id)) throw new Error('Undeclared or duplicate extension handler');
          handlers.set(id, handler); return () => handlers.delete(id);
        },
        on(event, callback) {
          if (!['projectChanged', 'buildFinished'].includes(event) || typeof callback !== 'function') throw new Error('Unsupported extension event');
          const values = listeners.get(event) || new Set(); values.add(callback); listeners.set(event, values); return () => values.delete(callback);
        },
        onDispose(callback) { if (typeof callback !== 'function') throw new Error('Invalid disposer'); disposers.push(callback); },
        log(message) { send({ type: 'log', message: String(message).slice(0, 2000) }); },
      });
      const exported = await import(require('node:url').pathToFileURL(message.entry).href);
      const plugin = exported.default || exported;
      const dispose = await (typeof plugin === 'function' ? plugin : plugin.activate)(context);
      if (typeof dispose === 'function') disposers.push(dispose);
      for (const action of message.manifest.contributes.actions) if (!handlers.has(action.id)) throw new Error(`Missing extension handler: ${action.id}`);
      send({ type: 'ready' });
    } else if (message.type === 'invoke') {
      const handler = handlers.get(message.action); if (!handler) throw new Error('Extension handler unavailable');
      const controller = new AbortController(); active.set(message.id, controller);
      try {
        const result = await handler(Object.freeze({ ...message.context, signal: controller.signal,
          services: Object.freeze({ call: (name, args) => service(name, args, message.id) }) }), message.input);
        if (!controller.signal.aborted) send({ type: 'result', id: message.id, result: result ?? {} });
      } catch (error) { send({ type: 'result', id: message.id, error: String(error.message || error).slice(0, 2000) }); }
      finally { active.delete(message.id); }
    } else if (message.type === 'service-result') {
      const call = calls.get(message.id); if (call) { calls.delete(message.id); message.error ? call.reject(new Error(message.error)) : call.resolve(message.result); }
    } else if (message.type === 'event') {
      for (const listener of listeners.get(message.event) || []) await listener(message.payload);
    } else if (message.type === 'cancel') active.get(message.id)?.abort();
    else if (message.type === 'stop') await stop();
  } catch (error) { send({ type: 'failure', error: String(error.message || error).slice(0, 2000) }); }
});
