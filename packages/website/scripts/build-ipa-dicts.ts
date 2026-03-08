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
  const tsvPath = path.join(KAIKKI_DIR, `${code}.tsv`);
  try {
    const text = await fs.readFile(tsvPath, 'utf8');
    return parseTsv(text);
  } catch {
    return {};
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

    const mergedCount = Object.keys(ipaDict).length;

    // Convert IPA → ARPAbet arrays
    const arpabetDict = convertToArpabet(ipaDict, lang.code);
    const json = JSON.stringify(arpabetDict);

    await fs.writeFile(outPath, json, 'utf8');
    if (kaikkiCount > 0) {
      console.log(
        `  ${lang.code}: ${ipaCount} (ipa-dict) + ${kaikkiCount} (kaikki) = ${mergedCount} merged, ${(json.length / 1024).toFixed(0)} KB`
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
