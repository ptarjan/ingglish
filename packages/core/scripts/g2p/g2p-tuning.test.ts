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
  it('pattern-analysis', async () => {
    const output = await run('./pattern-analysis.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('find-rules (single letter)', async () => {
    const output = await run('./find-rules.js', ['A']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('try-removal (single letter)', async () => {
    const output = await run('./try-removal.js', ['A']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('try-reorder (single letter)', async () => {
    const output = await run('./try-reorder.js', ['A']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('try-rule', async () => {
    const output = await run('./try-rule.js', ['A', '0', '[ATE] =/EY T/']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('hill-climb (dry run, 1 round)', async () => {
    const output = await run('./hill-climb.js', ['--max-rounds=1']);
    expect(output).toContain('Round 1');
  });

  it('backtest', async () => {
    const output = await run('./backtest.js');
    expect(output.length).toBeGreaterThan(0);
  });
});
