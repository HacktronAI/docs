// Generates a neutral images/placeholder.png with zero dependencies.
//
// New sections that need a visual reference this placeholder in a <Frame> and
// add a manifest entry with status "todo"; the next screenshot run replaces it.
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const W = 1440;
const H = 900;

// Almond-dark-ish neutral palette.
const BG = [14, 17, 22];
const PANEL = [22, 26, 32];
const STROKE = [60, 66, 76];
const ICON = [90, 98, 110];

const data = Buffer.alloc(W * H * 3);
function px(x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
}

// Background.
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) px(x, y, BG);

// Centered panel with a stroked border.
const pw = 760, ph = 460;
const px0 = (W - pw) >> 1, py0 = (H - ph) >> 1;
for (let y = py0; y < py0 + ph; y++) {
  for (let x = px0; x < px0 + pw; x++) {
    const edge = x < px0 + 3 || x >= px0 + pw - 3 || y < py0 + 3 || y >= py0 + ph - 3;
    px(x, y, edge ? STROKE : PANEL);
  }
}

// A simple "image" glyph: a sun (circle) and a mountain (triangle).
const cx = W >> 1, cy = H >> 1;
const sunX = cx - 150, sunY = cy - 90, sunR = 46;
for (let y = -sunR; y <= sunR; y++) {
  for (let x = -sunR; x <= sunR; x++) {
    if (x * x + y * y <= sunR * sunR) px(sunX + x, sunY + y, ICON);
  }
}
// Mountain triangle within the panel's lower half.
const baseY = py0 + ph - 70;
const apexX = cx + 40, apexY = cy - 20;
const halfBase = 230;
for (let y = apexY; y <= baseY; y++) {
  const t = (y - apexY) / (baseY - apexY);
  const half = Math.round(t * halfBase);
  for (let x = apexX - half; x <= apexX + half; x++) px(x, y, ICON);
}

// Encode as PNG (color type 2, 8-bit RGB).
function chunk(type, payload) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(payload.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, payload])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, payload, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // color type RGB
// 10,11,12 = compression/filter/interlace = 0

// Add filter byte (0) per scanline.
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  data.copy(raw, y * (W * 3 + 1) + 1, y * W * 3, (y + 1) * W * 3);
}
const idat = zlib.deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  sig,
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "..", "..", "images", "placeholder.png");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log(`Wrote ${out} (${png.length} bytes)`);
