import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { convertIpaEntries, WORD_RESOLVERS } from './index';

/**
 * Tests language-specific word resolvers and G2P converters.
 *
 * Uses translate(word, { lang }) for G2P coverage.
 * Uses WORD_RESOLVERS[lang] directly for resolver coverage because vitest's
 * source map remapping loses coverage attribution when calls cross package
 * boundaries (translateSync → core's lookupDict → ipa's WORD_RESOLVERS).
 * Verified empirically: translateSync gives 15% resolver coverage vs 98%+ direct.
 */

const DICT_DIR = path.resolve(import.meta.dirname, '..', '..', 'website', 'public', 'ipa-dicts');

const entriesCache = new Map<string, Record<string, string[]>>();
async function loadEntries(lang: string): Promise<Record<string, string[]>> {
  let cached = entriesCache.get(lang);
  if (cached) {
    return cached;
  }
  const json = await readFile(path.resolve(DICT_DIR, `${lang}.json`), 'utf8');
  const raw = JSON.parse(json) as Record<string, string | string[]>;
  cached = convertIpaEntries(raw, lang);
  entriesCache.set(lang, cached);
  return cached;
}

describe('German ß resolver', () => {
  it('normalizes ß to ss', async () => {
    const entries = await loadEntries('de');
    const result = WORD_RESOLVERS.de!(entries, 'daß');
    expect(result).toBeDefined();
  }, 30_000);

  it('normalizes ß with title case fallback', async () => {
    const entries = await loadEntries('de');
    // Kongreß → Kongress (title case in dict)
    const result = WORD_RESOLVERS.de!(entries, 'kongreß');
    expect(result).toBeDefined();
  }, 30_000);

  it('returns undefined for words without ß', async () => {
    const entries = await loadEntries('de');
    expect(WORD_RESOLVERS.de!(entries, 'das')).toBeUndefined();
  }, 30_000);
});

describe('Japanese kana resolver', () => {
  it('resolves single kana characters', async () => {
    const entries = await loadEntries('ja');
    const result = WORD_RESOLVERS.ja!(entries, 'かた');
    expect(result).toBeDefined();
    expect(result!.length).toBeGreaterThan(0);
  });

  it('prefers 2-char combined kana', async () => {
    const entries = await loadEntries('ja');
    const result = WORD_RESOLVERS.ja!(entries, 'きゃ');
    expect(result).toBeDefined();
  });

  it('falls back to 1-char when 2-char not found', async () => {
    const entries = await loadEntries('ja');
    const result = WORD_RESOLVERS.ja!(entries, 'きた');
    expect(result).toBeDefined();
  });

  it('skips structural markers (っ, ー)', async () => {
    const entries = await loadEntries('ja');
    const result = WORD_RESOLVERS.ja!(entries, 'かっ');
    expect(result).toBeDefined();
  });

  it('returns empty for only structural markers', async () => {
    const entries = await loadEntries('ja');
    const result = WORD_RESOLVERS.ja!(entries, 'っー');
    expect(result).toEqual([]);
  });

  it('returns undefined for characters not in dict', async () => {
    const entries = await loadEntries('ja');
    // Use a rare character that won't be in the kana lookup tables
    expect(WORD_RESOLVERS.ja!(entries, '㊀')).toBeUndefined();
  });
});

