/**
 * Generates the Price Estimator PWA icon set.
 *
 * Source artwork: drop your logo at `brand/logo.svg` (or .png/.jpg/.webp).
 * That folder is not published by Vite - only the generated PNGs under
 * `public/icons/` are. When no file is present the script falls back to a
 * lettermark placeholder so a fresh clone still builds.
 *
 * Chromium-based browsers (including Brave) will not treat an app as
 * installable unless the manifest advertises raster icons of at least
 * 192x192 and 512x512. An SVG-only manifest fails that check, which is why
 * these PNGs are generated and committed.
 *
 * Run with:      node scripts/generate-icons.mjs
 * Custom canvas: ICON_BG=#ffffff node scripts/generate-icons.mjs
 */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath, URL } from 'node:url';
import sharp from 'sharp';

const OUT_DIR = fileURLToPath(new URL('../public/icons/', import.meta.url));
const BRAND_DIR = new URL('../brand/', import.meta.url);

/**
 * Colour filled behind the logo. Icons cannot be transparent (launchers and
 * iOS composite them onto unknown surfaces), so a solid canvas is required.
 * White matches the manifest `background_color` and blends with logos that
 * carry their own white backdrop. Override for a coloured canvas:
 *   ICON_BG=#1867c0 node scripts/generate-icons.mjs
 */
const BACKGROUND = process.env.ICON_BG ?? '#ffffff';

/** Tried in order; the first file that exists wins. */
const SOURCE_CANDIDATES = ['logo.svg', 'logo.png', 'logo.jpg', 'logo.jpeg', 'logo.webp'];

const PLACEHOLDER_LABEL = 'PE';
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

/** Square the logo is rendered into before being scaled down per target. */
const MASTER_SIZE = 1024;

/**
 * @param size   Output edge length in pixels.
 * @param inset  Fraction of the canvas reserved as empty margin. Maskable
 *               icons need content inside the central 80% "safe zone",
 *               because launchers crop the icon to an arbitrary shape.
 * @param radius Corner radius as a fraction of size. Maskable icons must be
 *               full-bleed squares, so they use 0.
 */
const TARGETS = [
  // Standard icons: rounded, near full-bleed.
  { file: 'icon-192.png', size: 192, inset: 0.08, radius: 0.21 },
  { file: 'icon-512.png', size: 512, inset: 0.08, radius: 0.21 },
  // Maskable: square, content pulled into the safe zone.
  { file: 'icon-maskable-192.png', size: 192, inset: 0.2, radius: 0 },
  { file: 'icon-maskable-512.png', size: 512, inset: 0.2, radius: 0 },
  // iOS home screen: square, no transparency.
  { file: 'apple-touch-icon-180.png', size: 180, inset: 0.08, radius: 0 },
  // Browser tab.
  { file: 'favicon-32.png', size: 32, inset: 0.04, radius: 0 },
];

/** Lettermark used when `brand/` holds no artwork. */
function buildPlaceholder() {
  const fontSize = MASTER_SIZE * 0.62;
  const baseline = MASTER_SIZE / 2 + fontSize * 0.35;

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MASTER_SIZE}" height="${MASTER_SIZE}"` +
      ` viewBox="0 0 ${MASTER_SIZE} ${MASTER_SIZE}">` +
      `<text x="${MASTER_SIZE / 2}" y="${baseline}" font-family="Arial, Helvetica, sans-serif"` +
      ` font-size="${fontSize}" font-weight="bold" fill="#1867c0"` +
      ` text-anchor="middle">${PLACEHOLDER_LABEL}</text>` +
      `</svg>`,
  );
}

async function loadSource() {
  for (const name of SOURCE_CANDIDATES) {
    try {
      return { buffer: await readFile(new URL(name, BRAND_DIR)), name };
    } catch {
      // Try the next candidate extension.
    }
  }
  return { buffer: buildPlaceholder(), name: 'built-in placeholder' };
}

/**
 * Rasterises the source once at a generous size. SVGs are rendered at high
 * density first, because scaling a low-density render up produces soft edges.
 *
 * The uniform border most logo exports carry is trimmed away, so the padding
 * in the generated icons is the one each target asks for rather than the
 * artwork's own margin stacked on top of it. Without this the logo looks
 * shrunken inside the maskable safe zone.
 */
async function buildMaster(buffer) {
  const raster = await sharp(buffer, { density: 600 }).png().toBuffer();

  let trimmed = raster;
  try {
    trimmed = await sharp(raster).trim({ threshold: 12 }).png().toBuffer();
  } catch {
    // `trim` throws when the image is a single flat colour; keep the original.
  }

  return sharp(trimmed)
    .resize(MASTER_SIZE, MASTER_SIZE, { fit: 'inside', background: TRANSPARENT })
    .png()
    .toBuffer();
}

function buildCanvas({ size, radius }) {
  const rx = size * radius;
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"` +
      ` viewBox="0 0 ${size} ${size}">` +
      `<rect width="${size}" height="${size}" rx="${rx}" ry="${rx}" fill="${BACKGROUND}"/>` +
      `</svg>`,
  );
}

async function countDifferingPixels(a, b) {
  const [rawA, rawB] = await Promise.all([
    sharp(a).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(b).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);

  let differing = 0;
  for (let i = 0; i < rawA.data.length; i += rawA.info.channels) {
    for (let channel = 0; channel < rawA.info.channels; channel += 1) {
      if (Math.abs(rawA.data[i + channel] - rawB.data[i + channel]) > 8) {
        differing += 1;
        break;
      }
    }
  }
  return differing;
}

const source = await loadSource();
const master = await buildMaster(source.buffer);

await mkdir(OUT_DIR, { recursive: true });

console.log(`Source: ${source.name}`);
console.log(`Canvas: ${BACKGROUND}\n`);

for (const target of TARGETS) {
  const content = Math.round(target.size * (1 - target.inset * 2));

  const logo = await sharp(master)
    .resize(content, content, { fit: 'inside', background: TRANSPARENT })
    .png()
    .toBuffer();

  const canvas = buildCanvas(target);
  const pipeline = sharp(canvas).composite([{ input: logo, gravity: 'center' }]);

  // Maskable and iOS icons must be fully opaque squares; launchers apply their
  // own shape and transparent corners render as artefacts. Rounded "any"
  // icons keep their alpha channel.
  if (target.radius === 0) pipeline.flatten({ background: BACKGROUND });

  const png = await pipeline.png({ compressionLevel: 9 }).toBuffer();

  // Guard against a silently blank icon: the composited result must differ
  // from the bare canvas, otherwise the logo failed to rasterise.
  const blankReference = await sharp(canvas).png().toBuffer();
  const differing = await countDifferingPixels(png, blankReference);
  if (differing < 16) {
    throw new Error(`${target.file} looks blank - the logo did not rasterise.`);
  }

  const { width, height } = await sharp(png).metadata();

  await writeFile(new URL(target.file, `file://${OUT_DIR.replace(/\\/g, '/')}`), png);
  console.log(`${target.file.padEnd(28)} ${width}x${height}  ${png.length} bytes`);
}

console.log('\nDone.');
