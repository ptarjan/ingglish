/**
 * Generates a supplementary dictionary from ipa-dict for words not in CMU.
 *
 * Usage: node scripts/generate-supplementary-dict.cjs
 *
 * Downloads ipa-dict if not present, extracts modern/tech words not in CMU,
 * converts IPA to ARPABET, and generates a TypeScript file.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// IPA to ARPABET mapping (inverse of compare-dictionaries.cjs)
const ipaToArpabet = {
  // Vowels
  'ɑ': 'AA',
  'æ': 'AE',
  'ʌ': 'AH',
  'ə': 'AH', // schwa maps to AH0
  'ɔ': 'AO',
  'ɛ': 'EH',
  'ɝ': 'ER',
  'ɚ': 'ER',
  'ɪ': 'IH',
  'i': 'IY',
  'ʊ': 'UH',
  'u': 'UW',
  // Diphthongs
  'aʊ': 'AW',
  'aɪ': 'AY',
  'eɪ': 'EY',
  'oʊ': 'OW',
  'ɔɪ': 'OY',
  // Consonants
  'b': 'B',
  'd': 'D',
  'ɡ': 'G',
  'g': 'G',
  'k': 'K',
  'p': 'P',
  't': 'T',
  'ð': 'DH',
  'f': 'F',
  'h': 'HH',
  's': 'S',
  'ʃ': 'SH',
  'θ': 'TH',
  'v': 'V',
  'z': 'Z',
  'ʒ': 'ZH',
  'tʃ': 'CH',
  'dʒ': 'JH',
  'm': 'M',
  'n': 'N',
  'ŋ': 'NG',
  'l': 'L',
  'ɫ': 'L', // dark L
  'ɹ': 'R',
  'r': 'R',
  'w': 'W',
  'j': 'Y',
};

// Sort by length descending so we match longer sequences first
const ipaPatterns = Object.keys(ipaToArpabet).sort((a, b) => b.length - a.length);

/**
 * Converts IPA pronunciation to ARPABET phonemes.
 * Returns null if conversion fails.
 */
