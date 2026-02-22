import { registerFormat } from '@ingglish/phonemes';
import { arpabetToIPARaw } from './to-ipa';

export function registerIPA(): void {
  registerFormat('ipa', {
    forward: arpabetToIPARaw,
    isLatinScript: true,
    joinSeparator: ' ',
    label: 'IPA',
    preservesCase: false,
  });
}

export { ipaToArpabetClean } from './from-ipa';
// Export individual functions for direct use
export { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';
