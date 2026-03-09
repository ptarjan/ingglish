/**
 * Tests that verify all examples in documentation are correct.
 * This prevents documentation drift when phoneme mappings change.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { translateSync } from './index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_DIR = path.join(__dirname, '../../../docs');
const README_PATH = path.join(__dirname, '../../../README.md');

interface Example {
  english: string;
  ingglish: string;
  line: number;
  source: string;
}

// Words that are not real English words (phoneme symbols, abbreviations, etc.)
const SKIP_WORDS = new Set([
  // ARPAbet symbols
  'aa',
  'ae',
  'ah',
  'albanian',
  'ao',
  // Table headers and non-examples
  'arpabet',
  'aw',
  'ay',
  'b',
  'ch',
  'commonality',
  'count',
  'd',
  'dh',
  'dutch',
  'eh',
  'english',
  'er',
  'example',
  'ey',
  'f',
  'finnish',
  'french',
  'frequency',
  'g',
  'german',
  // Partial examples from README
  'git',
  'hh',
  'hub',
  'hungarian',
  'ih',
  'indonesian',
  'ing',
  'ingglish',
  'ipa',
  'italian',
  'iy',
  'jh',
  'k',
  'l',
  'language',
  'm',
  'metric',
  'n',
  'ng',
  'notes',
  'ow',
  'oy',
  'p',
  'pinyin',
  'polish',
  'portuguese',
  'r',
  'romaji',
  'run',
  's',
  'sh',
  'sound',
  // Language names (from comparison tables)
  'spanish',
  'spelling',
  'swahili',
  't',
  'th',
  'turkish',
  'uh',
  'uw',
  'v',
  'vietnamese',
  'w',
  'y',
  'z',
  'zh',
]);

/**
 * Extract examples from markdown content.
 * Handles various formats:
 * - "word" → "translated" or "word" → **translated**
 * - | English | Ingglish | table rows (specific example tables only)
 * - word → **translated** (without quotes, inline in tables)
 */
