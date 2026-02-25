/**
 * IPA to ARPAbet conversion.
 *
 * Used to convert IPA transcriptions to ARPAbet format
 * compatible with our phoneme mappings.
 */

import { stripStress } from '@ingglish/phonemes';
import { IPA_TO_ARPABET_MAP, IPA_VOWEL_MAP } from './ipa-maps';

const ARPABET_VOWELS = new Set(Object.keys(IPA_VOWEL_MAP));

// Pre-compiled regexes (avoid per-call RegExp object creation)
const NASAL_VOWEL_RE = /([aeiouɑɛɔəɐɒæøœʌɝɚɘɜɞɤʏʊɪɨɯy])\u0303/g;
const MODIFIER_RE = /[\u02B0\u02D0\u02D1\u02E5-\u02E9\u0303\u1D5D]/g; // eslint-disable-line no-misleading-character-class
const COMBINING_NON_CEDILLA_RE = /(?!\u0327)\p{Mn}/gu;

// Cache merged override maps per language (avoids object spread on every call)
const mergedMapCache = new Map<Record<string, string>, Record<string, string>>();

/**
 * Converts an IPA transcription to ARPAbet phonemes.
 * Preserves IPA stress markers as ARPAbet stress digits on vowels:
 * ˈ (primary) → 1, ˌ (secondary) → 2. Unstressed vowels stay bare.
 *
 * @param ipa IPA string (e.g., "həˈloʊ" for "hello")
 * @param overrides Optional per-language IPA→ARPAbet overrides (highest priority)
 * @returns Array of ARPAbet phonemes (e.g., ["HH", "AH0", "L", "OW1"])
 */
export function ipaToArpabet(ipa: string, overrides?: Record<string, string>): string[] {
  // Normalize to NFD so precomposed characters (e.g. ã U+00E3) are
  // decomposed into base + combining mark (a + U+0303) for uniform handling.
  const normalized = ipa.normalize('NFD');

  // Nasal vowels (vowel + combining tilde U+0303) → vowel + "n".
  // Only match IPA vowel characters — consonant nasalization (e.g. w̃ in
  // Portuguese) should be dropped, not converted to "wn".
  const denasalized = normalized.replaceAll(NASAL_VOWEL_RE, '$1n');

  // Remove IPA modifier letters: length (ːˑ), aspiration (ʰ), tone bars
  // (˥˦˧˨˩), superscript modifiers (ᵝ), and remaining tilde.
  // Stress markers (ˈˌ) are preserved — handled in the parse loop below.
  const stripped = denasalized.replaceAll(MODIFIER_RE, '');

  // Strip all remaining combining marks (Korean ̠ ̹ ̚, accents on loanwords é,
  // breathy voice ̤, etc.) EXCEPT cedilla U+0327 (needed for ç → SH).
  // Must happen before NFC, otherwise e+acute recomposes to é (a single
  // codepoint, no longer a combining mark) and gets silently dropped.
  const stripped2 = stripped.replaceAll(COMBINING_NON_CEDILLA_RE, '');

  // Re-compose to NFC so c+cedilla → ç matches its precomposed map key.
  const clean = stripped2.normalize('NFC');

  let map: Record<string, string> = IPA_TO_ARPABET_MAP;
  if (overrides) {
    let cached = mergedMapCache.get(overrides);
    if (!cached) {
      cached = { ...IPA_TO_ARPABET_MAP, ...overrides };
      mergedMapCache.set(overrides, cached);
    }
    map = cached;
  }

  const result: string[] = [];
  let pendingStress: null | number = null;
  let i = 0;

  // Push a phoneme, applying pending stress to vowels.
  const push = (phoneme: string) => {
    const base = stripStress(phoneme);
    if (ARPABET_VOWELS.has(base) && pendingStress !== null) {
      result.push(base + String(pendingStress));
      pendingStress = null;
    } else {
      result.push(phoneme);
    }
  };

  while (i < clean.length) {
    const ch = clean[i]!;

    // IPA stress markers → pending stress for next vowel
    if (ch === '\u02C8') {
      pendingStress = 1;
      i++;
      continue;
    }
    if (ch === '\u02CC') {
      pendingStress = 2;
      i++;
      continue;
    }

    // Try two-character sequences first (diphthongs, affricates)
    if (i + 1 < clean.length) {
      const twoChar = clean.slice(i, i + 2);
      const twoCharArpabet = map[twoChar];
      if (twoCharArpabet !== undefined) {
        // Support multi-phoneme values (space-separated, e.g. "N Y" for ɲ)
        if (twoCharArpabet.includes(' ')) {
          for (const p of twoCharArpabet.split(' ')) {
            push(p);
          }
        } else {
          push(twoCharArpabet);
        }
        i += 2;
        continue;
      }
    }

    // Try single character
    const oneCharArpabet = map[ch];
    if (oneCharArpabet !== undefined) {
      if (oneCharArpabet.includes(' ')) {
        for (const p of oneCharArpabet.split(' ')) {
          push(p);
        }
      } else {
        push(oneCharArpabet);
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
 * Converts IPA text to ARPAbet with stress digits stripped.
 */
export function ipaToArpabetClean(ipa: string): null | string[] {
  const arpabet = ipaToArpabet(ipa).map((p) => stripStress(p));
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
