import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const coreDir = join(import.meta.dirname, '..', '..');

function run(script: string, args = '', timeout = 60_000): string {
  const cmd = args
    ? `npx vite-node scripts/analysis/${script}.ts -- ${args}`
    : `npx vite-node scripts/analysis/${script}.ts`;
  return execSync(cmd, {
    cwd: coreDir,
    encoding: 'utf-8',
    timeout,
  });
}

describe('analysis scripts', () => {
  it('analyze-identical-words', () => {
    const output = run('analyze-identical-words');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('british-vs-american', () => {
    const output = run('british-vs-american');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('cmu-error-scan', () => {
    const output = run('cmu-error-scan');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('compare-schwa', () => {
    const output = run('compare-schwa');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('compound-words-scan', () => {
    const output = run('compound-words-scan');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('cross-reference-top-words', () => {
    const output = run('cross-reference-top-words');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('exhaustive-search', () => {
    const output = run('exhaustive-search', '--limit=5');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('familiarity-search', () => {
    const output = run('familiarity-search', '--limit=5');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('find-more-errors', () => {
    const output = run('find-more-errors');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-roundtrip-search', () => {
    const output = run('g2p-roundtrip-search', '--limit=5');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it.skipIf(!existsSync('/tmp/cmudict-raw.dict'))(
    'homograph-defaults-scan',
    () => {
      const output = run('homograph-defaults-scan');
      expect(output.length).toBeGreaterThan(0);
    },
    60_000
  );

  it('missing-spelling-patterns', () => {
    const output = run('missing-spelling-patterns');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('orthotactic-search', () => {
    const output = run('orthotactic-search', '--limit=5');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('prefix-consistency-scan', () => {
    const output = run('prefix-consistency-scan');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('pronunciation-consistency', () => {
    const output = run('pronunciation-consistency');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('rhyme-consistency-scan', () => {
    const output = run('rhyme-consistency-scan');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('spelling-rules-scan', () => {
    const output = run('spelling-rules-scan');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);
});
