import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const coreDir = join(import.meta.dirname, '..', '..');

function run(script: string, args = '', timeout = 60_000): string {
  const cmd = args
    ? `npx vite-node scripts/g2p/${script}.ts -- ${args}`
    : `npx vite-node scripts/g2p/${script}.ts`;
  return execSync(cmd, {
    cwd: coreDir,
    encoding: 'utf-8',
    timeout,
  });
}

describe('g2p scripts (1/2)', () => {
  it('measure', () => {
    const output = run('measure');
    expect(output).toContain('Unweighted:');
    expect(output).toContain('Freq-weighted:');
  }, 60_000);

  it('freq-errors', () => {
    const output = run('freq-errors', '10');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('rule-errors', () => {
    const output = run('rule-errors');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('rule-stats', () => {
    const output = run('rule-stats');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('rule-words', () => {
    const output = run('rule-words', '"[A]=/AE/"');
    expect(output).toContain('Rule:');
  }, 60_000);

  it('default-errors', () => {
    const output = run('default-errors');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('error-analysis', () => {
    const output = run('error-analysis', '', 120_000);
    expect(output.length).toBeGreaterThan(0);
  }, 180_000);
});
