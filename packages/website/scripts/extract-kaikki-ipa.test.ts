import { describe, expect, it } from 'vitest';
import { extractIpa } from './extract-kaikki-ipa';

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
