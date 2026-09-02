import { describe, expect, it } from 'vitest';
import {
  buildRhymeMap,
  buildWordData,
  capitalize,
  cleanIpa,
  cleanIpaSymbol,
  alignSpelling,
  DESCRIPTION_LIMIT,
  escapeHtml,
  fitText,
  formatRate,
  frequencyBand,
  groupByLetter,
  isPageableWord,
  lcsSegments,
  letterOf,
  ordinal,
  phonemeKey,
  primaryStressIndex,
  traceSegments,
  pickHomophones,
  pickTopWords,
  renderLetterPage,
  renderSitemapIndex,
  renderWordPage,
  renderWordsHub,
  renderWordsSitemaps,
  SITEMAP_CHUNK_SIZE,
  rhymeKey,
  TITLE_LIMIT,
  wordDescription,
  wordTitle,
  type WordData,
  type WordDeps,
} from './build-word-pages';

// A tiny fake translator/dictionary so the builders can be tested in isolation.
const PRON: Record<string, string[]> = {
  colonel: ['K', 'ER1', 'N', 'AH0', 'L'],
  kernel: ['K', 'ER1', 'N', 'AH0', 'L'],
  hello: ['HH', 'AH0', 'L', 'OW1'],
  cat: ['K', 'AE1', 'T'],
};
const ING: Record<string, string> = {
  colonel: 'kernal',
  kernel: 'kernal',
  hello: 'haloh',
  cat: 'kat',
};
const IPA: Record<string, string> = { colonel: '/ˈkɝnəl/', hello: '/həˈloʊ/', cat: '/ˈkæt/' };
const GUIDE: Record<string, string> = { colonel: 'KER-nal', hello: 'ha-LOH', cat: 'KAT' };
const PHONE_ING: Record<string, string> = {
  K: 'k',
  ER: 'er',
  N: 'n',
  AH: 'a',
  L: 'l',
  HH: 'h',
  OW: 'oh',
  AE: 'a',
  T: 't',
};
const PHONE_IPA: Record<string, string> = {
  K: 'k',
  ER: 'ˈɝ',
  N: 'n',
  AH: 'ə',
  L: 'l',
  HH: 'h',
  OW: 'ˈoʊ',
  AE: 'æ',
  T: 't',
};

const FREQ: Record<string, number> = { colonel: 500, hello: 2_000_000, cat: 90_000 };
// "kernel" traces cleanly (its letters really do make its sounds); "colonel"
// does not, which is what pushes it onto the string-comparison path.
const TRACE: Record<
  string,
  { phonemes: string[]; steps: { letters: string; phonemes: string[] }[] }
> = {
  kernel: {
    phonemes: ['K', 'ER1', 'N', 'AH0', 'L'],
    steps: [
      { letters: 'K', phonemes: ['K'] },
      { letters: 'ER', phonemes: ['ER1'] },
      { letters: 'N', phonemes: ['N'] },
      { letters: 'E', phonemes: ['AH0'] },
      { letters: 'L', phonemes: ['L'] },
    ],
  },
  colonel: { phonemes: ['K', 'OW1', 'L', 'AH0', 'N', 'AH0', 'L'], steps: [] },
};

const deps: WordDeps = {
  translateSync: (text, opts) => {
    if (opts?.format === 'ipa') return IPA[text] ?? text;
    if (opts?.format === 'pronunciation') return GUIDE[text] ?? text;
    return ING[text] ?? text;
  },
  lookupPronunciation: (word) => PRON[word] ?? null,
  arpabetPhonemeToIngglish: (p) => PHONE_ING[p.replace(/[0-2]$/, '')] ?? p,
  arpabetPhonemeToIPA: (p) => PHONE_IPA[p.replace(/[0-2]$/, '')] ?? p,
  arpabetToIngglish: (ps) => ps.map((p) => PHONE_ING[p.replace(/[0-2]$/, '')] ?? p).join(''),
  getWordFrequency: (word) => FREQ[word],
  getCorpusTotal: () => 50_000_000,
  traceSpelling: (word) => TRACE[word] ?? null,
};

describe('isPageableWord', () => {
  it.each([
    ['cat', true],
    ['a', false], // too short
    ['co-op', false],
    ["don't", false],
    ['win32', false],
    ['CAT', false], // must be lowercase
  ])('%s → %s', (word, expected) => {
    expect(isPageableWord(word)).toBe(expected);
  });
});

