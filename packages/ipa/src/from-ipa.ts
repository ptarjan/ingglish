/**
 * IPA to ARPAbet conversion.
 *
 * Used to convert IPA transcriptions to ARPAbet format
 * compatible with our phoneme mappings.
 */

import { IPA_TO_ARPABET_MAP } from './ipa-maps';

/**
 * Converts an IPA transcription to ARPAbet phonemes.
 * Strips stress markers as they are not preserved in our system.
 *
 * @param ipa IPA string (e.g., "həˈloʊ" for "hello")
 * @param overrides Optional per-language IPA→ARPAbet overrides (highest priority)
 * @returns Array of ARPAbet phonemes (e.g., ["HH", "AH0", "L", "OW"])
 */
export function ipaToArpabet(ipa: string, overrides?: Record<string, string>): string[] {
  // Normalize to NFD so precomposed characters (e.g. ã U+00E3) are
  // decomposed into base + combining mark (a + U+0303) for uniform handling.
  const normalized = ipa.normalize('NFD');

  // Nasal vowels (vowel + combining tilde U+0303) → vowel + "n".
  // Only match IPA vowel characters — consonant nasalization (e.g. w̃ in
  // Portuguese) should be dropped, not converted to "wn".
  const denasalized = normalized.replaceAll(/([aeiouɑɛɔəɐɒæøœʌɝɚɘɜɞɤʏʊɪɨɯy])\u0303/g, '$1n');

  // Remove IPA modifier letters: stress (ˈˌ), length (ːˑ), aspiration (ʰ),
  // tone bars (˥˦˧˨˩), and remaining tilde from consonant nasalization.
  const MODIFIER_RE = /[\u02B0\u02C8\u02CC\u02D0\u02D1\u02E5-\u02E9\u0303]/g; // eslint-disable-line no-misleading-character-class
  const stripped = denasalized.replaceAll(MODIFIER_RE, '');

  // Re-compose to NFC so diacriticked characters (e.g. c+cedilla → ç) match
  // their precomposed map keys, then strip all remaining combining marks
  // (Korean diacritics like ̠ ̹ ̚, breathy voice ̤, etc.).
  const clean = stripped.normalize('NFC').replaceAll(/\p{Mn}/gu, '');

  const map = overrides ? { ...IPA_TO_ARPABET_MAP, ...overrides } : IPA_TO_ARPABET_MAP;

  const result: string[] = [];
  let i = 0;

  while (i < clean.length) {
    // Try two-character sequences first (diphthongs, affricates)
    if (i + 1 < clean.length) {
      const twoChar = clean.slice(i, i + 2);
      const twoCharArpabet = map[twoChar];
      if (twoCharArpabet !== undefined) {
        // Support multi-phoneme values (space-separated, e.g. "N Y" for ɲ)
        if (twoCharArpabet.includes(' ')) {
          result.push(...twoCharArpabet.split(' '));
        } else {
          result.push(twoCharArpabet);
        }
        i += 2;
        continue;
      }
    }

    // Try single character
    const oneChar = clean[i]!;
    const oneCharArpabet = map[oneChar];
    if (oneCharArpabet !== undefined) {
      if (oneCharArpabet.includes(' ')) {
        result.push(...oneCharArpabet.split(' '));
      } else {
        result.push(oneCharArpabet);
      }
    }
    // Skip unknown characters (punctuation, etc.)
    i++;
  }

  // Deduplicate consecutive identical phonemes. Foreign languages often
  // represent long vowels/geminate consonants as doubled characters
  // (Finnish /uu/, /ii/; Italian /ll/, /ss/) — for English approximation,
  // a single phoneme is sufficient.
  const deduped: string[] = [];
  for (const phoneme of result) {
    if (phoneme !== deduped.at(-1)) {
      deduped.push(phoneme);
    }
  }

  return deduped;
}

/**
 * Converts IPA text to ARPAbet (stripping stress markers).
 */
export function ipaToArpabetClean(ipa: string): null | string[] {
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
