import { describe, expect, it, vi } from 'vitest';

/** Import a script's main(), inject args into argv, capture stdout. */
async function run(
  scriptPath: string,
  args: string[] = []
): Promise<{ stdout: string; exitCode: number | null }> {
  const original = [...process.argv];
  process.argv = ['node', 'test', ...args];
  const lines: string[] = [];
  let exitCode: number | null = null;
  const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  });
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
    exitCode = (code as number) ?? 0;
    throw new Error(`process.exit(${code})`);
  });
  try {
    const mod = await import(scriptPath);
    await mod.main();
  } catch (e) {
    if (!(e instanceof Error && e.message.startsWith('process.exit'))) throw e;
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
    process.argv = original;
  }
  return { stdout: lines.join('\n'), exitCode };
}

describe('translate CLI', () => {
  it('shows usage when run without arguments', async () => {
    const { stdout, exitCode } = await run('./translate.js');
    expect(stdout).toContain('Usage:');
    expect(exitCode).toBe(1);
  });

  it('translates a word forward', async () => {
    const { stdout } = await run('./translate.js', ['hello']);
    expect(stdout).toContain('hello');
    expect(stdout).toContain('->');
  });

  it('translates a word in reverse mode', async () => {
    const { stdout } = await run('./translate.js', ['-r', 'haloh']);
    expect(stdout).toContain('Ingglish:');
    expect(stdout).toContain('English:');
  });
});

describe('debug-roundtrip CLI', () => {
  it('shows usage when run without arguments', async () => {
    const { stdout, exitCode } = await run('./debug-roundtrip.js');
    expect(stdout).toContain('Usage:');
    expect(exitCode).toBe(1);
  });

  it('debugs a single word', async () => {
    const { stdout } = await run('./debug-roundtrip.js', ['hello']);
    expect(stdout).toContain('CMU Dictionary Lookup');
    expect(stdout).toContain('Round-trip');
  });
});

describe('collision-analysis CLI', () => {
  it('runs and produces collision report', async () => {
    const { stdout } = await run('./collision-analysis.js');
    expect(stdout).toContain('Collision Analysis');
    expect(stdout).toContain('Total words analyzed');
  });
});