function extractExamples(content: string, filename: string): Example[] {
  const examples: Example[] = [];
  const lines = content.split('\n');

  // Track whether we're in a "rejected approach" section
  let inRejectedSection = false;

  for (const [i, line_] of lines.entries()) {
    const line = line_;
    const lineNum = i + 1;

    // Track section context for spelling-iteration.md
    // Sections starting with "Before:", "Problem:", "Original:" show rejected approaches
    if (/^\*\*(?:Before|Problem|Original):?\*\*/.test(line)) {
      inRejectedSection = true;
      continue;
    }
    // Sections starting with "After", "Examples:", "Verdict:" show adopted approaches
    if (/^\*\*(?:After|Examples|Verdict|Rationale):?\*\*/.test(line)) {
      inRejectedSection = false;
      continue;
    }
    // New section headers reset state
    if (/^#{2,}/.test(line)) {
      inRejectedSection = false;
      continue;
    }

    // Skip examples in rejected sections
    if (inRejectedSection) {
      continue;
    }

    // Skip hypothetical examples (lines explaining what we DON'T do)
    if (
      line.includes('looks like') ||
      line.includes('looks incomplete') ||
      line.includes('would become') ||
      line.includes('would produce')
    ) {
      continue;
    }

    // Skip lines that are clearly not translation examples
    if (
      line.includes('ARPAbet') ||
      line.includes('IPA') ||
      line.includes('Phoneme') ||
      line.includes('Language') ||
      line.includes('Commonality')
    ) {
      continue;
    }

    // Pattern 1: - "word" → **translated** (distinct from "other")
    // This is the most reliable format used in phoneme-mapping.md
    const distinctMatch = /^-\s*"([a-zA-Z]{2,})"\s*→\s*\*\*([a-zA-Z]+)\*\*\s*\(distinct from/.exec(
      line
    );
    if (distinctMatch) {
      const english = distinctMatch[1]!.toLowerCase();
      const ingglish = distinctMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(english) && english.length >= 3) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }

    // Pattern 2: - "word" → **translated** (intuitive) or similar
    const intuitiveMatch = /^-\s*"([a-z]{3,})"\s*→\s*\*\*([a-z]+)\*\*/i.exec(line);
    if (intuitiveMatch) {
      const english = intuitiveMatch[1]!.toLowerCase();
      const ingglish = intuitiveMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(english)) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }

    // Pattern 3: - "word" → "translated" (text-speak association) etc
    const quotedMatch = /^-\s*"([a-z]{3,})"\s*→\s*"([a-z]+)"/i.exec(line);
    if (quotedMatch) {
      const english = quotedMatch[1]!.toLowerCase();
      const ingglish = quotedMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(english)) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }

    // Pattern 4: - word → word (unquoted, from spelling-iteration.md)
    // e.g., - my → mai, - out → out (identical!)
    const unquotedMatch = /^-\s*([a-z]+)\s*→\s*([a-z]+)/i.exec(line);
    if (unquotedMatch) {
      const english = unquotedMatch[1]!.toLowerCase();
      const ingglish = unquotedMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(english) && english.length > 0) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }

    // Pattern 5: | word | translated | /IPA/ | (README example table)
    // Only match when there's an IPA column (indicates it's the examples table)
    const readmeTableMatch = /^\|\s*([a-z]{3,})\s*\|\s*([a-z]+)\s*\|\s*\/[^/]+\/\s*\|/i.exec(line);
    if (readmeTableMatch) {
      const english = readmeTableMatch[1]!.toLowerCase();
      const ingglish = readmeTableMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(english) && english !== 'english') {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }

    // Pattern 5: word → **translated** (inline in orthography comparison tables)
    // e.g., | **Ingglish** | **a** | cat → **kat** |
    const inlineMatch = /\|\s*([a-z]{3,})\s*→\s*\*\*([a-z]+)\*\*\s*\|/i.exec(line);
    if (inlineMatch) {
      const english = inlineMatch[1]!.toLowerCase();
      const ingglish = inlineMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(english)) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }

    // Pattern 6: ingglish (english) in Ingglish rows of orthography comparison tables
    // e.g., | **Ingglish** | **dh** | dha (the) |
    // Also handles comma-separated: | **Ingglish** | **a** | about (about), sohfa (sofa) |
    // The word before parens is Ingglish, the word in parens is English
    if (line.includes('**Ingglish**')) {
      for (const parenMatch of line.matchAll(/([a-z]{3,})\s*\(([a-z]+)\)/gi)) {
        const ingglish = parenMatch[1]!.toLowerCase();
        const english = parenMatch[2]!.toLowerCase();
        if (!SKIP_WORDS.has(english) && !SKIP_WORDS.has(ingglish)) {
          examples.push({ english, ingglish, line: lineNum, source: filename });
        }
      }
    }

    // Pattern 7: Collision table — | english, english | ingglish (description) | freq |
    // e.g., | right, write, rite | rait (soak flax) | 204,428 → rare |
    const collisionTableMatch = /^\|\s*([a-z]+(?:[, ]+[a-z]+)*)\s*\|\s*([a-z]+)\s*\(/i.exec(line);
    if (collisionTableMatch) {
      const englishWords = collisionTableMatch[1]!.split(',').map((w) => w.trim().toLowerCase());
      const ingglish = collisionTableMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(ingglish)) {
        for (const english of englishWords) {
          if (english.length > 0 && /^[a-z]+$/.test(english) && !SKIP_WORDS.has(english)) {
            examples.push({ english, ingglish, line: lineNum, source: filename });
          }
        }
      }
      continue;
    }

    // Pattern 8: Homophone table — | word, word, ... | ingglish |
    // e.g., | aer, air, ayre, eir, ere, err, eyre, heir, ire | air |
    // Matches rows with comma-separated words and a single Ingglish result
    const homophoneTableMatch =
      /^\|\s*([a-z]+(?:,\s*[a-z]+)+)(?:\s*\(\d+\))?\s*\|\s*([a-z]+)\s*\|$/i.exec(line);
    if (homophoneTableMatch) {
      const englishWords = homophoneTableMatch[1]!.split(',').map((w) => w.trim().toLowerCase());
      const ingglish = homophoneTableMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(ingglish)) {
        for (const english of englishWords) {
          if (english.length > 0 && /^[a-z]+$/.test(english) && !SKIP_WORDS.has(english)) {
            examples.push({ english, ingglish, line: lineNum, source: filename });
          }
        }
      }
      continue;
    }

    // Pattern 9: Notable collision — **word → word**: description
    // e.g., **white → wait**: adjective → verb.
    const notableCollisionMatch = /^\*\*([a-z]+)\s*→\s*([a-z]+)\*\*:/i.exec(line);
    if (notableCollisionMatch) {
      const english = notableCollisionMatch[1]!.toLowerCase();
      const ingglish = notableCollisionMatch[2]!.toLowerCase();
      if (!SKIP_WORDS.has(english)) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }
  }

  return examples;
}

