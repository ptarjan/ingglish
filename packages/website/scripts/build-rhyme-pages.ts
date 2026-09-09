/**
 * Generates one page per rhyme-worthy word at dist/rhymes/<word>/index.html,
 * plus the /rhymes/ hub.
 *
 * These exist because Google answers "how do you spell X" and "how do you
 * pronounce X" in its own SERP widget but has no rhyme widget: measured in
 * Search Console, rhyme queries convert 6× the site average and IPA queries
 * 9×, on impressions the word pages already earn.
 *
 * A rhyme page must not be a second copy of /word/<word>/. It carries the one
 * thing that page cannot: the whole rhyme group as a table of word, Ingglish
 * respelling, IPA and syllable count, sectioned by syllable count. It does not
 * repeat the letter-by-letter table, the sound-by-sound table, the frequency
 * facts or the word page's FAQ.
 *
 * Siblings in a rhyme group never link each other. Twelve pages listing the
 * same words and cross-linking each other is the shape of a doorway cluster;
 * they meet only at the hub. See ./rhymes for the per-group cap that keeps the
 * group from spraying pages in the first place.
 *
 * Written by ./build-word-pages during its own run (it already holds the
 * dictionaries), into ./dist:
 *   dist/rhymes/<word>/index.html   one page per eligible word
 *   dist/rhymes/index.html          the hub, one entry per rhyme group
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  capitalize,
  cleanIpa,
  cleanIpaSymbol,
  DESCRIPTION_LIMIT,
  escapeHtml,
  fitText,
  hubShell,
  TITLE_LIMIT,
} from './build-word-pages';
import {
  countSyllables,
  rhymesFor,
  rimeStartIndex,
  RHYME_LIST_LIMIT,
  strictRhymeKey,
  type RhymeDeps,
} from './rhymes';

const SITE = 'https://ingglish.com';

/** One row of the rhyme table. */
export interface RhymeRow {
  word: string;
  ingglish: string;
  ipa: string;
  syllables: number;
}

/** Everything one rhyme page renders. */
export interface RhymePageData {
  /** The headword the page is about. */
  word: string;
  /** The headword's IPA, without the surrounding slashes. */
  ipa: string;
  /** IPA of the shared rime — the stressed vowel to the end. */
  rime: string;
  /** The same rime spelled in Ingglish. */
  rimeIngglish: string;
  /** The rhymes, nearest first (see rhymesFor). */
  rhymes: RhymeRow[];
}

/** Dependencies for building rhyme rows, injected so the builders stay testable. */
export interface RhymePageDeps extends RhymeDeps {
  translateSync: (text: string, opts?: { format?: 'ipa' | 'pronunciation' }) => string;
  arpabetPhonemeToIPA: (phoneme: string) => string;
  arpabetToIngglish: (phonemes: string[]) => string;
}

/**
 * The <title>. `n` is the number of rhymes the page actually lists, so the
 * count in the SERP is the count behind the click.
 */
export function rhymeTitle(word: string, n: number): string {
  const w = capitalize(word);
  return fitText(
    [
      `Words that rhyme with ${w}: ${n} perfect rhymes`,
      `Words that rhyme with ${w} — ${n} rhymes`,
      `Words that rhyme with ${w}`,
      `${w} rhymes`,
    ],
    TITLE_LIMIT
  );
}

/** The meta description: the count, the pronunciation, and what each row adds. */
export function rhymeDescription(word: string, ipa: string, n: number): string {
  const w = capitalize(word);
  return fitText(
    [
      `All ${n} words that rhyme with ${w} (/${ipa}/), each with its IPA, Ingglish phonetic spelling and syllable count. Sorted by syllables, then how common.`,
      `All ${n} words that rhyme with ${w} (/${ipa}/) — each with IPA, phonetic spelling and syllable count, sorted by syllables then frequency.`,
      `All ${n} words that rhyme with ${w}, each with its IPA and syllable count.`,
    ],
    DESCRIPTION_LIMIT
  );
}

