// Copyright (c) 2026 Michael Ladurner. Licensed under the MIT License. See LICENSE.
// Shared helpers for build, test and publish scripts. No dependencies.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Everything that ships inside the extension package. Nothing else is included.
export const EXT_ENTRIES = ["LICENSE", "manifest.json", "schema.json", "ui.css", "_locales", "icons", "src", "popup", "options"];

export function readManifest(root = ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
}

export function listFiles(root = ROOT) {
  const out = [];
  const walk = rel => {
    const abs = path.join(root, rel);
    const st = fs.statSync(abs);
    if (st.isDirectory()) for (const n of fs.readdirSync(abs).sort()) walk(path.posix.join(rel, n));
    else out.push(rel.split(path.sep).join("/"));
  };
  for (const e of EXT_ENTRIES) {
    if (!fs.existsSync(path.join(root, e))) throw new Error(`Missing ${e}`);
    walk(e);
  }
  return out;
}

export function copyExtension(dest, root = ROOT) {
  for (const f of listFiles(root)) {
    const to = path.join(dest, f);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(root, f), to);
  }
}

// ---- minimal ZIP writer (deflate, UTF-8 names) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) {
  if (typeof zlib.crc32 === "function") return zlib.crc32(buf) >>> 0;
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export function writeZip(zipPath, entries /* [{name, data:Buffer}] */) {
  const d = new Date(2026, 0, 1, 0, 0, 0); // fixed timestamp -> reproducible zips
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
  const locals = [], centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(time, 10); lh.writeUInt16LE(date, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(time, 12); ch.writeUInt16LE(date, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20);
    ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);
    offset += 30 + nameBuf.length + comp.length;
  }
  const cdSize = centrals.reduce((s, b) => s + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cdSize, 12); end.writeUInt32LE(offset, 16);
  fs.mkdirSync(path.dirname(zipPath), { recursive: true });
  fs.writeFileSync(zipPath, Buffer.concat([...locals, ...centrals, end]));
}

export function setOutput(key, value) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
}

export function fail(msg) {
  console.error(`::error::${msg}`);
  process.exit(1);
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));
