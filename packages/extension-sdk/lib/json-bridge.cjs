'use strict';

const LIMIT = 4 * 1024 * 1024;
const METHODS = new Set(['storage.get', 'storage.set', 'project.readFile', 'project.symbols']);

/** Bind a compiler's JSON message transport to API 1. This is not a sandbox. */
function defineJsonExtension({ actions, start }) {
  if (!Array.isArray(actions) || !actions.length || new Set(actions).size !== actions.length || actions.some(id => typeof id !== 'string' || !id) || typeof start !== 'function') throw new Error('Invalid JSON bridge definition');
  return { async activate(ctx) {
    let transport, disposed = false, sequence = 0;
    const pending = new Map(), subscriptions = [];
    const encode = value => {
      const json = JSON.stringify(value);
      if (Buffer.byteLength(json, 'utf8') > LIMIT) throw new Error('JSON bridge message too large');
      return json;
    };
    const send = value => {
      if (!disposed) {
        const returned = transport.send(encode(value));
        if (returned && typeof returned.then === 'function') returned.catch(fail);
      }
    };
    function settle(id, error, result) {
      const call = pending.get(id);
      if (!call) return;
      pending.delete(id); clearTimeout(call.timer); call.context.signal.removeEventListener('abort', call.abort);
      error ? call.reject(new Error(String(error).slice(0, 2000))) : call.resolve(result ?? {});
    }
    function fail(error) {
      for (const id of pending.keys()) settle(id, error.message || error);
      ctx.log('JSON bridge: ' + String(error.message || error).slice(0, 2000));
    }
    function receive(json) {
      if (disposed) return;
      try {
        if (typeof json !== 'string' || Buffer.byteLength(json, 'utf8') > LIMIT) throw new Error('Invalid JSON bridge message');
        const message = JSON.parse(json);
        if (!message || typeof message !== 'object' || Array.isArray(message)) throw new Error('Invalid JSON bridge envelope');
        if (message.type === 'result') {
          if (!Number.isSafeInteger(message.id)) throw new Error('Invalid JSON bridge request id');
          settle(message.id, message.error, message.result);
        } else if (message.type === 'service') {
          const call = pending.get(message.id);
          if (!call) return; // Cancelled/expired invocations cannot call host services.
          if (!METHODS.has(message.name) || typeof message.callId !== 'string' || !message.callId || message.callId.length > 100 || call.usedServices.has(message.callId) || call.services.size >= 16 || ++call.serviceCount > 64) throw new Error('Invalid or excessive JSON bridge service call');
          call.usedServices.add(message.callId);
          call.services.add(message.callId);
          Promise.resolve().then(() => {
            if (!pending.has(message.id)) throw new Error('Invocation expired');
            return call.context.services.call(message.name, message.args);
          }).then(result => {
            if (pending.get(message.id) === call) send({ type: 'service-result', id: message.id, callId: message.callId, result });
          }, error => {
            if (pending.get(message.id) === call) send({ type: 'service-result', id: message.id, callId: message.callId, error: String(error.message || error).slice(0, 2000) });
          }).catch(fail).finally(() => call.services.delete(message.callId));
        } else if (message.type === 'log') ctx.log(String(message.message).slice(0, 2000));
        else throw new Error('Unknown JSON bridge message type');
      } catch (error) { fail(error); }
    }
    async function dispose() {
      if (disposed) return;
      disposed = true;
      for (const id of pending.keys()) settle(id, 'JSON bridge disposed');
      for (const unsubscribe of subscriptions.reverse()) unsubscribe();
      try { await transport?.send(encode({ type: 'dispose' })); } catch { /* continue cleanup */ }
      await transport?.dispose?.();
    }
    try {
      transport = await start(receive);
      if (!transport || typeof transport.send !== 'function') throw new Error('JSON bridge requires a send function');
      for (const action of actions) subscriptions.push(ctx.handle(action, (context, input) => new Promise((resolve, reject) => {
        if (disposed || context.signal.aborted) return reject(new Error('Invocation cancelled'));
        if (pending.size >= 4) return reject(new Error('JSON bridge is busy'));
        const id = ++sequence;
        const abort = () => {
          settle(id, 'Invocation cancelled');
          try { send({ type: 'cancel', id }); } catch (error) { fail(error); }
        };
        const timer = setTimeout(() => { settle(id, 'JSON bridge timed out'); try { send({ type: 'cancel', id }); } catch (error) { fail(error); } }, 9500);
        pending.set(id, { resolve, reject, context, abort, timer, services: new Set(), usedServices: new Set(), serviceCount: 0 });
        context.signal.addEventListener('abort', abort, { once: true });
        try {
          const { language, source, file, selection, project } = context;
          send({ type: 'invoke', id, action, context: { language, source, file, selection, project }, input });
        } catch (error) { settle(id, error.message); }
      })));
      for (const event of ['projectChanged', 'buildFinished']) subscriptions.push(ctx.on(event, payload => send({ type: 'event', event, payload })));
      send({ type: 'init', apiVersion: 1, config: ctx.config });
      return dispose;
    } catch (error) { await dispose(); throw error; }
  } };
}

/** Small starter binding for languages exporting a string -> string function. */
function defineTextTransform(transform, action = 'uppercase') {
  if (typeof transform !== 'function') throw new Error('Expected a text transform');
  return defineJsonExtension({ actions: [action], start(receive) {
    return { async send(json) {
      const message = JSON.parse(json);
      if (message.type !== 'invoke') return;
      try {
        const { source, selection: { from, to }, language } = message.context;
        const result = from === to ? { message: language === 'zh' ? '请先选中文字。' : 'Select text first.' } : { edits: [{ from, to, insert: await transform(source.slice(from, to)) }] };
        receive(JSON.stringify({ type: 'result', id: message.id, result }));
      } catch (error) { receive(JSON.stringify({ type: 'result', id: message.id, error: String(error.message || error) })); }
    } };
  } });
}

module.exports = { defineJsonExtension, defineTextTransform };
