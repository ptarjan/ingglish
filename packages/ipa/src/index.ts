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
  buildReverseMap,
  ipaToIngglish,
  LANGUAGES,
  lookupDict,
  NOT_FOUND_MARKER,
  segmentKhmerText,
  translateDict,
  translateDictWithMapping,
} from './dict';
export type { Language, PhoneDict } from './dict';
export { ipaToArpabetClean } from './from-ipa';
// Export individual functions for direct use
export { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';
