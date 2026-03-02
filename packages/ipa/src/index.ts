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
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- backward compat re-export
  lookupIpa,
  NOT_FOUND_MARKER,
  reverseDictText,
  segmentKhmerText,
  translateDict,
  translateDictWithMapping,
} from './foreign';
// eslint-disable-next-line @typescript-eslint/no-deprecated -- backward compat re-export
export type { IpaDict, Language, PhoneDict } from './foreign';
export { ipaToArpabetClean } from './from-ipa';
// Export individual functions for direct use
export { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';
