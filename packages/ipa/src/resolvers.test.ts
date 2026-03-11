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
  it.each([
    ['daß', ['D', 'AE1', 'S'], 'normalizes ß to ss'],
    ['kongreß', ['K', 'AO', 'N', 'G', 'R', 'EH1', 'S'], 'normalizes ß with title case fallback'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.de!(entries.de!, word)).toEqual(expected);
  });

  it('returns undefined for words without ß', () => {
    expect(WORD_RESOLVERS.de!(entries.de!, 'das')).toBeUndefined();
  });
});

describe('Japanese kana resolver', () => {
  it.each([
    ['かた', ['K', 'AE1', 'T', 'AE1'], 'resolves single kana characters'],
    ['きゃ', ['K', 'IY', 'AE1'], 'prefers 2-char combined kana'],
    ['きた', ['K', 'IY1', 'T', 'AE1'], 'falls back to 1-char when 2-char not found'],
    ['かっ', ['K', 'AE1'], 'skips structural markers (っ, ー)'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.ja!(entries.ja!, word)).toEqual(expected);
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
    ['barnen', ['B', 'AA1', 'R', 'N'], 'strips -en suffix'],
    ['flickorna', ['F', 'L', 'IH1', 'K', 'AE2'], 'strips -orna suffix with -a replacement'],
    ['hundar', ['HH', 'UH1', 'N', 'D'], 'strips -ar suffix'],
    ['barnens', ['B', 'AA1', 'R', 'N'], 'handles recursive genitive -s'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.sv!(entries.sv!, word)).toEqual(expected);
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.sv!(entries.sv!, 'xyz')).toBeUndefined();
  });
});

describe('Romanian resolver', () => {
  it.each([
    ['băiatul', ['B', 'AH0', 'Y', 'AE1', 'T'], 'strips -ul suffix'],
    ['nțeleg', ['IH', 'N', 'T', 'S', 'EH', 'L', 'EH1', 'G'], 'restores n- prefix to în-'],
    ['mpart', ['IH', 'M', 'P', 'AE1', 'R', 'T'], 'prepends î for fragments like mpart → împart'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.ro!(entries.ro!, word)).toEqual(expected);
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.ro!(entries.ro!, 'xyz')).toBeUndefined();
  });
});

describe('Esperanto resolver', () => {
  it.each([
    ['bonon', ['B', 'OW1', 'N', 'OW'], 'strips accusative -n'],
    ['bonoj', ['B', 'OW1', 'N', 'OW'], 'strips plural -j'],
    ['bonojn', ['B', 'OW1', 'N', 'OW'], 'strips plural accusative -jn'],
    ['laboris', ['L', 'AE', 'B', 'OW1', 'R', 'IY'], 'strips past tense -is'],
    ['laboros', ['L', 'AE', 'B', 'OW1', 'R', 'IY'], 'strips future tense -os'],
    ['laboru', ['L', 'AE', 'B', 'OW1', 'R', 'IY'], 'strips imperative -u'],
    ['laboranta', ['L', 'AE', 'B', 'OW1', 'R', 'IY'], 'strips participle -anta'],
    ['rapide', ['R', 'AE', 'P', 'IY1', 'D', 'OW'], 'strips adverb -e → adjective -a'],
    ['malbono', ['B', 'OW1', 'N', 'OW'], 'strips prefix mal-'],
    [
      'malrapide',
      ['M', 'AE', 'L', 'R', 'AE', 'P', 'IY1', 'D', 'AE'],
      'strips prefix mal- with recursive lemmatization',
    ],
    ['laboristo', ['L', 'AE', 'B', 'OW1', 'R', 'OW'], 'strips derivational -isto'],
    [
      'laborisj',
      ['L', 'AE', 'B', 'OW1', 'R', 'IY', 'S'],
      'strips -j then continues to verb ending',
    ],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.eo!(entries.eo!, word)).toEqual(expected);
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
    ['talossa', ['T', 'AA1', 'L', 'OW'], 'strips inessive -ssa'],
    ['koiraa', ['K', 'OY1', 'R', 'AA'], 'strips partitive -a'],
    ['talossani', ['T', 'AA1', 'L', 'OW'], 'strips possessive -ni then case (two-level)'],
    ['talossamme', ['T', 'AA1', 'L', 'OW'], 'strips possessive -mme then case (two-level)'],
    ['talossansa', ['T', 'AA1', 'L', 'OW'], 'strips possessive -nsa then case (two-level)'],
    ['puhunut', ['P', 'UW1', 'HH', 'UW'], 'strips verb suffix -nut'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.fi!(entries.fi!, word)).toEqual(expected);
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
    ['af', ['AA1', 'V'], 'modernizes af → av'],
    ['efter', ['EH1', 'T', 'AH0', 'R'], 'modernizes efter → etter'],
    ['maal', ['M', 'OW1', 'L'], 'modernizes old aa → å'],
    ['hunden', ['HH', 'UW1', 'N'], 'strips -en suffix'],
    ['hunder', ['HH', 'UW1', 'N'], 'strips -er suffix'],
    ['maalen', ['M', 'OW1', 'L'], 'two-level: suffix then modernize'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.nb!(entries.nb!, word)).toEqual(expected);
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.nb!(entries.nb!, 'zzz')).toBeUndefined();
  });
});

describe('Malay resolver', () => {
  it.each([
    ['memakan', ['P', 'AE1', ''], 'strips prefix me-'],
    ['menulis', ['T', 'UW1', 'L', 'AH0', 'S'], 'restores dropped consonant with men- prefix'],
    ['buatkan', ['B', 'UW', 'AE1', 'T'], 'strips suffix -kan'],
    ['perbaiki', ['B', 'AE1', 'EH', 'K'], 'strips prefix per- + suffix -i'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.ma!(entries.ma!, word)).toEqual(expected);
  });
});

describe('Persian resolver', () => {
  it.each([
    ['کتابها', ['K', 'IY', 'T', 'AE1', 'B'], 'strips plural -ها suffix'],
    ['می\u200Cکند', ['M', 'AE1', 'Y'], 'splits ZWNJ compounds'],
    ['می\u200Cکنند', ['M', 'AE1', 'Y'], 'strips verb endings with می prefix'],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.fa!(entries.fa!, word)).toEqual(expected);
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
    ['wanakula', ['K', 'UW', 'L', 'AE1'], 'strips verb prefix wana-'],
    ['nikula', ['K', 'UW', 'L', 'AE1'], 'strips verb prefix ni-'],
    ['wakula', ['K', 'UW', 'L', 'AE1'], 'strips verb prefix wa-'],
    ['wanasoma', ['K', 'UW', 'S', 'OW', 'M', 'AE1'], 'resolves prefix + ku-form fallback'],
    ['nilipendisha', ['P', 'EH', 'N', 'D', 'AE1'], 'strips derivational suffix -isha with prefix'],
    [
      'nilisomisha',
      ['K', 'UW', 'S', 'OW', 'M', 'AE1'],
      'strips derivational suffix -isha with prefix + ku-form',
    ],
  ])('%s → %j (%s)', (word, expected) => {
    expect(WORD_RESOLVERS.sw!(entries.sw!, word)).toEqual(expected);
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
