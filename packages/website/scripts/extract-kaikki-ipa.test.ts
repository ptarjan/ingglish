import { describe, expect, it } from 'vitest';
import { collectParadigm, extractIpa } from './extract-kaikki-ipa';

describe('extractIpa', () => {
  it.each([
    {
      name: 'returns phonemic IPA (between slashes)',
      sounds: [{ ipa: '/hɛˈloʊ/' }],
      expected: '/hɛˈloʊ/',
    },
    {
      name: 'prefers phonemic over phonetic',
      sounds: [{ ipa: '[hɛˈloʊ]' }, { ipa: '/hɛˈloʊ/' }],
      expected: '/hɛˈloʊ/',
    },
    {
      name: 'falls back to phonetic (brackets) if no phonemic',
      sounds: [{ ipa: '[hɛˈloʊ]' }],
      expected: '/hɛˈloʊ/',
    },
    {
      name: 'returns first phonemic match',
      sounds: [{ ipa: '/first/' }, { ipa: '/second/' }],
      expected: '/first/',
    },
  ])('$name', ({ sounds, expected }) => {
    expect(extractIpa(sounds)).toBe(expected);
  });

  it.each([
    {
      name: 'returns null for empty sounds',
      sounds: [],
    },
    {
      name: 'returns null for sounds with no IPA',
      sounds: [{ tags: ['standard'] }],
    },
    {
      name: 'returns null for empty IPA strings',
      sounds: [{ ipa: '' }, { ipa: '  ' }],
    },
    {
      name: 'skips IPA without delimiters',
      sounds: [{ ipa: 'hɛloʊ' }],
    },
  ])('$name', ({ sounds }) => {
    expect(extractIpa(sounds)).toBeNull();
  });
});

describe('collectParadigm', () => {
  it('collects inflection-table forms and form-of entries under their lemma', () => {
    const paradigms = new Map<string, Set<string>>();
    collectParadigm(
      {
        word: 'öga',
        forms: [
          { form: 'no-table-tags', tags: ['table-tags'] },
          { form: 'öga', tags: ['indefinite'] },
          { form: 'ögon', tags: ['plural'] },
          { form: '-', tags: ['plural'] },
          { form: 'två ögon' },
          {},
        ],
      },
      paradigms
    );
    collectParadigm(
      { word: 'ögonen', senses: [{ form_of: [{ word: 'öga' }, {}] }, {}] },
      paradigms
    );
    collectParadigm({ word: 'äro', senses: [{ form_of: [{ word: 'vara' }] }] }, paradigms);
    collectParadigm({ forms: [{ form: 'x' }] }, paradigms);
    expect(paradigms).toEqual(
      new Map([
        ['öga', new Set(['ögon', 'ögonen'])],
        ['vara', new Set(['äro'])],
      ])
    );
  });
});
