import { registerFormat } from '@ingglish/phonemes';
import {
  reverseTranslateDeseretText,
  reverseTranslateDeseretTextWithMapping,
} from './from-deseret';
import { arpabetToDeseret } from './to-deseret';

export function registerDeseret(): void {
  registerFormat('deseret', {
    forward: arpabetToDeseret,
    reverseText: reverseTranslateDeseretText,
    reverseTextWithMapping: reverseTranslateDeseretTextWithMapping,
    isLatinScript: false,
    preservesCase: false,
    label: 'Deseret',
    nativeLabel: '𐐔𐐯𐑅𐐨𐑉𐐯𐐻',
  });
}

// Export individual functions for direct use
export { arpabetToDeseret } from './to-deseret';
export {
  deseretToArpabet,
  reverseTranslateDeseretWord,
  reverseTranslateDeseretText,
  reverseTranslateDeseretTextWithMapping,
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
