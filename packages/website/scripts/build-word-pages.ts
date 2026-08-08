/**
 * Generates lightweight, self-contained static landing pages for the most
 * common English words: one page per word at dist/word/<word>/index.html.
 *
 * Each page shows the word's Ingglish phonetic respelling, its IPA, a
 * sound-by-sound breakdown, a "hear it" button, and links to rhyming words —
 * unique, useful content that captures long-tail "how to pronounce X" search
 * traffic and funnels visitors into the interactive translator.
 *
 * Run standalone (source conditions resolve workspace packages to TS source):
 *   npx tsx --conditions=source scripts/build-word-pages.ts
 *
 * Writes into ./dist (must exist — run after `vite build`):
 *   dist/word/<word>/index.html   one landing page per word
 *   dist/words/index.html         browsable A–Z hub
 *   dist/sitemap-words.xml        sitemap of every word page
 *   dist/sitemap.xml              sitemap index (pages + words)
 */
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://ingglish.com';

export interface WordSound {
  ingglish: string;
  ipa: string;
}

export interface WordData {
  word: string;
  ingglish: string;
  ipa: string;
  /** Guide pronunciation with the stressed syllable capitalized, e.g. "KER-nal". */
  guide: string;
  sounds: WordSound[];
  syllables: number;
  frequencyRank: number;
}

/** Dependencies injected so the pure builders can be unit-tested. */
export interface WordDeps {
  translateSync: (text: string, opts?: { format?: 'ipa' | 'pronunciation' }) => string;
  lookupPronunciation: (word: string) => string[] | null | undefined;
  arpabetPhonemeToIngglish: (phoneme: string) => string;
  arpabetPhonemeToIPA: (phoneme: string) => string;
}

const WORD_JOINERS = /[⁠.]/g;
const STRESS_AND_JOINERS = /[⁠ˈˌ.]/g;

/** Strips word-joiners and syllable dots but keeps IPA stress marks (word-level display). */
export function cleanIpa(ipa: string): string {
  return ipa.replace(WORD_JOINERS, '');
}

/** Strips IPA stress marks, word-joiners, and syllable dots (per-sound display). */
export function cleanIpaSymbol(ipa: string): string {
  return ipa.replace(STRESS_AND_JOINERS, '');
}

/** True if the word is a plain lowercase alphabetic token safe for a clean URL. */
export function isPageableWord(word: string): boolean {
  return /^[a-z]{2,}$/.test(word);
}

/**
 * Picks the top `limit` pageable words by frequency (highest first).
 * `entries` is a list of {word, count}; ties keep input order.
 */
export function pickTopWords(entries: { word: string; count: number }[], limit: number): string[] {
  const seen = new Set<string>();
  const pageable: { word: string; count: number }[] = [];
  for (const { word, count } of entries) {
    const lower = word.toLowerCase();
    if (!isPageableWord(lower) || seen.has(lower)) {
      continue;
    }
    seen.add(lower);
    pageable.push({ word: lower, count });
  }
  pageable.sort((a, b) => b.count - a.count);
  return pageable.slice(0, limit).map((e) => e.word);
}

/** Counts syllables as the number of vowel-carrying phonemes (ARPAbet vowels end in a stress digit). */
function countSyllables(phonemes: string[]): number {
  let n = 0;
  for (const p of phonemes) {
    if (/[0-2]$/.test(p)) {
      n++;
    }
  }
  return Math.max(1, n);
}

