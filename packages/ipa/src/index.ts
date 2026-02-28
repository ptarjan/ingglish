import { registerFormat } from '@ingglish/phonemes';
import { arpabetToIPARaw } from './to-ipa';

registerFormat('ipa', {
  forward: arpabetToIPARaw,
  isLatinScript: true,
  joinSeparator: ' ',
  label: 'IPA',
  preservesCase: false,
});

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
export { ipaToArpabetClean } from './from-ipa';
// Export individual functions for direct use
export { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';