/**
 * Extract examples from spelling-guide-data.ts.
 * Format: 'b**a**d (bad), s**al**mon (saman)' where parenthetical is Ingglish.
 */
function extractSpellingGuideExamples(filepath: string): Example[] {
  try {
    const content = readFileSync(filepath, 'utf8');
    const filename = filepath.split('/').pop() ?? filepath;
    const examples: Example[] = [];
    const lines = content.split('\n');

    for (const [i, line_] of lines.entries()) {
      const line = line_;
      if (!line.includes('examples:')) {
        continue;
      }

      // Strip bold markers: **a**bout → about
      const stripped = line.replaceAll('**', '');

      // Match all "english (ingglish)" pairs
      for (const m of stripped.matchAll(/([a-z]{3,})\s*\(([a-z]+)\)/gi)) {
        const english = m[1]!.toLowerCase();
        const ingglish = m[2]!.toLowerCase();
        if (!SKIP_WORDS.has(english) && english !== ingglish) {
          examples.push({ english, ingglish, line: i + 1, source: filename });
        }
      }
    }
    return examples;
  } catch {
    return [];
  }
}

/**
 * Read a file and extract examples
 */
function getExamplesFromFile(filepath: string): Example[] {
  try {
    const content = readFileSync(filepath, 'utf8');
    const filename = filepath.split('/').pop() ?? filepath;
    return extractExamples(content, filename);
  } catch {
    return [];
  }
}

const SPELLING_GUIDE_PATH = path.join(
  __dirname,
  '../../../packages/website/src/data/spelling-guide-data.ts'
);

/**
 * Extract examples from any markdown table with "English" and "Ingglish" column headers.
 * Handles comma-separated English words and parenthetical descriptions in Ingglish column.
 * Multi-word cells (e.g., "mai taim") are split into individual word pairs.
 */
