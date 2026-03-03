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
  getLanguage,
  LANGUAGES,
  lookupDict,
  NOT_FOUND_MARKER,
  translateDict,
  translateDictWithMapping,
} from './dict';
export type { Language, PhoneDict } from './dict';
export { ipaToArpabet, ipaToArpabetClean } from './from-ipa';
export { G2P_CONVERTERS } from './g2p';
export { IPA_LANGUAGE_OVERRIDES } from './ipa-maps';
export { WORD_RESOLVERS } from './resolvers';
export { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';
