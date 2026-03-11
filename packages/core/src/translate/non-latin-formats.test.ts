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

  it.each([
    ['pen', '𐐹𐐯𐑌', 'P+N'],
    ['bat', '𐐺𐐰𐐻', 'B+T'],
    ['dog', '𐐼𐐫𐑀', 'D+G'],
    ['fish', '𐑁𐐮𐑇', 'F+SH'],
    ['very', '𐑂𐐯𐑉𐐨', 'V'],
    ['zoo', '𐑆𐐭', 'Z'],
    ['measure', '𐑋𐐯𐑈𐐱𐑉', 'ZH+M'],
    ['church', '𐐽𐐲𐑉𐐽', 'CH'],
    ['judge', '𐐾𐐲𐐾', 'JH'],
    ['red', '𐑉𐐯𐐼', 'R'],
    ['think', '𐑃𐐮𐑍𐐿', 'TH+NG+K'],
    ['yes', '𐐷𐐯𐑅', 'Y+S'],
    ['world', '𐐶𐐲𐑉𐑊𐐼', 'W+L'],
  ])('translates Deseret consonant "%s" → %s (%s)', (word, expected) => {
    expect(translateSync(word, { format: 'deseret' })).toBe(expected);
  });

  it.each([
    ['hot', '𐐸𐐪𐐻', 'AA'],
    ['bed', '𐐺𐐯𐐼', 'EH'],
    ['book', '𐐺𐐳𐐿', 'UH'],
    ['see', '𐑅𐐨', 'IY'],
    ['day', '𐐼𐐩', 'EY'],
    ['my', '𐑋𐐴', 'AY'],
    ['cup', '𐐿𐐲𐐹', 'AH1'],
    ['go', '𐑀𐐬', 'OW'],
    ['zoo', '𐑆𐐭', 'UW'],
    ['cow', '𐐿𐐵', 'AW'],
    ['boy', '𐐺𐑎', 'OY'],
    ['law', '𐑊𐐫', 'AO'],
    ['about', '𐐱𐐺𐐵𐐻', 'AH0'],
  ])('translates Deseret vowel "%s" → %s (%s)', (word, expected) => {
    expect(translateSync(word, { format: 'deseret' })).toBe(expected);
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
