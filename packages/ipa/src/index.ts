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
export { G2P_CONVERTERS } from './g2p';
export type { G2PConverter, G2PEntry } from './g2p';
export { WORD_RESOLVERS } from './resolvers';
export type { WordResolver } from './resolvers';
// Export individual functions for direct use
export { arpabetPhonemeToIPA, arpabetToIPARaw } from './to-ipa';
