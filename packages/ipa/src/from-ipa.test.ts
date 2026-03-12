import { reverseTranslateSync, translateSync } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { ipaToArpabet } from './index';

describe('ipaToArpabet — English round-trip via public API', () => {
  it.each([
    'pen',
    'bad',
    'ten',
    'dog',
    'cat',
    'hot',
    'bed',
    'bit',
    'time',
    'out',
    'coin',
    'go',
    'say',
    'church',
    'judge',
    'think',
    'the',
    'she',
    'measure',
    'hello',
    'world',
    'thought',
  ])('round-trips "%s" through IPA', (word) => {
    const ipa = translateSync(word, { format: 'ipa' });
    const english = reverseTranslateSync(ipa, { format: 'ipa' });
    expect(english, `Failed round-trip for "${word}" (IPA: ${ipa})`).toBe(word);
  });
});

describe('ipaToArpabet — direct conversion (non-English, overrides, edge cases)', () => {
  it.each([
    ['ˈhɛˌloʊ', ['HH', 'EH1', 'L', 'OW2'], 'primary+secondary stress'],
    ['ˈstrɛs', ['S', 'T', 'R', 'EH1', 'S'], 'stress skips consonants'],
    ['ɛ', ['EH'], 'bare vowel without stress'],
    ['ˈə', ['AH1'], 'stress overrides schwa'],
  ])('stress: %s → %j (%s)', (ipa, expected) => {
    expect(ipaToArpabet(ipa)).toEqual(expected);
  });

  it.each([
    ['a', ['AE'], 'plain /a/ → AE'],
    ['salam', ['S', 'AE', 'L', 'AE', 'M'], 'Arabic word'],
    ['marhaba', ['M', 'AE', 'R', 'HH', 'AE', 'B', 'AE'], 'Arabic word'],
    ['ɯ', ['UH'], 'Japanese ɯ → UH'],
    ['sakɯɾa', ['S', 'AE', 'K', 'UH', 'R', 'AE'], 'sakura'],
    ['sɯɕi', ['S', 'UH', 'SH', 'IY'], 'sushi'],
    ['oɯ', ['OW'], 'Japanese oɯ → OW'],
    ['toɯkjoɯ', ['T', 'OW', 'K', 'Y', 'OW'], 'Tokyo'],
    ['seɴdʑoɯ', ['S', 'EH', 'N', 'JH', 'OW'], 'sensei'],
    ['ɴ', ['N'], 'moraic ɴ → N'],
    ['geɴki', ['G', 'EH', 'N', 'K', 'IY'], 'genki'],
  ])('language-specific: %s → %j (%s)', (ipa, expected) => {
    expect(ipaToArpabet(ipa)).toEqual(expected);
  });

  it.each([
    ['tɕ', ['CH'], 'palatal affricate'],
    ['dʑ', ['JH'], 'voiced palatal affricate'],
    ['ʈʂ', ['CH'], 'retroflex affricate'],
    ['niɴdʑa', ['N', 'IY', 'N', 'JH', 'AE'], 'ninja'],
    ['ʈʂa', ['CH', 'AE'], 'cha'],
    ['y', ['UW'], 'IPA /y/ → UW'],
    ['ty', ['T', 'UW'], 'French tu'],
    ['myzik', ['M', 'UW', 'Z', 'IY', 'K'], 'French musique'],
  ])('affricates/vowels: %s → %j (%s)', (ipa, expected) => {
    expect(ipaToArpabet(ipa)).toEqual(expected);
  });

  it.each([
    ['ɑu', ['AW'], 'Finnish diphthong ɑu'],
    ['ɑi', ['AY'], 'Finnish diphthong ɑi'],
    ['sɑunɑ', ['S', 'AW', 'N', 'AA'], 'sauna'],
    ['tɑivɑs', ['T', 'AY', 'V', 'AA', 'S'], 'taivas'],
    ['ɑ̃fɑ̃', ['AA', 'N', 'F', 'AA', 'N'], 'nasal vowel'],
    ['ɛ̃', ['EH', 'N'], 'nasal ɛ̃'],
    ['ɔ̃', ['AO', 'N'], 'nasal ɔ̃'],
    ['bɔ̃ʒuʁ', ['B', 'AO', 'N', 'ZH', 'UW', 'R'], 'bonjour'],
    ['\u00E3', ['AE', 'N'], 'precomposed ã'],
    ['\u00F5', ['OW', 'N'], 'precomposed õ'],
  ])('diphthongs/nasals: %s → %j (%s)', (ipa, expected) => {
    expect(ipaToArpabet(ipa)).toEqual(expected);
  });

  it.each([
    ['x', undefined, ['HH'], 'default x → HH'],
    ['xɑʊ', undefined, ['HH', 'AW'], 'Chinese 好'],
    ['x', { x: 'K' }, ['K'], 'German x → K'],
    ['nɑxt', { x: 'K' }, ['N', 'AA', 'K', 'T'], 'Nacht'],
    ['ɣ', undefined, ['G'], 'default ɣ → G'],
    ['ɣ', { ɣ: 'HH' }, ['HH'], 'Dutch ɣ → HH'],
    ['ɣut', { ɣ: 'HH' }, ['HH', 'UW', 'T'], 'Dutch goed'],
  ] as const)('overrides: %s → %j (%s)', (ipa, overrides, expected, _desc) => {
    expect(ipaToArpabet(ipa, overrides ?? undefined)).toEqual(expected);
  });

  it.each([
    ['tuuli', ['T', 'UW', 'L', 'IY'], 'dedup long vowel'],
    ['kissɑ', ['K', 'IY', 'S', 'AA'], 'dedup geminate'],
    ['papa', ['P', 'AE', 'P', 'AE'], 'non-consecutive preserved'],
    ['ç', ['SH'], 'palatal fricative'],
    ['mɛːtçən', ['M', 'EH', 'T', 'SH', 'AH0', 'N'], 'Mädchen'],
    ['w\u0303', ['W'], 'nasalized glide → W'],
    ['koɾɐsɐ̃w\u0303', ['K', 'OW', 'R', 'AH', 'S', 'AH', 'N', 'W'], 'coração'],
    ['ɲ', ['N', 'Y'], 'palatal nasal'],
    ['espaɲa', ['EH', 'S', 'P', 'AE', 'N', 'Y', 'AE'], 'España'],
    ['ʎ', ['L', 'Y'], 'palatal lateral'],
    ['kaʎe', ['K', 'AE', 'L', 'Y', 'EH'], 'calle'],
    ['oi', ['OY'], 'diphthong oi'],
    ['ou', ['OW'], 'diphthong ou'],
    ['ei', ['EY'], 'diphthong ei'],
    ['koirɑ', ['K', 'OY', 'R', 'AA'], 'koira'],
    ['koulu', ['K', 'OW', 'L', 'UW'], 'koulu'],
    ['pæivæ', ['P', 'AY', 'V', 'AE'], 'päivä'],
    ['hœys', ['HH', 'OY', 'S'], 'Dutch huis'],
    ['ɦ', ['HH'], 'voiced glottal fricative'],
    ['ɦamnida', ['HH', 'AE', 'M', 'N', 'IY', 'D', 'AE'], 'Korean'],
    ['tʰa', ['T', 'AE'], 'strips aspiration'],
    ['ta\u02E5\u02E9', ['T', 'AE'], 'strips tone bars'],
    ['ɕjɛ\u02E5\u02E9', ['SH', 'Y', 'EH'], 'strips Mandarin tones'],
    ['a\u0320', ['AE'], 'strips Korean diacritics'],
    ['ʌ\u0339', ['AH'], 'strips combining ring'],
    ['k\u031A', ['K'], 'strips unreleased marker'],
    ['ɻ', ['R'], 'retroflex approximant'],
    ['aɻ', ['AE', 'R'], 'Mandarin 二'],
    ['é', ['EH'], 'strips accent'],
    ['bébé', ['B', 'EH', 'B', 'EH'], 'loanword accents'],
  ])('conversion: %s → %j (%s)', (ipa, expected) => {
    expect(ipaToArpabet(ipa)).toEqual(expected);
  });

  it('handles two-char override with multi-phoneme value (space-separated)', () => {
    // Exercise lines 102-105: a two-character IPA sequence mapped to a space-separated ARPAbet value
    const overrides = { ab: 'AE B' };
    expect(ipaToArpabet('ab', overrides)).toEqual(['AE', 'B']);
  });
});
