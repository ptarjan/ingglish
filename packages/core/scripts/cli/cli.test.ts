import { execSync } from 'child_process';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

const coreDir = join(import.meta.dirname, '..', '..');

function run(script: string, args: string): string {
  return execSync(`npx vite-node scripts/cli/${script}.ts -- ${args}`, {
    cwd: coreDir,
    encoding: 'utf-8',
    timeout: 30_000,
  });
}

describe('translate CLI', () => {
  it('shows usage when run without arguments', () => {
    try {
      run('translate', '');
    } catch (err) {
      // Exits with code 1 but prints usage
      const output = (err as { stdout: string }).stdout;
      expect(output).toContain('Usage:');
    }
  });

  it('translates a word forward', () => {
    const output = run('translate', '"hello"');
    expect(output).toContain('hello');
    expect(output).toContain('->');
  });

  it('translates a word in reverse mode', () => {
    const output = run('translate', '-r "haloh"');
    expect(output).toContain('Ingglish:');
    expect(output).toContain('English:');
  });
});

describe('debug-roundtrip CLI', () => {
  it('shows usage when run without arguments', () => {
    try {
      run('debug-roundtrip', '');
    } catch (err) {
      const output = (err as { stdout: string }).stdout;
      expect(output).toContain('Usage:');
    }
  });

  it('debugs a single word', () => {
    const output = run('debug-roundtrip', '"hello"');
    expect(output).toContain('CMU Dictionary Lookup');
    expect(output).toContain('Round-trip');
  });
});
