import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distIconsDir = join(__dirname, '../dist/icons');
const srcIconsDir = join(__dirname, '../src/icons');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1"/>
      <stop offset="100%" style="stop-color:#a855f7"/>
    </linearGradient>
  </defs>
  <circle cx="64" cy="64" r="60" fill="url(#grad)"/>
  <text x="64" y="82" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white" text-anchor="middle">I</text>
</svg>`;

const sizes = [16, 48, 128];

async function generateIcons() {
  await mkdir(distIconsDir, { recursive: true });

  for (const size of sizes) {
    const pngBuffer = await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toBuffer();

    await sharp(pngBuffer).toFile(join(distIconsDir, `icon${size}.png`));
    console.log(`Generated icon${size}.png`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);