function extractTableExamples(content: string, filename: string): Example[] {
  const examples: Example[] = [];
  const lines = content.split('\n');

  let englishCol = -1;
  let ingglishCol = -1;
  let inTable = false;

  for (const [i, line_] of lines.entries()) {
    const line = line_;
    const lineNum = i + 1;

    // Detect table header rows with both English and Ingglish columns
    if (line.startsWith('|') && /\bEnglish\b/i.test(line) && /\bIngglish\b/i.test(line)) {
      const cells = line.split('|').map((c) => c.trim());
      englishCol = cells.findIndex((c) => /^English$/i.test(c));
      ingglishCol = cells.findIndex((c) => /^Ingglish$/i.test(c));
      inTable = englishCol !== -1 && ingglishCol !== -1;
      continue;
    }

    // Skip separator rows (|---|---|)
    if (inTable && /^\|[\s\-:|]+\|$/.test(line)) {
      continue;
    }

    // End of table
    if (inTable && !line.startsWith('|')) {
      inTable = false;
      continue;
    }

    if (!inTable) {
      continue;
    }

    const cells = line.split('|').map((c) => c.trim());
    const rawEnglish = cells[englishCol];
    const rawIngglish = cells[ingglishCol];
    if (
      rawEnglish === undefined ||
      rawEnglish === '' ||
      rawIngglish === undefined ||
      rawIngglish === ''
    ) {
      continue;
    }

    // Parse English column: may be comma-separated ("right, write, rite")
    // Strip count annotations like "(14)" at the end
    const englishClean = rawEnglish.replace(/\s*\(\d+\)\s*$/, '');
    const englishWords = englishClean.includes(',')
      ? englishClean.split(',').map((w) => w.trim().toLowerCase())
      : englishClean.toLowerCase().split(/\s+/);

    // Parse Ingglish column: may have parenthetical ("rait (soak flax)")
    // Strip description in parens, then split by space for multi-word phrases
    const ingglishClean = rawIngglish.replace(/\s*\(.*\)/, '').trim();
    const ingglishWords = ingglishClean.toLowerCase().split(/\s+/);

    // Multi-word phrases: pair up positionally ("my time" → "mai taim")
    if (englishWords.length === ingglishWords.length && englishWords.length > 1) {
      for (const [j, englishWord] of englishWords.entries()) {
        const eng = englishWord;
        const ing = ingglishWords[j]!;
        if (/^[a-z]+$/.test(eng) && /^[a-z]+$/.test(ing) && !SKIP_WORDS.has(eng)) {
          examples.push({ english: eng, ingglish: ing, line: lineNum, source: filename });
        }
      }
    } else {
      // Comma-separated English words all map to the single Ingglish word
      const ingglish = ingglishWords[0];
      if (ingglish === undefined || !/^[a-z]+$/.test(ingglish) || SKIP_WORDS.has(ingglish)) {
        continue;
      }
      for (const eng of englishWords) {
        if (/^[a-z]+$/.test(eng) && !SKIP_WORDS.has(eng)) {
          examples.push({ english: eng, ingglish, line: lineNum, source: filename });
        }
      }
    }
  }

  return examples;
}

// Auto-discover all markdown files in docs/
const allDocFiles = readdirSync(DOCS_DIR)
  .filter((f) => f.endsWith('.md'))
  .toSorted();

describe('documentation examples', () => {
  // Collect all examples from docs (initialize with README examples)
  const allExamples: Example[] = [...getExamplesFromFile(README_PATH)];

  // Doc files — inline pattern extraction (curated list for pattern-based parsing)
  const patternDocFiles = [
    'phoneme-mapping.md',
    'orthography-comparison.md',
    'spelling-reform-comparison.md',
    'spelling-iteration.md',
    'false-friends.md',
  ];

  for (const file of patternDocFiles) {
    allExamples.push(...getExamplesFromFile(path.join(DOCS_DIR, file)));
  }

  // All docs — generic table extraction (auto-discovers any English|Ingglish table)
  for (const file of allDocFiles) {
    try {
      const content = readFileSync(path.join(DOCS_DIR, file), 'utf8');
      allExamples.push(...extractTableExamples(content, file));
    } catch {
      // skip unreadable files
    }
  }
  // Also check README tables
  try {
    const readmeContent = readFileSync(README_PATH, 'utf8');
    allExamples.push(...extractTableExamples(readmeContent, 'README.md'));
  } catch {
    // skip
  }

  // Spelling guide data (TypeScript, not markdown)
  allExamples.push(...extractSpellingGuideExamples(SPELLING_GUIDE_PATH));

  // Deduplicate examples (same word may appear multiple times)
  const seenExamples = new Map<string, Example>();
  for (const example of allExamples) {
    const key = `${example.english}:${example.ingglish}`;
    if (!seenExamples.has(key)) {
      seenExamples.set(key, example);
    }
  }

  const uniqueExamples = [...seenExamples.values()];

  it('should find examples in documentation', () => {
    expect(uniqueExamples.length).toBeGreaterThan(0);
  });

  describe('verify all examples translate correctly', () => {
    for (const example of uniqueExamples) {
      it(`"${example.english}" → "${example.ingglish}" (${example.source}:${example.line})`, () => {
        const result = translateSync(example.english);
        expect(result.toLowerCase()).toBe(example.ingglish);
      });
    }
  });
});
