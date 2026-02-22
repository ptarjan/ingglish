import { registerFormat } from '@ingglish/phonemes';
import {
  reverseTranslateShavianText,
  reverseTranslateShavianTextWithMapping,
} from './from-shavian';
import { arpabetToShavian } from './to-shavian';

export function registerShavian(): void {
  registerFormat('shavian', {
    forward: arpabetToShavian,
    reverseText: reverseTranslateShavianText,
    reverseTextWithMapping: reverseTranslateShavianTextWithMapping,
    isLatinScript: false,
    preservesCase: false,
    label: 'Shavian',
    nativeLabel: '𐑖𐑱𐑝𐑾𐑯',
  });
}
