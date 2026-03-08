import { describe, expect, it } from 'vitest';
import { arpabetPhonemeToIPA } from './to-ipa';

describe('arpabet-to-ipa', () => {
  describe('arpabetPhonemeToIPA', () => {
    it('should return lowercase for unknown phonemes', () => {
      expect(arpabetPhonemeToIPA('XY')).toBe('xy');
    });
  });
});
