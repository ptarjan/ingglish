import { describe, expect, it } from 'vitest';
import { extractIpa } from './extract-kaikki-ipa';

describe('extractIpa', () => {
  it('returns phonemic IPA (between slashes)', () => {
    const sounds = [{ ipa: '/hɛˈloʊ/' }];
    expect(extractIpa(sounds)).toBe('/hɛˈloʊ/');
  });

  it('prefers phonemic over phonetic', () => {
    const sounds = [{ ipa: '[hɛˈloʊ]' }, { ipa: '/hɛˈloʊ/' }];
    expect(extractIpa(sounds)).toBe('/hɛˈloʊ/');
  });

  it('falls back to phonetic (brackets) if no phonemic', () => {
    const sounds = [{ ipa: '[hɛˈloʊ]' }];
    // Should convert brackets to slashes
    expect(extractIpa(sounds)).toBe('/hɛˈloʊ/');
  });

  it('returns null for empty sounds', () => {
    expect(extractIpa([])).toBeNull();
  });

  it('returns null for sounds with no IPA', () => {
    const sounds = [{ tags: ['standard'] }];
    expect(extractIpa(sounds)).toBeNull();
  });

  it('returns null for empty IPA strings', () => {
    const sounds = [{ ipa: '' }, { ipa: '  ' }];
    expect(extractIpa(sounds)).toBeNull();
  });

  it('returns first phonemic match', () => {
    const sounds = [{ ipa: '/first/' }, { ipa: '/second/' }];
    expect(extractIpa(sounds)).toBe('/first/');
  });

  it('skips IPA without delimiters', () => {
    const sounds = [{ ipa: 'hɛloʊ' }];
    expect(extractIpa(sounds)).toBeNull();
  });
});
