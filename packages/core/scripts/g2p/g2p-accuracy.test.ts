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

describe('g2p accuracy', () => {
  it.each([
    ['measure', './measure.js', [], ['Unweighted:', 'Freq-weighted:']],
    ['rule-words', './rule-words.js', ['[A]=/AE/'], ['Rule:']],
  ])('%s', async (_name, script, args, expected) => {
    const output = await run(script, [...args]);
    for (const str of expected) expect(output).toContain(str);
  });

  it.each([
    ['freq-errors', './freq-errors.js', ['10']],
    ['rule-errors', './rule-errors.js', []],
    ['rule-stats', './rule-stats.js', []],
    ['default-errors', './default-errors.js', []],
    ['error-analysis', './error-analysis.js', []],
  ])('%s', async (_name, script, args) => {
    const output = await run(script, [...args]);
    expect(output.length).toBeGreaterThan(0);
  });
});
