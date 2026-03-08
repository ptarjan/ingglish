import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const websiteDir = join(import.meta.dirname, '..');

describe('check-language-samples', () => {
  it('runs and reports coverage', () => {
    try {
      const output = execSync('npx tsx --conditions=source scripts/check-language-samples.ts', {
        cwd: websiteDir,
        encoding: 'utf-8',
        timeout: 30_000,
      });
      expect(output).toContain('words found');
    } catch (err) {
      // Exits with code 1 when missing words exist (expected)
      const output = (err as { stdout: string }).stdout;
      expect(output).toContain('words found');
    }
  }, 60_000);
});

describe('ensure-kaikki', () => {
  it('runs successfully (no-op when files exist)', () => {
    const output = execSync('node scripts/ensure-kaikki.cjs', {
      cwd: websiteDir,
      encoding: 'utf-8',
      timeout: 10_000,
    });
    expect(output).toContain('Kaikki IPA data exists');
  });
});

describe('ensure-ipa-dicts', () => {
  it('runs successfully (no-op when files exist)', () => {
    const output = execSync('node scripts/ensure-ipa-dicts.cjs', {
      cwd: websiteDir,
      encoding: 'utf-8',
      timeout: 10_000,
    });
    expect(output).toContain('IPA dictionaries exist');
  });
});
