import { describe, expect, it } from 'vitest';
import { verifyScriptRoundTrip } from './verify-script-roundtrip';

// Identity-like mock: forward joins with dashes, toArpabet splits on dashes
const forward = (arpabet: string[]) => arpabet.join('-');
const toArpabet = (text: string): string[] => text.split('-');

const badReverseER = (text: string): string[] => {
  const result = text.split('-');
  // Corrupt ER0/ER1: return AH instead
  return result.map((p) => (p.startsWith('ER') ? 'AH' : p));
};

const nullReverse = () => null;
const emptyReverse = () => [] as string[];

const badReverseYUW = (text: string): string[] => {
  // Y-UW comes back as just Y
  if (text === 'Y-UW') {
    return ['Y'];
  }
  return text.split('-');
};

describe('verifyScriptRoundTrip', () => {
  it('should pass for consistent forward/reverse', () => {
    expect(() => {
      verifyScriptRoundTrip(forward, toArpabet);
    }).not.toThrow();
  });

  it('should throw for divergent reverse', () => {
    expect(() => {
      verifyScriptRoundTrip(forward, badReverseER);
    }).toThrow(/round-trip verification failed/i);
    expect(() => {
      verifyScriptRoundTrip(forward, badReverseER);
    }).toThrow(/ER/);
  });

  it('should throw when toArpabet returns null', () => {
    expect(() => {
      verifyScriptRoundTrip(forward, nullReverse);
    }).toThrow(/round-trip verification failed/i);
  });

  it('should throw when toArpabet returns empty array', () => {
    expect(() => {
      verifyScriptRoundTrip(forward, emptyReverse);
    }).toThrow(/round-trip verification failed/i);
  });

  it('should verify multi-phoneme rules', () => {
    expect(() => {
      verifyScriptRoundTrip(forward, toArpabet, [['Y', 'UW']]);
    }).not.toThrow();
  });

  it('should throw when multi-phoneme rule fails round-trip', () => {
    expect(() => {
      verifyScriptRoundTrip(forward, badReverseYUW, [['Y', 'UW']]);
    }).toThrow(/Y.*UW/);
  });
});
