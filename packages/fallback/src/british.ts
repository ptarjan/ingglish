/**
 * British-to-American spelling conversion.
 *
 * Converts common British English spellings to their American
 * equivalents and looks them up in the CMU dictionary.
 * Used as a fallback when the British spelling isn't found.
 */

import { lookupPronunciation } from '@ingglish/dictionary';
import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetToFormat } from '@ingglish/phonemes';

export type LookupFn = (word: string) => null | string[] | undefined;

/**
 * British-to-American spelling rules, ordered by specificity.
 * Each rule has a regex to match and a replacement string.
 * More specific patterns (like -isation) must come before
 * general patterns (like -ise) to match correctly.
 */
const BRITISH_TO_AMERICAN: { pattern: RegExp; replacement: string }[] = [
  // -isation → -ization (must come before -ise)
  { pattern: /isation$/, replacement: 'ization' },
  // -ise → -ize (realise→realize, organise→organize)
  { pattern: /ise$/, replacement: 'ize' },
  // -our → -or (colour→color, favour→favor)
  { pattern: /our$/, replacement: 'or' },
  // -oured → -ored (coloured→colored, favoured→favored)
  { pattern: /oured$/, replacement: 'ored' },
  // -ouring → -oring (colouring→coloring)
  { pattern: /ouring$/, replacement: 'oring' },
  // -ourable → -orable (favourable→favorable)
  { pattern: /ourable$/, replacement: 'orable' },
  // -re → -er (centre→center, theatre→theater)
  // Only after consonants to avoid matching normal -re words
  { pattern: /([a-z])re$/, replacement: '$1er' },
  // -lled → -led (travelled→traveled, cancelled→canceled)
  { pattern: /lled$/, replacement: 'led' },
  // -lling → -ling (travelling→traveling, cancelling→canceling)
  { pattern: /lling$/, replacement: 'ling' },
  // -ller → -ler (traveller→traveler)
  { pattern: /ller$/, replacement: 'ler' },
  // -ence → -ense (defence→defense, offence→offense)
  { pattern: /ence$/, replacement: 'ense' },
  // -ogue → -og (catalogue→catalog, dialogue→dialog)
  { pattern: /ogue$/, replacement: 'og' },
  // -ae- → -e- (anaesthetic→anesthetic, paediatric→pediatric)
  { pattern: /ae/, replacement: 'e' },
  // -oe- → -e- (foetus→fetus, oestrogen→estrogen)
  { pattern: /oe/, replacement: 'e' },
  // -ey → -y (curtsey→curtsy)
  { pattern: /ey$/, replacement: 'y' },
  // grey → gray
  { pattern: /grey/, replacement: 'gray' },
];

export interface BritishMatch {
  american: string;
  phonemes: string[];
}

/**
 * Matches a word against British-to-American spelling rules.
 * Returns the American spelling and its phonemes, or null if no match.
 */
export function matchBritish(word: string, lookup?: LookupFn): BritishMatch | null {
  const lower = word.toLowerCase();
  const lookupFn = lookup ?? lookupPronunciation;

  for (const { pattern, replacement } of BRITISH_TO_AMERICAN) {
    if (pattern.test(lower)) {
      const american = lower.replace(pattern, replacement);
      if (american !== lower) {
        const phonemes = lookupFn(american);
        if (phonemes) {
          return { american, phonemes };
        }
      }
    }
  }

  return null;
}

/**
 * Attempts to translate a word by converting British spelling to American
 * and looking up the American form in the dictionary.
 *
 * @param word The unknown word (possibly British spelling)
 * @param format The output format
 * @returns The translated word, or null if no American variant was found
 */
export function translateAsBritish(
  word: string,
  format: OutputFormat = 'ingglish',
  lookup?: LookupFn
): null | string {
  const match = matchBritish(word, lookup);
  if (match === null) {
    return null;
  }
  return arpabetToFormat(match.phonemes, format);
}
