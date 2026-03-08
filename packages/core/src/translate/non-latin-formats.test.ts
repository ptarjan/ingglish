import { describe, it, expect, beforeAll } from 'vitest';
import '@ingglish/deseret'; // registers 'deseret' format
import { loadDictionary } from '@ingglish/dictionary';
import '@ingglish/shavian'; // registers 'shavian' format
import { translateSync, translateWord } from './forward';

beforeAll(async () => {
  await loadDictionary();
});

describe('non-Latin script translation of common words', () => {
  it('should translate "it" to shavian', () => {
    const result = translateWord('it', { format: 'shavian' });
    expect(result).toBe('𐑦𐑑');
  });

  it('should translate "it" to ingglish unchanged', () => {
    const result = translateWord('it', { format: 'ingglish' });
    expect(result).toBe('it');
  });

  it('should translate "make it so" to all shavian', () => {
    const result = translateSync('make it so', { format: 'shavian' });
    expect(result).not.toMatch(/[a-z]/i);
  });

  it('should translate "GIVE IT UP" to shavian (not keep Latin)', () => {
    const result = translateSync('GIVE IT UP', { format: 'shavian' });
    // Should not contain any Latin letters
    expect(result).not.toMatch(/[a-z]/i);
  });

  it('should keep "IT" as-is for ingglish', () => {
    const result = translateWord('IT', { format: 'ingglish' });
    expect(result).toBe('IT');
  });

  it('should translate "us" to shavian (not confuse with US initialism)', () => {
    const result = translateWord('us', { format: 'shavian' });
    expect(result).not.toBe('us');
  });

  it('should translate "am" to shavian (not confuse with AM initialism)', () => {
    const result = translateWord('am', { format: 'shavian' });
    expect(result).not.toBe('am');
  });

  it('should translate "it\'s" as contraction in shavian', () => {
    const result = translateSync("it's great", { format: 'shavian' });
    expect(result).not.toMatch(/[a-z]/i);
  });

  it('should translate "GIVE IT UP" to deseret (not keep Latin)', () => {
    const result = translateSync('GIVE IT UP', { format: 'deseret' });
    expect(result).not.toMatch(/[a-z]/i);
  });
});

describe('Shavian word translations', () => {
  it('should translate common words to Shavian', () => {
    expect(translateWord('hello', { format: 'shavian' })).toBe('𐑣𐑩𐑤𐑴');
    expect(translateWord('world', { format: 'shavian' })).toBe('𐑢𐑻𐑤𐑛');
    expect(translateWord('the', { format: 'shavian' })).toBe('𐑞𐑩');
    expect(translateWord('cat', { format: 'shavian' })).toBe('𐑒𐑨𐑑');
  });

  it('should translate words with R-ligatures to Shavian', () => {
    expect(translateWord('star', { format: 'shavian' })).toBe('𐑕𐑑𐑸');
  });

  it('should translate NG cluster words to Shavian', () => {
    expect(translateWord('think', { format: 'shavian' })).toBe('𐑔𐑦𐑙𐑒');
  });
});

describe('Deseret word translations', () => {
  it('should translate common words to Deseret', () => {
    expect(translateWord('hello', { format: 'deseret' })).toBe('𐐸𐐱𐑊𐐬');
    expect(translateWord('cat', { format: 'deseret' })).toBe('𐐿𐐰𐐻');
    expect(translateWord('the', { format: 'deseret' })).toBe('𐑄𐐱');
  });
});
