/**
 * Downloads IPA dictionaries from ipa-dict (MIT license) and converts
 * each to ARPAbet arrays for zero-parse-cost lookups at runtime.
 *
 * Source: https://github.com/open-dict-data/ipa-dict
 *
 * Each TSV line: word\t/IPA/
 * Output: {"word":["HH","AH0","L","OW1"], ...}  (ARPAbet arrays)
 */

import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
// Relative imports — this script runs via tsx, not through the package system
import { ipaToArpabet } from '../../ipa/src/from-ipa';
import { IPA_LANGUAGE_OVERRIDES } from '../../ipa/src/ipa-maps';
import { getStress, isVowel } from '@ingglish/phonemes';
import { paradigmsFile } from './extract-kaikki-ipa';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'ipa-dicts');
const KAIKKI_DIR = path.join(__dirname, '..', 'data', 'kaikki');

const BASE_URL = 'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data';

// Pre-compiled regex to strip IPA slashes and syllable dots
const IPA_SLASH_RE = /^\/|\/$/g;

const LANGUAGES = [
  { code: 'ar', file: 'ar.txt' },
  { code: 'de', file: 'de.txt' },
  { code: 'eo', file: 'eo.txt' },
  { code: 'es', file: 'es_ES.txt' },
  { code: 'fa', file: 'fa.txt' },
  { code: 'fi', file: 'fi.txt' },
  { code: 'fr', file: 'fr_FR.txt' },
  { code: 'is', file: 'is.txt' },
  { code: 'ja', file: 'ja.txt' },
  { code: 'km', file: 'km.txt' },
  { code: 'ko', file: 'ko.txt' },
  { code: 'ma', file: 'ma.txt' },
  { code: 'nb', file: 'nb.txt' },
  { code: 'nl', file: 'nl.txt' },
  { code: 'or', file: 'or.txt' },
  { code: 'pt', file: 'pt_BR.txt' },
  { code: 'ro', file: 'ro.txt' },
  { code: 'sv', file: 'sv.txt' },
  { code: 'sw', file: 'sw.txt' },
  { code: 'vi', file: 'vi_N.txt' },
  { code: 'yue', file: 'yue.txt' },
  { code: 'zh', file: 'zh_hans.txt' },
] as const;

/**
 * Hand-maintained entries merged last (they win over ipa-dict and kaikki).
 * Kaikki regenerates from Wiktionary, so words can vanish between dumps —
 * these cover sample-critical words the dict-coverage test guards.
 */
export const MANUAL_ENTRIES: Record<string, Record<string, string>> = {
  // "ø" (island, Dano-Norwegian) appears in the Ibsen "Terje Vigen" sample;
  // it dropped out of the kaikki Norwegian dump in July 2026.
  nb: { ø: '/øː/' },
};

/**
 * IPA for the letters an inflectional ending may contain, per language. A
 * language listed here gets its kaikki paradigms expanded (see
 * deriveInflection). The first alternative is emitted; all are accepted when
 * stripping a base's ending. Digraphs are tried before single letters.
 */
export const ENDING_IPA: Record<string, Record<string, readonly string[]>> = {
  sv: {
    a: ['a', 'ɑ'],
    e: ['ɛ', 'e', 'ə'],
    i: ['ɪ', 'i'],
    o: ['ɔ', 'ʊ', 'o', 'u'],
    d: ['d'],
    l: ['l'],
    m: ['m'],
    n: ['n'],
    r: ['r', 'ɾ'],
    s: ['s'],
    t: ['t'],
    rd: ['ɖ'],
    rl: ['ɭ'],
    rn: ['ɳ'],
    rs: ['ʂ'],
    rt: ['ʈ'],
  },
};

const VOWEL_LETTERS = 'aeiouyåäöæø';
/** Stress, syllable and length marks plus combining diacritics: skipped when matching an ending. */
const IPA_TRAILING_MARKS_RE = /[ˈˌ²¹.ːˑ̀-ͯ]+$/u;
const IPA_TRAILING_STRESS_RE = /[ˈˌ²¹.]+$/u;
const MAX_BASE_ENDING = 3;
const MAX_FORM_ENDING = 5;

