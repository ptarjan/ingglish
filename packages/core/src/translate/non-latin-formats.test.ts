import { describe, it, expect } from 'vitest';
import { translateSync, translateWord } from './forward';
import { reverseTranslateSyncWithMapping } from './reverse';

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

  it('should translate all consonant sounds to Shavian', () => {
    expect(translateWord('pen', { format: 'shavian' })).toBe('𐑐𐑧𐑯'); // P 𐑐, N 𐑯
    expect(translateWord('bat', { format: 'shavian' })).toBe('𐑚𐑨𐑑'); // B 𐑚
    expect(translateWord('dog', { format: 'shavian' })).toBe('𐑛𐑷𐑜'); // D 𐑛, G 𐑜
    expect(translateWord('fish', { format: 'shavian' })).toBe('𐑓𐑦𐑖'); // F 𐑓, SH 𐑖
    expect(translateWord('very', { format: 'shavian' })).toBe('𐑝𐑺𐑰'); // V 𐑝
    expect(translateWord('zoo', { format: 'shavian' })).toBe('𐑟𐑵'); // Z 𐑟
    expect(translateWord('measure', { format: 'shavian' })).toBe('𐑥𐑧𐑠𐑻'); // ZH 𐑠, M 𐑥
    expect(translateWord('church', { format: 'shavian' })).toBe('𐑗𐑻𐑗'); // CH 𐑗
    expect(translateWord('judge', { format: 'shavian' })).toBe('𐑡𐑳𐑡'); // JH 𐑡
    expect(translateWord('red', { format: 'shavian' })).toBe('𐑮𐑧𐑛'); // R 𐑮
    expect(translateWord('yes', { format: 'shavian' })).toBe('𐑘𐑧𐑕'); // Y 𐑘, S 𐑕
  });

  it('should translate all vowel sounds to Shavian', () => {
    expect(translateWord('hot', { format: 'shavian' })).toBe('𐑣𐑭𐑑'); // AA 𐑭
    expect(translateWord('bed', { format: 'shavian' })).toBe('𐑚𐑧𐑛'); // EH 𐑧
    expect(translateWord('book', { format: 'shavian' })).toBe('𐑚𐑫𐑒'); // UH 𐑫
    expect(translateWord('see', { format: 'shavian' })).toBe('𐑕𐑰'); // IY 𐑰
    expect(translateWord('day', { format: 'shavian' })).toBe('𐑛𐑱'); // EY 𐑱
    expect(translateWord('my', { format: 'shavian' })).toBe('𐑥𐑲'); // AY 𐑲
    expect(translateWord('cup', { format: 'shavian' })).toBe('𐑒𐑳𐑐'); // AH1 𐑳
    expect(translateWord('go', { format: 'shavian' })).toBe('𐑜𐑴'); // OW 𐑴
    expect(translateWord('cow', { format: 'shavian' })).toBe('𐑒𐑬'); // AW 𐑬
    expect(translateWord('boy', { format: 'shavian' })).toBe('𐑚𐑶'); // OY 𐑶
    expect(translateWord('law', { format: 'shavian' })).toBe('𐑤𐑷'); // AO 𐑷
    expect(translateWord('not', { format: 'shavian' })).toBe('𐑯𐑭𐑑'); // AA 𐑭
  });

  it('should translate R-colored words to Shavian ligatures', () => {
    expect(translateWord('star', { format: 'shavian' })).toBe('𐑕𐑑𐑸'); // AA+R 𐑸
    expect(translateWord('more', { format: 'shavian' })).toBe('𐑥𐑹'); // AO+R 𐑹
    expect(translateWord('care', { format: 'shavian' })).toBe('𐑒𐑺'); // EH+R 𐑺
    expect(translateWord('beer', { format: 'shavian' })).toBe('𐑚𐑽'); // IH+R 𐑽
    expect(translateWord('letter', { format: 'shavian' })).toBe('𐑤𐑧𐑑𐑻'); // ER 𐑻
  });

  it('should translate NG cluster words to Shavian', () => {
    expect(translateWord('think', { format: 'shavian' })).toBe('𐑔𐑦𐑙𐑒');
  });

  it('should round-trip Shavian translations', () => {
    const words = ['hello', 'world', 'cat', 'dog', 'fish', 'love', 'time'];
    for (const word of words) {
      const shavian = translateWord(word, { format: 'shavian' });
      const back = reverseTranslateSyncWithMapping(shavian, { format: 'shavian' });
      const result = back.find((t) => t.isWord);
      expect(result?.translated.toLowerCase(), `${word} → ${shavian}`).toBe(word);
    }
  });
});

