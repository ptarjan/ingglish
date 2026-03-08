import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const coreDir = join(import.meta.dirname, '..');

function run(script: string, args = '', timeout = 60_000): string {
  const cmd = args
    ? `npx vite-node scripts/${script}.ts -- ${args}`
    : `npx vite-node scripts/${script}.ts`;
  return execSync(cmd, {
    cwd: coreDir,
    encoding: 'utf-8',
    timeout,
  });
}

describe('core scripts', () => {
  it('check-docs-words', () => {
    const output = run('check-docs-words');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('coverage', () => {
    const output = run('coverage');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-error-deep', () => {
    const output = run('g2p-error-deep');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-fixable', () => {
    const output = run('g2p-fixable');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-freq-errors', () => {
    const output = run('g2p-freq-errors', '10');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-rule-errors', () => {
    const output = run('g2p-rule-errors', '10');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-rule-stats', () => {
    const output = run('g2p-rule-stats', '10');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-rule-words', () => {
    const output = run('g2p-rule-words', '"[A]=/AE/" 10');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-test-rules', () => {
    const output = run('g2p-test-rules');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('phoneme-count-errors', () => {
    const output = run('phoneme-count-errors');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('strategy-breakdown', () => {
    const output = run('strategy-breakdown');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('vowel-minimal-pairs', () => {
    const output = run('vowel-minimal-pairs');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);
});
