/**
 * Generates the Price Estimator PWA icon set from a single source design.
 *
 * Chromium-based browsers (including Brave) will not treat an app as
 * installable unless the manifest advertises raster icons of at least
 * 192x192 and 512x512. An SVG-only manifest fails that check, which is why
 * these PNGs are generated and committed.
 *
 * Run with: node scripts/generate-icons.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import sharp from 'sharp';

const OUT_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url));

const BRAND = '#1867c0';
const FOREGROUND = '#ffffff';
const LABEL = 'PE';

/**
 * @param size   Output edge length in pixels.
 * @param inset  Fraction of the canvas reserved as empty margin. Maskable
 *               icons need content inside the central 80% "safe zone",
 *               because launchers crop the icon to an arbitrary shape.
 * @param radius Corner radius as a fraction of size. Maskable icons must be
 *               full-bleed squares, so they use 0.
 */
function buildSvg({ size, inset, radius }) {
  const content = size * (1 - inset * 2);
  const fontSize = content * 0.46;
  const rx = size * radius;
  // Nudge the baseline so the glyphs sit optically centred.
  const baseline = size / 2 + fontSize * 0.35;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="${BRAND}"/>` +
      `<text x="${size / 2}" y="${baseline}" font-family="Arial, Helvetica, sans-serif"` +
      ` font-size="${fontSize}" font-weight="bold" fill="${FOREGROUND}"` +
      ` text-anchor="middle">${LABEL}</text>` +
      `</svg>`,
  );
}

const TARGETS = [
  // Standard icons: rounded, near full-bleed.
  { file: 'icon-192.png', size: 192, inset: 0.08, radius: 0.21 },
  { file: 'icon-512.png', size: 512, inset: 0.08, radius: 0.21 },
  // Maskable: square, content pulled into the safe zone.
  { file: 'icon-maskable-192.png', size: 192, inset: 0.2, radius: 0 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.2, radius: 0 },
  // iOS home screen: square, no transparency.
  { file: 'apple-touch-icon-180.png', size: 180, inset: 0.08, radius: 0 },
];

await mkdir(OUT_DIR, { recursive: true });

for (const target of TARGETS) {
  const pipeline = sharp(buildSvg(target));

  // Maskable and iOS icons must be fully opaque squares; launchers apply their
  // own shape and transparent corners render as artefacts. Rounded "any"
  // icons keep their alpha channel.
  if (target.radius === 0) pipeline.flatten({ background: BRAND });

  const png = await pipeline.png({ compressionLevel: 9 }).toBuffer();

  // Guard against a silently blank icon (e.g. missing font at build time).
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  let foreground = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) foreground += 1;
  }
  if (foreground < 100) {
    throw new Error(`${target.file} looks blank - the label did not rasterise.`);
  }

  await writeFile(new URL(target.file, `file://${OUT_DIR.replace(/\\/g, '/')}`), png);
  console.log(`${target.file.padEnd(28)} ${info.width}x${info.height}  ${png.length} bytes`);
}

console.log('\nDone.');
