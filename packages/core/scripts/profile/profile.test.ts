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
  it('benchmark', async () => {
    const output = await run('./benchmark.js');
    expect(output).toContain('=== Ingglish Core Benchmarks ===');
  });

  it('convert', async () => {
    const output = await run('./convert.js');
    expect(output).toContain('=== arpabetToIngglish Deep Profile ===');
  });

  it('cpu-profile', async () => {
    const output = await run('./cpu-profile.js');
    expect(output.length).toBeGreaterThan(0);
  });

  it('overview', async () => {
    const output = await run('./overview.js');
    expect(output).toContain('=== Ingglish Performance Profile ===');
  });

  it('translate', async () => {
    const output = await run('./translate.js');
    expect(output).toContain('=== translateSync Deep Profile ===');
  });
});
