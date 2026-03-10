import { describe, it, expect } from 'vitest';
import { reverseTranslateSyncWithMapping, translateSync } from '../index';

describe('non-Latin script translation of common words', () => {
  it('should translate "it" to shavian', () => {
    const result = translateSync('it', { format: 'shavian' });
    expect(result).toBe('𐑦𐑑');
  });

  it('should translate "it" to ingglish unchanged', () => {
    const result = translateSync('it', { format: 'ingglish' });
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
    const result = translateSync('IT', { format: 'ingglish' });
    expect(result).toBe('IT');
  });

  it('should translate "us" to shavian (not confuse with US initialism)', () => {
    const result = translateSync('us', { format: 'shavian' });
    expect(result).not.toBe('us');
  });

  it('should translate "am" to shavian (not confuse with AM initialism)', () => {
    const result = translateSync('am', { format: 'shavian' });
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
  it.each([
    ['hello', '𐑣𐑩𐑤𐑴'],
    ['world', '𐑢𐑻𐑤𐑛'],
    ['the', '𐑞𐑩'],
    ['cat', '𐑒𐑨𐑑'],
  ])('translates "%s" to Shavian', (word, expected) => {
    expect(translateSync(word, { format: 'shavian' })).toBe(expected);
  });

  it.each([
    ['pen', '𐑐𐑧𐑯'],
    ['bat', '𐑚𐑨𐑑'],
    ['dog', '𐑛𐑷𐑜'],
    ['fish', '𐑓𐑦𐑖'],
    ['very', '𐑝𐑺𐑰'],
    ['zoo', '𐑟𐑵'],
    ['measure', '𐑥𐑧𐑠𐑻'],
    ['church', '𐑗𐑻𐑗'],
    ['judge', '𐑡𐑳𐑡'],
    ['red', '𐑮𐑧𐑛'],
    ['yes', '𐑘𐑧𐑕'],
  ])('translates "%s" consonant to Shavian', (word, expected) => {
    expect(translateSync(word, { format: 'shavian' })).toBe(expected);
  });

  it.each([
    ['hot', '𐑣𐑭𐑑'],
    ['bed', '𐑚𐑧𐑛'],
    ['book', '𐑚𐑫𐑒'],
    ['see', '𐑕𐑰'],
    ['day', '𐑛𐑱'],
    ['my', '𐑥𐑲'],
    ['cup', '𐑒𐑳𐑐'],
    ['go', '𐑜𐑴'],
    ['cow', '𐑒𐑬'],
    ['boy', '𐑚𐑶'],
    ['law', '𐑤𐑷'],
    ['not', '𐑯𐑭𐑑'],
  ])('translates "%s" vowel to Shavian', (word, expected) => {
    expect(translateSync(word, { format: 'shavian' })).toBe(expected);
  });

  it.each([
    ['star', '𐑕𐑑𐑸'],
    ['more', '𐑥𐑹'],
    ['care', '𐑒𐑺'],
    ['beer', '𐑚𐑽'],
    ['letter', '𐑤𐑧𐑑𐑻'],
  ])('translates R-colored "%s" to Shavian', (word, expected) => {
    expect(translateSync(word, { format: 'shavian' })).toBe(expected);
  });

  it('should translate NG cluster words to Shavian', () => {
    expect(translateSync('think', { format: 'shavian' })).toBe('𐑔𐑦𐑙𐑒');
  });

  it.each(['hello', 'world', 'cat', 'dog', 'fish', 'love', 'time'])(
    'round-trips "%s" through Shavian',
    (word) => {
      const shavian = translateSync(word, { format: 'shavian' });
      const back = reverseTranslateSyncWithMapping(shavian, { format: 'shavian' });
      const result = back.find((t) => t.isWord);
      expect(result?.translated.toLowerCase()).toBe(word);
    }
  );
});

describe('Deseret word translations', () => {
  it.each([
    ['hello', '𐐸𐐱𐑊𐐬'],
    ['cat', '𐐿𐐰𐐻'],
    ['the', '𐑄𐐱'],
  ])('translates "%s" to Deseret', (word, expected) => {
    expect(translateSync(word, { format: 'deseret' })).toBe(expected);
  });

  it('should translate all consonant sounds to Deseret', () => {
    expect(translateSync('pen', { format: 'deseret' })).toBe('𐐹𐐯𐑌'); // P 𐐹, N 𐑌
    expect(translateSync('bat', { format: 'deseret' })).toBe('𐐺𐐰𐐻'); // B 𐐺, T 𐐻
    expect(translateSync('dog', { format: 'deseret' })).toBe('𐐼𐐫𐑀'); // D 𐐼, G 𐑀
    expect(translateSync('fish', { format: 'deseret' })).toBe('𐑁𐐮𐑇'); // F 𐑁, SH 𐑇
    expect(translateSync('very', { format: 'deseret' })).toBe('𐑂𐐯𐑉𐐨'); // V 𐑂
    expect(translateSync('zoo', { format: 'deseret' })).toBe('𐑆𐐭'); // Z 𐑆
    expect(translateSync('measure', { format: 'deseret' })).toBe('𐑋𐐯𐑈𐐱𐑉'); // ZH 𐑈, M 𐑋
    expect(translateSync('church', { format: 'deseret' })).toBe('𐐽𐐲𐑉𐐽'); // CH 𐐽
    expect(translateSync('judge', { format: 'deseret' })).toBe('𐐾𐐲𐐾'); // JH 𐐾
    expect(translateSync('red', { format: 'deseret' })).toBe('𐑉𐐯𐐼'); // R 𐑉
    expect(translateSync('think', { format: 'deseret' })).toBe('𐑃𐐮𐑍𐐿'); // TH 𐑃, NG 𐑍, K 𐐿
    expect(translateSync('yes', { format: 'deseret' })).toBe('𐐷𐐯𐑅'); // Y 𐐷, S 𐑅
    expect(translateSync('world', { format: 'deseret' })).toBe('𐐶𐐲𐑉𐑊𐐼'); // W 𐐶, L 𐑊
  });

  it('should translate all vowel sounds to Deseret', () => {
    expect(translateSync('hot', { format: 'deseret' })).toBe('𐐸𐐪𐐻'); // AA 𐐪
    expect(translateSync('bed', { format: 'deseret' })).toBe('𐐺𐐯𐐼'); // EH 𐐯
    expect(translateSync('book', { format: 'deseret' })).toBe('𐐺𐐳𐐿'); // UH 𐐳
    expect(translateSync('see', { format: 'deseret' })).toBe('𐑅𐐨'); // IY 𐐨
    expect(translateSync('day', { format: 'deseret' })).toBe('𐐼𐐩'); // EY 𐐩
    expect(translateSync('my', { format: 'deseret' })).toBe('𐑋𐐴'); // AY 𐐴
    expect(translateSync('cup', { format: 'deseret' })).toBe('𐐿𐐲𐐹'); // AH1 𐐲
    expect(translateSync('go', { format: 'deseret' })).toBe('𐑀𐐬'); // OW 𐐬
    expect(translateSync('zoo', { format: 'deseret' })).toBe('𐑆𐐭'); // UW 𐐭
    expect(translateSync('cow', { format: 'deseret' })).toBe('𐐿𐐵'); // AW 𐐵
    expect(translateSync('boy', { format: 'deseret' })).toBe('𐐺𐑎'); // OY 𐑎
    expect(translateSync('law', { format: 'deseret' })).toBe('𐑊𐐫'); // AO 𐐫
    expect(translateSync('about', { format: 'deseret' })).toBe('𐐱𐐺𐐵𐐻'); // AH0 𐐱
  });

  it('should handle Y+UW → Ew ligature in Deseret', () => {
    expect(translateSync('cute', { format: 'deseret' })).toBe('𐐿𐑏𐐻'); // Y+UW → 𐑏
    expect(translateSync('music', { format: 'deseret' })).toBe('𐑋𐑏𐑆𐐮𐐿');
  });

  it('should handle ER in Deseret', () => {
    expect(translateSync('world', { format: 'deseret' })).toBe('𐐶𐐲𐑉𐑊𐐼'); // ER1 → 𐐲𐑉
    expect(translateSync('letter', { format: 'deseret' })).toBe('𐑊𐐯𐐻𐐱𐑉'); // ER0 → 𐐱𐑉
  });

  it('should round-trip Deseret translations', () => {
    const deseret = translateSync('hello cat dog', { format: 'deseret' });
    const tokens = reverseTranslateSyncWithMapping(deseret, { format: 'deseret' });
    const words = tokens.filter((t) => t.isWord);
    expect(words.length).toBe(3);
    for (const word of words) {
      expect(word.matched).toBe(true);
    }
    expect(words[0]!.translated.toLowerCase()).toBe('hello');
  });
});
