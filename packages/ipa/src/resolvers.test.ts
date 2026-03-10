import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { loadLangDict, translateSync } from 'ingglish';
import { beforeAll, describe, expect, it } from 'vitest';
import { G2P_CONVERTERS } from './g2p';
import { convertIpaEntries, WORD_RESOLVERS } from './index';

/**
 * Tests language-specific word resolvers and G2P converters.
 *
 * Uses translateSync(word, { lang }) for G2P coverage.
 * Uses WORD_RESOLVERS[lang] directly for resolver coverage because vitest's
 * source map remapping loses coverage attribution when calls cross package
 * boundaries (translateSync → core's lookupDict → ipa's WORD_RESOLVERS).
 * Verified empirically: translateSync gives 15% resolver coverage vs 98%+ direct.
 *
 * All dicts are pre-loaded once in beforeAll to avoid repeated file I/O per test.
 */

const DICT_DIR = path.resolve(import.meta.dirname, '..', '..', 'website', 'public', 'ipa-dicts');

const RESOLVER_LANGS = ['de', 'ja', 'sv', 'ro', 'eo', 'fi', 'nb', 'ma', 'fa', 'sw'] as const;
const G2P_LANGS = ['fi', 'eo', 'sw', 'ma'] as const;
const entries = {} as Record<string, Record<string, string[]>>;

beforeAll(async () => {
  // Load resolver dicts and G2P dicts in parallel
  const [, ...g2pDicts] = await Promise.all([
    // Load all resolver dicts from disk
    Promise.all(
      RESOLVER_LANGS.map(async (lang) => {
        const json = await readFile(path.resolve(DICT_DIR, `${lang}.json`), 'utf8');
        const raw = JSON.parse(json) as Record<string, string | string[]>;
        entries[lang] = convertIpaEntries(raw, lang);
      })
    ),
    // Pre-load G2P languages so translateSync works
    ...G2P_LANGS.map((lang) => loadLangDict(lang)),
  ]);
  // Also store G2P entries for any overlap
  for (const [i, G2P_LANG] of G2P_LANGS.entries()) {
    entries[G2P_LANG] ??= g2pDicts[i]!.entries;
  }
}, 30_000);

describe('German ß resolver', () => {
  it('normalizes ß to ss', () => {
    expect(WORD_RESOLVERS.de!(entries.de!, 'daß')).toBeDefined();
  });

  it('normalizes ß with title case fallback', () => {
    expect(WORD_RESOLVERS.de!(entries.de!, 'kongreß')).toBeDefined();
  });

  it('returns undefined for words without ß', () => {
    expect(WORD_RESOLVERS.de!(entries.de!, 'das')).toBeUndefined();
  });
});

describe('Japanese kana resolver', () => {
  it('resolves single kana characters', () => {
    const result = WORD_RESOLVERS.ja!(entries.ja!, 'かた');
    expect(result).toBeDefined();
    expect(result!.length).toBeGreaterThan(0);
  });

  it('prefers 2-char combined kana', () => {
    expect(WORD_RESOLVERS.ja!(entries.ja!, 'きゃ')).toBeDefined();
  });

  it('falls back to 1-char when 2-char not found', () => {
    expect(WORD_RESOLVERS.ja!(entries.ja!, 'きた')).toBeDefined();
  });

  it('skips structural markers (っ, ー)', () => {
    expect(WORD_RESOLVERS.ja!(entries.ja!, 'かっ')).toBeDefined();
  });

  it('returns empty for only structural markers', () => {
    expect(WORD_RESOLVERS.ja!(entries.ja!, 'っー')).toEqual([]);
  });

  it('returns undefined for characters not in dict', () => {
    expect(WORD_RESOLVERS.ja!(entries.ja!, '㊀')).toBeUndefined();
  });
});

