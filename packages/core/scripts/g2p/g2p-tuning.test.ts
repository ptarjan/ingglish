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

describe('g2p tuning', () => {
  it.each([
    ['pattern-analysis', './pattern-analysis.js', []],
    ['find-rules (single letter)', './find-rules.js', ['A']],
    ['try-removal (single letter)', './try-removal.js', ['A']],
    ['try-reorder (single letter)', './try-reorder.js', ['A']],
    ['try-rule', './try-rule.js', ['A', '0', '[ATE] =/EY T/']],
    ['backtest', './backtest.js', []],
  ])('%s', async (_name, script, args) => {
    const output = await run(script, [...args]);
    expect(output.length).toBeGreaterThan(0);
  });

  it('hill-climb (dry run, 1 round)', async () => {
    const output = await run('./hill-climb.js', ['--max-rounds=1']);
    expect(output).toContain('Round 1');
  });
});
