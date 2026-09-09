import { describe, expect, it } from 'vitest';
import {
  rhymeDescription,
  rhymeTitle,
  renderRhymePage,
  renderRhymesHub,
  type RhymePageData,
  type RhymeRow,
} from './build-rhyme-pages';
import { renderWordPage, DESCRIPTION_LIMIT, TITLE_LIMIT, type WordData } from './build-word-pages';
import { RHYME_LIST_LIMIT } from './rhymes';
import { AUDIO_CLAIM } from './seo-claims';

const len = (s: string): number => [...s].length;

/** Headwords across the length range that really get rhyme pages, with their counts. */
const SAMPLE: { word: string; ipa: string; n: number }[] = [
  { word: 'cat', ipa: 'ˈkæt', n: 60 },
  { word: 'day', ipa: 'ˈdeɪ', n: 60 },
  { word: 'colonel', ipa: 'ˈkɝnəl', n: 9 },
  { word: 'station', ipa: 'ˈsteɪʃən', n: 60 },
  { word: 'believe', ipa: 'bɪˈliv', n: 24 },
  { word: 'celebration', ipa: 'ˌsɛləˈbɹeɪʃən', n: 60 },
  { word: 'understanding', ipa: 'ˌʌndɝˈstændɪŋ', n: 12 },
  { word: 'international', ipa: 'ˌɪntɝˈnæʃənəl', n: 8 },
  { word: 'responsibility', ipa: 'ɹiˌspɑnsəˈbɪlɪti', n: 41 },
];

/** A rhyme row generator — the table only needs word, spelling, IPA, syllables. */
function rows(count: number, syllables = 1): RhymeRow[] {
  return Array.from({ length: count }, (_, i) => ({
    word: `w${i}`,
    ingglish: `w${i}`,
    ipa: 'æt',
    syllables,
  }));
}

const CAT: RhymePageData = {
  word: 'cat',
  ipa: 'ˈkæt',
  rime: 'æt',
  rimeIngglish: 'at',
  rhymes: [
    { word: 'hat', ingglish: 'hat', ipa: 'ˈhæt', syllables: 1 },
    { word: 'that', ingglish: 'dhat', ipa: 'ˈðæt', syllables: 1 },
    { word: 'combat', ingglish: 'kombat', ipa: 'ˈkɑmˌbæt', syllables: 2 },
  ],
};

describe('rhymeTitle and rhymeDescription', () => {
  it.each(SAMPLE.map((s) => [s.word, s] as const))('%s fits the SERP limits', (_word, s) => {
    const title = rhymeTitle(s.word, s.n);
    const desc = rhymeDescription(s.word, s.ipa, s.n);
    expect(len(title)).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(len(desc)).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    // Degrades by dropping a whole clause, never by truncating one.
    expect(title).not.toMatch(/[—:]\s*$/);
    expect(desc.endsWith('.')).toBe(true);
    expect(title).toContain(`${s.n}`);
  });

  it('leads with the query it is answering', () => {
    expect(rhymeTitle('cat', 60)).toBe('Words that rhyme with Cat: 60 perfect rhymes');
    expect(rhymeDescription('cat', 'ˈkæt', 60)).toBe(
      'All 60 words that rhyme with Cat (/ˈkæt/), each with its IPA, Ingglish phonetic ' +
        'spelling and syllable count. Sorted by syllables, then how common.'
    );
  });

  it('gives every headword its own title and description', () => {
    expect(new Set(SAMPLE.map((s) => rhymeTitle(s.word, s.n))).size).toBe(SAMPLE.length);
    expect(new Set(SAMPLE.map((s) => rhymeDescription(s.word, s.ipa, s.n))).size).toBe(
      SAMPLE.length
    );
  });

  // The page has no recording, and neither do the pages it links to.
  it.each(SAMPLE.map((s) => [s.word, s] as const))('%s promises no audio', (_word, s) => {
    expect(`${rhymeTitle(s.word, s.n)} ${rhymeDescription(s.word, s.ipa, s.n)}`).not.toMatch(
      AUDIO_CLAIM
    );
  });
});

