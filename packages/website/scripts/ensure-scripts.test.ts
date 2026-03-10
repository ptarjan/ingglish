import { describe, expect, it, vi } from 'vitest';

async function run(scriptPath: string): Promise<string> {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  try {
    const mod = await import(scriptPath);
    await mod.main();
    return lines.join('\n');
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  }
}

describe('check-language-samples', () => {
  it('runs and reports coverage', async () => {
    const output = await run('./check-language-samples');
    expect(output).toContain('words found');
  }, 90_000);
});

describe('ensure-kaikki', () => {
  it('runs successfully (no-op when files exist)', async () => {
    const output = await run('./ensure-kaikki.cjs');
    expect(output).toContain('Kaikki IPA data exists');
  });
});

describe('ensure-ipa-dicts', () => {
  it('runs successfully (no-op when files exist)', async () => {
    const output = await run('./ensure-ipa-dicts.cjs');
    expect(output).toContain('IPA dictionaries exist');
  });
});
