import { describe, expect, it, vi } from 'vitest';
import { postprocessDocs } from '../../../scripts/postprocess-docs.js';
import { lintGitignoreContent } from '../../../scripts/pre-commit-checks.js';

describe('review-languages', () => {
  it('runs successfully', async () => {
    const lines: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => {
      lines.push(a.map(String).join(' '));
    });
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const mod = await import('../../../scripts/review-languages');
      await mod.main();
      expect(lines.join('\n').length).toBeGreaterThan(0);
    } finally {
      spy.mockRestore();
      errSpy.mockRestore();
    }
  }, 60_000);
});

describe('postprocessDocs', () => {
  it('links heading directly followed by Defined in', () => {
    const input = '### MyType\n\nDefined in: [types.ts:42](https://github.com/x/y/types.ts#L42)';
    const result = postprocessDocs(input);
    expect(result).toBe('### [MyType](https://github.com/x/y/types.ts#L42)');
  });

  it('links heading with code block before Defined in', () => {
    const input = [
      '### myFunction',
      '',
      '```ts',
      'function myFunction(): void',
      '```',
      '',
      'Defined in: [utils.ts:10](https://github.com/x/y/utils.ts#L10)',
    ].join('\n');
    const result = postprocessDocs(input);
    expect(result).toContain('### [myFunction](https://github.com/x/y/utils.ts#L10)');
    expect(result).toContain('```ts\nfunction myFunction(): void\n```');
  });

  it('handles ## through ##### heading levels', () => {
    const input = '## MyType\n\nDefined in: [a.ts:1](http://url)';
    expect(postprocessDocs(input)).toBe('## [MyType](http://url)');

    const input5 = '##### MyType\n\nDefined in: [a.ts:1](http://url)';
    expect(postprocessDocs(input5)).toBe('##### [MyType](http://url)');
  });

  it('leaves content without Defined in unchanged', () => {
    const input = '### MyType\n\nSome description.';
    expect(postprocessDocs(input)).toBe(input);
  });

  it('handles multiple headings', () => {
    const input = [
      '### TypeA\n\nDefined in: [a.ts:1](http://a)',
      '### TypeB\n\nDefined in: [b.ts:2](http://b)',
    ].join('\n\n');
    const result = postprocessDocs(input);
    expect(result).toContain('### [TypeA](http://a)');
    expect(result).toContain('### [TypeB](http://b)');
  });
});

describe('lintGitignoreContent', () => {
  it('returns no errors for clean content', () => {
    const content = '# comment\nnode_modules/\n*.log\n';
    expect(lintGitignoreContent(content, '.gitignore')).toEqual([]);
  });

  it('detects trailing whitespace', () => {
    const content = 'node_modules/ \n';
    const errors = lintGitignoreContent(content, '.gitignore');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('trailing whitespace');
  });

  it('detects duplicate patterns', () => {
    const content = 'dist/\nnode_modules/\ndist/\n';
    const errors = lintGitignoreContent(content, '.gitignore');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('duplicate pattern');
    expect(errors[0]).toContain('"dist/"');
  });

  it('does not flag leading whitespace after trim (pattern is trimmed)', () => {
    // The leading whitespace check uses line.trim(), so a line with leading spaces
    // will get trimmed before the check — but trailing whitespace IS detected
    const content = ' node_modules/\n';
    const errors = lintGitignoreContent(content, '.gitignore');
    // No leading whitespace error (pattern is trimmed), but trailing/leading
    // whitespace in the original line is irrelevant since trim is applied
    expect(errors.some((e) => e.includes('leading whitespace'))).toBe(false);
  });

  it('detects Windows-style backslashes', () => {
    const content = 'path\\to\\file\n';
    const errors = lintGitignoreContent(content, '.gitignore');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('forward slashes');
  });

  it('allows escaped backslashes', () => {
    const content = 'path\\\\with\\\\escaped\n';
    const errors = lintGitignoreContent(content, '.gitignore');
    expect(errors).toEqual([]);
  });

  it('skips comments and empty lines', () => {
    const content = '# comment\n\n# another\n\nnode_modules/\n';
    expect(lintGitignoreContent(content, '.gitignore')).toEqual([]);
  });

  it('includes filepath and line number in errors', () => {
    const content = 'ok\nbad \n';
    const errors = lintGitignoreContent(content, 'pkg/.gitignore');
    expect(errors[0]).toContain('pkg/.gitignore:2');
  });
});
