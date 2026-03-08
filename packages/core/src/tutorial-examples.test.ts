/**
 * Tests that verify all translation examples in the Tutorial page are correct.
 * Prevents tutorial drift when phoneme mappings change.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { translateSync } from './index';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TUTORIAL_PATH = path.join(__dirname, '../../website/src/data/tutorial-data.ts');

interface Example {
  english: string;
  ingglish: string;
  line: number;
  source: string;
}

function extractExamples(content: string, filename: string): Example[] {
  const examples: Example[] = [];
  const lines = content.split('\n');

  for (const [i, line_] of lines.entries()) {
    const line = line_;
    const lineNum = i + 1;

    // Pattern 1: english: 'word', ingglish: 'translation'
    // Covers: silentLetterExamples, eeSoundExamples, aySoundExamples, phExamples,
    // ckExamples, ightExamples, tionExamples, voicelessTh, voicedTh, paragraphWords
    const engIngMatch = /english:\s*'([^']+)',\s*ingglish:\s*'([^']+)'/.exec(line);
    if (engIngMatch) {
      const english = stripPunctuation(engIngMatch[1]!);
      const ingglish = stripPunctuation(engIngMatch[2]!);
      if (english.length > 0 && ingglish.length > 0) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }

    // Pattern 2: { e: 'word', i: 'translation', s: N } (poem words)
    const poemMatch = /\{\s*e:\s*'([^']+)',\s*i:\s*'([^']+)',\s*s:\s*\d+/.exec(line);
    if (poemMatch) {
      const rawEnglish = poemMatch[1]!;
      const english = stripPunctuation(rawEnglish);
      const ingglish = stripPunctuation(poemMatch[2]!);
      // Skip line break markers and quoted meta-references like "ph", "f"
      if (rawEnglish === String.raw`\n`) {
        continue;
      }
      const isQuotedRef = rawEnglish.includes('"') || rawEnglish.includes('\u201C');
      if (english.length > 0 && ingglish.length > 0 && !(isQuotedRef && english === ingglish)) {
        examples.push({ english, ingglish, line: lineNum, source: filename });
      }
      continue;
    }
  }

  return examples;
}

/** Strip leading/trailing punctuation and quotes from a word */
function stripPunctuation(word: string): string {
  return word.replaceAll(/^[,."'?!\u2014\s]+|[,."'?!\u2014\s]+$/g, '');
}

describe('tutorial page examples', () => {
  const content = readFileSync(TUTORIAL_PATH, 'utf8');
  const allExamples = extractExamples(content, 'Tutorial.tsx');

  // Deduplicate
  const seen = new Map<string, Example>();
  for (const ex of allExamples) {
    const key = `${ex.english.toLowerCase()}:${ex.ingglish.toLowerCase()}`;
    if (!seen.has(key)) {
      seen.set(key, ex);
    }
  }
  const unique = [...seen.values()];

  it('should find examples in tutorial', () => {
    expect(unique.length).toBeGreaterThan(0);
  });

  describe('verify all examples translate correctly', () => {
    for (const ex of unique) {
      it(`"${ex.english}" → "${ex.ingglish}" (${ex.source}:${ex.line})`, () => {
        const result = translateSync(ex.english, { format: 'ingglish' });
        expect(result.toLowerCase()).toBe(ex.ingglish.toLowerCase());
      });
    }
  });
});