/** Remove the IPA of `letters` from the end of `ipa`, or undefined if it doesn't end that way. */
function stripEndingIpa(
  ipa: string,
  letters: string,
  table: Record<string, readonly string[]>
): string | undefined {
  if (!letters) return ipa;
  const body = ipa.replace(IPA_TRAILING_MARKS_RE, '');
  for (const len of [2, 1]) {
    const key = letters.slice(-len);
    if (key.length !== len) continue;
    for (const alt of table[key] ?? []) {
      if (body.endsWith(alt)) {
        const rest = stripEndingIpa(body.slice(0, -alt.length), letters.slice(0, -len), table);
        if (rest !== undefined) return rest;
      }
    }
  }
  return undefined;
}

/** IPA for an ending's letters (digraphs first, doubled consonants once), or undefined. */
function endingIpa(letters: string, table: Record<string, readonly string[]>): string | undefined {
  let out = '';
  for (let i = 0; i < letters.length; ) {
    if (i > 0 && letters[i] === letters[i - 1] && !VOWEL_LETTERS.includes(letters[i]!)) {
      i++;
      continue;
    }
    const pair = letters.slice(i, i + 2);
    const digraph = pair.length === 2 ? table[pair] : undefined;
    const single = table[letters[i]!];
    if (digraph) {
      out += digraph[0];
      i += 2;
    } else if (single) {
      out += single[0];
      i++;
    } else {
      return undefined;
    }
  }
  return out;
}

/**
 * Derive IPA for an inflected `form` from a `base` in the same paradigm:
 * split both at their longest common prefix, strip the base's ending from
 * its IPA and append the form's ending. A consonant doubled across the split
 * (rum → rummet, glömma → glöm) is pronounced once. Returns undefined when
 * the stem changes (fot → fötter) or an ending has a letter the table lacks.
 */
export function deriveInflection(
  base: string,
  baseIpa: string,
  form: string,
  lang: string
): string | undefined {
  const table = ENDING_IPA[lang];
  if (!table) return undefined;
  let p = 0;
  while (p < base.length && p < form.length && base[p] === form[p]) p++;
  const stem = form.slice(0, p);
  if (p < 2 || ![...stem].some((ch) => VOWEL_LETTERS.includes(ch))) return undefined;
  let baseEnd = base.slice(p);
  let formEnd = form.slice(p);
  const last = stem[p - 1]!;
  if (!VOWEL_LETTERS.includes(last)) {
    if (baseEnd.startsWith(last)) baseEnd = baseEnd.slice(1);
    if (formEnd.startsWith(last)) formEnd = formEnd.slice(1);
  }
  if (baseEnd.length > MAX_BASE_ENDING || formEnd.length > MAX_FORM_ENDING) return undefined;
  const stemIpa = stripEndingIpa(baseIpa.replaceAll(IPA_SLASH_RE, ''), baseEnd, table);
  const suffixIpa = endingIpa(formEnd, table);
  if (stemIpa === undefined || suffixIpa === undefined) return undefined;
  return `/${(stemIpa + suffixIpa).replace(IPA_TRAILING_STRESS_RE, '')}/`;
}

/** Parse a kaikki paradigm TSV: one paradigm per line, lemma first, tab-separated. */
export function parseParadigms(text: string): string[][] {
  return text
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split('\t'));
}

/**
 * Add derived IPA for every paradigm member missing from `ipaDict`, based on
 * the member with IPA that shares the longest prefix with it. Derived forms
 * never serve as bases. Returns the number of entries added.
 */
export function expandParadigms(
  ipaDict: Record<string, string>,
  paradigms: string[][],
  lang: string
): number {
  const derived: Record<string, string> = {};
  for (const words of paradigms) {
    const bases = words.filter((w) => w in ipaDict);
    if (bases.length === 0) continue;
    for (const form of words) {
      if (form in ipaDict || form in derived) continue;
      let best: { ipa: string; prefix: number } | undefined;
      for (const base of bases) {
        let prefix = 0;
        while (base[prefix] !== undefined && base[prefix] === form[prefix]) prefix++;
        if (best && prefix <= best.prefix) continue;
        const ipa = deriveInflection(base, ipaDict[base]!, form, lang);
        if (ipa) best = { ipa, prefix };
      }
      if (best) derived[form] = best.ipa;
    }
  }
  Object.assign(ipaDict, derived);
  return Object.keys(derived).length;
}

async function download(url: string): Promise<string> {
  const { stdout } = await execFileAsync('curl', ['-sL', url], {
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf8',
  });
  if (!stdout || stdout.length === 0) {
    throw new Error(`Downloaded file is empty: ${url}`);
  }
  return stdout;
}

