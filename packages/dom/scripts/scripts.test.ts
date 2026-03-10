import { describe, expect, it, vi } from 'vitest';

async function run(scriptPath: string): Promise<string> {
  const lines: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
    lines.push(a.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  const writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  try {
    const mod = await import(scriptPath);
    await mod.main();
    return lines.join('\n');
  } finally {
    spy.mockRestore();
    errSpy.mockRestore();
    writeSpy.mockRestore();
  }
}

describe('dom profile scripts', () => {
  it('profile-dom', async () => {
    const output = await run('./profile-dom');
    expect(output).toContain('=== DOM Translation Profile ===');
  }, 60_000);

  it('profile-process-node', async () => {
    const output = await run('./profile-process-node');
    expect(output).toContain('=== processTextNode Deep Profile ===');
  }, 60_000);

  it('profile-real-html', async () => {
    const output = await run('./profile-real-html');
    expect(output).toContain('=== Real HTML DOM Profile ===');
  }, 60_000);

  it('profile-tooltips', async () => {
    const output = await run('./profile-tooltips');
    expect(output).toContain('=== Tooltip Performance Profile ===');
  }, 60_000);

  it('profile-tree-walker', async () => {
    const output = await run('./profile-tree-walker');
    expect(output).toContain('=== TreeWalker Alternatives Profile ===');
  }, 60_000);

  it('profile-walker-only', async () => {
    const output = await run('./profile-walker-only');
    expect(output).toContain('=== TreeWalker Profile (Pre-parsed DOM) ===');
  }, 60_000);

  it('profile-wikipedia', async () => {
    const output = await run('./profile-wikipedia');
    expect(output).toContain('=== Wikipedia DOM Profile ===');
  }, 60_000);
});
