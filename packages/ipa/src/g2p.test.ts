import { describe, expect, it } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import type { PhoneDict } from './dict';
import { lookupDict, translateDict, NOT_FOUND_MARKER } from './dict';
import { G2P_CONVERTERS } from './g2p';

describe('G2P converters', () => {
  describe('Finnish', () => {
    const g2p = G2P_CONVERTERS.fi!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('talo');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('handles nk → NG K digraph', () => {
      const result = g2p('helsinki');
      expect(result).toContain('NG');
      expect(result).toContain('K');
    });
  });

  describe('Esperanto', () => {
    const g2p = G2P_CONVERTERS.eo!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('saluton');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('converts special characters', () => {
      const result = g2p('ĝardeno');
      expect(result).toContain('JH'); // dʒ → JH
    });
  });

  describe('Swahili', () => {
    const g2p = G2P_CONVERTERS.sw!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('habari');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('Malay', () => {
    const g2p = G2P_CONVERTERS.ma!.convert;

    it('returns ARPAbet arrays', () => {
      const result = g2p('selamat');
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe('G2P integration', () => {
  it('lookupDict falls back to G2P when word is not in dict', () => {
    expect(lookupDict({ entries: {}, lang: 'fi' }, 'talo')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'eo' }, 'saluton')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'sw' }, 'habari')).toBeDefined();
    expect(lookupDict({ entries: {}, lang: 'ma' }, 'makan')).toBeDefined();
  });

  it('G2P results are ARPAbet arrays', () => {
    const result = lookupDict({ entries: {}, lang: 'fi' }, 'talo');
    expect(Array.isArray(result)).toBe(true);
    expect(result!.every((p) => typeof p === 'string')).toBe(true);
  });

  it('dict entries take priority over G2P', () => {
    const dict: PhoneDict = { entries: { talo: ['T', 'AA1', 'L', 'OW0'] }, lang: 'fi' };
    expect(lookupDict(dict, 'talo')).toEqual(['T', 'AA1', 'L', 'OW0']);
  });

  it('translateDict produces output via G2P fallback', () => {
    expect(translateDict('talo', { entries: {}, lang: 'fi' }, 'ingglish')).not.toContain(
      NOT_FOUND_MARKER
    );
    expect(translateDict('saluton', { entries: {}, lang: 'eo' }, 'ingglish')).not.toContain(
      NOT_FOUND_MARKER
    );
    expect(translateDict('habari', { entries: {}, lang: 'sw' }, 'ingglish')).not.toContain(
      NOT_FOUND_MARKER
    );
    expect(translateDict('makan', { entries: {}, lang: 'ma' }, 'ingglish')).not.toContain(
      NOT_FOUND_MARKER
    );
  });

  it('does not apply G2P to unsupported languages', () => {
    expect(lookupDict({ entries: {}, lang: 'es' }, 'hola')).toBeUndefined();
  });
});
