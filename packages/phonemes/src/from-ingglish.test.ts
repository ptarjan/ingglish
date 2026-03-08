import { describe, expect, it } from 'vitest';
import { expandArpabetAlternatives, ingglishToArpabet } from './index';

describe('ingglishToArpabet', () => {
  it('returns null for empty string', () => {
    expect(ingglishToArpabet('')).toBeNull();
  });

  it('skips unknown characters', () => {
    // Digits and special characters should be skipped
    const result = ingglishToArpabet('1a2');
    expect(result).toBeDefined();
    // Only "a" should produce a phoneme
    expect(result?.length).toBe(1);
  });

  it('handles single consonants', () => {
    const result = ingglishToArpabet('b');
    expect(result).toEqual(['B']);
  });

  it('handles single vowels', () => {
    const result = ingglishToArpabet('a');
    expect(result).toBeDefined();
    expect(result?.length).toBe(1);
  });
});

describe('expandArpabetAlternatives', () => {
  it('returns original sequence when no alternatives exist', () => {
    const input = ['B', 'AH', 'T'];
    const result = expandArpabetAlternatives(input);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(input);
  });

  it('expands ER into ER and EH+R alternatives', () => {
    const input = ['B', 'ER', 'D'];
    const result = expandArpabetAlternatives(input);
    expect(result.length).toBeGreaterThan(1);
    // Should include original
    expect(result[0]).toEqual(['B', 'ER', 'D']);
    // Should include EH+R expansion
    expect(result).toContainEqual(['B', 'EH', 'R', 'D']);
  });

  it('expands SH into SH and S+HH alternatives', () => {
    const input = ['SH', 'IH', 'P'];
    const result = expandArpabetAlternatives(input);
    expect(result.length).toBeGreaterThan(1);
    expect(result).toContainEqual(['S', 'HH', 'IH', 'P']);
  });

  it('handles multiple ambiguous phonemes in one sequence', () => {
    const input = ['ER', 'SH'];
    const result = expandArpabetAlternatives(input);
    // Original + ER expansion + SH expansion = 3
    expect(result.length).toBe(3);
  });
});