describe('Swedish resolver', () => {
  it.each([
    ['barnen', 'strips -en suffix'],
    ['flickorna', 'strips -orna suffix with -a replacement'],
    ['hundar', 'strips -ar suffix'],
    ['barnens', 'handles recursive genitive -s'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.sv!(entries.sv!, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.sv!(entries.sv!, 'xyz')).toBeUndefined();
  });
});

describe('Romanian resolver', () => {
  it.each([
    ['băiatul', 'strips -ul suffix'],
    ['nțeleg', 'restores n- prefix to în-'],
    ['mpart', 'prepends î for fragments like mpart → împart'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.ro!(entries.ro!, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.ro!(entries.ro!, 'xyz')).toBeUndefined();
  });
});

describe('Esperanto resolver', () => {
  it.each([
    ['bonon', 'strips accusative -n'],
    ['bonoj', 'strips plural -j'],
    ['bonojn', 'strips plural accusative -jn'],
    ['laboris', 'strips past tense -is'],
    ['laboros', 'strips future tense -os'],
    ['laboru', 'strips imperative -u'],
    ['laboranta', 'strips participle -anta'],
    ['rapide', 'strips adverb -e → adjective -a'],
    ['malbono', 'strips prefix mal-'],
    ['malrapide', 'strips prefix mal- with recursive lemmatization'],
    ['laboristo', 'strips derivational -isto'],
    ['laborisj', 'strips -j then continues to verb ending'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.eo!(entries.eo!, word)).toBeDefined();
  });

  it.each([
    [
      'malrapide',
      { rapida: ['R', 'AE', 'P'] },
      ['R', 'AE', 'P'],
      'prefix with recursive lemmatization',
    ],
    ['laborisj', { labori: ['L', 'AE', 'B'] }, ['L', 'AE', 'B'], '-j fallthrough then verb ending'],
  ])('controlled: %s (%s)', (word, ctrlEntries, expected) => {
    expect(WORD_RESOLVERS.eo!(ctrlEntries, word)).toEqual(expected);
  });

  it('returns undefined for prefix stripping failure', () => {
    expect(WORD_RESOLVERS.eo!(entries.eo!, 'malxyz')).toBeUndefined();
  });
});

describe('Finnish resolver', () => {
  it.each([
    ['talossa', 'strips inessive -ssa'],
    ['koiraa', 'strips partitive -a'],
    ['talossani', 'strips possessive -ni then case (two-level)'],
    ['talossamme', 'strips possessive -mme then case (two-level)'],
    ['talossansa', 'strips possessive -nsa then case (two-level)'],
    ['puhunut', 'strips verb suffix -nut'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.fi!(entries.fi!, word)).toBeDefined();
  });

  it.each([
    ['rintat', 'rinna', ['R', 'IY', 'N', 'AE'], 'nt→nn'],
    ['haltat', 'halla', ['HH', 'AE', 'L', 'AE'], 'lt→ll'],
    ['partat', 'parra', ['P', 'AE', 'R', 'AE'], 'rt→rr'],
    ['kankat', 'kanga', ['K', 'AE', 'NG', 'AE'], 'nk→ng'],
    ['kumpat', 'kumma', ['K', 'UH', 'M', 'AE'], 'mp→mm'],
    ['halkat', 'hala', ['HH', 'AE', 'L', 'AE'], 'lk→l'],
    ['parkat', 'para', ['P', 'AE', 'R', 'AE'], 'rk→r'],
  ])('applies consonant gradation %s (%s)', (word, dictKey, phonemes) => {
    const ctrlEntries = { [dictKey]: phonemes };
    expect(WORD_RESOLVERS.fi!(ctrlEntries, word)).toEqual(phonemes);
  });

  it.each([
    ['rannat', 'ranta', ['R', 'AE', 'N', 'T', 'AE'], 'nn→nt'],
    ['sillat', 'silta', ['S', 'IY', 'L', 'T', 'AE'], 'll→lt'],
    ['parrat', 'parta', ['P', 'AE', 'R', 'T', 'AE'], 'rr→rt'],
    ['langat', 'lanka', ['L', 'AE', 'N', 'K', 'AE'], 'ng→nk'],
    ['kammat', 'kampa', ['K', 'AE', 'M', 'P', 'AE'], 'mm→mp'],
  ])('applies consonant strengthening %s (%s)', (word, dictKey, phonemes) => {
    const ctrlEntries = { [dictKey]: phonemes };
    expect(WORD_RESOLVERS.fi!(ctrlEntries, word)).toEqual(phonemes);
  });
});

describe('Norwegian Bokmål resolver', () => {
  it.each([
    ['af', 'modernizes af → av'],
    ['efter', 'modernizes efter → etter'],
    ['maal', 'modernizes old aa → å'],
    ['hunden', 'strips -en suffix'],
    ['hunder', 'strips -er suffix'],
    ['maalen', 'two-level: suffix then modernize'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.nb!(entries.nb!, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.nb!(entries.nb!, 'zzz')).toBeUndefined();
  });
});

describe('Malay resolver', () => {
  it.each([
    ['memakan', 'strips prefix me-'],
    ['menulis', 'restores dropped consonant with men- prefix'],
    ['buatkan', 'strips suffix -kan'],
    ['perbaiki', 'strips prefix per- + suffix -i'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.ma!(entries.ma!, word)).toBeDefined();
  });
});

describe('Persian resolver', () => {
  it.each([
    ['کتابها', 'strips plural -ها suffix'],
    ['می\u200Cکند', 'splits ZWNJ compounds'],
    ['می\u200Cکنند', 'strips verb endings with می prefix'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.fa!(entries.fa!, word)).toBeDefined();
  });

  it.each([
    [
      'می\u200Cخورند',
      { خور: ['X', 'OW', 'R'] },
      ['X', 'OW', 'R'],
      'strips verb ending -ند with می prefix',
    ],
    [
      'می\u200Cکند',
      { میکند: ['M', 'IY', 'K'] },
      ['M', 'IY', 'K'],
      'joins ZWNJ parts when joined form is in dict',
    ],
  ])('controlled: %s (%s)', (word, ctrlEntries, expected) => {
    expect(WORD_RESOLVERS.fa!(ctrlEntries, word)).toEqual(expected);
  });
});

describe('Swahili resolver', () => {
  it.each([
    ['wanakula', 'strips verb prefix wana-'],
    ['nikula', 'strips verb prefix ni-'],
    ['wakula', 'strips verb prefix wa-'],
    ['wanasoma', 'resolves prefix + ku-form fallback'],
    ['nilipendisha', 'strips derivational suffix -isha with prefix'],
    ['nilisomisha', 'strips derivational suffix -isha with prefix + ku-form'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.sw!(entries.sw!, word)).toBeDefined();
  });

  it('strips derivational suffix without prefix', () => {
    const ctrlEntries = { paka: ['P', 'AE', 'K', 'AE'] };
    expect(WORD_RESOLVERS.sw!(ctrlEntries, 'pakika')).toEqual(['P', 'AE', 'K', 'AE']);
  });
});

describe('G2P fallback via translateSync()', () => {
  it.each([
    ['talokissa', 'fi', 'Finnish G2P for unknown words'],
    ['salutonido', 'eo', 'Esperanto G2P for unknown words'],
    ['habarimu', 'sw', 'Swahili G2P for unknown words'],
    ['selamatmu', 'ma', 'Malay G2P for unknown words'],
    ['xyz123', 'fi', 'G2P skips unknown characters'],
    ['blö', 'fi', 'Finnish G2P monosyllabic stress'],
    ['bla', 'ma', 'Malay G2P monosyllabic stress'],
    ['belakanmu', 'ma', 'Malay G2P multisyllabic stress'],
  ])('%s (%s) — %s', (word, lang) => {
    expect(translateSync(word, { lang })).toBeTruthy();
  });

  it('returns empty array for all-unknown-char input (empty IPA)', () => {
    // All digits are unknown to Esperanto rules → applyRules returns '' →
    // addPenultimateStress returns '' → ipaToArpabet returns []
    expect(G2P_CONVERTERS.eo.convert('123')).toEqual([]);
  });
});
