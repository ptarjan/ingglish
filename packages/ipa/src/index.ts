import { registerFormat } from '@ingglish/phonemes';
import { arpabetToIPARaw } from './to-ipa';

export function registerIPA(): void {
  registerFormat('ipa', { forward: arpabetToIPARaw });
}

// Export individual functions for direct use
export { arpabetToIPA, arpabetToIPARaw, arpabetPhonemeToIPA } from './to-ipa';
export { ipaToArpabet, ipaToArpabetClean, ipaToArpabetString } from './from-ipa';
export {
  ARPABET_TO_IPA_MAP,
  IPA_TO_ARPABET_MAP,
  IPA_VARIANT_MAP,
  IPA_VOWEL_MAP,
  IPA_CONSONANT_MAP,
} from './ipa-maps';
