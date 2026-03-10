import { loadLangDict, translateSync } from 'ingglish';
import { beforeAll, describe, expect, it } from 'vitest';
import { WORD_RESOLVERS } from './index';

/**
 * Tests language-specific word resolvers and G2P converters.
 *
 * Uses translateSync(word, { lang }) for G2P coverage.
 * Uses WORD_RESOLVERS[lang] directly for resolver coverage because vitest's
 * source map remapping loses coverage attribution when calls cross package
 * boundaries (translateSync → core's lookupDict → ipa's WORD_RESOLVERS).
 * Verified empirically: translateSync gives 15% resolver coverage vs 98%+ direct.
 *
 * Resolver tests use minimal mock entries (the exact keys each resolver looks up)
 * instead of loading full multi-MB dictionary files from disk (~5x faster).
 */

/** Creates a null-prototype dict from key-value pairs. */
function mockDict(pairs: Record<string, string[]>): Record<string, string[]> {
  const d: Record<string, string[]> = Object.create(null) as Record<string, string[]>;
  for (const [k, v] of Object.entries(pairs)) {
    d[k] = v;
  }
  return d;
}

// -- Mock entries: only the keys each resolver actually looks up --

const de = mockDict({
  dass: ['D', 'AE1', 'S'],
  Kongress: ['K', 'AO', 'N', 'G', 'R', 'EH1', 'S'],
});

const ja = mockDict({
  か: ['K', 'AE1'],
  き: ['K', 'IY1'],
  きゃ: ['K', 'IY', 'AE1'],
  た: ['T', 'AE1'],
});

const sv = mockDict({
  barn: ['B', 'AA1', 'R', 'N'],
  flicka: ['F', 'L', 'IH1', 'K', 'AE2'],
  hund: ['HH', 'UH1', 'N', 'D'],
});

const ro = mockDict({
  băiat: ['B', 'AH0', 'Y', 'AE1', 'T'],
  împart: ['IH', 'M', 'P', 'AE1', 'R', 'T'],
  înțeleg: ['IH', 'N', 'T', 'S', 'EH', 'L', 'EH1', 'G'],
});

const eo = mockDict({
  bono: ['B', 'OW1', 'N', 'OW'],
  labori: ['L', 'AE', 'B', 'OW1', 'R', 'IY'],
  laboris: ['L', 'AE', 'B', 'OW1', 'R', 'IY', 'S'],
  laboro: ['L', 'AE', 'B', 'OW1', 'R', 'OW'],
  malrapida: ['M', 'AE', 'L', 'R', 'AE', 'P', 'IY1', 'D', 'AE'],
  rapido: ['R', 'AE', 'P', 'IY1', 'D', 'OW'],
});

const fi = mockDict({
  koira: ['K', 'OY1', 'R', 'AA'],
  puhu: ['P', 'UW1', 'HH', 'UW'],
  talo: ['T', 'AA1', 'L', 'OW'],
});

const nb = mockDict({
  av: ['AA1', 'V'],
  etter: ['EH1', 'T', 'AH0', 'R'],
  hund: ['HH', 'UW1', 'N'],
  mål: ['M', 'OW1', 'L'],
});

const ma = mockDict({
  baik: ['B', 'AE1', 'EH', 'K'],
  buat: ['B', 'UW', 'AE1', 'T'],
  pak: ['P', 'AE1', 'K'],
  tulis: ['T', 'UW1', 'L', 'AH0', 'S'],
});

const fa = mockDict({
  کتاب: ['K', 'IY', 'T', 'AE1', 'B'],
  می: ['M', 'AE1', 'Y'],
});

const sw = mockDict({
  kula: ['K', 'UW', 'L', 'AE1'],
  kusoma: ['K', 'UW', 'S', 'OW', 'M', 'AE1'],
  penda: ['P', 'EH', 'N', 'D', 'AE1'],
});

// Pre-load G2P languages for translateSync tests
beforeAll(async () => {
  await Promise.all(['fi', 'eo', 'sw', 'ma'].map((lang) => loadLangDict(lang)));
}, 30_000);

describe('German ß resolver', () => {
  it('normalizes ß to ss', () => {
    expect(WORD_RESOLVERS.de!(de, 'daß')).toBeDefined();
  });

  it('normalizes ß with title case fallback', () => {
    expect(WORD_RESOLVERS.de!(de, 'kongreß')).toBeDefined();
  });

  it('returns undefined for words without ß', () => {
    expect(WORD_RESOLVERS.de!(de, 'das')).toBeUndefined();
  });
});

