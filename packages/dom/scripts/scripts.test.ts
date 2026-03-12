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
  it.each([
    ['profile-dom', '=== DOM Translation Profile ==='],
    ['profile-process-node', '=== processTextNode Deep Profile ==='],
    ['profile-real-html', '=== Real HTML DOM Profile ==='],
    ['profile-tooltips', '=== Tooltip Performance Profile ==='],
    ['profile-tree-walker', '=== TreeWalker Alternatives Profile ==='],
    ['profile-walker-only', '=== TreeWalker Profile (Pre-parsed DOM) ==='],
    ['profile-wikipedia', '=== Wikipedia DOM Profile ==='],
  ])(
    '%s outputs expected header',
    async (script, expectedHeader) => {
      const output = await run(`./${script}`);
      expect(output).toContain(expectedHeader);
    },
    60_000
  );
});
