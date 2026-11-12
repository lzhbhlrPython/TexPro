'use strict';
const zlib = require('node:zlib');
const { relative } = require('./schema.cjs');
const LIMIT = 16 * 1024 * 1024;
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ 0xffffffff) >>> 0;
}
function unpack(bytes) {
  if (!Buffer.isBuffer(bytes) && bytes instanceof Uint8Array) bytes = Buffer.from(bytes);
  if (!Buffer.isBuffer(bytes) || bytes.length > LIMIT || bytes.length < 22) throw new Error('Invalid extension archive size');
  // Deliberately small ZIP subset: UTF-8, regular files, stored/deflate, no ZIP64 or encryption.
  let end = bytes.length - 22;
  while (end >= Math.max(0, bytes.length - 65557) && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < 0 || end < bytes.length - 65557 || bytes.length !== end + 22 + bytes.readUInt16LE(end + 20)) throw new Error('Invalid ZIP directory');
  const count = bytes.readUInt16LE(end + 10), size = bytes.readUInt32LE(end + 12), offset = bytes.readUInt32LE(end + 16);
  if (bytes.readUInt16LE(end + 4) || bytes.readUInt16LE(end + 6) || count !== bytes.readUInt16LE(end + 8) || !count || count > 300 || offset + size !== end) throw new Error('Unsupported ZIP directory');
  const files = new Map(), folded = new Set(); let at = offset, total = 0;
  for (let index = 0; index < count; index++) {
    if (at + 46 > end || bytes.readUInt32LE(at) !== 0x02014b50) throw new Error('Invalid ZIP entry');
    const flags = bytes.readUInt16LE(at + 8), method = bytes.readUInt16LE(at + 10), crc = bytes.readUInt32LE(at + 16);
    const compressed = bytes.readUInt32LE(at + 20), length = bytes.readUInt32LE(at + 24), n = bytes.readUInt16LE(at + 28), extra = bytes.readUInt16LE(at + 30), comment = bytes.readUInt16LE(at + 32), mode = bytes.readUInt32LE(at + 38) >>> 16, start = bytes.readUInt32LE(at + 42);
    if (at + 46 + n + extra + comment > end || flags & ~0x808 || ![0, 8].includes(method) || length > LIMIT || (total += length) > LIMIT || ((mode & 0xf000) && (mode & 0xf000) !== 0x8000)) throw new Error('Unsupported or oversized ZIP entry');
    const nameBytes = bytes.subarray(at + 46, at + 46 + n), name = nameBytes.toString('utf8'); relative(name);
    if (!Buffer.from(name).equals(nameBytes) || /[. ]$/.test(name) || name.split('/').some(p => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)) || folded.has(name.toLowerCase())) throw new Error('Unsafe or duplicate package path');
    folded.add(name.toLowerCase());
    if (start + 30 > offset || bytes.readUInt32LE(start) !== 0x04034b50 || bytes.readUInt16LE(start + 6) !== flags || bytes.readUInt16LE(start + 8) !== method) throw new Error('Invalid ZIP local header');
    const localN = bytes.readUInt16LE(start + 26), localExtra = bytes.readUInt16LE(start + 28), dataAt = start + 30 + localN + localExtra;
    if (dataAt + compressed > offset || !bytes.subarray(start + 30, start + 30 + localN).equals(nameBytes)) throw new Error('Invalid ZIP payload');
    const data = bytes.subarray(dataAt, dataAt + compressed);
    const content = method === 8 ? zlib.inflateRawSync(data, { maxOutputLength: Math.max(1, length) }) : data;
    if (content.length !== length || crc32(content) !== crc) throw new Error('Corrupted extension archive');
    files.set(name, content); at += 46 + n + extra + comment;
  }
  if (at !== end) throw new Error('Invalid ZIP directory length');
  return files;
}
function pack(files) {
  const locals = [], centrals = []; let offset = 0;
  for (const [name, value] of files) {
    relative(name); const n = Buffer.from(name), data = Buffer.from(value), crc = crc32(data);
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6); local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(n.length, 26);
    const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(0x800, 8); central.writeUInt32LE(crc, 16); central.writeUInt32LE(data.length, 20); central.writeUInt32LE(data.length, 24); central.writeUInt16LE(n.length, 28); central.writeUInt32LE(offset, 42);
    locals.push(local, n, data); centrals.push(central, n); offset += local.length + n.length + data.length;
  }
  const directory = Buffer.concat(centrals), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.size, 8); end.writeUInt16LE(files.size, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  const result = Buffer.concat([...locals, directory, end]); unpack(result); return result;
}
module.exports = { pack, unpack, crc32, LIMIT };
