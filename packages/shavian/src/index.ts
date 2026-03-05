import { registerFormat } from '@ingglish/phonemes';
import {
  reverseTranslateShavianText,
  reverseTranslateShavianTextWithMapping,
} from './from-shavian';
import { arpabetToShavian } from './to-shavian';

/** Register the Shavian output format. Safe to call multiple times. */
export function registerShavian(): void {
  registerFormat('shavian', {
    forward: arpabetToShavian,
    isLatinScript: false,
    label: 'Shavian',
    nativeLabel: '𐑖𐑱𐑝𐑾𐑯',
    preservesCase: false,
    reverseText: reverseTranslateShavianText,
    reverseTextWithMapping: reverseTranslateShavianTextWithMapping,
  });
}

registerShavian();
