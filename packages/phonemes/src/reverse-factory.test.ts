import { describe, expect, it } from 'vitest';
import { createScriptReverseTranslator } from './reverse-factory';

function makeTranslator(dict: Record<string, string[]> = {}, frequencies: string[] = []) {
  return createScriptReverseTranslator({
    lookupPhonemeKey: (key) => dict[key] ?? null,
    sortByFrequency: (words) =>
      [...words].toSorted(
        (a, b) =>
          (frequencies.includes(a) ? frequencies.indexOf(a) : Infinity) -
          (frequencies.includes(b) ? frequencies.indexOf(b) : Infinity)
      ),
    toArpabet: (text) => {
      const map: Record<string, string[]> = {
        helo: ['HH', 'EH', 'L', 'OW'],
        werld: ['W', 'ER', 'L', 'D'],
        xyz: ['X', 'Y', 'Z'],
      };
      return map[text.toLowerCase()] ?? null;
    },
    tokenize: (text) => {
      const tokens: { isWord: boolean; text: string }[] = [];
      for (const match of text.matchAll(/(\w+)|\W+/g)) {
        tokens.push({ isWord: Boolean(match[1]), text: match[0] });
      }
      return tokens;
    },
  });
}

describe('createScriptReverseTranslator', () => {
  describe('reverseWord', () => {
    it('returns English matches from the dictionary', () => {
      const t = makeTranslator({ 'HH EH L OW': ['hello'] });
      expect(t.reverseWord('helo')).toEqual(['hello']);
    });

    it('returns original word when toArpabet returns null', () => {
      const t = makeTranslator();
      expect(t.reverseWord('unknown')).toEqual(['unknown']);
    });

    it('returns original word when no dictionary match', () => {
      const t = makeTranslator({});
      expect(t.reverseWord('helo')).toEqual(['helo']);
    });

    it('returns original word when dictionary match is empty array', () => {
      const t = makeTranslator({ 'HH EH L OW': [] });
      expect(t.reverseWord('helo')).toEqual(['helo']);
    });

    it('sorts multiple matches by frequency', () => {
      const t = makeTranslator({ 'HH EH L OW': ['hallow', 'hello', 'helo'] }, [
        'hello',
        'hallow',
        'helo',
      ]);
      expect(t.reverseWord('helo')).toEqual(['hello', 'hallow', 'helo']);
    });

    it('returns single match without sorting', () => {
      const t = makeTranslator({ 'HH EH L OW': ['hello'] });
      expect(t.reverseWord('helo')).toEqual(['hello']);
    });
  });

  describe('reverseText', () => {
    it('translates words and preserves punctuation', () => {
      const t = makeTranslator({
        'HH EH L OW': ['hello'],
        'W ER L D': ['world'],
      });
      expect(t.reverseText('helo, werld!')).toBe('hello, world!');
    });

    it('leaves unknown words as-is', () => {
      const t = makeTranslator({ 'HH EH L OW': ['hello'] });
      expect(t.reverseText('helo unknown')).toBe('hello unknown');
    });

    it('handles empty string', () => {
      const t = makeTranslator();
      expect(t.reverseText('')).toBe('');
    });
  });

  describe('reverseTextWithMapping', () => {
    it('returns token array with mapping info', () => {
      const t = makeTranslator({ 'HH EH L OW': ['hello'] });
      const result = t.reverseTextWithMapping('helo!');
      expect(result).toEqual([
        { isWord: true, matched: true, original: 'helo', translated: 'hello' },
        { isWord: false, matched: true, original: '!', translated: '!' },
      ]);
    });

    it('marks unmatched words', () => {
      const t = makeTranslator();
      const result = t.reverseTextWithMapping('unknown');
      expect(result).toEqual([
        { isWord: true, matched: false, original: 'unknown', translated: 'unknown' },
      ]);
    });

    it('handles words where toArpabet returns null', () => {
      const t = makeTranslator();
      const result = t.reverseTextWithMapping('nope');
      expect(result).toEqual([
        { isWord: true, matched: false, original: 'nope', translated: 'nope' },
      ]);
    });
  });
});