describe('pickTopWords', () => {
  it('returns pageable words sorted by frequency, deduped, capped at limit', () => {
    const entries = [
      { word: 'the', count: 100 },
      { word: 'a', count: 999 }, // not pageable (too short)
      { word: 'cat', count: 50 },
      { word: 'The', count: 5 }, // dupe of 'the' (lowercased)
      { word: 'hello', count: 75 },
    ];
    expect(pickTopWords(entries, 10)).toEqual(['the', 'hello', 'cat']);
    expect(pickTopWords(entries, 2)).toEqual(['the', 'hello']);
  });
});

describe('cleanIpa / cleanIpaSymbol', () => {
  it('cleanIpa keeps stress marks, strips joiners and dots', () => {
    expect(cleanIpa('⁠ˈkɝ.nəl')).toBe('ˈkɝnəl');
  });
  it('cleanIpaSymbol strips stress marks too', () => {
    expect(cleanIpaSymbol('⁠ˈkɝ.nəl')).toBe('kɝnəl');
  });
});

describe('buildWordData', () => {
  it('builds display data with guide, sounds and syllable count', () => {
    const data = buildWordData('colonel', 3, deps);
    expect(data).not.toBeNull();
    expect(data!.ingglish).toBe('kernal');
    expect(data!.ipa).toBe('ˈkɝnəl'); // word-level IPA keeps stress
    expect(data!.guide).toBe('KER-nal');
    expect(data!.syllables).toBe(2); // ER1 + AH0
    expect(data!.frequencyRank).toBe(3);
    expect(data!.sounds.map((s) => s.ingglish)).toEqual(['k', 'er', 'n', 'a', 'l']);
    expect(data!.sounds[1]!.ipa).toBe('ɝ'); // per-sound stress stripped
  });

  it('marks which sounds are vowels and where the primary stress falls', () => {
    const data = buildWordData('colonel', 3, deps)!;
    expect(data.sounds.map((s) => s.vowel)).toEqual([false, true, false, true, false]);
    expect(data.stressIndex).toBe(0); // ER1 is the first syllable
  });

  it('converts the raw frequency count to uses per million', () => {
    // colonel: 500 in a 50M-token corpus = 10 per million
    expect(buildWordData('colonel', 3, deps, 400)!.perMillion).toBe(10);
    expect(buildWordData('colonel', 3, deps, 400)!.corpusSize).toBe(400);
    expect(buildWordData('kernel', 3, deps)!.perMillion).toBeNull(); // no count
  });

  it('returns null when the word has no pronunciation', () => {
    expect(buildWordData('zzz', 0, deps)).toBeNull();
  });
});

describe('primaryStressIndex', () => {
  it.each([
    [['K', 'ER1', 'N', 'AH0', 'L'], 0],
    [['HH', 'AH0', 'L', 'OW1'], 1],
    [['DH', 'AH0'], -1], // unstressed function word
  ])('%s → %s', (phonemes, expected) => {
    expect(primaryStressIndex(phonemes)).toBe(expected);
  });
});

describe('lcsSegments', () => {
  it('splits both spellings into aligned columns around what they share', () => {
    expect(lcsSegments('tsunami', 'tsoonomee')).toEqual([
      { from: 'ts', to: 'ts' },
      { from: 'u', to: 'oo' },
      { from: 'n', to: 'n' },
      { from: 'a', to: 'o' },
      { from: 'm', to: 'm' },
      { from: 'i', to: 'ee' },
    ]);
  });

  it('gives a one-sided run a letter from its neighbour so no column is empty', () => {
    expect(lcsSegments('lum', 'luhm')).toEqual([
      { from: 'l', to: 'l' },
      { from: 'u', to: 'uh' }, // an inserted "h" alone would leave a hole
      { from: 'm', to: 'm' },
    ]);
    expect(lcsSegments('zeiss', 'zais')).toEqual([
      { from: 'z', to: 'z' },
      { from: 'e', to: 'a' },
      { from: 'i', to: 'i' },
      { from: 'ss', to: 's' },
    ]);
  });

  it.each([
    ['luring', 'luring'],
    ['cat', 'kat'],
    ['through', 'throo'],
    ['aardvark', 'ardvark'],
  ])('columns always rebuild both spellings (%s → %s)', (english, ingglish) => {
    const pairs = lcsSegments(english, ingglish);
    expect(pairs.map((p) => p.from).join('')).toBe(english);
    expect(pairs.map((p) => p.to).join('')).toBe(ingglish);
  });
});