/** Builds the display data for one word, or null if it has no usable pronunciation. */
export function buildWordData(word: string, rank: number, deps: WordDeps): WordData | null {
  const phonemes = deps.lookupPronunciation(word);
  if (!phonemes || phonemes.length === 0) {
    return null;
  }
  const ingglish = deps.translateSync(word);
  const ipa = cleanIpa(deps.translateSync(word, { format: 'ipa' })).replace(/^\/|\/$/g, '');
  const guide = deps.translateSync(word, { format: 'pronunciation' });
  const sounds = phonemes.map((p) => ({
    ingglish: deps.arpabetPhonemeToIngglish(p),
    ipa: cleanIpaSymbol(deps.arpabetPhonemeToIPA(p)),
  }));
  return {
    word,
    ingglish,
    ipa,
    guide,
    sounds,
    syllables: countSyllables(phonemes),
    frequencyRank: rank,
  };
}

/** Rhyme key: the last two stress-stripped phonemes (or one, for monosyllables). */
export function rhymeKey(phonemes: string[]): string {
  const stripped = phonemes.map((p) => p.replace(/[0-2]$/, ''));
  return stripped.slice(-2).join(' ');
}

/** Full stress-stripped phoneme key (matches the reverse dictionary's keys). */
export function phonemeKey(phonemes: string[]): string {
  return phonemes.map((p) => p.replace(/[0-2]$/, '')).join(' ');
}

/**
 * From reverse-dictionary candidates for a word's phoneme key, keeps the ones
 * that have their own page (are in `wordSet`) and aren't the word itself.
 */
export function pickHomophones(
  word: string,
  candidates: string[] | undefined,
  wordSet: Set<string>,
  limit: number
): string[] {
  if (!candidates) {
    return [];
  }
  return candidates.filter((w) => w !== word && wordSet.has(w)).slice(0, limit);
}

/**
 * Groups words by rhyme so each page can link to words that rhyme with it.
 * Returns a map from rhyme key → ordered word list (input order preserved,
 * which is frequency order when built from pickTopWords output).
 */
export function buildRhymeMap(
  words: string[],
  lookupPronunciation: WordDeps['lookupPronunciation']
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const word of words) {
    const ph = lookupPronunciation(word);
    if (!ph || ph.length < 2) {
      continue;
    }
    const key = rhymeKey(ph);
    const list = map.get(key);
    if (list) {
      list.push(word);
    } else {
      map.set(key, [word]);
    }
  }
  return map;
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);
}

// Written once to dist/word.css and <link>ed from every generated page —
// inlining it would duplicate ~1.5 KB into each of ~50k pages (~73 MB of
// dist/ and ~40% of every page's bytes).
export const PAGE_CSS = `:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;
background:#fafafa;color:#1a1a1a}
a{color:#4f46e5;text-decoration:none}a:hover{text-decoration:underline}
header,main,footer{max-width:44rem;margin:0 auto;padding:0 1.25rem}
header{display:flex;align-items:center;justify-content:space-between;height:3.5rem;font-weight:700}
main{padding-bottom:3rem}
.hero{text-align:center;margin:2rem 0 1rem}
.hero h1{font-size:2.6rem;margin:.2rem 0}
.arrow{color:#666;margin:0 .5rem}
.ing{font-size:2.6rem;font-weight:700;color:#4f46e5}
.guide{font-size:1.5rem;font-weight:700;letter-spacing:.02em;margin:.1rem 0}
.ipa{font-size:1.3rem;color:#666;margin:.25rem 0}
.faq h3{font-size:1.05rem;margin:1rem 0 .25rem}
.faq p{margin:.25rem 0}
button.hear{margin-top:.75rem;font-size:1rem;padding:.5rem 1rem;border:1px solid #e0e0e0;border-radius:.5rem;
background:#fff;color:#1a1a1a;cursor:pointer}
button.hear:hover{background:#f0f0f0}
.tablewrap{overflow-x:auto;margin:1.5rem 0}
table{width:100%;border-collapse:collapse}
th,td{padding:.5rem;border-bottom:1px solid #e0e0e0;text-align:center;white-space:nowrap}
th{color:#666;font-weight:600;font-size:.85rem;text-transform:uppercase;letter-spacing:.03em}
td.snd{font-size:1.4rem;font-weight:700;color:#4f46e5}
.note{background:#fff;border:1px solid #e0e0e0;border-radius:.75rem;padding:1rem 1.25rem;margin:1.5rem 0}
.cta{display:inline-block;margin:.5rem .5rem 0 0;padding:.6rem 1.1rem;border-radius:.5rem;
background:#4f46e5;color:#fff;font-weight:600}
.cta:hover{background:#4338ca;text-decoration:none}
.rhymes a{display:inline-block;margin:.25rem .5rem .25rem 0}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
footer{color:#666;font-size:.9rem;padding-top:1.5rem;border-top:1px solid #e0e0e0;margin-top:2rem}
@media(prefers-color-scheme:dark){
body{background:#0f0f0f;color:#f5f5f5}a{color:#818cf8}.ing{color:#818cf8}
button.hear{background:#1a1a1a;color:#f5f5f5;border-color:#333}button.hear:hover{background:#252525}
.note{background:#1a1a1a;border-color:#333}th,td{border-color:#333}td.snd{color:#818cf8}
.cta{background:#6366f1}.cta:hover{background:#818cf8}footer{border-color:#333}
}`;

