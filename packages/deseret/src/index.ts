import { registerFormat } from '@ingglish/phonemes';
import { arpabetToDeseret } from './to-deseret';
import { reverseTranslateDeseretText } from './from-deseret';

export function registerDeseret(): void {
  registerFormat('deseret', {
    forward: arpabetToDeseret,
    reverseText: reverseTranslateDeseretText,
  });
}

// Export individual functions for direct use
export { arpabetToDeseret } from './to-deseret';
export {
  deseretToArpabet,
  reverseTranslateDeseretWord,
  reverseTranslateDeseretText,
} from './from-deseret';
export { isDeseretChar, tokenizeDeseret } from './tokenize';
export {
  ARPABET_TO_DESERET_MAP,
  DESERET_TO_ARPABET_MAP,
  DESERET_CONSONANT_MAP,
  DESERET_VOWEL_MAP,
  DESERET_SCHWA,
  DESERET_EW,
} from './deseret-maps';
