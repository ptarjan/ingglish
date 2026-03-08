import { describe, expect, it } from 'vitest';
import { verifyScriptRoundTrip } from '@ingglish/phonemes';
import { ipaToArpabet } from './from-ipa';
import { arpabetToIPA, arpabetPhonemeToIPA } from './to-ipa';

describe('arpabet-to-ipa', () => {
  describe('arpabetPhonemeToIPA', () => {
    it('should return lowercase for unknown phonemes', () => {
      expect(arpabetPhonemeToIPA('XY')).toBe('xy');
    });
  });

  it('should round-trip all phonemes', () => {
    expect(() => { verifyScriptRoundTrip(arpabetToIPA, ipaToArpabet); }).not.toThrow();
  });
});
