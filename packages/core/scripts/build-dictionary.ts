/**
 * Downloads and parses the CMU Pronouncing Dictionary from GitHub.
 * Outputs a JSON file compatible with the existing dictionary format.
 *
 * Source: https://github.com/cmusphinx/cmudict
 *
 * Run with --force to re-download even if the file exists.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'dictionary', 'cmudict.json');

const CMUDICT_URL = 'https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict';

interface CMUDictionary {
  [word: string]: string;
}

async function downloadDictionary(): Promise<string> {
  console.log('Downloading CMU dictionary from GitHub...');
  const response = await fetch(CMUDICT_URL);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  console.log(`Downloaded ${text.length} bytes`);
  return text;
}

function parseDictionary(text: string): CMUDictionary {
  console.log('Parsing dictionary...');
  const dict: CMUDictionary = {};
  const lines = text.split('\n');

  let parsed = 0;
  let skipped = 0;

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.startsWith(';;;')) {
      skipped++;
      continue;
    }

    // Format: WORD  PHONEMES or WORD(n)  PHONEMES
    // Single space separates word from phonemes in cmudict.dict
    const spaceIndex = line.indexOf(' ');
    if (spaceIndex > 0) {
      const word = line.slice(0, spaceIndex);
      const phonemes = line.slice(spaceIndex + 1).trim();
      // Convert word to lowercase to match npm package format
      dict[word.toLowerCase()] = phonemes;
      parsed++;
    } else {
      skipped++;
    }
  }

  console.log(`Parsed: ${parsed}, Skipped: ${skipped}`);
  return dict;
}

async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const forceUpdate = process.argv.includes('--force');

  // Skip if dictionary already exists (unless --force)
  if (!forceUpdate && (await fileExists(OUTPUT_PATH))) {
    console.log('Dictionary already exists, skipping download (use --force to re-download)');
    return;
  }

  const text = await downloadDictionary();
  const dict = parseDictionary(text);

  const wordCount = Object.keys(dict).length;
  console.log(`Total entries: ${wordCount}`);

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(dict));
  console.log(`Written to ${OUTPUT_PATH}`);

  // Show file size
  const stats = await fs.stat(OUTPUT_PATH);
  console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
