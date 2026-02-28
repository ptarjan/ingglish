/**
 * Downloads per-language Wiktionary IPA data from kaikki.org and extracts
 * compact word→IPA TSV files. These are layered on top of ipa-dict data
 * to improve IPA quality (Wiktionary entries are human-curated).
 *
 * Source: https://kaikki.org/dictionary/
 *
 * Each JSONL entry has a `sounds` array with IPA transcriptions.
 * We prefer phonemic /IPA/ over phonetic [IPA].
 * Output: word\t/IPA/ (one per line)
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'kaikki');

const LANGUAGES: { code: string; name: string }[] = [
  { code: 'ar', name: 'Arabic' },
  { code: 'de', name: 'German' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'es', name: 'Spanish' },
  { code: 'fa', name: 'Persian' },
  { code: 'fi', name: 'Finnish' },
  { code: 'fr', name: 'French' },
  { code: 'is', name: 'Icelandic' },
  { code: 'ja', name: 'Japanese' },
  // No kaikki dictionary for Jamaican Creole
  { code: 'km', name: 'Khmer' },
  { code: 'ko', name: 'Korean' },
  { code: 'ma', name: 'Malay' },
  { code: 'nb', name: 'Norwegian' },
  { code: 'nl', name: 'Dutch' },
  { code: 'or', name: 'Odia' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ro', name: 'Romanian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'sw', name: 'Swahili' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'yue', name: 'Cantonese' },
  { code: 'zh', name: 'Chinese' },
];

interface KaikkiSound {
  ipa?: string;
  tags?: string[];
}

interface KaikkiEntry {
  word?: string;
  sounds?: KaikkiSound[];
}

/**
 * Extract the best IPA from a kaikki sounds array.
 * Prefers phonemic /xxx/ over phonetic [xxx].
 */
function extractIpa(sounds: KaikkiSound[]): string | null {
  let phonetic: string | null = null;

  for (const s of sounds) {
    if (!s.ipa) continue;
    const ipa = s.ipa.trim();
    if (!ipa) continue;

    // Phonemic transcription (between slashes)
    if (ipa.startsWith('/') && ipa.endsWith('/')) {
      return ipa;
    }

    // Phonetic transcription (between brackets) — keep as fallback
    if (!phonetic && ipa.startsWith('[') && ipa.endsWith(']')) {
      // Convert to phonemic-style: strip brackets, add slashes
      phonetic = '/' + ipa.slice(1, -1) + '/';
    }
  }

  return phonetic;
}

/**
 * Stream a kaikki JSONL.gz file and extract word→IPA pairs.
 */
async function extractLanguage(code: string, name: string): Promise<Map<string, string>> {
  const url = `https://kaikki.org/dictionary/${encodeURIComponent(name)}/kaikki.org-dictionary-${encodeURIComponent(name)}.jsonl.gz`;
  const dict = new Map<string, string>();

  console.log(`  Downloading ${code} (${name})...`);

  // Stream: curl | gunzip | line-by-line parse
  const curl = spawn('curl', ['-sL', url], { stdio: ['ignore', 'pipe', 'pipe'] });
  const gunzip = spawn('gunzip', [], { stdio: ['pipe', 'pipe', 'pipe'] });

  // Capture close promises before piping to avoid missing the event
  const curlDone = new Promise<void>((resolve, reject) => {
    curl.on('close', (exitCode) => {
      if (exitCode !== 0) reject(new Error(`curl exited with ${exitCode} for ${code}`));
      else resolve();
    });
  });
  const gunzipDone = new Promise<void>((resolve, reject) => {
    gunzip.on('close', (exitCode) => {
      if (exitCode !== 0) reject(new Error(`gunzip exited with ${exitCode} for ${code}`));
      else resolve();
    });
  });

  curl.stdout.pipe(gunzip.stdin);

  const rl = readline.createInterface({ input: gunzip.stdout });

  let lineCount = 0;
  for await (const line of rl) {
    lineCount++;
    if (!line.trim()) continue;

    let entry: KaikkiEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }

    const word = entry.word;
    if (!word || !entry.sounds?.length) continue;

    // Skip multi-word entries
    if (word.includes(' ')) continue;

    const ipa = extractIpa(entry.sounds);
    if (!ipa) continue;

    // First occurrence wins (dedup)
    if (!dict.has(word)) {
      dict.set(word, ipa);
    }
  }

  await Promise.all([curlDone, gunzipDone]);

  console.log(`  ${code}: ${dict.size} entries (${lineCount} lines processed)`);
  return dict;
}

/**
 * Write a word→IPA map as a TSV file.
 */
async function writeTsv(dict: Map<string, string>, outPath: string): Promise<void> {
  const lines: string[] = [];
  for (const [word, ipa] of dict) {
    lines.push(`${word}\t${ipa}`);
  }
  await fs.writeFile(outPath, lines.join('\n') + '\n', 'utf8');
}

async function main(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  let totalEntries = 0;

  for (const lang of LANGUAGES) {
    const outPath = path.join(OUTPUT_DIR, `${lang.code}.tsv`);

    try {
      const dict = await extractLanguage(lang.code, lang.name);
      if (dict.size === 0) {
        console.log(`  ${lang.code}: no entries found, skipping`);
        continue;
      }
      await writeTsv(dict, outPath);
      totalEntries += dict.size;
    } catch (err) {
      console.error(`  ${lang.code}: FAILED -`, err);
      // Continue with other languages
    }
  }

  console.log(`\nDone! Total: ${totalEntries} entries across ${LANGUAGES.length} languages`);
}

main().catch((err: unknown) => {
  console.error('Failed to extract kaikki IPA:', err);
  process.exit(1);
});
