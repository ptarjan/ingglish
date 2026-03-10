import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';

const distDir = join(import.meta.dirname, '..', 'dist');

async function run(scriptPath: string): Promise<string> {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const mod = await import(scriptPath);
    await mod.main();
    return lines.join('\n');
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
  }
}

describe('copy-assets', () => {
  it('copies manifest, popup.html, popup.css to dist/', async () => {
    if (!existsSync(distDir)) {
      return; // Skip if dist/ doesn't exist (needs build first)
    }
    const output = await run('./copy-assets.js');
    expect(output).toContain('Copied assets');
    expect(existsSync(join(distDir, 'manifest.json'))).toBe(true);
    expect(existsSync(join(distDir, 'popup.html'))).toBe(true);
    expect(existsSync(join(distDir, 'popup.css'))).toBe(true);
  });
});

describe('generate-icons', () => {
  it('generates icon PNGs in dist/icons/', async () => {
    if (!existsSync(distDir)) {
      return; // Skip if dist/ doesn't exist (needs build first)
    }
    const output = await run('./generate-icons.js');
    expect(output).toContain('All icons generated');
    expect(existsSync(join(distDir, 'icons', 'icon16.png'))).toBe(true);
    expect(existsSync(join(distDir, 'icons', 'icon128.png'))).toBe(true);
  });
});
