import { describe, expect, it } from 'vitest';
import { verifyScriptRoundTrip } from '@ingglish/phonemes';
import { deseretToArpabet } from './from-deseret';
import { arpabetToDeseret } from './to-deseret';

describe('arpabetToDeseret', () => {
  it('should round-trip all phonemes', () => {
    expect(() =>
      { verifyScriptRoundTrip(arpabetToDeseret, deseretToArpabet, [['Y', 'UW1']]); }
    ).not.toThrow();
  });
});
