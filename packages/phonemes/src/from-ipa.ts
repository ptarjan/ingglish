/**
 * IPA to ARPAbet conversion.
 *
 * Used to convert IPA transcriptions (e.g., from phonemize library)
 * to ARPAbet format compatible with our phoneme mappings.
 */

import { IPA_TO_ARPABET_MAP } from './ipa-maps';

/**
 * Converts an IPA transcription to ARPAbet phonemes.
 * Strips stress markers as they are not preserved in our system.
 *
 * @param ipa IPA string (e.g., "həˈloʊ" for "hello")
 * @returns Array of ARPAbet phonemes (e.g., ["HH", "AH0", "L", "OW"])
 */
export function ipaToArpabet(ipa: string): string[] {
  // Remove stress markers (we don't preserve stress in our system)
  const clean = ipa.replace(/[ˈˌ]/g, '');

  const result: string[] = [];
  let i = 0;

  while (i < clean.length) {
    // Try two-character sequences first (diphthongs, affricates)
    if (i + 1 < clean.length) {
      const twoChar = clean.slice(i, i + 2);
      if (IPA_TO_ARPABET_MAP[twoChar] !== undefined) {
        result.push(IPA_TO_ARPABET_MAP[twoChar]);
        i += 2;
        continue;
      }
    }

    // Try single character
    const oneChar = clean[i];
    if (IPA_TO_ARPABET_MAP[oneChar] !== undefined) {
      result.push(IPA_TO_ARPABET_MAP[oneChar]);
    }
    // Skip unknown characters (punctuation, etc.)
    i++;
  }

  return result;
}

/**
 * Converts IPA text to ARPAbet (stripping stress markers).
 */
export function ipaToArpabetClean(ipa: string): string[] | null {
  const arpabet = ipaToArpabet(ipa).map((p) => p.replace(/[012]$/, ''));
  return arpabet.length > 0 ? arpabet : null;
}

/**
 * Converts an IPA transcription to a space-separated ARPAbet string.
 *
 * @param ipa IPA string
 * @returns Space-separated ARPAbet string (e.g., "HH AH0 L OW")
 */
export function ipaToArpabetString(ipa: string): string {
  return ipaToArpabet(ipa).join(' ');
}