describe('traceSegments', () => {
  it('spells each traced letter group with the dictionary phonemes', () => {
    expect(
      traceSegments(TRACE.kernel!.steps, PRON.kernel!, 'kernal', deps.arpabetToIngglish)
    ).toEqual([
      { from: 'k', to: 'k' },
      { from: 'er', to: 'er' },
      { from: 'n', to: 'n' },
      { from: 'e', to: 'a' },
      { from: 'l', to: 'l' },
    ]);
  });

  it('merges groups whose spellings run together, and keeps silent letters empty', () => {
    // A group that emits no phoneme spells to "" — that is the silent-letter
    // signal the page renders as an em dash.
    const steps = [
      { letters: 'K', phonemes: [] },
      { letters: 'N', phonemes: ['N'] },
    ];
    expect(traceSegments(steps, ['N'], 'n', deps.arpabetToIngglish)).toEqual([
      { from: 'k', to: '' },
      { from: 'n', to: 'n' },
    ]);
  });

  it('keeps trailing letters that never resolved to a column', () => {
    // A converter whose longer prefix is not an extension of its shorter one
    // never lets the second group settle; its letters still have to appear.
    const steps = [
      { letters: 'A', phonemes: ['X'] },
      { letters: 'B', phonemes: ['Y'] },
    ];
    const weird = (p: string[]): string => (p.length === 1 ? 'q' : 'zz');
    expect(traceSegments(steps, ['X', 'Y'], 'q', weird)).toEqual([
      { from: 'a', to: 'q' },
      { from: 'b', to: '' },
    ]);
  });
});

describe('alignSpelling', () => {
  it('uses the letter-to-sound trace when it matches the dictionary', () => {
    expect(alignSpelling('kernel', 'kernal', PRON.kernel!, deps)).toEqual([
      { from: 'k', to: 'k' },
      { from: 'er', to: 'er' },
      { from: 'n', to: 'n' },
      { from: 'e', to: 'a' },
      { from: 'l', to: 'l' },
    ]);
  });

  it('falls back to comparing the spellings when the trace disagrees', () => {
    // "colonel" is the classic case: its letters do not make its sounds, so the
    // trace mispronounces it and must not be used to explain the spelling.
    const pairs = alignSpelling('colonel', 'kernal', PRON.colonel!, deps);
    expect(pairs.map((p) => p.from).join('')).toBe('colonel');
    expect(pairs.map((p) => p.to).join('')).toBe('kernal');
  });

  it('falls back when there is no trace at all', () => {
    const pairs = alignSpelling('hello', 'haloh', PRON.hello!, deps);
    expect(pairs.map((p) => p.to).join('')).toBe('haloh');
  });
});

describe('frequencyBand / formatRate / ordinal', () => {
  it.each([
    [null, 'not in the frequency corpus'],
    [4000, 'one of the most common words in English'],
    [250, 'very common'],
    [12, 'common'],
    [3, 'fairly common'],
    [0.4, 'uncommon'],
    [0.01, 'rare'],
  ])('%s per million → %s', (perMillion, expected) => {
    expect(frequencyBand(perMillion)).toBe(expected);
  });

  it.each([
    [4123.6, '4,124'],
    [12.34, '12.3'],
    [0.456, '0.46'],
  ])('formats %s as %s', (rate, expected) => {
    expect(formatRate(rate)).toBe(expected);
  });

  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
  ])('ordinal %s → %s', (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});

describe('rhymeKey and buildRhymeMap', () => {
  it('groups words by their last two phonemes', () => {
    expect(rhymeKey(['K', 'ER1', 'N', 'AH0', 'L'])).toBe('AH L');
    const map = buildRhymeMap(['colonel', 'kernel', 'cat'], deps.lookupPronunciation);
    expect(map.get('AH L')).toEqual(['colonel', 'kernel']);
    expect(map.has('AE T')).toBe(true);
  });
});

