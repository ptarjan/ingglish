import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const websiteDir = join(import.meta.dirname, '..');

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