describe('renderRhymePage', () => {
  const html = renderRhymePage(CAT);

  it('is a complete document that is its own canonical', () => {
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<link rel="canonical" href="https://ingglish.com/rhymes/cat/">');
    // Pointing the canonical at /word/cat/ would hand the whole experiment back
    // to the page that already exists.
    expect(html).not.toContain('href="https://ingglish.com/word/cat/">');
    expect(html).toContain('<h1>Words that rhyme with cat</h1>');
    expect(html).toContain('/æt/ · 3 perfect rhymes');
  });

  it('links the headword and every rhyme to its word page', () => {
    expect(html).toContain('<a href="/word/cat/">');
    expect(html).toContain('<a href="/word/hat/">hat</a>');
    expect(html).toContain('<a href="/word/combat/">combat</a>');
  });

  it('renders one table row per rhyme, sectioned by syllable count', () => {
    expect(html.match(/<tr><td class="eng">/g)).toHaveLength(CAT.rhymes.length);
    expect(html).toContain('<h2>1-syllable rhymes for “cat”</h2>');
    expect(html).toContain('<h2>2-syllable rhymes for “cat”</h2>');
    expect(html).toContain('<h2>Why these rhyme</h2>');
    expect(html).toContain('spelled “at” in');
  });

  it('marks the list up as an ItemList and nothing as a question', () => {
    expect(html).toContain('"@type":"ItemList"');
    expect(html).toContain('"numberOfItems":3');
    expect(html).toContain('"url":"https://ingglish.com/word/hat/"');
    expect(html).not.toContain('FAQPage');
  });

  // ~6.4k more generated pages share the word pages' stylesheet.
  it('links the shared stylesheet instead of inlining CSS', () => {
    expect(html).toContain('<link rel="stylesheet" href="/word.css">');
    expect(html).not.toContain('<style>');
  });

  /**
   * A rhyme page that repeated the word page's tables would be a duplicate of
   * it, and the two would compete for the same query.
   */
  it('shares no letter-by-letter or frequency table with the word page', () => {
    expect(html).not.toContain('letter by letter');
    expect(html).not.toContain('SUBTLEX');
    expect(html).not.toContain('class="facts"');
  });

  /**
   * Twelve pages per group all listing the same words and linking each other
   * is the footprint of a doorway cluster. Siblings meet at the hub only.
   */
  it('does not link sibling rhyme pages', () => {
    expect(html).not.toMatch(/href="\/rhymes\/[a-z]/);
    expect(html).toContain('href="/rhymes/"'); // the hub, which is the way across
  });

  it('quotes the number of rhymes it actually lists', () => {
    const many = renderRhymePage({ ...CAT, rhymes: rows(200) });
    expect(many).toContain(`Words that rhyme with Cat: ${RHYME_LIST_LIMIT} perfect rhymes`);
    expect(many).toContain(`All ${RHYME_LIST_LIMIT} words that rhyme with Cat`);
    expect(many.match(/<tr><td class="eng">/g)).toHaveLength(RHYME_LIST_LIMIT);
    expect(many).toContain(`"numberOfItems":${RHYME_LIST_LIMIT}`);
  });

  it('uses the singular for a lone rhyme', () => {
    expect(renderRhymePage({ ...CAT, rhymes: rows(1) })).toContain('1 perfect rhyme<');
  });
});

describe('renderRhymesHub', () => {
  const html = renderRhymesHub([
    { rime: 'æt', word: 'cat', size: 40 },
    { rime: 'ɝnəl', word: 'journal', size: 9 },
  ]);

  it('lists every rhyme group by sound, linking its most common member', () => {
    expect(html).toContain('href="/rhymes/cat/"');
    expect(html).toContain('/æt/ — cat');
    expect(html).toContain('href="/rhymes/journal/"');
    expect(html).toContain('2 rhyme groups');
    expect(html).toContain('<link rel="canonical" href="https://ingglish.com/rhymes/">');
  });
});

describe('renderWordPage links to the rhymes page only when the word has one', () => {
  const data: WordData = {
    word: 'colonel',
    ingglish: 'kernal',
    ipa: 'ˈkɝnəl',
    guide: 'KER-nal',
    sounds: [
      { ingglish: 'k', ipa: 'k', vowel: false },
      { ingglish: 'er', ipa: 'ɝ', vowel: true },
      { ingglish: 'n', ipa: 'n', vowel: false },
      { ingglish: 'a', ipa: 'ə', vowel: true },
      { ingglish: 'l', ipa: 'l', vowel: false },
    ],
    syllables: 2,
    frequencyRank: 3,
    corpusSize: 48_000,
    perMillion: 10,
    stressIndex: 0,
    rime: 'ɝnəl',
    spelling: [{ from: 'colonel', to: 'kernal' }],
  };

  it('adds the "see all" link, quoting the count that page lists', () => {
    const html = renderWordPage(data, ['kernel'], [], 9);
    expect(html).toContain('<a href="/rhymes/colonel/">See all 9 words that rhyme with');
  });

  it('omits it when the word has no rhyme page', () => {
    expect(renderWordPage(data, ['kernel'])).not.toContain('/rhymes/colonel/');
    expect(renderWordPage(data, [], [], 9)).not.toContain('/rhymes/colonel/');
  });
});
