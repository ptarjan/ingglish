import { describe, expect, it } from 'vitest';
import { verifyScriptRoundTrip } from '@ingglish/phonemes';
import { arpabetToDeseret, deseretToArpabet } from './index';

describe('arpabetToDeseret', () => {
  it('should round-trip all phonemes', () => {
    expect(() => {
      verifyScriptRoundTrip(arpabetToDeseret, deseretToArpabet, [['Y', 'UW1']]);
    }).not.toThrow();
  });
});
