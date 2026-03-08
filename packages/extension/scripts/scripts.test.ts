import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const extDir = join(import.meta.dirname, '..');
const distDir = join(extDir, 'dist');

describe('copy-assets', () => {
  it('copies manifest, popup.html, popup.css to dist/', () => {
    if (!existsSync(distDir)) {
      return; // Skip if dist/ doesn't exist (needs build first)
    }
    const output = execSync('node scripts/copy-assets.js', {
      cwd: extDir,
      encoding: 'utf-8',
      timeout: 10_000,
    });
    expect(output).toContain('Copied assets');
    expect(existsSync(join(distDir, 'manifest.json'))).toBe(true);
    expect(existsSync(join(distDir, 'popup.html'))).toBe(true);
    expect(existsSync(join(distDir, 'popup.css'))).toBe(true);
  });
});

describe('generate-icons', () => {
  it('generates icon PNGs in dist/icons/', () => {
    if (!existsSync(distDir)) {
      return; // Skip if dist/ doesn't exist (needs build first)
    }
    const output = execSync('node scripts/generate-icons.js', {
      cwd: extDir,
      encoding: 'utf-8',
      timeout: 10_000,
    });
    expect(output).toContain('All icons generated');
    expect(existsSync(join(distDir, 'icons', 'icon16.png'))).toBe(true);
    expect(existsSync(join(distDir, 'icons', 'icon128.png'))).toBe(true);
  });
});
