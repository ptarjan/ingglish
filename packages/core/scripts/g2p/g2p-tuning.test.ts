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

describe('g2p tuning', () => {
  it('pattern-analysis', () => {
    const output = run('pattern-analysis');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('find-rules (single letter)', () => {
    const output = run('find-rules', 'A');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('try-removal (single letter)', () => {
    const output = run('try-removal', 'A');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('try-reorder (single letter)', () => {
    const output = run('try-reorder', 'A');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('try-rule', () => {
    const output = run('try-rule', 'A 0 "[ATE] =/EY T/"');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('hill-climb (dry run, 1 round)', () => {
    const output = run('hill-climb', '--max-rounds=1', 120_000);
    expect(output).toContain('Round 1');
  }, 180_000);

  it('backtest', () => {
    const output = run('backtest', '', 120_000);
    expect(output.length).toBeGreaterThan(0);
  }, 180_000);
});
