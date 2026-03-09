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
  it('measure', async () => {
    const output = await run('./measure.js');
    expect(output).toContain('Unweighted:');
    expect(output).toContain('Freq-weighted:');
  });

  it('freq-errors', async () => {
    const output = await run('./freq-errors.js', ['10']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('rule-errors', async () => {
    const output = await run('./rule-errors.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('rule-stats', async () => {
    const output = await run('./rule-stats.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('rule-words', async () => {
    const output = await run('./rule-words.js', ['[A]=/AE/']);
    expect(output).toContain('Rule:');
  });

  it('default-errors', async () => {
    const output = await run('./default-errors.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('error-analysis', async () => {
    const output = await run('./error-analysis.js');
    expect(output.length).toBeGreaterThan(0);
  });
});
