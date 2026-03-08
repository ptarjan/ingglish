import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const domDir = join(import.meta.dirname, '..');

function run(script: string, timeout = 60_000): string {
  return execSync(`npx vite-node scripts/${script}.ts`, {
    cwd: domDir,
    encoding: 'utf-8',
    timeout,
  });
}

describe('dom profile scripts', () => {
  it('profile-dom', () => {
    const output = run('profile-dom');
    expect(output).toContain('=== DOM Translation Profile ===');
  }, 60_000);

  it('profile-process-node', () => {
    const output = run('profile-process-node');
    expect(output).toContain('=== processTextNode Deep Profile ===');
  }, 60_000);

  it('profile-real-html', () => {
    const output = run('profile-real-html');
    expect(output).toContain('=== Real HTML DOM Profile ===');
  }, 60_000);

  it('profile-tooltips', () => {
    const output = run('profile-tooltips');
    expect(output).toContain('=== Tooltip Performance Profile ===');
  }, 60_000);

  it('profile-tree-walker', () => {
    const output = run('profile-tree-walker');
    expect(output).toContain('=== TreeWalker Alternatives Profile ===');
  }, 60_000);

  it('profile-walker-only', () => {
    const output = run('profile-walker-only');
    expect(output).toContain('=== TreeWalker Profile (Pre-parsed DOM) ===');
  }, 60_000);

  it('profile-wikipedia', () => {
    const output = run('profile-wikipedia');
    expect(output).toContain('=== Wikipedia DOM Profile ===');
  }, 60_000);
});
