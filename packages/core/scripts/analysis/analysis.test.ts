import { existsSync } from 'fs';
import { describe, expect, it, vi } from 'vitest';

/** Import a script's main(), inject args into argv, capture stdout. */
async function run(scriptPath: string, args: string[] = []): Promise<string> {
  const original = [...process.argv];
  process.argv = ['node', 'test', ...args];
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  try {
    const mod = await import(scriptPath);
    await mod.main();
    return lines.join('\n');
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
    writeSpy.mockRestore();
    process.argv = original;
  }
}

describe('analysis scripts', () => {
  it('analyze-identical-words', async () => {
    const output = await run('./analyze-identical-words.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('british-vs-american', async () => {
    const output = await run('./british-vs-american.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('cmu-error-scan', async () => {
    const output = await run('./cmu-error-scan.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('compare-schwa', async () => {
    const output = await run('./compare-schwa.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('compound-words-scan', async () => {
    const output = await run('./compound-words-scan.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('cross-reference-top-words', async () => {
    const output = await run('./cross-reference-top-words.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('exhaustive-search', async () => {
    const output = await run('./exhaustive-search.js', ['--limit=2']);
    expect(output.length).toBeGreaterThan(0);
  }, 120_000);

  it('familiarity-search', async () => {
    const output = await run('./familiarity-search.js', ['--limit=2']);
    expect(output.length).toBeGreaterThan(0);
  }, 120_000);

  it('find-more-errors', async () => {
    const output = await run('./find-more-errors.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('g2p-roundtrip-search', async () => {
    const output = await run('./g2p-roundtrip-search.js', ['--limit=2']);
    expect(output.length).toBeGreaterThan(0);
  }, 120_000);

  it.skipIf(!existsSync('/tmp/cmudict-raw.dict'))(
    'homograph-defaults-scan',
    async () => {
      const output = await run('./homograph-defaults-scan.js');
      expect(output.length).toBeGreaterThan(0);
    },
    60_000
  );

  it('missing-spelling-patterns', async () => {
    const output = await run('./missing-spelling-patterns.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('orthotactic-search', async () => {
    const output = await run('./orthotactic-search.js', ['--limit=2']);
    expect(output.length).toBeGreaterThan(0);
  }, 120_000);

  it('prefix-consistency-scan', async () => {
    const output = await run('./prefix-consistency-scan.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('pronunciation-consistency', async () => {
    const output = await run('./pronunciation-consistency.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('rhyme-consistency-scan', async () => {
    const output = await run('./rhyme-consistency-scan.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('spelling-rules-scan', async () => {
    const output = await run('./spelling-rules-scan.js');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);
});