describe('Swedish resolver', () => {
  it.each([
    ['barnen', 'strips -en suffix'],
    ['flickorna', 'strips -orna suffix with -a replacement'],
    ['hundar', 'strips -ar suffix'],
    ['barnens', 'handles recursive genitive -s'],
  ])('%s — %s', async (word, _description) => {
    const entries = await loadEntries('sv');
    expect(WORD_RESOLVERS.sv!(entries, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', async () => {
    const entries = await loadEntries('sv');
    expect(WORD_RESOLVERS.sv!(entries, 'xyz')).toBeUndefined();
  });
});

describe('Romanian resolver', () => {
  it('strips -ul suffix', async () => {
    const entries = await loadEntries('ro');
    expect(WORD_RESOLVERS.ro!(entries, 'băiatul')).toBeDefined();
  });

  it('restores n- prefix to în-', async () => {
    const entries = await loadEntries('ro');
    // nțeleg → prefix 'n' restored to 'în' + 'țeleg' = 'înțeleg'
    expect(WORD_RESOLVERS.ro!(entries, 'nțeleg')).toBeDefined();
  });

  it('prepends î for fragments like mpart → împart', async () => {
    const entries = await loadEntries('ro');
    expect(WORD_RESOLVERS.ro!(entries, 'mpart')).toBeDefined();
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
  ])('%s — %s', async (word, _description) => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, word)).toBeDefined();
  });

  it('strips prefix with recursive lemmatization (controlled)', () => {
    // Controlled entries: 'rapide' not in dict, but lemmatize('rapide') -> 'rapida' is
    const entries = { rapida: ['R', 'AE', 'P'] };
    // malrapide: prefix 'mal', remainder 'rapide' not in dict (line 412 fails)
    // recursive lemmatize('rapide'): adverb -e -> adjective -a -> 'rapida' in dict (line 417)
    expect(WORD_RESOLVERS.eo!(entries, 'malrapide')).toEqual(['R', 'AE', 'P']);
  });

  it('strips -j fallthrough when stripped form not in dict', () => {
    // Controlled entries: -j stripped form not in dict, but further lemmatization finds it
    const entries = { labori: ['L', 'AE', 'B'] };
    // laborisj: strip -n? no -n. strip -j -> laboris, not in dict (line 336 fallthrough)
    // Then verb endings: strip -is -> labor + 'i' = labori -> found!
    expect(WORD_RESOLVERS.eo!(entries, 'laborisj')).toEqual(['L', 'AE', 'B']);
  });

  it('returns undefined for prefix stripping failure', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'malxyz')).toBeUndefined();
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
  ])('%s — %s', async (word, _description) => {
    const entries = await loadEntries('fi');
    expect(WORD_RESOLVERS.fi!(entries, word)).toBeDefined();
  });

  it('applies consonant gradation nt→nn', () => {
    // Uses controlled entries: dict has weak form, word uses strong form + suffix
    const entries = { rinna: ['R', 'IY', 'N', 'AE'] };
    // rintat: strip -at → 'rint', gradation nt→nn → 'rinn', candidate 'rinna' in dict
    expect(WORD_RESOLVERS.fi!(entries, 'rintat')).toEqual(['R', 'IY', 'N', 'AE']);
  });

  it('applies consonant gradation lt→ll', () => {
    const entries = { halla: ['HH', 'AE', 'L', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'haltat')).toEqual(['HH', 'AE', 'L', 'AE']);
  });

  it('applies consonant gradation rt→rr', () => {
    const entries = { parra: ['P', 'AE', 'R', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'partat')).toEqual(['P', 'AE', 'R', 'AE']);
  });

  it('applies consonant gradation nk→ng', () => {
    const entries = { kanga: ['K', 'AE', 'NG', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'kankat')).toEqual(['K', 'AE', 'NG', 'AE']);
  });

  it('applies consonant gradation mp→mm', () => {
    const entries = { kumma: ['K', 'UH', 'M', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'kumpat')).toEqual(['K', 'UH', 'M', 'AE']);
  });

  it('applies consonant gradation lk→l', () => {
    const entries = { hala: ['HH', 'AE', 'L', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'halkat')).toEqual(['HH', 'AE', 'L', 'AE']);
  });

  it('applies consonant gradation rk→r', () => {
    const entries = { para: ['P', 'AE', 'R', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'parkat')).toEqual(['P', 'AE', 'R', 'AE']);
  });

  it('applies consonant strengthening nn→nt', () => {
    const entries = { ranta: ['R', 'AE', 'N', 'T', 'AE'] };
    // rannat: strip -at → 'rann', strengthen nn→nt → 'rant', candidate 'ranta' in dict
    expect(WORD_RESOLVERS.fi!(entries, 'rannat')).toEqual(['R', 'AE', 'N', 'T', 'AE']);
  });

  it('applies consonant strengthening ll→lt', () => {
    const entries = { silta: ['S', 'IY', 'L', 'T', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'sillat')).toEqual(['S', 'IY', 'L', 'T', 'AE']);
  });

  it('applies consonant strengthening rr→rt', () => {
    const entries = { parta: ['P', 'AE', 'R', 'T', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'parrat')).toEqual(['P', 'AE', 'R', 'T', 'AE']);
  });

  it('applies consonant strengthening ng→nk', () => {
    const entries = { lanka: ['L', 'AE', 'N', 'K', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'langat')).toEqual(['L', 'AE', 'N', 'K', 'AE']);
  });

  it('applies consonant strengthening mm→mp', () => {
    const entries = { kampa: ['K', 'AE', 'M', 'P', 'AE'] };
    expect(WORD_RESOLVERS.fi!(entries, 'kammat')).toEqual(['K', 'AE', 'M', 'P', 'AE']);
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
  ])('%s — %s', async (word, _description) => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, word)).toBeDefined();
  });

  it('returns undefined for unresolvable words', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'zzz')).toBeUndefined();
  });
});

