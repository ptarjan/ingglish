import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const coreDir = join(import.meta.dirname, '..', '..');

function run(script: string, timeout = 60_000): string {
  return execSync(`npx vite-node scripts/profile/${script}.ts`, {
    cwd: coreDir,
    encoding: 'utf-8',
    timeout,
  });
}

describe('profile scripts', () => {
  it('benchmark', () => {
    const output = run('benchmark');
    expect(output).toContain('=== Ingglish Core Benchmarks ===');
  }, 60_000);

  it('convert', () => {
    const output = run('convert');
    expect(output).toContain('=== arpabetToIngglish Deep Profile ===');
  }, 60_000);

  it('cpu-profile', () => {
    const output = run('cpu-profile');
    expect(output.length).toBeGreaterThan(0);
  }, 60_000);

  it('overview', () => {
    const output = run('overview');
    expect(output).toContain('=== Ingglish Performance Profile ===');
  }, 60_000);

  it('translate', () => {
    const output = run('translate');
    expect(output).toContain('=== translateSync Deep Profile ===');
  }, 60_000);
});
