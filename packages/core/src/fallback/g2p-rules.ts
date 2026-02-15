/**
 * Grapheme-to-phoneme (G2P) rule-based conversion.
 *
 * Basic letter-to-sound rules for converting unknown words
 * to phonemes. Used as a fallback when no other strategy works.
 *
 * Rules are matched left-to-right, longest patterns first.
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import type { OutputFormat } from '../types';

/**
 * Basic letter-to-sound rules for grapheme-to-phoneme conversion.
 * Used as a fallback when the word isn't in the dictionary.
 */
export const GRAPHEME_TO_PHONEME: { pattern: RegExp; phonemes: string[] }[] = [
  // Trigraphs and longer patterns (must come before shorter matches)
  { pattern: /^igh/i, phonemes: ['AY1'] }, // light, night, sight (long I, gh silent)
  { pattern: /^tch/i, phonemes: ['CH'] }, // match, catch (t is silent)
  { pattern: /^dge/i, phonemes: ['JH'] }, // badge, bridge (d+g+e → single J sound)
  { pattern: /^tion/i, phonemes: ['SH', 'AH0', 'N'] }, // nation, action
  { pattern: /^sion/i, phonemes: ['ZH', 'AH0', 'N'] }, // vision, fusion

  // Consonant digraphs
  { pattern: /^sh/i, phonemes: ['SH'] },
  { pattern: /^ch/i, phonemes: ['CH'] },
  { pattern: /^th/i, phonemes: ['TH'] }, // Simplified: always voiceless
  { pattern: /^wh/i, phonemes: ['W'] },
  { pattern: /^ph/i, phonemes: ['F'] },
  { pattern: /^gh/i, phonemes: ['G'] },
  { pattern: /^ng/i, phonemes: ['NG'] },
  { pattern: /^ck/i, phonemes: ['K'] },
  { pattern: /^qu/i, phonemes: ['K', 'W'] },
  { pattern: /^wr/i, phonemes: ['R'] }, // write, wrong (w is silent)
  { pattern: /^kn/i, phonemes: ['N'] }, // knot, knee (k is silent)
  { pattern: /^gn/i, phonemes: ['N'] }, // gnome, gnat (g is silent)

  // Doubled consonants (same sound as single — English doesn't double sounds)
  { pattern: /^bb/i, phonemes: ['B'] },
  { pattern: /^cc(?=[eiy])/i, phonemes: ['K', 'S'] }, // accept, success
  { pattern: /^cc/i, phonemes: ['K'] }, // account, occur
  { pattern: /^dd/i, phonemes: ['D'] },
  { pattern: /^ff/i, phonemes: ['F'] },
  { pattern: /^gg/i, phonemes: ['G'] },
  { pattern: /^ll/i, phonemes: ['L'] },
  { pattern: /^mm/i, phonemes: ['M'] },
  { pattern: /^nn/i, phonemes: ['N'] },
  { pattern: /^pp/i, phonemes: ['P'] },
  { pattern: /^rr/i, phonemes: ['R'] },
  { pattern: /^ss/i, phonemes: ['S'] },
  { pattern: /^tt/i, phonemes: ['T'] },
  { pattern: /^zz/i, phonemes: ['Z'] },

  // Vowel digraphs
  { pattern: /^ee/i, phonemes: ['IY1'] },
  { pattern: /^ea/i, phonemes: ['IY1'] },
  { pattern: /^oo/i, phonemes: ['UW1'] },
  { pattern: /^oa/i, phonemes: ['OW1'] }, // boat, road, coal
  { pattern: /^ou/i, phonemes: ['AW1'] },
  { pattern: /^ow/i, phonemes: ['OW1'] },
  { pattern: /^oi/i, phonemes: ['OY1'] },
  { pattern: /^oy/i, phonemes: ['OY1'] },
  { pattern: /^ai/i, phonemes: ['EY1'] },
  { pattern: /^ay/i, phonemes: ['EY1'] },
  { pattern: /^au/i, phonemes: ['AO1'] },
  { pattern: /^aw/i, phonemes: ['AO1'] },
  { pattern: /^ue/i, phonemes: ['UW1'] }, // blue, true, clue
  { pattern: /^ie/i, phonemes: ['IY1'] },
  { pattern: /^ei/i, phonemes: ['EY1'] }, // vein, rein, reign
  { pattern: /^ey/i, phonemes: ['IY1'] },

  // R-controlled vowels (must come before single vowels)
  { pattern: /^ir/i, phonemes: ['ER1'] }, // bird, first, girl
  { pattern: /^ur/i, phonemes: ['ER1'] }, // burn, turn, fur
  { pattern: /^er/i, phonemes: ['ER1'] }, // fern, her, term

  // Single consonants
  { pattern: /^b/i, phonemes: ['B'] },
  { pattern: /^c(?=[eiy])/i, phonemes: ['S'] }, // soft c
  { pattern: /^c/i, phonemes: ['K'] }, // hard c
  { pattern: /^d/i, phonemes: ['D'] },
  { pattern: /^f/i, phonemes: ['F'] },
  // Soft g before e/y, but NOT before i (too many exceptions: give, gift, girl, git)
  { pattern: /^g(?=[ey])/i, phonemes: ['JH'] }, // soft g (gem, gym)
  { pattern: /^g/i, phonemes: ['G'] }, // hard g (go, git, give, girl)
  { pattern: /^h/i, phonemes: ['HH'] },
  { pattern: /^j/i, phonemes: ['JH'] },
  { pattern: /^k/i, phonemes: ['K'] },
  { pattern: /^l/i, phonemes: ['L'] },
  { pattern: /^m/i, phonemes: ['M'] },
  { pattern: /^n/i, phonemes: ['N'] },
  { pattern: /^p/i, phonemes: ['P'] },
  { pattern: /^q/i, phonemes: ['K'] }, // standalone q (rare: qi, qat)
  { pattern: /^r/i, phonemes: ['R'] },
  { pattern: /^s/i, phonemes: ['S'] },
  { pattern: /^t/i, phonemes: ['T'] },
  { pattern: /^v/i, phonemes: ['V'] },
  { pattern: /^w/i, phonemes: ['W'] },
  { pattern: /^x/i, phonemes: ['K', 'S'] },
  { pattern: /^y(?=[aeiou])/i, phonemes: ['Y'] }, // consonant y (yes, yell)
  { pattern: /^y/i, phonemes: ['IH1'] }, // vowel y: gym, myth, crypt (short I)
  { pattern: /^z/i, phonemes: ['Z'] },

  // Single vowels (default, short sounds)
  { pattern: /^a/i, phonemes: ['AE1'] },
  { pattern: /^e/i, phonemes: ['EH1'] },
  { pattern: /^i/i, phonemes: ['IH1'] },
  { pattern: /^o/i, phonemes: ['AA1'] },
  { pattern: /^u/i, phonemes: ['AH1'] },
];

/**
 * Converts a word to ARPAbet using grapheme-to-phoneme rules.
 * This is a simple rule-based approach for unknown words.
 *
 * @param word The word to convert
 * @returns Array of ARPAbet phonemes
 */
export function wordToArpabet(word: string): string[] {
  const result: string[] = [];
  let remaining = word.toLowerCase();

  while (remaining.length > 0) {
    let matched = false;

    for (const { pattern, phonemes: ruleArpabet } of GRAPHEME_TO_PHONEME) {
      const match = remaining.match(pattern);
      if (match) {
        result.push(...ruleArpabet);
        remaining = remaining.slice(match[0].length);
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Skip unknown characters (numbers, hyphens, etc.)
      remaining = remaining.slice(1);
    }
  }

  return result;
}

/**
 * Translates an unknown word using grapheme-to-phoneme rules.
 * This is a fallback when the word isn't in the dictionary.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The best-effort translation
 */
export function translateWithRules(word: string, format: OutputFormat = 'ingglish'): string {
  const arpabet = wordToArpabet(word);
  return arpabetToFormat(arpabet, format);
}
