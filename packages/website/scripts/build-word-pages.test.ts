import { describe, expect, it } from 'vitest';
import {
  buildRhymeMap,
  buildWordData,
  cleanIpaSymbol,
  escapeHtml,
  isPageableWord,
  pickTopWords,
  renderSitemapIndex,
  renderWordPage,
  renderWordsHub,
  renderWordsSitemap,
  rhymeKey,
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

const deps: WordDeps = {
  translateSync: (text, opts) =>
    opts?.format === 'ipa' ? (IPA[text] ?? text) : (ING[text] ?? text),
  lookupPronunciation: (word) => PRON[word] ?? null,
  arpabetPhonemeToIngglish: (p) => PHONE_ING[p.replace(/[0-2]$/, '')] ?? p,
  arpabetPhonemeToIPA: (p) => PHONE_IPA[p.replace(/[0-2]$/, '')] ?? p,
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

describe('cleanIpaSymbol', () => {
  it('strips stress marks, word-joiners, and syllable dots', () => {
    expect(cleanIpaSymbol('⁠ˈkɝ.nəl')).toBe('kɝnəl');
  });
});

describe('buildWordData', () => {
  it('builds display data with sounds and syllable count', () => {
    const data = buildWordData('colonel', 3, deps);
    expect(data).not.toBeNull();
    expect(data!.ingglish).toBe('kernal');
    expect(data!.ipa).toBe('kɝnəl');
    expect(data!.syllables).toBe(2); // ER1 + AH0
    expect(data!.frequencyRank).toBe(3);
    expect(data!.sounds.map((s) => s.ingglish)).toEqual(['k', 'er', 'n', 'a', 'l']);
    expect(data!.sounds[1]!.ipa).toBe('ɝ'); // stress stripped
  });

  it('returns null when the word has no pronunciation', () => {
    expect(buildWordData('zzz', 0, deps)).toBeNull();
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

describe('escapeHtml', () => {
  it('escapes HTML metacharacters', () => {
    expect(escapeHtml(`<a href="x">& '`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp; &#39;');
  });
});

describe('renderWordPage', () => {
  const data = buildWordData('colonel', 3, deps)!;
  const html = renderWordPage(data, ['kernel']);

  it('is a complete HTML document with canonical and word content', () => {
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('<link rel="canonical" href="https://ingglish.com/word/colonel/">');
    expect(html).toContain('kernal');
    expect(html).toContain('/kɝnəl/');
  });

  it('includes a per-sound breakdown, rhyme links, and a translator CTA', () => {
    expect(html).toContain('class="snd">er</td>');
    expect(html).toContain('/word/kernel/');
    expect(html).toContain('/text?text=colonel');
    expect(html).toContain('application/ld+json');
  });

  it('omits the rhyme section when there are no rhymes', () => {
    expect(renderWordPage(data, [])).not.toContain('Words that rhyme');
  });
});

describe('renderWordsHub', () => {
  it('groups words alphabetically with links', () => {
    const html = renderWordsHub(['cat', 'apple', 'ant']);
    expect(html).toContain('<h2>A</h2>');
    expect(html).toContain('<h2>C</h2>');
    expect(html).toContain('/word/apple/');
    // alphabetical within a letter
    expect(html.indexOf('/word/ant/')).toBeLessThan(html.indexOf('/word/apple/'));
  });
});

describe('sitemaps', () => {
  it('renders the words sitemap with the hub and every word', () => {
    const xml = renderWordsSitemap(['cat', 'hello']);
    expect(xml).toContain('<loc>https://ingglish.com/words/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/word/cat/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/word/hello/</loc>');
  });

  it('renders a sitemap index pointing at page and word sitemaps', () => {
    const xml = renderSitemapIndex();
    expect(xml).toContain('<sitemapindex');
    expect(xml).toContain('sitemap-pages.xml');
    expect(xml).toContain('sitemap-words.xml');
  });
});