describe('phonemeKey and pickHomophones', () => {
  it('builds the full stress-stripped key', () => {
    expect(phonemeKey(['K', 'ER1', 'N', 'AH0', 'L'])).toBe('K ER N AH L');
  });

  it('keeps only same-key words that have a page and are not the word itself', () => {
    const wordSet = new Set(['colonel', 'kernel']); // "krnl" (a non-page word) excluded
    const candidates = ['colonel', 'kernel', 'krnl'];
    expect(pickHomophones('colonel', candidates, wordSet, 8)).toEqual(['kernel']);
    expect(pickHomophones('colonel', undefined, wordSet, 8)).toEqual([]);
    expect(pickHomophones('colonel', candidates, wordSet, 0)).toEqual([]);
  });
});

describe('escapeHtml', () => {
  it('escapes HTML metacharacters', () => {
    expect(escapeHtml(`<a href="x">& '`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp; &#39;');
  });
});

describe('fitText', () => {
  it('returns the first candidate within the limit', () => {
    expect(fitText(['aaaaaa', 'aaa', 'a'], 4)).toBe('aaa');
  });

  it('falls back to the last candidate when nothing fits', () => {
    expect(fitText(['aaaaaa', 'aaaa'], 2)).toBe('aaaa');
  });

  it('measures code points, not UTF-16 units', () => {
    expect(fitText(['𝐚𝐛𝐜', 'x'], 3)).toBe('𝐚𝐛𝐜');
  });
});

describe('capitalize', () => {
  it.each([
    ['patriarchs', 'Patriarchs'],
    ['a', 'A'],
    ["don't", "Don't"],
    ['co-op', 'Co-op'],
    ['', ''],
  ])('%s → %s', (word, expected) => {
    expect(capitalize(word)).toBe(expected);
  });
});

// A spread of real corpus words: the head Google answers ("the", "it"), the
// pages losing the most clicks, and the longest guides in the dictionary.
const SAMPLE: Pick<WordData, 'word' | 'guide' | 'ipa' | 'syllables'>[] = [
  { word: 'a', guide: 'a', ipa: 'ə', syllables: 1 },
  { word: 'the', guide: 'dha', ipa: 'ðə', syllables: 1 },
  { word: 'it', guide: 'IT', ipa: 'ˈɪt', syllables: 1 },
  { word: 'pencil', guide: 'PEN-sal', ipa: 'ˈpɛnsəl', syllables: 2 },
  { word: 'beauty', guide: 'BYOO-tee', ipa: 'ˈbjuti', syllables: 2 },
  { word: 'colonel', guide: 'KER-nal', ipa: 'ˈkɝnəl', syllables: 2 },
  { word: 'quinoa', guide: 'KEE-NOH-a', ipa: 'ˌkiˈnoʊə', syllables: 3 },
  { word: 'butterfly', guide: 'BUH-ter-FLAI', ipa: 'ˈbʌtɝˌflaɪ', syllables: 3 },
  { word: 'patriarchs', guide: 'PAY-tree-ARKS', ipa: 'ˈpeɪtɹiˌɑɹks', syllables: 3 },
  { word: 'worcestershire', guide: 'WU-ster-sher', ipa: 'ˈwʊstɝʃɝ', syllables: 3 },
  { word: 'phenolphthalein', guide: 'FEE-nolf-THAY-lan', ipa: 'ˌfinɑlfˈθeɪlən', syllables: 4 },
  {
    word: 'uncharacteristically',
    guide: 'UHNG-KE-rik-ter-I-sti-klee',
    ipa: 'ˌʌŋˌkɛɹɪktɝˈɪstɪkli',
    syllables: 7,
  },
  {
    word: 'telecommunications',
    guide: 'TE-la-ka-MYOO-na-KAY-shanz',
    ipa: 'ˌtɛləkəˌmjunəˈkeɪʃənz',
    syllables: 7,
  },
  {
    word: 'counterrevolutionary',
    guide: 'KOUN-ter-re-va-LOO-sha-NE-ree',
    ipa: 'ˌkaʊntɝɹɛvəˈluʃəˌnɛɹi',
    syllables: 8,
  },
  {
    word: 'deinstitutionalization',
    guide: 'DEE-IN-sti-TOO-sha-na-la-ZAY-shan',
    ipa: 'ˌdiˌɪnstɪˌtuʃənələˈzeɪʃən',
    syllables: 9,
  },
  {
    // The longest guide in the dictionary — 42 characters on its own.
    word: 'antidisestablishmentarianism',
    guide: 'AN-tai-DI-sa-STA-blish-man-TE-ree-a-NI-zam',
    ipa: 'ˌæntaɪˌdɪsəˌstæblɪʃmənˈtɛɹiəˌnɪzəm',
    syllables: 12,
  },
  { word: "don't", guide: 'DOHNT', ipa: 'ˈdoʊnt', syllables: 1 },
  { word: 'co-op', guide: 'KOH-op', ipa: 'ˈkoʊˌɑp', syllables: 2 },
];

const stub = (s: (typeof SAMPLE)[number]): WordData =>
  ({ ...s, ingglish: s.word, sounds: [], spelling: [] }) as unknown as WordData;

const len = (s: string): number => [...s].length;

describe('wordTitle', () => {
  it('leads with the capitalized word and its pronunciation guide', () => {
    const title = wordTitle(stub(SAMPLE[8]!), ['monarchs']);
    expect(title).toBe('How to pronounce Patriarchs: PAY-tree-ARKS — IPA & rhymes');
    expect(len(title)).toBeLessThanOrEqual(TITLE_LIMIT);
  });

  it('drops the rhyme hook when the word has no rhymes', () => {
    expect(wordTitle(stub(SAMPLE[3]!), [])).toBe('How to pronounce Pencil: PEN-sal — IPA');
  });

  it('never carries the brand suffix or a lowercase lead', () => {
    for (const s of SAMPLE) {
      const title = wordTitle(stub(s), ['x']);
      expect(title).not.toContain('| Ingglish');
      expect(title[0]).toBe(title[0]!.toUpperCase());
    }
  });

  it.each(SAMPLE.map((s) => [s.word, s] as const))(
    'fits %s in the title limit whole facts only',
    (_word, s) => {
      for (const rhymes of [[], ['x']]) {
        const title = wordTitle(stub(s), rhymes);
        expect(len(title)).toBeLessThanOrEqual(TITLE_LIMIT);
        // Degrades by dropping a whole clause, never by truncating one.
        expect(title).not.toMatch(/[—:]\s*$/);
        expect(title).toContain(capitalize(s.word));
      }
    }
  );

  it('drops clauses in priority order as the word gets longer', () => {
    // The guide is the answer, so it outlives the "How to pronounce" framing;
    // once even that will not fit, the framing outlives the guide.
    expect(wordTitle(stub(SAMPLE[12]!), ['x'])).toBe(
      'Telecommunications: TE-la-ka-MYOO-na-KAY-shanz'
    );
    expect(wordTitle(stub(SAMPLE[15]!), ['x'])).toBe(
      'How to pronounce Antidisestablishmentarianism'
    );
  });
});

describe('wordDescription', () => {
  it('gives the pronunciation, IPA and syllable count, then what needs a click', () => {
    expect(wordDescription(stub(SAMPLE[8]!), ['monarchs'], [])).toBe(
      'Patriarchs is pronounced PAY-tree-ARKS (IPA /ˈpeɪtɹiˌɑɹks/) — 3 syllables. ' +
        'See which letters make which sound, plus words that rhyme with it.'
    );
  });

  it('names homophones only when the page has them', () => {
    expect(wordDescription(stub(SAMPLE[5]!), ['x'], ['kernel'])).toContain(
      'plus rhymes and homophones.'
    );
    expect(wordDescription(stub(SAMPLE[5]!), [], [])).toContain(
      'See which letters make which sound.'
    );
  });

  it('uses the singular for one-syllable words', () => {
    expect(wordDescription(stub(SAMPLE[1]!), [], [])).toContain('— 1 syllable.');
  });

  it.each(SAMPLE.map((s) => [s.word, s] as const))(
    'fits %s in the description limit whole facts only',
    (_word, s) => {
      for (const rhymes of [[], ['x']]) {
        const desc = wordDescription(stub(s), rhymes, rhymes);
        expect(len(desc)).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
        expect(desc.endsWith('.')).toBe(true);
        expect(desc).toContain(s.guide);
      }
    }
  );
});

// The page has a speechSynthesis button, not a recording. A snippet that
// promises audio wins the click and loses the visit.
const AUDIO_CLAIM = /audio|listen|hear|sound clip|recording|play it/i;

describe('title and description promise nothing the page does not have', () => {
  it.each(SAMPLE.map((s) => [s.word, s] as const))('%s', (_word, s) => {
    // Only the boilerplate is checked: "hear" is a legitimate headword, and the
    // guide for it legitimately reads HEER.
    const boilerplate = `${wordTitle(stub(s), ['x'])} ${wordDescription(stub(s), ['x'], ['y'])}`
      .split(s.guide)
      .join('')
      .split(s.ipa)
      .join('')
      .replace(new RegExp(capitalize(s.word), 'gi'), '');
    expect(boilerplate).not.toMatch(AUDIO_CLAIM);
  });
});

describe('title and description uniqueness', () => {
  it('gives every word its own title and description', () => {
    const titles = new Set(SAMPLE.map((s) => wordTitle(stub(s), ['x'])));
    const descs = new Set(SAMPLE.map((s) => wordDescription(stub(s), ['x'], [])));
    expect(titles.size).toBe(SAMPLE.length);
    expect(descs.size).toBe(SAMPLE.length);
  });
});

describe('renderWordPage', () => {
  const data = buildWordData('colonel', 3, deps, 48_000)!;
  const html = renderWordPage(data, ['kernel']);

  it('is a complete HTML document with canonical and word content', () => {
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<link rel="canonical" href="https://ingglish.com/word/colonel/">');
    expect(html).toContain('kernal');
    expect(html).toContain('/ˈkɝnəl/');
  });

  it('includes a per-sound breakdown, rhyme links, and a translator CTA', () => {
    expect(html).toContain('class="snd">er</td>');
    expect(html).toContain('/word/kernel/');
    expect(html).toContain('/text/?text=colonel');
    expect(html).toContain('application/ld+json');
  });

  it('shows the guide pronunciation and an FAQ with FAQPage structured data', () => {
    expect(html).toContain('class="guide">KER-nal</div>');
    expect(html).toContain('How do you pronounce “colonel”?');
    // The syllable question used to restate the Syllables fact row verbatim.
    expect(html).not.toContain('How many syllables are in “colonel”?');
    expect(html).toContain('"@type":"FAQPage"');
  });

  it('shows the letter-by-letter English → Ingglish columns', () => {
    const kernel = renderWordPage(buildWordData('kernel', 4, deps)!, []);
    expect(kernel).toContain('“kernel” letter by letter');
    expect(kernel).toContain('<td class="eng">er</td>');
    // "e" spells the schwa, so its Ingglish column is "a"
    expect(kernel).toContain('<td class="eng">e</td><td class="eng">l</td>');
  });

  it('states per-word facts: sound counts, stress, frequency band and rhyme ending', () => {
    expect(html).toContain('5 from 7 letters — 2 vowels /ɝ/, /ə/ and 3 consonants /k/, /n/, /l/');
    expect(html).toContain('stress on the 1st');
    // 500 hits in a 50M corpus = 10 per million, ranked 4th of 48,000
    expect(html).toContain('common — 10.0 uses per million words');
    expect(html).toContain('#4 of 48,000');
    expect(html).toContain('Rhyme ending');
  });

  it('says each fact once instead of restating it in prose', () => {
    // The old template repeated the same sentence in the intro, a callout and
    // every FAQ answer; ~75% of any two word pages was verbatim identical.
    expect(html.match(/every spelling always makes the same sound/g)).toBeNull();
    expect(html).not.toContain('Here is how it sounds out');
    expect(html).not.toContain('no silent letters');
  });

  it('omits the rhyme section when there are no rhymes', () => {
    expect(renderWordPage(data, [])).not.toContain('Words that rhyme');
  });

  it('renders a homophones section and points at it from the description', () => {
    const withHom = renderWordPage(data, [], ['kernel']);
    expect(withHom).toContain('homophones');
    expect(withHom).toContain('plus words that sound the same.');
    expect(withHom).toContain('/word/kernel/');
  });

  it('uses the tail-facing title and description in every head slot', () => {
    const title = 'How to pronounce Colonel: KER-nal — IPA &amp; rhymes';
    const desc =
      'Colonel is pronounced KER-nal (IPA /ˈkɝnəl/) — 2 syllables. ' +
      'See which letters make which sound, plus words that rhyme with it.';
    expect(html).toContain(`<title>${title}</title>`);
    expect(html).toContain(`<meta name="description" content="${desc}">`);
    expect(html).toContain(`<meta property="og:description" content="${desc}">`);
    expect(html).not.toContain('| Ingglish</title>');
  });

  it('omits the homophones section when there are none', () => {
    expect(renderWordPage(data, [], [])).not.toContain('(homophones)');
  });

  // ~50k generated pages share one stylesheet: inlining it would duplicate
  // the CSS tens of thousands of times in dist/ (~40% of every page's bytes).
  it('links the shared stylesheet instead of inlining CSS', () => {
    expect(html).toContain('<link rel="stylesheet" href="/word.css">');
    expect(html).not.toContain('<style>');
    expect(renderWordsHub(['a'], ['the'])).toContain('<link rel="stylesheet" href="/word.css">');
  });
});

describe('groupByLetter / letterOf', () => {
  it('groups words by first letter, sorted within each', () => {
    expect(letterOf('Cat')).toBe('c');
    const map = groupByLetter(['cat', 'apple', 'ant']);
    expect([...map.keys()].sort()).toEqual(['a', 'c']);
    expect(map.get('a')).toEqual(['ant', 'apple']); // alphabetical within letter
  });
});

describe('renderWordsHub', () => {
  it('links to each letter page and features the top words', () => {
    const html = renderWordsHub(['a', 'c'], ['the', 'cat']);
    expect(html).toContain('href="/words/a/"');
    expect(html).toContain('href="/words/c/"');
    expect(html).toContain('Most common words');
    expect(html).toContain('/word/the/');
  });
});

describe('renderLetterPage', () => {
  it('lists every word for the letter and links back to the hub', () => {
    const html = renderLetterPage('a', ['ant', 'apple']);
    expect(html).toContain('Words starting with A');
    expect(html).toContain('href="/words/"'); // back link
    expect(html).toContain('/word/ant/');
    expect(html).toContain('/word/apple/');
  });
});

describe('sitemaps', () => {
  it('renders the words sitemap with the hub, letter pages, and every word', () => {
    const maps = renderWordsSitemaps(['cat', 'hello'], ['c', 'h']);
    expect(maps).toHaveLength(1);
    expect(maps[0]!.filename).toBe('sitemap-words.xml');
    const xml = maps[0]!.xml;
    expect(xml).toContain('<loc>https://ingglish.com/words/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/words/c/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/word/cat/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/word/hello/</loc>');
  });

  it('renders a sitemap index pointing at page and word sitemaps', () => {
    const xml = renderSitemapIndex(['sitemap-words.xml']);
    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain('https://ingglish.com/sitemap-pages.xml');
    expect(xml).toContain('https://ingglish.com/sitemap-words.xml');
  });

  // A sitemap over 50,000 URLs is rejected whole, not truncated, so the split
  // has to happen before the dictionary grows into it — never after.
  it('splits past the chunk size and keeps the historical first filename', () => {
    const words = Array.from({ length: SITEMAP_CHUNK_SIZE + 10 }, (_, i) => `w${i}`);
    const maps = renderWordsSitemaps(words, ['w']);
    expect(maps).toHaveLength(2);
    expect(maps.map((m) => m.filename)).toEqual(['sitemap-words.xml', 'sitemap-words-2.xml']);
    expect([...maps[0]!.xml.matchAll(/<loc>/g)]).toHaveLength(SITEMAP_CHUNK_SIZE);
    expect([...maps[1]!.xml.matchAll(/<loc>/g)]).toHaveLength(12); // 10 words + hub + letter
  });

  it.each([0, 1, SITEMAP_CHUNK_SIZE * 2 + 5])('%i words stays under the cap', (count) => {
    const words = Array.from({ length: count }, (_, i) => `w${i}`);
    const maps = renderWordsSitemaps(words, ['w']);
    const total = maps.reduce((n, m) => n + [...m.xml.matchAll(/<loc>/g)].length, 0);
    expect(total).toBe(count + 2); // every word, plus the hub and the one letter page
    for (const m of maps) {
      expect([...m.xml.matchAll(/<loc>/g)].length).toBeLessThanOrEqual(SITEMAP_CHUNK_SIZE);
    }
    // Every chunk must be reachable, or its pages are invisible.
    const index = renderSitemapIndex(maps.map((m) => m.filename));
    for (const m of maps) expect(index).toContain(`https://ingglish.com/${m.filename}`);
  });
});
