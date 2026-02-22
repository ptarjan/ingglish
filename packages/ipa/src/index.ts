import { registerFormat } from '@ingglish/phonemes';
import { arpabetToIPARaw } from './to-ipa';

export function registerIPA(): void {
  registerFormat('ipa', {
    forward: arpabetToIPARaw,
    isLatinScript: true,
    preservesCase: false,
    label: 'IPA',
    joinSeparator: ' ',
  });
}

// Export individual functions for direct use
export { arpabetToIPARaw, arpabetPhonemeToIPA } from './to-ipa';
export { ipaToArpabetClean } from './from-ipa';
