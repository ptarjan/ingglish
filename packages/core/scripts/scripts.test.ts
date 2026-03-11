import { describe, expect, it, vi } from 'vitest';

/** Import a script's main(), inject --limit=500 into argv, capture stdout. */
async function run(scriptPath: string, extraArgs: string[] = []): Promise<string> {
  const original = [...process.argv];
  process.argv = ['node', 'test', ...extraArgs, '--limit=500'];
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    const mod = await import(scriptPath);
    await mod.main();
    return lines.join('\n');
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
    process.argv = original;
  }
}

describe('core scripts', () => {
  it.each([
    ['check-docs-words', './check-docs-words.js', []],
    ['g2p-error-deep', './g2p-error-deep.js', []],
    ['g2p-fixable', './g2p-fixable.js', []],
    ['g2p-freq-errors', './g2p-freq-errors.js', ['10']],
    ['g2p-rule-errors', './g2p-rule-errors.js', ['10']],
    ['g2p-rule-stats', './g2p-rule-stats.js', ['10']],
    ['g2p-rule-words', './g2p-rule-words.js', ['[A]=/AE/', '10']],
    ['g2p-test-rules', './g2p-test-rules.js', []],
    ['phoneme-count-errors', './phoneme-count-errors.js', []],
    ['strategy-breakdown', './strategy-breakdown.js', []],
    ['vowel-minimal-pairs', './vowel-minimal-pairs.js', []],
  ] as const)('%s', async (_name, script, args) => {
    const output = await run(script, [...args]);
    expect(output.length).toBeGreaterThan(0);
  });

  it('coverage', async () => {
    const output = await run('./coverage.js');
    expect(output.length).toBeGreaterThan(0);
  }, 120_000);
});
