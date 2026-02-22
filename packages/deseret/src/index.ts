import { registerFormat } from '@ingglish/phonemes';
import {
  reverseTranslateDeseretText,
  reverseTranslateDeseretTextWithMapping,
} from './from-deseret';
import { arpabetToDeseret } from './to-deseret';

export function registerDeseret(): void {
  registerFormat('deseret', {
    forward: arpabetToDeseret,
    isLatinScript: false,
    label: 'Deseret',
    nativeLabel: '𐐔𐐯𐑅𐐨𐑉𐐯𐐻',
    preservesCase: false,
    reverseText: reverseTranslateDeseretText,
    reverseTextWithMapping: reverseTranslateDeseretTextWithMapping,
  });
}
