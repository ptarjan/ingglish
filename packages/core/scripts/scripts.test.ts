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
  it('check-docs-words', async () => {
    const output = await run('./check-docs-words.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('coverage', async () => {
    const output = await run('./coverage.js');
    expect(output.length).toBeGreaterThan(0);
  }, 120_000);

  it('g2p-error-deep', async () => {
    const output = await run('./g2p-error-deep.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('g2p-fixable', async () => {
    const output = await run('./g2p-fixable.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('g2p-freq-errors', async () => {
    const output = await run('./g2p-freq-errors.js', ['10']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('g2p-rule-errors', async () => {
    const output = await run('./g2p-rule-errors.js', ['10']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('g2p-rule-stats', async () => {
    const output = await run('./g2p-rule-stats.js', ['10']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('g2p-rule-words', async () => {
    const output = await run('./g2p-rule-words.js', ['[A]=/AE/', '10']);
    expect(output.length).toBeGreaterThan(0);
  });

  it('g2p-test-rules', async () => {
    const output = await run('./g2p-test-rules.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('phoneme-count-errors', async () => {
    const output = await run('./phoneme-count-errors.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('strategy-breakdown', async () => {
    const output = await run('./strategy-breakdown.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('vowel-minimal-pairs', async () => {
    const output = await run('./vowel-minimal-pairs.js');
    expect(output.length).toBeGreaterThan(0);
  });
});