const SITE_HEADER = `<header><a href="/">Ingglish</a><a href="/text/">Translator</a></header>`;

/** Rows split into syllable-count sections, in the order the rows arrive. */
function bySyllables(rows: RhymeRow[]): { syllables: number; rows: RhymeRow[] }[] {
  const sections: { syllables: number; rows: RhymeRow[] }[] = [];
  for (const row of rows) {
    const section = sections.find((s) => s.syllables === row.syllables);
    if (section) {
      section.rows.push(row);
    } else {
      sections.push({ syllables: row.syllables, rows: [row] });
    }
  }
  return sections;
}

/**
 * Renders one rhyme page. The list is capped here rather than by the caller so
 * the headline count, the description and the table can never disagree — `n`
 * is read back off the rows that were rendered.
 */
export function renderRhymePage(data: RhymePageData): string {
  const { word, ipa, rime, rimeIngglish } = data;
  const rows = data.rhymes.slice(0, RHYME_LIST_LIMIT);
  const n = rows.length;
  const title = rhymeTitle(word, n);
  const desc = rhymeDescription(word, ipa, n);
  const canonical = `${SITE}/rhymes/${word}/`;

  const sections = bySyllables(rows)
    .map(
      ({ syllables, rows: sectionRows }) =>
        `<h2>${syllables}-syllable rhymes for “${escapeHtml(word)}”</h2>
<div class="tablewrap">
<table>
<caption class="sr-only">Words of ${syllables} ${syllables === 1 ? 'syllable' : 'syllables'} that rhyme with “${escapeHtml(word)}”, most common first</caption>
<thead><tr><th scope="col">Word</th><th scope="col">Ingglish</th><th scope="col">IPA</th><th scope="col">Syllables</th></tr></thead>
<tbody>
${sectionRows
  .map(
    (r) =>
      `<tr><td class="eng"><a href="/word/${r.word}/">${escapeHtml(r.word)}</a></td>` +
      `<td class="snd">${escapeHtml(r.ingglish)}</td>` +
      `<td>/${escapeHtml(r.ipa)}/</td><td>${r.syllables}</td></tr>`
  )
  .join('\n')}
</tbody>
</table>
</div>`
    )
    .join('\n');

  // An ItemList of the words listed, as bare ListItems: the nested DefinedTerm
  // form said the same thing in 160 bytes a row instead of 80, which across
  // 6,361 pages was half the HTML this family adds to dist. No FAQPage —
  // nothing on this page is a question, and marking a table up as questions
  // would be a lie to a parser.
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Words that rhyme with ${word}`,
    description: desc,
    url: canonical,
    numberOfItems: n,
    itemListElement: rows.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: r.word,
      url: `${SITE}/word/${r.word}/`,
    })),
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
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
<h1>Words that rhyme with ${escapeHtml(word)}</h1>
<div class="ipa">/${escapeHtml(rime)}/ · ${n} perfect ${n === 1 ? 'rhyme' : 'rhymes'}</div>
<p><a href="/word/${word}/">How to pronounce “${escapeHtml(word)}” →</a></p>
</div>

${sections}

<h2>Why these rhyme</h2>
<p>A perfect rhyme shares everything from the stressed vowel onward. “${escapeHtml(word)}” is
/${escapeHtml(ipa)}/, and its rime is /${escapeHtml(rime)}/ — spelled “${escapeHtml(rimeIngglish)}” in
Ingglish, where that spelling always makes that sound. Every word above ends on the same
/${escapeHtml(rime)}/, however English chooses to spell it.</p>

<p>
<a class="cta" href="/rhymes/">Browse rhymes by sound →</a>
<a class="cta" href="/text/?text=${encodeURIComponent(word)}">Translate any text</a>
</p>
</main>
<footer>
<a href="/">Ingglish</a> — what if English spelling made sense? Every spelling always makes the same sound.
</footer>
</body>
</html>
`;
}

/** One hub entry: a rhyme group, named by its sound and its most common member. */
export interface RhymeGroupEntry {
  /** IPA of the shared rime. */
  rime: string;
  /** The group's most common member — the page the entry links to. */
  word: string;
  /** How many words rhyme in this group. */
  size: number;
}

