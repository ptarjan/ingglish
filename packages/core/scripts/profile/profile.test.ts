import { describe, expect, it, vi } from 'vitest';

/** Import a script's main(), capture stdout. */
async function run(scriptPath: string): Promise<string> {
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
  }
}

describe('profile scripts', () => {
  it.each([
    ['benchmark', './benchmark.js', '=== Ingglish Core Benchmarks ==='],
    ['convert', './convert.js', '=== arpabetToIngglish Deep Profile ==='],
    ['overview', './overview.js', '=== Ingglish Performance Profile ==='],
    ['translate', './translate.js', '=== translateSync Deep Profile ==='],
  ])('%s', async (_name, script, expected) => {
    const output = await run(script);
    expect(output).toContain(expected);
  });

  it('cpu-profile', async () => {
    const output = await run('./cpu-profile.js');
    expect(output.length).toBeGreaterThan(0);
  });
});
