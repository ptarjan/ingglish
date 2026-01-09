/**
 * IPA to ARPAbet conversion.
 *
 * Used to convert IPA transcriptions (e.g., from phonemize library)
 * to ARPAbet format compatible with our phoneme mappings.
 */

/**
 * Mapping from IPA symbols to ARPAbet phonemes.
 * Covers American English sounds and common IPA variants.
 *
 * Note: This includes additional variants beyond the standard map
 * to handle real-world IPA transcriptions.
 */
const IPA_TO_ARPABET: Record<string, string> = {
  // Vowels (monophthongs)
  ə: 'AH0', // schwa (unstressed)
  ɝ: 'ER', // r-colored schwa (bird)
  ɚ: 'ER', // r-colored schwa variant
  ʌ: 'AH', // strut
  æ: 'AE', // trap
  ɑ: 'AA', // palm, father
  ɔ: 'AO', // thought
  ɛ: 'EH', // dress
  ɪ: 'IH', // kit
  i: 'IY', // fleece
  u: 'UW', // goose
  ʊ: 'UH', // foot

  // Diphthongs (two-character sequences - checked first)
  aɪ: 'AY', // price
  aʊ: 'AW', // mouth
  ɔɪ: 'OY', // choice
  oʊ: 'OW', // goat
  eɪ: 'EY', // face

  // Consonants - Stops
  p: 'P',
  b: 'B',
  t: 'T',
  d: 'D',
  k: 'K',
  g: 'G',
  ɡ: 'G', // IPA variant of g (U+0261)

  // Consonants - Fricatives
  f: 'F',
  v: 'V',
  θ: 'TH', // think (voiceless dental)
  ð: 'DH', // this (voiced dental)
  s: 'S',
  z: 'Z',
  ʃ: 'SH', // ship
  ʒ: 'ZH', // measure
  h: 'HH',

  // Consonants - Affricates (two-character sequences)
  tʃ: 'CH', // church
  dʒ: 'JH', // judge

  // Consonants - Nasals
  m: 'M',
  n: 'N',
  ŋ: 'NG', // sing

  // Consonants - Liquids
  l: 'L',
  ɫ: 'L', // dark l
  ɹ: 'R', // alveolar approximant
  r: 'R', // common variant

  // Consonants - Glides
  w: 'W',
  j: 'Y', // palatal approximant
  y: 'Y', // common variant

  // Additional vowel variants (fallbacks)
  e: 'EY', // some IPA uses plain e for face vowel
  o: 'OW', // some IPA uses plain o for goat vowel
  a: 'AE', // fallback for plain a
};

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
      if (IPA_TO_ARPABET[twoChar] !== undefined) {
        result.push(IPA_TO_ARPABET[twoChar]);
        i += 2;
        continue;
      }
    }

    // Try single character
    const oneChar = clean[i];
    if (IPA_TO_ARPABET[oneChar] !== undefined) {
      result.push(IPA_TO_ARPABET[oneChar]);
    }
    // Skip unknown characters (punctuation, etc.)
    i++;
  }

  return result;
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
