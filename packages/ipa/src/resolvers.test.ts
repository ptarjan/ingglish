import { describe, expect, it } from 'vitest';
import { WORD_RESOLVERS } from './index';

describe('WORD_RESOLVERS', () => {
  describe('de (German ß→ss)', () => {
    const resolve = WORD_RESOLVERS.de!;
    const dict: Record<string, string[]> = {
      dass: ['D', 'AH1', 'S'],
    };

    it('resolves ß to ss variant', () => {
      expect(resolve(dict, 'daß')).toEqual(['D', 'AH1', 'S']);
    });

    it('returns undefined for words without ß', () => {
      expect(resolve(dict, 'das')).toBeUndefined();
    });

    it('tries title case variant', () => {
      const dictTitle: Record<string, string[]> = {
        Dass: ['D', 'AH1', 'S'],
      };
      expect(resolve(dictTitle, 'Daß')).toEqual(['D', 'AH1', 'S']);
    });
  });

  describe('ja (Japanese kana fallback)', () => {
    const resolve = WORD_RESOLVERS.ja!;
    const dict: Record<string, string[]> = {
      か: ['K', 'AH0'],
      き: ['K', 'IY0'],
      きゃ: ['K', 'Y', 'AH0'],
      た: ['T', 'AH0'],
    };

    it('resolves single kana characters', () => {
      expect(resolve(dict, 'かた')).toEqual(['K', 'AH0', 'T', 'AH0']);
    });

    it('prefers 2-char combined kana', () => {
      expect(resolve(dict, 'きゃ')).toEqual(['K', 'Y', 'AH0']);
    });

    it('falls back to 1-char when 2-char not found', () => {
      expect(resolve(dict, 'きた')).toEqual(['K', 'IY0', 'T', 'AH0']);
    });

    it('skips structural markers (ー, っ, ッ)', () => {
      expect(resolve(dict, 'かっ')).toEqual(['K', 'AH0']);
    });

    it('returns empty array for only structural markers', () => {
      expect(resolve(dict, 'っー')).toEqual([]);
    });

    it('returns undefined for unknown kanji', () => {
      expect(resolve(dict, '漢')).toBeUndefined();
    });
  });

  describe('sv (Swedish lemmatization)', () => {
    const resolve = WORD_RESOLVERS.sv!;
    const dict: Record<string, string[]> = {
      barn: ['B', 'AA1', 'R', 'N'],
      flicka: ['F', 'L', 'IH1', 'K', 'AH0'],
      hund: ['HH', 'UH1', 'N', 'D'],
    };

    it('strips -en suffix', () => {
      expect(resolve(dict, 'barnen')).toEqual(['B', 'AA1', 'R', 'N']);
    });

    it('strips -orna suffix with -a replacement', () => {
      expect(resolve(dict, 'flickorna')).toEqual(['F', 'L', 'IH1', 'K', 'AH0']);
    });

    it('handles genitive -s recursively', () => {
      // barnens -> strip -s -> barnen -> strip -en -> barn
      expect(resolve(dict, 'barnens')).toEqual(['B', 'AA1', 'R', 'N']);
    });

    it('strips -ar suffix', () => {
      expect(resolve(dict, 'hundar')).toEqual(['HH', 'UH1', 'N', 'D']);
    });

    it('returns undefined for unresolvable words', () => {
      expect(resolve(dict, 'xyz')).toBeUndefined();
    });
  });

  describe('ro (Romanian lemmatization)', () => {
    const resolve = WORD_RESOLVERS.ro!;
    const dict: Record<string, string[]> = {
      băiat: ['B', 'AH0', 'Y', 'AH1', 'T'],
      femeie: ['F', 'EH0', 'M', 'EY1'],
      întâlni: ['IH0', 'N', 'T'],
    };

    it('strips -ul suffix', () => {
      expect(resolve(dict, 'băiatul')).toEqual(['B', 'AH0', 'Y', 'AH1', 'T']);
    });

    it('strips -ele suffix with -ă replacement', () => {
      const dictEle: Record<string, string[]> = {
        femeă: ['F', 'EH0', 'M', 'EY1'],
      };
      expect(resolve(dictEle, 'femeele')).toEqual(['F', 'EH0', 'M', 'EY1']);
    });

    it('restores n→în prefix', () => {
      expect(resolve(dict, 'ntâlni')).toEqual(['IH0', 'N', 'T']);
    });

    it('tries î + word', () => {
      expect(resolve(dict, 'ntâlni')).toBeDefined();
    });
  });

  describe('eo (Esperanto lemmatization)', () => {
    const resolve = WORD_RESOLVERS.eo!;
    const dict: Record<string, string[]> = {
      bono: ['B', 'OW1', 'N', 'OW0'],
      labori: ['L', 'AH0', 'B', 'OW1', 'R', 'IY0'],
      laboro: ['L', 'AH0', 'B', 'OW1', 'R', 'OW0'],
      rapida: ['R', 'AH0', 'P', 'IY1', 'D', 'AH0'],
    };

    it('strips accusative -n', () => {
      expect(resolve(dict, 'bonon')).toEqual(['B', 'OW1', 'N', 'OW0']);
    });

    it('strips plural -j', () => {
      expect(resolve(dict, 'bonoj')).toEqual(['B', 'OW1', 'N', 'OW0']);
    });

    it('strips plural accusative -jn', () => {
      expect(resolve(dict, 'bonojn')).toEqual(['B', 'OW1', 'N', 'OW0']);
    });

    it('strips verb past tense -is', () => {
      expect(resolve(dict, 'laboris')).toEqual(['L', 'AH0', 'B', 'OW1', 'R', 'IY0']);
    });

    it('strips verb future -os', () => {
      expect(resolve(dict, 'laboros')).toEqual(['L', 'AH0', 'B', 'OW1', 'R', 'IY0']);
    });

    it('strips imperative -u', () => {
      expect(resolve(dict, 'laboru')).toEqual(['L', 'AH0', 'B', 'OW1', 'R', 'IY0']);
    });

    it('strips participle -anta', () => {
      expect(resolve(dict, 'laboranta')).toEqual(['L', 'AH0', 'B', 'OW1', 'R', 'IY0']);
    });

    it('strips adverb -e to noun -o', () => {
      expect(resolve(dict, 'rapide')).toEqual(['R', 'AH0', 'P', 'IY1', 'D', 'AH0']);
    });

    it('strips prefix mal- with recursive lemmatization', () => {
      expect(resolve(dict, 'malbono')).toEqual(['B', 'OW1', 'N', 'OW0']);
    });

    it('strips derivational suffix -isto', () => {
      expect(resolve(dict, 'laboristo')).toEqual(['L', 'AH0', 'B', 'OW1', 'R', 'OW0']);
    });
  });

  describe('sw (Swahili lemmatization)', () => {
    const resolve = WORD_RESOLVERS.sw!;
    const dict: Record<string, string[]> = {
      kula: ['K', 'UW1', 'L', 'AH0'],
      soma: ['S', 'OW1', 'M', 'AH0'],
    };

    it('strips verb prefix wa-', () => {
      expect(resolve(dict, 'wakula')).toEqual(['K', 'UW1', 'L', 'AH0']);
    });

    it('strips verb prefix ni-', () => {
      expect(resolve(dict, 'nikula')).toEqual(['K', 'UW1', 'L', 'AH0']);
    });

    it('strips verb prefix wana-', () => {
      expect(resolve(dict, 'wanakula')).toEqual(['K', 'UW1', 'L', 'AH0']);
    });

    it('tries ku- form', () => {
      const dictKu: Record<string, string[]> = {
        kusoma: ['K', 'UW0', 'S', 'OW1', 'M', 'AH0'],
      };
      expect(resolve(dictKu, 'wasoma')).toEqual(['K', 'UW0', 'S', 'OW1', 'M', 'AH0']);
    });

    it('strips derivational suffix without prefix', () => {
      const dictSuf: Record<string, string[]> = {
        soma: ['S', 'OW1', 'M', 'AH0'],
      };
      expect(resolve(dictSuf, 'somana')).toEqual(['S', 'OW1', 'M', 'AH0']);
    });
  });

  describe('fi (Finnish lemmatization)', () => {
    const resolve = WORD_RESOLVERS.fi!;
    const dict: Record<string, string[]> = {
      kaupunki: ['K', 'AW1', 'P', 'UH0', 'NG', 'K', 'IY0'],
      koira: ['K', 'OY1', 'R', 'AH0'],
      talo: ['T', 'AH1', 'L', 'OW0'],
    };

    it('strips inessive -ssa', () => {
      expect(resolve(dict, 'talossa')).toEqual(['T', 'AH1', 'L', 'OW0']);
    });

    it('strips partitive -a', () => {
      expect(resolve(dict, 'koiraa')).toEqual(['K', 'OY1', 'R', 'AH0']);
    });

    it('applies consonant strengthening nn→nt', () => {
      // rannt → suffix -t → stem "rann" → strengthening: nn → nt → "rant" → match!
      const d: Record<string, string[]> = { rant: ['R', 'AH1', 'N', 'T'] };
      expect(resolve(d, 'rannt')).toEqual(['R', 'AH1', 'N', 'T']);
    });

    it('applies consonant strengthening ng→nk', () => {
      // langat → suffix -at → stem "lang" → replacements ['a'] → "langa" → no match
      // strengthening: "lang" ends in ng → nk → "lank" → replacements ['a'] → "lanka" → match!
      const d: Record<string, string[]> = { lanka: ['L', 'AH1', 'NG', 'K', 'AH0'] };
      expect(resolve(d, 'langat')).toEqual(['L', 'AH1', 'NG', 'K', 'AH0']);
    });

    it('applies consonant strengthening ll→lt', () => {
      // sullt → suffix -t → stem "sull" → strengthening: ll → lt → "sult" → match!
      const d: Record<string, string[]> = { sult: ['S', 'UH1', 'L', 'T'] };
      expect(resolve(d, 'sullt')).toEqual(['S', 'UH1', 'L', 'T']);
    });

    it('applies consonant strengthening rr→rt', () => {
      const d: Record<string, string[]> = { part: ['P', 'AH1', 'R', 'T'] };
      expect(resolve(d, 'parrt')).toEqual(['P', 'AH1', 'R', 'T']);
    });

    it('applies consonant strengthening mm→mp', () => {
      const d: Record<string, string[]> = { kamp: ['K', 'AH1', 'M', 'P'] };
      expect(resolve(d, 'kammt')).toEqual(['K', 'AH1', 'M', 'P']);
    });

    it('applies consonant gradation nt→nn', () => {
      // rantn → suffix -n → stem "rant" → gradation: nt → nn → "rann" → match!
      const d: Record<string, string[]> = { rann: ['R', 'AH1', 'N'] };
      expect(resolve(d, 'rantn')).toEqual(['R', 'AH1', 'N']);
    });

    it('applies consonant gradation nk→ng', () => {
      // lankn → suffix -n → stem "lank" → gradation: nk → ng → "lang" → match!
      const d: Record<string, string[]> = { lang: ['L', 'AH1', 'NG'] };
      expect(resolve(d, 'lankn')).toEqual(['L', 'AH1', 'NG']);
    });

    it('applies consonant gradation mp→mm', () => {
      // kampn → suffix -n → stem "kamp" → gradation: mp → mm → "kamm" → match!
      const d: Record<string, string[]> = { kamm: ['K', 'AH1', 'M'] };
      expect(resolve(d, 'kampn')).toEqual(['K', 'AH1', 'M']);
    });

    it('applies consonant gradation lt→ll', () => {
      const d: Record<string, string[]> = { sull: ['S', 'UH1', 'L'] };
      expect(resolve(d, 'sultn')).toEqual(['S', 'UH1', 'L']);
    });

    it('applies consonant gradation rt→rr', () => {
      const d: Record<string, string[]> = { parr: ['P', 'AH1', 'R'] };
      expect(resolve(d, 'partn')).toEqual(['P', 'AH1', 'R']);
    });

    it('applies consonant gradation lk→l', () => {
      // jalkn → suffix -n → stem "jalk" → gradation: lk → "jal" → match!
      const d: Record<string, string[]> = { jal: ['Y', 'AH1', 'L'] };
      expect(resolve(d, 'jalkn')).toEqual(['Y', 'AH1', 'L']);
    });

    it('applies consonant gradation rk→r', () => {
      // markn → suffix -n → stem "mark" → gradation: rk → "mar" → match!
      const d: Record<string, string[]> = { mar: ['M', 'AH1', 'R'] };
      expect(resolve(d, 'markn')).toEqual(['M', 'AH1', 'R']);
    });

    it('handles two-level possessive stripping with -ni', () => {
      // talossani → strip -ni → talossa → strip -ssa → talo
      expect(resolve(dict, 'talossani')).toEqual(['T', 'AH1', 'L', 'OW0']);
    });

    it('handles two-level possessive stripping with -nsa', () => {
      // talossansa → strip -nsa → talossa → strip -ssa → talo
      expect(resolve(dict, 'talossansa')).toEqual(['T', 'AH1', 'L', 'OW0']);
    });

    it('handles two-level possessive stripping with -mme', () => {
      // talossamme → strip -mme → talossa → strip -ssa → talo
      expect(resolve(dict, 'talossamme')).toEqual(['T', 'AH1', 'L', 'OW0']);
    });

    it('strips verb suffix -nut', () => {
      const dictVerb: Record<string, string[]> = {
        puhua: ['P', 'UW1'],
      };
      expect(resolve(dictVerb, 'puhunut')).toEqual(['P', 'UW1']);
    });
  });

  describe('nb (Norwegian Bokmål)', () => {
    const resolve = WORD_RESOLVERS.nb!;
    const dict: Record<string, string[]> = {
      av: ['AH1', 'V'],
      etter: ['EH1', 'T', 'ER0'],
      hund: ['HH', 'UH1', 'N', 'D'],
      mål: ['M', 'AO1', 'L'],
    };

    it('modernizes af→av', () => {
      expect(resolve(dict, 'af')).toEqual(['AH1', 'V']);
    });

    it('modernizes efter→etter', () => {
      expect(resolve(dict, 'efter')).toEqual(['EH1', 'T', 'ER0']);
    });

    it('modernizes aa→å', () => {
      expect(resolve(dict, 'maal')).toEqual(['M', 'AO1', 'L']);
    });

    it('strips -en suffix', () => {
      expect(resolve(dict, 'hunden')).toEqual(['HH', 'UH1', 'N', 'D']);
    });

    it('two-level: suffix strip then modernize', () => {
      // maalen → strip -en → maal → modernize aa→å → mål
      expect(resolve(dict, 'maalen')).toEqual(['M', 'AO1', 'L']);
    });

    it('strips -er suffix', () => {
      expect(resolve(dict, 'hunder')).toEqual(['HH', 'UH1', 'N', 'D']);
    });
  });

  describe('ma (Malay lemmatization)', () => {
    const resolve = WORD_RESOLVERS.ma!;
    const dict: Record<string, string[]> = {
      baik: ['B', 'AY1', 'K'],
      buat: ['B', 'UW1', 'AH0', 'T'],
      makan: ['M', 'AH0', 'K', 'AH1', 'N'],
      tulis: ['T', 'UW1', 'L', 'IH0', 'S'],
    };

    it('strips suffix -kan', () => {
      expect(resolve(dict, 'buatkan')).toEqual(['B', 'UW1', 'AH0', 'T']);
    });

    it('strips suffix -nya', () => {
      expect(resolve(dict, 'makannya')).toEqual(['M', 'AH0', 'K', 'AH1', 'N']);
    });

    it('strips prefix me- directly', () => {
      expect(resolve(dict, 'memakan')).toEqual(['M', 'AH0', 'K', 'AH1', 'N']);
    });

    it('restores dropped consonant with men- prefix', () => {
      // menulis → men- + ulis → restore t → tulis
      expect(resolve(dict, 'menulis')).toEqual(['T', 'UW1', 'L', 'IH0', 'S']);
    });

    it('strips suffix then prefix', () => {
      // memperbaiki → suffix -i → membaik → not found
      // But: perbaiki → suffix -i → perbaik → not found, prefix per- → baik
      expect(resolve(dict, 'perbaiki')).toEqual(['B', 'AY1', 'K']);
    });
  });

  describe('fa (Persian lemmatization)', () => {
    const resolve = WORD_RESOLVERS.fa!;
    const dict: Record<string, string[]> = {
      خانه: ['X', 'AH1', 'N', 'EH0'],
      کتاب: ['K', 'EH0', 'T', 'AH1', 'B'],
      کن: ['K', 'AH0', 'N'],
    };

    it('strips plural -ها suffix', () => {
      expect(resolve(dict, 'خانه\u200Cها')).toBeDefined();
    });

    it('splits ZWNJ compounds', () => {
      // می‌کند → parts: ['می', 'کند']
      const dictVerb: Record<string, string[]> = {
        کن: ['K', 'AH0', 'N'],
        کند: ['K', 'AH0', 'N', 'D'],
      };
      expect(resolve(dictVerb, 'می\u200Cکند')).toEqual(['K', 'AH0', 'N', 'D']);
    });

    it('strips verb endings with می prefix', () => {
      const dictVerb: Record<string, string[]> = {
        کن: ['K', 'AH0', 'N'],
      };
      // می‌کنند → parts: ['می', 'کنند'] → strip -ند → کن
      expect(resolve(dictVerb, 'می\u200Cکنند')).toEqual(['K', 'AH0', 'N']);
    });

    it('strips suffix -ها without ZWNJ', () => {
      expect(resolve(dict, 'کتابها')).toEqual(['K', 'EH0', 'T', 'AH1', 'B']);
    });

    it('tries joining ZWNJ parts', () => {
      const dictJoined: Record<string, string[]> = {
        میکند: ['M', 'IY0', 'K'],
      };
      expect(resolve(dictJoined, 'می\u200Cکند')).toEqual(['M', 'IY0', 'K']);
    });
  });
});
