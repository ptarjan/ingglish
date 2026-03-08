import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const dictDir = join(import.meta.dirname, '..');

describe('ensure-dictionaries', () => {
  it('runs successfully (no-op when files exist)', () => {
    const output = execSync('node scripts/ensure-dictionaries.cjs', {
      cwd: dictDir,
      encoding: 'utf-8',
      timeout: 10_000,
    });
    expect(output).toMatch(/Dictionaries (exist|already exist)/);
  });
});

describe('analyze-variants', () => {
  it.skipIf(!existsSync('/tmp/cmudict-raw.dict'))(
    'runs successfully',
    () => {
      const output = execSync('node scripts/analyze-variants.js', {
        cwd: dictDir,
        encoding: 'utf-8',
        timeout: 30_000,
      });
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
    () => {
      const output = execSync('node scripts/cross-reference-dicts.js', {
        cwd: dictDir,
        encoding: 'utf-8',
        timeout: 60_000,
      });
      expect(output.length).toBeGreaterThan(0);
    },
    120_000
  );
});