describe('Japanese kana resolver', () => {
  it('resolves single kana characters', () => {
    const result = WORD_RESOLVERS.ja!(ja, 'かた');
    expect(result).toBeDefined();
    expect(result!.length).toBeGreaterThan(0);
  });

  it('prefers 2-char combined kana', () => {
    expect(WORD_RESOLVERS.ja!(ja, 'きゃ')).toBeDefined();
  });

  it('falls back to 1-char when 2-char not found', () => {
    expect(WORD_RESOLVERS.ja!(ja, 'きた')).toBeDefined();
  });

  it('skips structural markers (っ, ー)', () => {
    expect(WORD_RESOLVERS.ja!(ja, 'かっ')).toBeDefined();
  });

  it('returns empty for only structural markers', () => {
    expect(WORD_RESOLVERS.ja!(ja, 'っー')).toEqual([]);
  });

  it('returns undefined for characters not in dict', () => {
    expect(WORD_RESOLVERS.ja!(ja, '㊀')).toBeUndefined();
  });
});

describe('Swedish resolver', () => {
  it.each([
    ['barnen', 'strips -en suffix'],
    ['flickorna', 'strips -orna suffix with -a replacement'],
    ['hundar', 'strips -ar suffix'],
    ['barnens', 'handles recursive genitive -s'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.sv!(sv, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.sv!(sv, 'xyz')).toBeUndefined();
  });
});

describe('Romanian resolver', () => {
  it.each([
    ['băiatul', 'strips -ul suffix'],
    ['nțeleg', 'restores n- prefix to în-'],
    ['mpart', 'prepends î for fragments like mpart → împart'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.ro!(ro, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', () => {
    const entries = { test: ['T'] };
    expect(WORD_RESOLVERS.ro!(entries, 'xyz')).toBeUndefined();
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
    expect(WORD_RESOLVERS.eo!(eo, word)).toBeDefined();
  });

  it.each([
    [
      'malrapide',
      { rapida: ['R', 'AE', 'P'] },
      ['R', 'AE', 'P'],
      'prefix with recursive lemmatization',
    ],
    ['laborisj', { labori: ['L', 'AE', 'B'] }, ['L', 'AE', 'B'], '-j fallthrough then verb ending'],
  ])('controlled: %s (%s)', (word, entries, expected) => {
    expect(WORD_RESOLVERS.eo!(entries, word)).toEqual(expected);
  });

  it('returns undefined for prefix stripping failure', () => {
    expect(WORD_RESOLVERS.eo!(eo, 'malxyz')).toBeUndefined();
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
    expect(WORD_RESOLVERS.fi!(fi, word)).toBeDefined();
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
    const entries = { [dictKey]: phonemes };
    expect(WORD_RESOLVERS.fi!(entries, word)).toEqual(phonemes);
  });

  it.each([
    ['rannat', 'ranta', ['R', 'AE', 'N', 'T', 'AE'], 'nn→nt'],
    ['sillat', 'silta', ['S', 'IY', 'L', 'T', 'AE'], 'll→lt'],
    ['parrat', 'parta', ['P', 'AE', 'R', 'T', 'AE'], 'rr→rt'],
    ['langat', 'lanka', ['L', 'AE', 'N', 'K', 'AE'], 'ng→nk'],
    ['kammat', 'kampa', ['K', 'AE', 'M', 'P', 'AE'], 'mm→mp'],
  ])('applies consonant strengthening %s (%s)', (word, dictKey, phonemes) => {
    const entries = { [dictKey]: phonemes };
    expect(WORD_RESOLVERS.fi!(entries, word)).toEqual(phonemes);
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
    expect(WORD_RESOLVERS.nb!(nb, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', () => {
    expect(WORD_RESOLVERS.nb!(nb, 'zzz')).toBeUndefined();
  });
});

describe('Malay resolver', () => {
  it.each([
    ['memakan', 'strips prefix me-'],
    ['menulis', 'restores dropped consonant with men- prefix'],
    ['buatkan', 'strips suffix -kan'],
    ['perbaiki', 'strips prefix per- + suffix -i'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.ma!(ma, word)).toBeDefined();
  });
});

describe('Persian resolver', () => {
  it.each([
    ['کتابها', 'strips plural -ها suffix'],
    ['می\u200Cکند', 'splits ZWNJ compounds'],
    ['می\u200Cکنند', 'strips verb endings with می prefix'],
  ])('%s — %s', (word) => {
    expect(WORD_RESOLVERS.fa!(fa, word)).toBeDefined();
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
  ])('controlled: %s (%s)', (word, entries, expected) => {
    expect(WORD_RESOLVERS.fa!(entries, word)).toEqual(expected);
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
    expect(WORD_RESOLVERS.sw!(sw, word)).toBeDefined();
  });

  it('strips derivational suffix without prefix', () => {
    const entries = { paka: ['P', 'AE', 'K', 'AE'] };
    expect(WORD_RESOLVERS.sw!(entries, 'pakika')).toEqual(['P', 'AE', 'K', 'AE']);
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
});