describe('Malay resolver', () => {
  it.each([
    ['memakan', 'strips prefix me-'],
    ['menulis', 'restores dropped consonant with men- prefix'],
    ['buatkan', 'strips suffix -kan'],
    ['perbaiki', 'strips prefix per- + suffix -i'],
  ])('%s — %s', async (word, _description) => {
    const entries = await loadEntries('ma');
    expect(WORD_RESOLVERS.ma!(entries, word)).toBeDefined();
  });
});

describe('Persian resolver', () => {
  it.each([
    ['کتابها', 'strips plural -ها suffix'],
    ['می\u200Cکند', 'splits ZWNJ compounds'],
    ['می\u200Cکنند', 'strips verb endings with می prefix'],
  ])('%s — %s', async (word, _description) => {
    const entries = await loadEntries('fa');
    expect(WORD_RESOLVERS.fa!(entries, word)).toBeDefined();
  });

  it('strips verb ending -ند with می prefix (controlled)', () => {
    // Exercise line 891-900: می + ZWNJ + verb with ending, stem in dict
    const entries = { خور: ['X', 'OW', 'R'] };
    expect(WORD_RESOLVERS.fa!(entries, 'می\u200Cخورند')).toEqual(['X', 'OW', 'R']);
  });

  it('joins ZWNJ parts when joined form is in dict', () => {
    // Exercise line 903-905: parts joined without ZWNJ found in dict
    const entries = { میکند: ['M', 'IY', 'K'] };
    expect(WORD_RESOLVERS.fa!(entries, 'می\u200Cکند')).toEqual(['M', 'IY', 'K']);
  });
});

describe('Swahili resolver', () => {
  it.each([
    ['wanakula', 'strips verb prefix wana-'],
    ['nikula', 'strips verb prefix ni-'],
    ['wakula', 'strips verb prefix wa-'],
  ])('%s — %s', async (word, _description) => {
    const entries = await loadEntries('sw');
    expect(WORD_RESOLVERS.sw!(entries, word)).toBeDefined();
  });

  it('resolves prefix + ku-form fallback', async () => {
    const entries = await loadEntries('sw');
    // wanasoma: prefix 'wana', remainder 'soma' not in dict, but kusoma IS
    expect(WORD_RESOLVERS.sw!(entries, 'wanasoma')).toBeDefined();
  });

  it('strips derivational suffix -isha with prefix', async () => {
    const entries = await loadEntries('sw');
    // nilipendisha: prefix 'nili', remainder 'pendisha', strip -isha → 'pend' + 'a' = 'penda'
    expect(WORD_RESOLVERS.sw!(entries, 'nilipendisha')).toBeDefined();
  });

  it('strips derivational suffix -isha with prefix + ku-form', async () => {
    const entries = await loadEntries('sw');
    // nilisomisha: prefix 'nili', remainder 'somisha', strip -isha → stem 'som',
    // 'soma' not in dict, but 'kusoma' IS
    expect(WORD_RESOLVERS.sw!(entries, 'nilisomisha')).toBeDefined();
  });

  it('strips derivational suffix without prefix', () => {
    // Uses controlled entries: word doesn't match any verb prefix,
    // ends in -ika, stem+'a' is in dict
    const entries = { paka: ['P', 'AE', 'K', 'AE'] };
    expect(WORD_RESOLVERS.sw!(entries, 'pakika')).toEqual(['P', 'AE', 'K', 'AE']);
  });
});

describe('G2P fallback via translate()', () => {
  it.each([
    ['talokissa', 'fi', 'Finnish G2P for unknown words'],
    ['salutonido', 'eo', 'Esperanto G2P for unknown words'],
    ['habarimu', 'sw', 'Swahili G2P for unknown words'],
    ['selamatmu', 'ma', 'Malay G2P for unknown words'],
  ])('%s (%s) — %s', async (word, lang, _description) => {
    const result = await translate(word, { lang });
    expect(result).toBeTruthy();
  });

  it('G2P skips unknown characters', async () => {
    // Characters not in any G2P rule set are skipped (line 118)
    const result = await translate('xyz123', { lang: 'fi' });
    expect(result).toBeTruthy();
  });

  it('Finnish G2P monosyllabic stress', async () => {
    // Monosyllabic unknown word triggers addDefaultStress line 83
    const result = await translate('blö', { lang: 'fi' });
    expect(result).toBeTruthy();
  });

  it('Malay G2P monosyllabic stress', async () => {
    // Monosyllabic unknown word triggers addMalayStress line 319
    const result = await translate('bla', { lang: 'ma' });
    expect(result).toBeTruthy();
  });

  it('Malay G2P multisyllabic stress', async () => {
    // Multisyllabic unknown word exercises full addMalayStress path (lines 311-336)
    const result = await translate('belakanmu', { lang: 'ma' });
    expect(result).toBeTruthy();
  });
});
