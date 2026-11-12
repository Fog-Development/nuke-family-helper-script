// Packs the extension into tools/fixture-recorder/dist/nfh-fixture-recorder.xpi
// (an unsigned add-on: install it in a Firefox build that allows unsigned
// add-ons, or load extension/manifest.json from about:debugging instead).
//
//   npm run recorder:xpi
//
// An .xpi is a zip; this writes one with stored (uncompressed) entries, which
// needs no zip library.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("./extension/", import.meta.url));
const OUT_DIR = fileURLToPath(new URL("./dist/", import.meta.url));

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const files = readdirSync(SRC, { recursive: true })
  .map(String)
  .filter((f) => !f.endsWith(".map"))
  .map((f) => f.split("\\").join("/"))
  .filter((f) => {
    try {
      readFileSync(join(SRC, f));
      return true;
    } catch {
      return false; // a directory
    }
  })
  .sort();

const locals = [];
const centrals = [];
let offset = 0;
for (const name of files) {
  const data = readFileSync(join(SRC, name));
  const nameBuf = Buffer.from(name, "utf8");
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(10, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // utf-8 names
  local.writeUInt16LE(0, 8); // stored
  local.writeUInt32LE(0, 10); // time/date
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  locals.push(local, nameBuf, data);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(10, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt32LE(0, 12);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(data.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, nameBuf);
  offset += local.length + nameBuf.length + data.length;
}
const centralSize = centrals.reduce((n, b) => n + b.length, 0);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(centralSize, 12);
end.writeUInt32LE(offset, 16);

mkdirSync(OUT_DIR, { recursive: true });
const out = join(OUT_DIR, "nfh-fixture-recorder.xpi");
writeFileSync(out, Buffer.concat([...locals, ...centrals, end]));
console.log(`wrote ${out} (${files.join(", ")})`);
