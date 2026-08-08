import { describe, expect, it } from 'vitest';
import {
  buildRhymeMap,
  buildWordData,
  cleanIpa,
  cleanIpaSymbol,
  escapeHtml,
  groupByLetter,
  isPageableWord,
  letterOf,
  phonemeKey,
  pickHomophones,
  pickTopWords,
  renderLetterPage,
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

const deps: WordDeps = {
  translateSync: (text, opts) => {
    if (opts?.format === 'ipa') return IPA[text] ?? text;
    if (opts?.format === 'pronunciation') return GUIDE[text] ?? text;
    return ING[text] ?? text;
  },
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

describe('renderWordPage', () => {
  const data = buildWordData('colonel', 3, deps)!;
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
    expect(html).toContain('How many syllables are in “colonel”?');
    expect(html).toContain('"@type":"FAQPage"');
  });

  it('omits the rhyme section when there are no rhymes', () => {
    expect(renderWordPage(data, [])).not.toContain('Words that rhyme');
  });

  it('renders a homophones section and mentions them in the description', () => {
    const withHom = renderWordPage(data, [], ['kernel']);
    expect(withHom).toContain('homophones');
    expect(withHom).toContain('sounds identical to “kernel”');
    expect(withHom).toContain('/word/kernel/');
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
    const xml = renderWordsSitemap(['cat', 'hello'], ['c', 'h']);
    expect(xml).toContain('<loc>https://ingglish.com/words/</loc>');
    expect(xml).toContain('<loc>https://ingglish.com/words/c/</loc>');
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
