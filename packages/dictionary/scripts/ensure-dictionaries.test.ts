import { execSync } from 'child_process';
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
    expect(output).toContain('Dictionaries exist');
  });
});
