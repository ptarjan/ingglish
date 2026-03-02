import { describe, expect, it } from 'vitest';
import '@ingglish/phonemes'; // registers 'pronunciation' format
import type { IpaDict } from './foreign';
import { lookupIpa, translateDict, NOT_FOUND_MARKER } from './foreign';
import { G2P_CONVERTERS } from './g2p';

describe('G2P converters', () => {
  describe('Finnish', () => {
    const g2p = G2P_CONVERTERS.fi!;

    it('converts basic words with first-syllable stress', () => {
      expect(g2p('talo')).toBe('ˈtɑlo');
      expect(g2p('suomi')).toBe('ˈsuomi');
    });

    it('handles nk → ŋk and ng → ŋː digraphs', () => {
      expect(g2p('helsinki')).toBe('ˈhelsiŋki');
      expect(g2p('kaupunki')).toBe('ˈkɑupuŋki');
    });

    it('handles long vowels (double letters)', () => {
      expect(g2p('pää')).toBe('ˈpæː');
      expect(g2p('tee')).toBe('ˈteː');
    });

    it('handles geminate consonants', () => {
      expect(g2p('tyttö')).toBe('ˈtytːø');
    });

    it('maps v → ʋ', () => {
      expect(g2p('vanha')).toBe('ˈʋɑnhɑ');
    });
  });

  describe('Esperanto', () => {
    const g2p = G2P_CONVERTERS.eo!;

    it('converts with penultimate stress', () => {
      expect(g2p('saluton')).toBe('saˈluton');
      expect(g2p('esperanto')).toBe('espeˈranto');
    });

    it('stresses first syllable for two-syllable words', () => {
      expect(g2p('dankon')).toBe('ˈdankon');
    });

    it('handles single-syllable words', () => {
      expect(g2p('ĉu')).toBe('ˈtʃu');
    });

    it('converts special characters (ĉ, ĝ, ŝ, ĵ, ĥ, ŭ)', () => {
      expect(g2p('ĝardeno')).toBe('dʒaˈrdeno');
      expect(g2p('ŝanco')).toBe('ˈʃantso');
      expect(g2p('ĥoro')).toBe('ˈxoro');
      expect(g2p('ĵaŭdo')).toBe('ˈʒawdo');
    });

    it('converts c → ts', () => {
      expect(g2p('celo')).toBe('ˈtselo');
    });
  });

  describe('Swahili', () => {
    const g2p = G2P_CONVERTERS.sw!;

    it('converts with penultimate stress', () => {
      expect(g2p('habari')).toBe('haˈbaɾi');
      expect(g2p('chakula')).toBe('tʃaˈkula');
    });

    it('handles digraphs (ch, sh, ny, ng, th, dh)', () => {
      expect(g2p('shule')).toBe('ˈʃulɛ');
      expect(g2p('nyumba')).toBe('ˈɲumba');
    });

    it("handles ng' trigraph (velar nasal only)", () => {
      expect(g2p("ng'ombe")).toBe('ˈŋɔmbɛ');
    });

    it('maps e → ɛ and o → ɔ', () => {
      expect(g2p('pole')).toBe('ˈpɔlɛ');
    });

    it('maps j → dʒ and y → j', () => {
      expect(g2p('jambo')).toBe('ˈdʒambɔ');
      expect(g2p('yetu')).toBe('ˈjɛtu');
    });
  });

  describe('Malay', () => {
    const g2p = G2P_CONVERTERS.ma!;

    it('converts with penultimate stress', () => {
      expect(g2p('selamat')).toBe('səˈlamat');
      expect(g2p('terima')).toBe('təˈɾima');
    });

    it('stresses first syllable for two-syllable words', () => {
      expect(g2p('makan')).toBe('ˈmakan');
    });

    it('handles digraphs (ng, ny, sy)', () => {
      expect(g2p('nyamuk')).toBe('ˈɲamuk');
      expect(g2p('singa')).toBe('ˈsiŋa');
    });

    it('maps e → ə (schwa) by default', () => {
      expect(g2p('besar')).toBe('bəˈsaɾ');
    });

    it('maps c → tʃ and j → dʒ', () => {
      expect(g2p('cari')).toBe('ˈtʃaɾi');
    });
  });
});

describe('G2P integration', () => {
  it('lookupIpa falls back to G2P when word is not in dict', () => {
    expect(lookupIpa({ entries: {}, lang: 'fi' }, 'talo')).toBe('ˈtɑlo');
    expect(lookupIpa({ entries: {}, lang: 'eo' }, 'saluton')).toBe('saˈluton');
    expect(lookupIpa({ entries: {}, lang: 'sw' }, 'habari')).toBe('haˈbaɾi');
    expect(lookupIpa({ entries: {}, lang: 'ma' }, 'makan')).toBe('ˈmakan');
  });

  it('dict entries take priority over G2P', () => {
    const dict: IpaDict = { entries: { talo: '/tɑːlo/' }, lang: 'fi' };
    expect(lookupIpa(dict, 'talo')).toBe('/tɑːlo/');
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
    expect(lookupIpa({ entries: {}, lang: 'es' }, 'hola')).toBeUndefined();
  });
});
