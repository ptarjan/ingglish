/**
 * Measure translation coverage across all non-English languages.
 *
 * Usage:
 *   cd /Users/pt/github/ingglish2
 *   npx tsx --conditions=source packages/core/scripts/coverage.ts
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadLangDict, setDictLoader, translateSyncWithMapping } from 'ingglish';
import {
  getLanguage,
  IPA_LANGUAGE_OVERRIDES,
  ipaToArpabet,
  LANGUAGES,
  toNullProto,
} from '@ingglish/ipa';
import type { PhoneDict } from '@ingglish/ipa';
import { getStress, isVowel } from '@ingglish/phonemes';
import { ALL_SAMPLES } from '../../website/src/data/language-samples';

// ---------------------------------------------------------------------------
// Dict loading for Node.js (mirrors website's dict-loader.ts)
// ---------------------------------------------------------------------------

const THIS_DIR = dirname(fileURLToPath(import.meta.url));
const DICT_DIR = join(THIS_DIR, '..', '..', 'website', 'public', 'ipa-dicts');

const IPA_SLASH_RE = /^\/|\/$/g;

function applyDefaultStress(arpabet: string[]): string[] {
  const hasStress = arpabet.some((p) => isVowel(p) && getStress(p) !== null);
  if (hasStress) return arpabet;
  const result = [...arpabet];
  for (let i = result.length - 1; i >= 0; i--) {
    if (isVowel(result[i]!)) {
      result[i] = result[i]! + '1';
      break;
    }
  }
  return result;
}

function convertIpaEntries(
  raw: Record<string, string | string[]>,
  langCode: string
): Record<string, string[]> {
  const firstValue = Object.values(raw)[0];
  if (firstValue === undefined || Array.isArray(firstValue)) {
    // Already ARPAbet arrays — strip empty phonemes (e.g. unmapped glottal stops)
    const cleaned: Record<string, string[]> = {};
    for (const [word, phonemes] of Object.entries(raw as Record<string, string[]>)) {
      if (phonemes) {
        const filtered = phonemes.filter((p) => typeof p === 'string' && p.length > 0);
        if (filtered.length > 0) {
          cleaned[word] = filtered;
        }
      }
    }
    return cleaned;
  }
  const overrides = IPA_LANGUAGE_OVERRIDES[langCode];
  const result: Record<string, string[]> = {};
  for (const [word, ipa] of Object.entries(raw)) {
    const clean = (ipa as string).replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
    const arpabet = applyDefaultStress(ipaToArpabet(clean, overrides)).filter((p) => p.length > 0);
    if (arpabet.length > 0) {
      result[word] = arpabet;
    }
  }
  return result;
}

function loadDictFromDisk(code: string): PhoneDict {
  const filePath = join(DICT_DIR, `${code}.json`);
  const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, string | string[]>;
  const entries = toNullProto(convertIpaEntries(raw, code));
  const langMeta = getLanguage(code);
  return {
    conventionalCapitals: langMeta?.conventionalCapitals,
    disableRColoring: langMeta?.disableRColoring,
    entries,
    lang: code,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
}

// Register a file-system dict loader for Node.js usage.
// This handles ALL languages including English (needed for initialism fallback).
setDictLoader(async (lang: string) => {
  return loadDictFromDisk(lang);
});

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Pre-load English dict — the translator's initialism path needs it
  // even when translating non-English text.
  await loadLangDict('en');

  // Skip English — we only want non-English coverage
  const langCodes = Object.keys(ALL_SAMPLES).filter((code) => code !== 'en');

  interface LangStats {
    code: string;
    totalWords: number;
    matchedWords: number;
    pct: number;
    unmatchedFreq: Map<string, number>;
  }

  const results: LangStats[] = [];

  for (const code of langCodes) {
    const samples = ALL_SAMPLES[code]!;

    // Try to load the dictionary
    try {
      await loadLangDict(code);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [${code}] Failed to load dictionary: ${msg}`);
      continue;
    }

    let totalWords = 0;
    let matchedWords = 0;
    const unmatchedFreq = new Map<string, number>();

    for (const sample of samples) {
      try {
        const tokens = translateSyncWithMapping(sample.text, { lang: code });
        for (const token of tokens) {
          if (!token.isWord) continue;
          totalWords++;
          if (token.matched) {
            matchedWords++;
          } else {
            const word = token.original.toLowerCase();
            unmatchedFreq.set(word, (unmatchedFreq.get(word) ?? 0) + 1);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  [${code}] Error translating "${sample.label}": ${msg}`);
      }
    }

    const pct = totalWords > 0 ? (matchedWords / totalWords) * 100 : 0;
    results.push({ code, totalWords, matchedWords, pct, unmatchedFreq });
  }

  // Sort by coverage descending
  results.sort((a, b) => b.pct - a.pct);

  // Print summary table
  console.log('');
  console.log('=== Translation Coverage by Language ===');
  console.log('');
  console.log('Lang  | Total Words | Matched | Unmatched | Coverage');
  console.log('------+-------------+---------+-----------+---------');

  let grandTotal = 0;
  let grandMatched = 0;

  for (const r of results) {
    grandTotal += r.totalWords;
    grandMatched += r.matchedWords;
    const unmatched = r.totalWords - r.matchedWords;
    console.log(
      `${r.code.padEnd(5)} | ${String(r.totalWords).padStart(11)} | ${String(r.matchedWords).padStart(7)} | ${String(unmatched).padStart(9)} | ${r.pct.toFixed(1).padStart(6)}%`
    );
  }

  const grandPct = grandTotal > 0 ? (grandMatched / grandTotal) * 100 : 0;
  console.log('------+-------------+---------+-----------+---------');
  console.log(
    `TOTAL | ${String(grandTotal).padStart(11)} | ${String(grandMatched).padStart(7)} | ${String(grandTotal - grandMatched).padStart(9)} | ${grandPct.toFixed(1).padStart(6)}%`
  );

  // Print top 10 unmatched words per language
  console.log('');
  console.log('=== Top 10 Unmatched Words per Language ===');
  console.log('');

  for (const r of results) {
    if (r.unmatchedFreq.size === 0) continue;

    const sorted = [...r.unmatchedFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

    const langMeta = LANGUAGES.find((l) => l.code === r.code);
    const langName = langMeta?.name ?? r.code;
    console.log(`${r.code} (${langName}):`);
    for (const [word, count] of sorted) {
      console.log(`  ${String(count).padStart(3)}x  ${word}`);
    }
    console.log('');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
