import { copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', 'src');
const dist = join(__dirname, '..', 'dist');

const files = ['manifest.json', 'popup.html', 'popup.css'];
for (const file of files) {
  copyFileSync(join(src, file), join(dist, file));
}
console.log('Copied assets to dist/');
