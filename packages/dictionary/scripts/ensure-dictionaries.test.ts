import { existsSync } from 'fs';
import { describe, expect, it, vi } from 'vitest';

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

describe('ensure-dictionaries', () => {
  it('runs successfully (no-op when files exist)', async () => {
    const output = await run('./ensure-dictionaries.cjs');
    expect(output).toMatch(/Dictionaries (exist|already exist)/);
  });
});

describe('analyze-variants', () => {
  it.skipIf(!existsSync('/tmp/cmudict-raw.dict'))(
    'runs successfully',
    async () => {
      const output = await run('./analyze-variants.js');
      expect(output.length).toBeGreaterThan(0);
    },
    60_000
  );
});

describe('cross-reference-dicts', () => {
  const hasPrereqs =
    existsSync('/tmp/cmudict-raw.dict') &&
    existsSync('/tmp/wikipron-en-us.tsv') &&
    existsSync('/tmp/mpron.txt');
  it.skipIf(!hasPrereqs)(
    'runs successfully',
    async () => {
      const output = await run('./cross-reference-dicts.js');
      expect(output.length).toBeGreaterThan(0);
    },
    120_000
  );
});