export function parseTsv(text: string): Record<string, string> {
  const dict: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const tab = trimmed.indexOf('\t');
    if (tab < 0) continue;
    const word = trimmed.slice(0, tab);
    const ipa = trimmed.slice(tab + 1);
    // Keep only the first pronunciation if multiple separated by ", "
    const firstIpa = ipa.split(', ')[0]!;
    // Only store if we don't already have this word
    if (!(word in dict)) {
      dict[word] = firstIpa;
    }
  }
  return dict;
}

/**
 * If no vowel carries a stress digit, apply stress 1 to the last vowel.
 * Gives useful output for languages whose IPA dicts omit stress (e.g. French).
 */
export function applyDefaultStress(arpabet: string[]): string[] {
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

/**
 * Convert an IPA dict (word → IPA string) to ARPAbet dict (word → string[]).
 */
export function convertToArpabet(
  ipaDict: Record<string, string>,
  langCode: string
): Record<string, string[]> {
  const overrides = IPA_LANGUAGE_OVERRIDES[langCode];
  const result: Record<string, string[]> = {};
  for (const [word, ipa] of Object.entries(ipaDict)) {
    const clean = ipa.replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
    const arpabet = applyDefaultStress(ipaToArpabet(clean, overrides));
    if (arpabet.length > 0) {
      result[word] = arpabet;
    }
  }
  return result;
}

/**
 * Read a kaikki TSV file and return word→IPA entries.
 * Returns empty record if the file doesn't exist.
 */
async function readKaikkiTsv(code: string): Promise<Record<string, string>> {
  const text = await readKaikkiFile(`${code}.tsv`);
  return text ? parseTsv(text) : {};
}

/** Read a file from the kaikki data dir, or undefined if it doesn't exist. */
async function readKaikkiFile(name: string): Promise<string | undefined> {
  try {
    return await fs.readFile(path.join(KAIKKI_DIR, name), 'utf8');
  } catch {
    return undefined;
  }
}

async function buildAll(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const lang of LANGUAGES) {
    const outPath = path.join(OUTPUT_DIR, `${lang.code}.json`);
    const url = `${BASE_URL}/${lang.file}`;

    console.log(`Downloading ${lang.code} from ${url}...`);
    const text = await download(url);
    const ipaDict = parseTsv(text);
    const ipaCount = Object.keys(ipaDict).length;

    // Merge kaikki data on top (higher quality, overwrites ipa-dict)
    const kaikki = await readKaikkiTsv(lang.code);
    const kaikkiCount = Object.keys(kaikki).length;
    if (kaikkiCount > 0) {
      Object.assign(ipaDict, kaikki);
    }

    // Inflected forms get IPA derived from a transcribed member of their paradigm
    let derivedCount = 0;
    if (ENDING_IPA[lang.code]) {
      const forms = await readKaikkiFile(paradigmsFile(lang.code));
      if (forms === undefined) {
        throw new Error(
          `${lang.code}: ${path.join(KAIKKI_DIR, paradigmsFile(lang.code))} is missing; run node scripts/ensure-kaikki.cjs --force`
        );
      }
      derivedCount = expandParadigms(ipaDict, parseParadigms(forms), lang.code);
    }

    // Hand-maintained entries win over both upstream sources
    Object.assign(ipaDict, MANUAL_ENTRIES[lang.code]);

    const mergedCount = Object.keys(ipaDict).length;

    // Convert IPA → ARPAbet arrays
    const arpabetDict = convertToArpabet(ipaDict, lang.code);
    const json = JSON.stringify(arpabetDict);

    await fs.writeFile(outPath, json, 'utf8');
    if (kaikkiCount > 0) {
      console.log(
        `  ${lang.code}: ${ipaCount} (ipa-dict) + ${kaikkiCount} (kaikki) + ${derivedCount} (derived inflections) = ${mergedCount} merged, ${(json.length / 1024).toFixed(0)} KB`
      );
    } else {
      console.log(`  ${lang.code}: ${ipaCount} entries, ${(json.length / 1024).toFixed(0)} KB`);
    }
  }

  console.log('Done!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildAll().catch((err: unknown) => {
    console.error('Failed to build IPA dictionaries:', err);
    process.exit(1);
  });
}
