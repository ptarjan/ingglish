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
  it('strips -en suffix', async () => {
    const entries = await loadEntries('sv');
    expect(WORD_RESOLVERS.sv!(entries, 'barnen')).toBeDefined();
  });

  it('strips -orna suffix with -a replacement', async () => {
    const entries = await loadEntries('sv');
    expect(WORD_RESOLVERS.sv!(entries, 'flickorna')).toBeDefined();
  });

  it('strips -ar suffix', async () => {
    const entries = await loadEntries('sv');
    expect(WORD_RESOLVERS.sv!(entries, 'hundar')).toBeDefined();
  });

  it('handles recursive genitive -s', async () => {
    const entries = await loadEntries('sv');
    // barnens → strip -s → barnen → strip -en → barn
    expect(WORD_RESOLVERS.sv!(entries, 'barnens')).toBeDefined();
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
  it('strips accusative -n', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'bonon')).toBeDefined();
  });

  it('strips plural -j', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'bonoj')).toBeDefined();
  });

  it('strips plural accusative -jn', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'bonojn')).toBeDefined();
  });

  it('strips past tense -is', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'laboris')).toBeDefined();
  });

  it('strips future tense -os', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'laboros')).toBeDefined();
  });

  it('strips imperative -u', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'laboru')).toBeDefined();
  });

  it('strips participle -anta', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'laboranta')).toBeDefined();
  });

  it('strips adverb -e → adjective -a', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'rapide')).toBeDefined();
  });

  it('strips prefix mal-', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'malbono')).toBeDefined();
  });

  it('strips prefix mal- with recursive lemmatization', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'malrapide')).toBeDefined();
  });

  it('strips derivational -isto', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'laboristo')).toBeDefined();
  });

  it('strips -j then continues to verb ending', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'laborisj')).toBeDefined();
  });

  it('returns undefined for prefix stripping failure', async () => {
    const entries = await loadEntries('eo');
    expect(WORD_RESOLVERS.eo!(entries, 'malxyz')).toBeUndefined();
  });
});

describe('Finnish resolver', () => {
  it('strips inessive -ssa', async () => {
    const entries = await loadEntries('fi');
    expect(WORD_RESOLVERS.fi!(entries, 'talossa')).toBeDefined();
  });

  it('strips partitive -a', async () => {
    const entries = await loadEntries('fi');
    expect(WORD_RESOLVERS.fi!(entries, 'koiraa')).toBeDefined();
  });

  it('strips possessive -ni then case (two-level)', async () => {
    const entries = await loadEntries('fi');
    expect(WORD_RESOLVERS.fi!(entries, 'talossani')).toBeDefined();
  });

  it('strips possessive -mme then case (two-level)', async () => {
    const entries = await loadEntries('fi');
    expect(WORD_RESOLVERS.fi!(entries, 'talossamme')).toBeDefined();
  });

  it('strips possessive -nsa then case (two-level)', async () => {
    const entries = await loadEntries('fi');
    expect(WORD_RESOLVERS.fi!(entries, 'talossansa')).toBeDefined();
  });

  it('strips verb suffix -nut', async () => {
    const entries = await loadEntries('fi');
    expect(WORD_RESOLVERS.fi!(entries, 'puhunut')).toBeDefined();
  });
});

describe('Norwegian Bokmål resolver', () => {
  it('modernizes af → av', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'af')).toBeDefined();
  });

  it('modernizes efter → etter', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'efter')).toBeDefined();
  });

  it('modernizes old aa → å', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'maal')).toBeDefined();
  });

  it('strips -en suffix', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'hunden')).toBeDefined();
  });

  it('strips -er suffix', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'hunder')).toBeDefined();
  });

  it('two-level: suffix then modernize', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'maalen')).toBeDefined();
  });

  it('returns undefined for unresolvable words', async () => {
    const entries = await loadEntries('nb');
    expect(WORD_RESOLVERS.nb!(entries, 'zzz')).toBeUndefined();
  });
});

describe('Malay resolver', () => {
  it('strips prefix me-', async () => {
    const entries = await loadEntries('ma');
    expect(WORD_RESOLVERS.ma!(entries, 'memakan')).toBeDefined();
  });

  it('restores dropped consonant with men- prefix', async () => {
    const entries = await loadEntries('ma');
    expect(WORD_RESOLVERS.ma!(entries, 'menulis')).toBeDefined();
  });

  it('strips suffix -kan', async () => {
    const entries = await loadEntries('ma');
    expect(WORD_RESOLVERS.ma!(entries, 'buatkan')).toBeDefined();
  });

  it('strips prefix per- + suffix -i', async () => {
    const entries = await loadEntries('ma');
    expect(WORD_RESOLVERS.ma!(entries, 'perbaiki')).toBeDefined();
  });
});

describe('Persian resolver', () => {
  it('strips plural -ها suffix', async () => {
    const entries = await loadEntries('fa');
    expect(WORD_RESOLVERS.fa!(entries, 'کتابها')).toBeDefined();
  });

  it('splits ZWNJ compounds', async () => {
    const entries = await loadEntries('fa');
    expect(WORD_RESOLVERS.fa!(entries, 'می\u200Cکند')).toBeDefined();
  });

  it('strips verb endings with می prefix', async () => {
    const entries = await loadEntries('fa');
    expect(WORD_RESOLVERS.fa!(entries, 'می\u200Cکنند')).toBeDefined();
  });
});

describe('Swahili resolver', () => {
  it('strips verb prefix wana-', async () => {
    const entries = await loadEntries('sw');
    expect(WORD_RESOLVERS.sw!(entries, 'wanakula')).toBeDefined();
  });

  it('strips verb prefix ni-', async () => {
    const entries = await loadEntries('sw');
    expect(WORD_RESOLVERS.sw!(entries, 'nikula')).toBeDefined();
  });

  it('strips verb prefix wa-', async () => {
    const entries = await loadEntries('sw');
    expect(WORD_RESOLVERS.sw!(entries, 'wakula')).toBeDefined();
  });
});

describe('G2P fallback via translate()', () => {
  it('Finnish G2P for unknown words', async () => {
    const result = await translate('talokissa', { lang: 'fi' });
    expect(result).toBeTruthy();
  });

  it('Esperanto G2P for unknown words', async () => {
    const result = await translate('salutonido', { lang: 'eo' });
    expect(result).toBeTruthy();
  });

  it('Swahili G2P for unknown words', async () => {
    const result = await translate('habarimu', { lang: 'sw' });
    expect(result).toBeTruthy();
  });

  it('Malay G2P for unknown words', async () => {
    const result = await translate('selamatmu', { lang: 'ma' });
    expect(result).toBeTruthy();
  });
});