describe('Deseret word translations', () => {
  it('should translate common words to Deseret', () => {
    expect(translateWord('hello', { format: 'deseret' })).toBe('𐐸𐐱𐑊𐐬');
    expect(translateWord('cat', { format: 'deseret' })).toBe('𐐿𐐰𐐻');
    expect(translateWord('the', { format: 'deseret' })).toBe('𐑄𐐱');
  });

  it('should translate all consonant sounds to Deseret', () => {
    expect(translateWord('pen', { format: 'deseret' })).toBe('𐐹𐐯𐑌'); // P 𐐹, N 𐑌
    expect(translateWord('bat', { format: 'deseret' })).toBe('𐐺𐐰𐐻'); // B 𐐺, T 𐐻
    expect(translateWord('dog', { format: 'deseret' })).toBe('𐐼𐐫𐑀'); // D 𐐼, G 𐑀
    expect(translateWord('fish', { format: 'deseret' })).toBe('𐑁𐐮𐑇'); // F 𐑁, SH 𐑇
    expect(translateWord('very', { format: 'deseret' })).toBe('𐑂𐐯𐑉𐐨'); // V 𐑂
    expect(translateWord('zoo', { format: 'deseret' })).toBe('𐑆𐐭'); // Z 𐑆
    expect(translateWord('measure', { format: 'deseret' })).toBe('𐑋𐐯𐑈𐐱𐑉'); // ZH 𐑈, M 𐑋
    expect(translateWord('church', { format: 'deseret' })).toBe('𐐽𐐲𐑉𐐽'); // CH 𐐽
    expect(translateWord('judge', { format: 'deseret' })).toBe('𐐾𐐲𐐾'); // JH 𐐾
    expect(translateWord('red', { format: 'deseret' })).toBe('𐑉𐐯𐐼'); // R 𐑉
    expect(translateWord('think', { format: 'deseret' })).toBe('𐑃𐐮𐑍𐐿'); // TH 𐑃, NG 𐑍, K 𐐿
    expect(translateWord('yes', { format: 'deseret' })).toBe('𐐷𐐯𐑅'); // Y 𐐷, S 𐑅
    expect(translateWord('world', { format: 'deseret' })).toBe('𐐶𐐲𐑉𐑊𐐼'); // W 𐐶, L 𐑊
  });

  it('should translate all vowel sounds to Deseret', () => {
    expect(translateWord('hot', { format: 'deseret' })).toBe('𐐸𐐪𐐻'); // AA 𐐪
    expect(translateWord('bed', { format: 'deseret' })).toBe('𐐺𐐯𐐼'); // EH 𐐯
    expect(translateWord('book', { format: 'deseret' })).toBe('𐐺𐐳𐐿'); // UH 𐐳
    expect(translateWord('see', { format: 'deseret' })).toBe('𐑅𐐨'); // IY 𐐨
    expect(translateWord('day', { format: 'deseret' })).toBe('𐐼𐐩'); // EY 𐐩
    expect(translateWord('my', { format: 'deseret' })).toBe('𐑋𐐴'); // AY 𐐴
    expect(translateWord('cup', { format: 'deseret' })).toBe('𐐿𐐲𐐹'); // AH1 𐐲
    expect(translateWord('go', { format: 'deseret' })).toBe('𐑀𐐬'); // OW 𐐬
    expect(translateWord('zoo', { format: 'deseret' })).toBe('𐑆𐐭'); // UW 𐐭
    expect(translateWord('cow', { format: 'deseret' })).toBe('𐐿𐐵'); // AW 𐐵
    expect(translateWord('boy', { format: 'deseret' })).toBe('𐐺𐑎'); // OY 𐑎
    expect(translateWord('law', { format: 'deseret' })).toBe('𐑊𐐫'); // AO 𐐫
    expect(translateWord('about', { format: 'deseret' })).toBe('𐐱𐐺𐐵𐐻'); // AH0 𐐱
  });

  it('should handle Y+UW → Ew ligature in Deseret', () => {
    expect(translateWord('cute', { format: 'deseret' })).toBe('𐐿𐑏𐐻'); // Y+UW → 𐑏
    expect(translateWord('music', { format: 'deseret' })).toBe('𐑋𐑏𐑆𐐮𐐿');
  });

  it('should handle ER in Deseret', () => {
    expect(translateWord('world', { format: 'deseret' })).toBe('𐐶𐐲𐑉𐑊𐐼'); // ER1 → 𐐲𐑉
    expect(translateWord('letter', { format: 'deseret' })).toBe('𐑊𐐯𐐻𐐱𐑉'); // ER0 → 𐐱𐑉
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