const SITE_HEADER = `<header><a href="/">Ingglish</a><a href="/text/">Translator</a></header>`;

/** A link list of word pages ("cat" → <a href="/word/cat/">cat</a>). */
function wordLinks(words: string[]): string {
  return words.map((w) => `<a href="/word/${w}/">${escapeHtml(w)}</a>`).join('');
}

/**
 * Renders one word's static landing page. `rhymes` and `homophones` are other
 * pageable words (with their own pages) that rhyme with / sound identical to it.
 */
export function renderWordPage(
  data: WordData,
  rhymes: string[],
  homophones: string[] = []
): string {
  const { word, ingglish, ipa, guide } = data;
  // Search Console says these pages rank ~position 10 for two query shapes in
  // roughly equal volume — "farmer spelling" / "how do you spell security" and
  // "how to pronounce become" — and the old pronounce-only title converted 1064
  // impressions into zero clicks. Serve both intents, lead with the word (that
  // is how the queries are phrased), and put the answer in the snippet: at
  // position 10 the only way past nine dictionaries is to be visibly different.
  const title = `${word} — spelling & pronunciation (${guide}) | Ingglish`;
  const homophoneNote = homophones.length
    ? ` Sounds identical to ${homophones.map((h) => `“${h}”`).join(', ')}.`
    : '';
  const syllableWord = data.syllables === 1 ? 'syllable' : 'syllables';
  const letterWord = word.length === 1 ? 'letter' : 'letters';
  const soundWord = data.sounds.length === 1 ? 'sound' : 'sounds';
  const spelledOut = [...word].join('-').toUpperCase();
  const desc = `Spell “${word}”: ${spelledOut} — ${word.length} ${letterWord}, ${data.sounds.length} ${soundWord}, ${data.syllables} ${syllableWord}. Pronounced ${guide} (IPA /${ipa}/); written “${ingglish}” in Ingglish phonetic spelling.${homophoneNote}`;
  const canonical = `${SITE}/word/${word}/`;

  const spellingCells = data.sounds
    .map((s) => `<td class="snd">${escapeHtml(s.ingglish)}</td>`)
    .join('');
  const ipaCells = data.sounds.map((s) => `<td>/${escapeHtml(s.ipa)}/</td>`).join('');

  const stressNote = `${data.syllables} ${syllableWord}`;
  const homophoneBlock = homophones.length
    ? `<h2>Words that sound like “${escapeHtml(word)}” (homophones)</h2><p class="rhymes">${wordLinks(homophones)}</p>`
    : '';
  const rhymeBlock = rhymes.length
    ? `<h2>Words that rhyme with “${escapeHtml(word)}”</h2><p class="rhymes">${wordLinks(rhymes)}</p>`
    : '';

  // FAQ — genuine answers built from the pronunciation data, with FAQPage
  // structured data for question-format search matching.
  // "X spelling" / "how do you spell X" is the larger of the two query clusters
  // these pages rank for, so it leads. Answer the question actually asked —
  // the English spelling, letter by letter — before pivoting to Ingglish.
  const faq: { q: string; a: string }[] = [
    {
      q: `How do you spell “${word}”?`,
      a: `“${word}” is spelled ${spelledOut} — ${word.length} ${letterWord} for ${data.sounds.length} ${soundWord}. In Ingglish, where every spelling always makes the same sound, the same word is written “${ingglish}”.`,
    },
    {
      q: `How do you pronounce “${word}”?`,
      a: `“${word}” is pronounced ${guide} — IPA /${ipa}/. In Ingglish phonetic spelling, where every spelling always makes the same sound, it is written “${ingglish}”.`,
    },
    {
      q: `How many syllables are in “${word}”?`,
      a: `“${word}” has ${data.syllables} ${syllableWord}: ${guide} (the capitalized syllable is stressed).`,
    },
  ];
  if (homophones.length) {
    faq.push({
      q: `What words sound like “${word}”?`,
      a: `“${word}” sounds identical to ${homophones.map((h) => `“${h}”`).join(', ')}.`,
    });
  }
  const faqHtml = faq.map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('\n');

  const jsonLd = JSON.stringify([
    {
      '@context': 'https://schema.org',
      '@type': 'DefinedTerm',
      name: word,
      description: desc,
      url: canonical,
      inDefinedTermSet: `${SITE}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(word)} → ${escapeHtml(ingglish)} — phonetic spelling">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${canonical}">
<meta name="twitter:card" content="summary">
<script type="application/ld+json">${jsonLd}</script>
<link rel="stylesheet" href="/word.css">
</head>
<body>
${SITE_HEADER}
<main>
<div class="hero">
<h1>${escapeHtml(word)}</h1>
<div class="guide">${escapeHtml(guide)}</div>
<div><span class="ing">${escapeHtml(ingglish)}</span></div>
<div class="ipa">/${escapeHtml(ipa)}/ · ${stressNote}</div>
<button class="hear" type="button" onclick="(function(){try{var u=new SpeechSynthesisUtterance('${escapeHtml(
    word
  )}');speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}})()">🔊 Hear it</button>
</div>

<p>In Ingglish — phonetic English where every spelling always makes the same sound — the word
<strong>“${escapeHtml(word)}”</strong> is spelled <strong>“${escapeHtml(
    ingglish
  )}”</strong>. Here is how it sounds out, one sound at a time:</p>

<div class="tablewrap">
<table>
<caption class="sr-only">Sound-by-sound breakdown of “${escapeHtml(word)}”</caption>
<tbody>
<tr><th scope="row" style="text-align:left;color:#666">Ingglish</th>${spellingCells}</tr>
<tr><th scope="row" style="text-align:left;color:#666">IPA</th>${ipaCells}</tr>
</tbody>
</table>
</div>

<div class="note">English writes <strong>“${escapeHtml(word)}”</strong> with
${word.length} letters for ${data.sounds.length} sounds. Ingglish writes it
<strong>“${escapeHtml(ingglish)}”</strong> — no silent letters, and the same spelling
always makes the same sound, so you can read it exactly as it looks.</div>

${homophoneBlock}

${rhymeBlock}

<section class="faq">
<h2>“${escapeHtml(word)}” — questions &amp; answers</h2>
${faqHtml}
</section>

<p>
<a class="cta" href="/text/?text=${encodeURIComponent(word)}">Translate any text →</a>
<a class="cta" href="/words/">Browse all words</a>
</p>
</main>
<footer>
<a href="/">Ingglish</a> — what if English spelling made sense? Every spelling always makes the same sound.
</footer>
</body>
</html>
`;
}

/** The URL-safe index letter for a word ('a'–'z'). */
export function letterOf(word: string): string {
  return word[0]!.toLowerCase();
}

/** Groups words by their first letter, each list sorted alphabetically. */
export function groupByLetter(words: string[]): Map<string, string[]> {
  const byLetter = new Map<string, string[]>();
  for (const w of [...words].sort()) {
    const letter = letterOf(w);
    let list = byLetter.get(letter);
    if (!list) {
      list = [];
      byLetter.set(letter, list);
    }
    list.push(w);
  }
  return byLetter;
}

/** Minimal self-contained HTML shell for the browsable index pages. */
function hubShell(title: string, description: string, canonical: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${canonical}">
<link rel="stylesheet" href="/word.css">
</head>
<body>
${SITE_HEADER}
<main>
${body}
<p><a class="cta" href="/text/">Translate any text →</a></p>
</main>
<footer><a href="/">Ingglish</a> — every spelling always makes the same sound.</footer>
</body>
</html>
`;
}

/**
 * Renders the top-level /words hub: an A–Z nav to the per-letter pages plus a
 * "most common" shortcut list, so every word page is reachable within two link
 * hops of the homepage (footer → /words → /words/<letter> → word).
 */
export function renderWordsHub(letters: string[], topWords: string[]): string {
  const letterNav = letters.map((l) => `<a href="/words/${l}/">${l.toUpperCase()}</a>`).join('');
  const body = `<div class="hero"><h1>Word pronunciations</h1>
<div class="ipa">Phonetic spelling &amp; IPA for common English words</div></div>
<h2>Browse A–Z</h2><p class="rhymes">${letterNav}</p>
<h2>Most common words</h2><p class="rhymes">${wordLinks(topWords)}</p>`;
  return hubShell(
    'Word pronunciations A–Z — phonetic spelling & IPA | Ingglish',
    'Browse phonetic spellings and IPA pronunciations for common English words. See how each word looks when every spelling always makes the same sound.',
    `${SITE}/words/`,
    body
  );
}

/** Renders one letter's index page listing every word page starting with it. */
export function renderLetterPage(letter: string, words: string[]): string {
  const upper = letter.toUpperCase();
  const body = `<div class="hero"><h1>Words starting with ${upper}</h1>
<div class="ipa">Phonetic spelling &amp; IPA · ${words.length} words</div></div>
<p><a href="/words/">← All letters</a></p>
<p class="rhymes">${wordLinks(words)}</p>`;
  return hubShell(
    `Words starting with ${upper} — phonetic spelling & IPA | Ingglish`,
    `Phonetic spellings and IPA pronunciations for English words starting with ${upper}.`,
    `${SITE}/words/${letter}/`,
    body
  );
}

/** Builds the words sitemap XML: the hub, each letter page, and every word. */
export function renderWordsSitemap(words: string[], letters: string[]): string {
  const urls = [
    `  <url><loc>${SITE}/words/</loc></url>`,
    ...letters.map((l) => `  <url><loc>${SITE}/words/${l}/</loc></url>`),
    ...words.map((w) => `  <url><loc>${SITE}/word/${w}/</loc></url>`),
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

/** Builds the sitemap index referencing the page and word sitemaps. */
export function renderSitemapIndex(): string {
  const maps = [`${SITE}/sitemap-pages.xml`, `${SITE}/sitemap-words.xml`]
    .map((loc) => `  <sitemap><loc>${loc}</loc></sitemap>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps}\n</sitemapindex>\n`;
}

/** How many rhyme links to show per page. */
const RHYMES_PER_PAGE = 10;
/** How many homophone links to show per page. */
const HOMOPHONES_PER_PAGE = 8;
/** How many "most common" words to feature on the top-level /words hub. */
const HUB_TOP_WORDS = 300;

/* v8 ignore start -- filesystem orchestration; the pure builders above are unit-tested */
async function main(): Promise<void> {
  // Default 50k caps naturally at the ~49k pageable words that have SUBTLEX
  // frequency data. Frequency ranks the pages but no longer gates them out:
  // the highest-intent "how do you pronounce X" words (quinoa, gnocchi,
  // epitome, worcestershire) are rare in corpora yet heavily searched.
  const limit = Number(process.env.WORD_PAGE_LIMIT ?? '50000');
  const distDir = join(import.meta.dirname, '..', 'dist');
  if (!existsSync(distDir)) {
    throw new Error(`dist/ not found at ${distDir} — run "vite build" first`);
  }

  const ingglish = await import('ingglish');
  const dict = await import('@ingglish/dictionary');
  const phonemes = await import('@ingglish/phonemes');
  const ipa = await import('@ingglish/ipa');

  await ingglish.translate('warmup'); // registers + loads the English dictionary
  await Promise.all([dict.loadDictionary(), dict.loadFrequencies(), dict.loadReverseDictionary()]);

  const deps: WordDeps = {
    translateSync: ingglish.translateSync,
    lookupPronunciation: dict.lookupPronunciation,
    arpabetPhonemeToIngglish: phonemes.arpabetPhonemeToIngglish,
    arpabetPhonemeToIPA: ipa.arpabetPhonemeToIPA,
  };

  // Build the frequency list from the dictionary's own words + frequency API,
  // so only words we can both pronounce and rank get a page.
  const entries: { word: string; count: number }[] = [];
  for (const word of Object.keys(dict.getDictionary())) {
    const count = dict.getWordFrequency(word);
    if (count !== undefined && count > 0) {
      entries.push({ word, count });
    }
  }

  const words = pickTopWords(entries, limit).filter((w) => deps.lookupPronunciation(w));
  const wordSet = new Set(words);
  const rhymeMap = buildRhymeMap(words, deps.lookupPronunciation);

  let written = 0;
  for (const [rank, word] of words.entries()) {
    const data = buildWordData(word, rank, deps);
    if (!data) {
      continue;
    }
    const ph = deps.lookupPronunciation(word)!;
    const rhymes = (rhymeMap.get(rhymeKey(ph)) ?? [])
      .filter((w) => w !== word)
      .slice(0, RHYMES_PER_PAGE);
    const homophones = pickHomophones(
      word,
      dict.lookupPhonemeKey(phonemeKey(ph)),
      wordSet,
      HOMOPHONES_PER_PAGE
    );
    const dir = join(distDir, 'word', word);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderWordPage(data, rhymes, homophones));
    written++;
  }

  // A–Z hub + one index page per letter, so every word page is reachable by
  // link-following (homepage footer → /words → /words/<letter> → word).
  const byLetter = groupByLetter(words);
  const letters = [...byLetter.keys()].sort();
  const hubDir = join(distDir, 'words');
  mkdirSync(hubDir, { recursive: true });
  writeFileSync(join(hubDir, 'index.html'), renderWordsHub(letters, words.slice(0, HUB_TOP_WORDS)));
  for (const letter of letters) {
    const letterDir = join(hubDir, letter);
    mkdirSync(letterDir, { recursive: true });
    writeFileSync(join(letterDir, 'index.html'), renderLetterPage(letter, byLetter.get(letter)!));
  }

  // The shared stylesheet every generated page <link>s
  writeFileSync(join(distDir, 'word.css'), PAGE_CSS);

  writeFileSync(join(distDir, 'sitemap-words.xml'), renderWordsSitemap(words, letters));
  writeFileSync(join(distDir, 'sitemap.xml'), renderSitemapIndex());

  console.log(
    `Word pages: wrote ${written} pages + ${letters.length} letter pages + sitemaps (limit ${limit})`
  );
}

// Exact entry-point match (not `includes`) so importing this module from the
// test file (build-word-pages.test.ts) never triggers generation.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  });
}
/* v8 ignore stop */