/**
 * The /rhymes/ hub: one entry per rhyme group. This is the only place sibling
 * pages meet, which is deliberate — they do not link each other.
 */
export function renderRhymesHub(entries: RhymeGroupEntry[]): string {
  const list = entries
    .map(
      (e) =>
        `<li><a href="/rhymes/${e.word}/">/${escapeHtml(e.rime)}/ — ${escapeHtml(e.word)}</a> ` +
        `<span class="ipa">${e.size} words</span></li>`
    )
    .join('');
  const body = `<div class="hero"><h1>Rhyming words by sound</h1>
<div class="ipa">${entries.length} rhyme groups · perfect rhymes with IPA and syllable counts</div></div>
<p>Each group shares everything from its stressed vowel onward — a perfect rhyme, not just a
matching ending. Pick a sound to see every word that rhymes on it.</p>
<ul>${list}</ul>`;
  return hubShell(
    'Rhyming words by sound — perfect rhymes with IPA | Ingglish',
    'Browse English rhymes by sound. Every group lists its perfect rhymes with IPA, phonetic spelling and syllable counts.',
    `${SITE}/rhymes/`,
    body
  );
}

/* v8 ignore start -- filesystem orchestration; the pure builders above are unit-tested */
/**
 * Writes dist/rhymes/<word>/index.html for every word in `rhymeWords` and the
 * dist/rhymes/ hub. The model (`map`, `rhymeWords`) is built by the caller and
 * passed in, so the word pages and the rhyme pages can only ever agree about
 * which words rhyme and which of them have a page.
 *
 * Returns the words that got a page, in the order they were written.
 */
export function writeRhymePages(
  distDir: string,
  rhymeWords: string[],
  map: Map<string, string[]>,
  deps: RhymePageDeps
): string[] {
  // One row per word, not per appearance: the dozen pages of a group list the
  // same members, so translating each word once saves ~370k conversions.
  const rowCache = new Map<string, RhymeRow>();
  const rowFor = (word: string): RhymeRow => {
    let row = rowCache.get(word);
    if (!row) {
      row = {
        word,
        ingglish: deps.translateSync(word),
        ipa: cleanIpa(deps.translateSync(word, { format: 'ipa' })).replace(/^\/|\/$/g, ''),
        syllables: countSyllables(deps.lookupPronunciation(word) ?? []),
      };
      rowCache.set(word, row);
    }
    return row;
  };

  const written: string[] = [];
  const hubEntries = new Map<string, RhymeGroupEntry>();
  for (const word of rhymeWords) {
    const phonemes = deps.lookupPronunciation(word)!;
    const key = strictRhymeKey(phonemes)!;
    // The rime is spelled from the headword's own stressed phonemes, not from
    // the stress-stripped group key: an isolated AH is /ʌ/ where the AH0 inside
    // the word is /ə/, and the two renderings would disagree on the same page.
    const rimePhonemes = phonemes.slice(rimeStartIndex(phonemes)!);
    const data: RhymePageData = {
      word,
      ipa: rowFor(word).ipa,
      rime: rimePhonemes.map((p) => cleanIpaSymbol(deps.arpabetPhonemeToIPA(p))).join(''),
      rimeIngglish: deps.arpabetToIngglish(rimePhonemes),
      rhymes: rhymesFor(word, map, deps).map(rowFor),
    };
    const dir = join(distDir, 'rhymes', word);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), renderRhymePage(data));
    written.push(word);
    // The first page written for a key is the group's most common member,
    // because rhymeWords keeps the caller's frequency order.
    if (!hubEntries.has(key)) {
      hubEntries.set(key, { rime: data.rime, word, size: map.get(key)!.length });
    }
  }

  const hubDir = join(distDir, 'rhymes');
  mkdirSync(hubDir, { recursive: true });
  writeFileSync(join(hubDir, 'index.html'), renderRhymesHub([...hubEntries.values()]));
  return written;
}
/* v8 ignore stop */
