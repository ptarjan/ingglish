import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import { convertIpaEntries, WORD_RESOLVERS } from './index';

/**
 * Tests language-specific word resolvers and G2P converters.
 *
 * Uses translate(word, { lang }) for end-to-end coverage where possible.
 * Uses WORD_RESOLVERS[lang] directly where v8 coverage can't track cross-file
 * dispatch through object property calls (lookupDict → WORD_RESOLVERS[lang]).
 */

const DICT_DIR = path.resolve(import.meta.dirname, '..', '..', 'website', 'public', 'ipa-dicts');

async function loadEntries(lang: string): Promise<Record<string, string[]>> {
  const json = await readFile(path.resolve(DICT_DIR, `${lang}.json`), 'utf8');
  const raw = JSON.parse(json) as Record<string, string | string[]>;
  return convertIpaEntries(raw, lang);
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
});