function ipaToArpabetPhonemes(ipa) {
  // Remove slashes, stress marks, syllable markers, and length markers
  let cleaned = ipa
    .replace(/[\/ˈˌ.ːˑ]/g, '')
    .trim();

  const phonemes = [];
  let i = 0;
  let hasVowel = false;

  while (i < cleaned.length) {
    let matched = false;

    for (const pattern of ipaPatterns) {
      if (cleaned.substring(i).startsWith(pattern)) {
        const arpabet = ipaToArpabet[pattern];
        // Add stress marker 1 to first vowel
        if (['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW'].includes(arpabet)) {
          if (!hasVowel) {
            phonemes.push(arpabet + '1');
            hasVowel = true;
          } else {
            phonemes.push(arpabet + '0');
          }
        } else {
          phonemes.push(arpabet);
        }
        i += pattern.length;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Skip unknown characters (they might be diacritics we don't handle)
      i++;
    }
  }

  // Validate: must have at least one vowel
  if (!hasVowel || phonemes.length === 0) {
    return null;
  }

  return phonemes;
}

/**
 * Downloads a file from URL to local path.
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        }).on('error', reject);
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }
    }).on('error', reject);
  });
}

async function main() {
  const ipaDictPath = path.join(__dirname, '..', 'ipa-dict-en_US.txt');
  const outputPath = path.join(__dirname, '..', 'packages', 'core', 'src', 'fallback', 'ipa-dict-supplement.ts');

  // Download ipa-dict if not present
  if (!fs.existsSync(ipaDictPath)) {
    console.log('Downloading ipa-dict...');
    await downloadFile(
      'https://raw.githubusercontent.com/open-dict-data/ipa-dict/master/data/en_US.txt',
      ipaDictPath
    );
    console.log('Downloaded ipa-dict');
  }

  // Load CMU dictionary from our local TypeScript file
  const cmuPath = path.join(__dirname, '..', 'packages', 'core', 'src', 'dictionary', 'cmudict.ts');
  if (!fs.existsSync(cmuPath)) {
    console.error('CMU dictionary not found. Run "npm run update-dictionary" in packages/core first.');
    process.exit(1);
  }
  // Parse the TypeScript file to extract the JSON object
  const cmuTsContent = fs.readFileSync(cmuPath, 'utf8');
  const jsonMatch = cmuTsContent.match(/= ({[\s\S]*});/);
  if (!jsonMatch) {
    console.error('Could not parse CMU dictionary TypeScript file');
    process.exit(1);
  }
  const cmu = JSON.parse(jsonMatch[1]);
  const cmuWords = new Set(Object.keys(cmu).filter(w => !w.includes('(')));
  console.log(`CMU has ${cmuWords.size} words`);

  // Load ipa-dict
  const ipaDict = {};
  const lines = fs.readFileSync(ipaDictPath, 'utf8').split('\n');
  for (const line of lines) {
    const [word, pron] = line.split('\t');
    if (word && pron) {
      // Take first pronunciation
      const firstPron = pron.split(',')[0].trim();
      ipaDict[word.toLowerCase()] = firstPron;
    }
  }
  console.log(`ipa-dict has ${Object.keys(ipaDict).length} words`);

  // Find words in ipa-dict but not in CMU
  const candidates = Object.entries(ipaDict)
    .filter(([word]) => {
      // Must not be in CMU
      if (cmuWords.has(word)) return false;
      // Must be lowercase letters only (no special chars, numbers)
      if (!/^[a-z]+$/.test(word)) return false;
      // Must be at least 3 characters
      if (word.length < 3) return false;
      // Skip words that look like abbreviations (all consonants)
      if (!/[aeiou]/.test(word)) return false;
      return true;
    });

  console.log(`Found ${candidates.length} candidate words`);

  // Convert to ARPABET
  const supplementary = {};
  let converted = 0;
  let failed = 0;

  for (const [word, ipa] of candidates) {
    const phonemes = ipaToArpabetPhonemes(ipa);
    if (phonemes) {
      supplementary[word] = phonemes;
      converted++;
    } else {
      failed++;
    }
  }

  console.log(`Converted ${converted} words, failed ${failed}`);

  // Curate: only include words that are likely useful
  // Skip very long words (likely obscure), very short (likely abbreviations)
  const curated = Object.entries(supplementary)
    .filter(([word]) => word.length >= 4 && word.length <= 20)
    .sort(([a], [b]) => a.localeCompare(b));

  console.log(`Curated to ${curated.length} words`);

  // Generate TypeScript file
  const tsContent = `/**
 * Supplementary pronunciations extracted from ipa-dict.
 *
 * These are words not in the CMU dictionary, primarily modern/tech terms.
 * This file is auto-generated by scripts/generate-supplementary-dict.cjs
 *
 * To regenerate: npm run generate:supplement
 */

/**
 * Words from ipa-dict that are not in CMU dictionary.
 * Format: word -> ARPABET phonemes array
 */
export const IPA_DICT_SUPPLEMENT: Record<string, string[]> = {
${curated.map(([word, phonemes]) => `  ${JSON.stringify(word)}: [${phonemes.map(p => JSON.stringify(p)).join(', ')}],`).join('\n')}
};

/**
 * Checks if a word has a supplementary pronunciation.
 */
export function hasSupplementaryPronunciation(word: string): boolean {
  return IPA_DICT_SUPPLEMENT[word.toLowerCase()] !== undefined;
}

/**
 * Gets supplementary pronunciation for a word.
 */
export function getSupplementaryPronunciation(word: string): string[] | undefined {
  return IPA_DICT_SUPPLEMENT[word.toLowerCase()];
}
`;

  fs.writeFileSync(outputPath, tsContent);
  console.log(`Generated ${outputPath}`);

  // Format with prettier
  const { execSync } = require('child_process');
  try {
    execSync(`npx prettier --write "${outputPath}"`, { stdio: 'inherit' });
  } catch {
    console.log('Note: prettier not available, skipping formatting');
  }

  // Clean up downloaded ipa-dict file
  if (fs.existsSync(ipaDictPath)) {
    fs.unlinkSync(ipaDictPath);
    console.log('Cleaned up downloaded ipa-dict');
  }

  // Print some sample entries
  console.log('\nSample entries:');
  curated.slice(0, 20).forEach(([word, phonemes]) => {
    console.log(`  ${word}: ${phonemes.join(' ')}`);
  });
}

main().catch(console.error);
