import { registerFormat } from '@ingglish/phonemes';
import { arpabetToShavian } from './to-shavian';
import { reverseTranslateShavianText } from './from-shavian';

export function registerShavian(): void {
  registerFormat('shavian', {
    forward: arpabetToShavian,
    reverseText: reverseTranslateShavianText,
    isLatinScript: false,
    preservesCase: false,
    label: 'Shavian',
  });
}

// Export individual functions for direct use
export { arpabetToShavian } from './to-shavian';
export {
  shavianToArpabet,
  reverseTranslateShavianWord,
  reverseTranslateShavianText,
} from './from-shavian';
export { isShavianChar, tokenizeShavian } from './tokenize';
export {
  ARPABET_TO_SHAVIAN_MAP,
  SHAVIAN_TO_ARPABET_MAP,
  SHAVIAN_CONSONANT_MAP,
  SHAVIAN_VOWEL_MAP,
  SHAVIAN_SCHWA,
  SHAVIAN_R_COLORED,
} from './shavian-maps';
