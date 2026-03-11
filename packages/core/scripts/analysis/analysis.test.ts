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
  it.each([
    ['analyze-identical-words', './analyze-identical-words.js', []],
    ['british-vs-american', './british-vs-american.js', []],
    ['cmu-error-scan', './cmu-error-scan.js', []],
    ['compare-schwa', './compare-schwa.js', []],
    ['compound-words-scan', './compound-words-scan.js', []],
    ['cross-reference-top-words', './cross-reference-top-words.js', []],
    ['find-more-errors', './find-more-errors.js', []],
    ['missing-spelling-patterns', './missing-spelling-patterns.js', []],
    ['prefix-consistency-scan', './prefix-consistency-scan.js', []],
    ['pronunciation-consistency', './pronunciation-consistency.js', []],
    ['rhyme-consistency-scan', './rhyme-consistency-scan.js', []],
    ['spelling-rules-scan', './spelling-rules-scan.js', []],
  ] as const)(
    '%s',
    async (_name, script, args) => {
      const output = await run(script, [...args]);
      expect(output.length).toBeGreaterThan(0);
    },
    60_000
  );

  it.each([
    ['exhaustive-search', './exhaustive-search.js', ['--limit=2']],
    ['familiarity-search', './familiarity-search.js', ['--limit=2']],
    ['g2p-roundtrip-search', './g2p-roundtrip-search.js', ['--limit=2']],
    ['orthotactic-search', './orthotactic-search.js', ['--limit=2']],
  ] as const)(
    '%s',
    async (_name, script, args) => {
      const output = await run(script, [...args]);
      expect(output.length).toBeGreaterThan(0);
    },
    120_000
  );

  it.skipIf(!existsSync('/tmp/cmudict-raw.dict'))(
    'homograph-defaults-scan',
    async () => {
      const output = await run('./homograph-defaults-scan.js');
      expect(output.length).toBeGreaterThan(0);
    },
    60_000
  );
});
