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
