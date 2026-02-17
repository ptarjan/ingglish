import { describe, it, expect, beforeAll } from 'vitest';
import { loadDictionary } from '@ingglish/dictionary';
import { registerShavian } from '@ingglish/shavian';
import { registerDeseret } from '@ingglish/deseret';
import { translateSync, translateWord } from './forward';

beforeAll(async () => {
  await loadDictionary();
  registerShavian();
  registerDeseret();
});

describe('non-Latin script translation of common words', () => {
  it('should translate "it" to shavian', () => {
    const result = translateWord('it', 'shavian');
    expect(result).toBe('𐑦𐑑');
  });

  it('should translate "it" to ingglish unchanged', () => {
    const result = translateWord('it', 'ingglish');
    expect(result).toBe('it');
  });

  it('should translate "make it so" to all shavian', () => {
    const result = translateSync('make it so', 'shavian');
    expect(result).not.toMatch(/[a-zA-Z]/);
  });

  it('should translate "GIVE IT UP" to shavian (not keep Latin)', () => {
    const result = translateSync('GIVE IT UP', 'shavian');
    // Should not contain any Latin letters
    expect(result).not.toMatch(/[a-zA-Z]/);
  });

  it('should keep "IT" as-is for ingglish', () => {
    const result = translateWord('IT', 'ingglish');
    expect(result).toBe('IT');
  });

  it('should translate "us" to shavian (not confuse with US initialism)', () => {
    const result = translateWord('us', 'shavian');
    expect(result).not.toBe('us');
  });

  it('should translate "am" to shavian (not confuse with AM initialism)', () => {
    const result = translateWord('am', 'shavian');
    expect(result).not.toBe('am');
  });

  it('should translate "it\'s" as contraction in shavian', () => {
    const result = translateSync("it's great", 'shavian');
    expect(result).not.toMatch(/[a-zA-Z]/);
  });

  it('should translate "GIVE IT UP" to deseret (not keep Latin)', () => {
    const result = translateSync('GIVE IT UP', 'deseret');
    expect(result).not.toMatch(/[a-zA-Z]/);
  });
});
