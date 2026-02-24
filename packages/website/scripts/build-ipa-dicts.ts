/**
 * Downloads IPA dictionaries from ipa-dict (MIT license) and converts
 * each to a JS module for lazy-loading in the browser.
 *
 * Source: https://github.com/open-dict-data/ipa-dict
 *
 * Each TSV line: word\t/IPA/
 * Output: export default {"word":"/IPA/", ...}
 */

import { execFile } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'ipa-dicts');

const BASE_URL = 'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data';

const LANGUAGES = [
  { code: 'ar', file: 'ar.txt' },
  { code: 'de', file: 'de.txt' },
  { code: 'es', file: 'es_ES.txt' },
  { code: 'fi', file: 'fi.txt' },
  { code: 'fr', file: 'fr_FR.txt' },
  { code: 'ja', file: 'ja.txt' },
  { code: 'ko', file: 'ko.txt' },
  { code: 'nl', file: 'nl.txt' },
  { code: 'pt', file: 'pt_BR.txt' },
  { code: 'ro', file: 'ro.txt' },
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

function parseTsv(text: string): Record<string, string> {
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

function toJson(dict: Record<string, string>): string {
  return JSON.stringify(dict);
}

async function buildAll(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const lang of LANGUAGES) {
    const outPath = path.join(OUTPUT_DIR, `${lang.code}.json`);
    const url = `${BASE_URL}/${lang.file}`;

    console.log(`Downloading ${lang.code} from ${url}...`);
    const text = await download(url);
    const dict = parseTsv(text);
    const entryCount = Object.keys(dict).length;
    const json = toJson(dict);

    await fs.writeFile(outPath, json, 'utf8');
    console.log(`  ${lang.code}: ${entryCount} entries, ${(json.length / 1024).toFixed(0)} KB`);
  }

  console.log('Done!');
}

buildAll().catch((err: unknown) => {
  console.error('Failed to build IPA dictionaries:', err);
  process.exit(1);
});
