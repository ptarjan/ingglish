import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const coreDir = join(import.meta.dirname, '..', '..');

const LIMIT = '--limit=500';

function run(script: string, args = '', timeout = 60_000): string {
  const allArgs = args ? `${args} ${LIMIT}` : LIMIT;
  const cmd = `npx vite-node scripts/g2p/${script}.ts -- ${allArgs}`;
  return execSync(cmd, {
    cwd: coreDir,
    encoding: 'utf-8',
    timeout,
  });
}

describe('g2p accuracy', () => {
  it('measure', () => {
    const output = run('measure');
    expect(output).toContain('Unweighted:');
    expect(output).toContain('Freq-weighted:');
  }, 30_000);

  it('freq-errors', () => {
    const output = run('freq-errors', '10');
    expect(output.length).toBeGreaterThan(0);
  }, 30_000);

  it('rule-errors', () => {
    const output = run('rule-errors');
    expect(output.length).toBeGreaterThan(0);
  }, 30_000);

  it('rule-stats', () => {
    const output = run('rule-stats');
    expect(output.length).toBeGreaterThan(0);
  }, 30_000);

  it('rule-words', () => {
    const output = run('rule-words', '"[A]=/AE/"');
    expect(output).toContain('Rule:');
  }, 30_000);

  it('default-errors', () => {
    const output = run('default-errors');
    expect(output.length).toBeGreaterThan(0);
  }, 30_000);

  it('error-analysis', () => {
    const output = run('error-analysis');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);
});
