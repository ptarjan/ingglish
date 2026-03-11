import { describe, expect, it } from 'vitest';
import { verifyScriptRoundTrip } from './index';

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

// Mock that swaps AH0 → XX (simulating a known divergence)
const divergentAH0 = (text: string): string[] => {
  const result = text.split('-');
  return result.map((p) => (p === 'AH0' ? 'XX' : p));
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

  it.each([
    ['null', nullReverse],
    ['empty array', emptyReverse],
  ] as const)('should throw when toArpabet returns %s', (_, reverse) => {
    expect(() => {
      verifyScriptRoundTrip(forward, reverse);
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

  it('should accept known divergences', () => {
    expect(() => {
      verifyScriptRoundTrip(forward, divergentAH0, [], { AH0: ['XX'] });
    }).not.toThrow();
  });

  it('should still throw for unknown divergences even with knownDivergences set', () => {
    // badReverseER corrupts ER, which is not in knownDivergences
    expect(() => {
      verifyScriptRoundTrip(forward, badReverseER, [], { AH0: ['XX'] });
    }).toThrow(/ER/);
  });
});
