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

export {
  ipaToIngglish,
  LANGUAGES,
  lookupIpa,
  NOT_FOUND_MARKER,
  segmentKhmerText,
  translateForeign,
  translateForeignWithMapping,
} from './foreign';
export type { IpaDict, Language } from './foreign';
export { ipaToArpabet, ipaToArpabetClean } from './from-ipa';
export { IPA_LANGUAGE_OVERRIDES } from './ipa-maps';
// Export individual functions for direct use
export { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';
