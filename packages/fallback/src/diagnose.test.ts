import { describe, it, expect } from 'vitest';
import { lookupPronunciation } from '@ingglish/dictionary';
import { diagnoseUnknown } from './index';

// These tests use words NOT in the CMU dictionary, so they actually reach
// diagnoseUnknown in the Word Explorer. Words already in the dictionary
// show "dictionary" or "custom override" badges instead.

describe('diagnoseUnknown', () => {
  it.each(['omg', 'diy', 'eta', 'faq'])('returns initialism strategy for "%s"', (w) => {
    expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
    expect(diagnoseUnknown(w)).toEqual({ strategy: 'initialism' });
  });

  it.each([
    ['organise', 'organize', ['AO1', 'R', 'G', 'AH0', 'N', 'AY2', 'Z']],
    ['specialise', 'specialize', ['S', 'P', 'EH1', 'SH', 'AH0', 'L', 'AY2', 'Z']],
    ['categorise', 'categorize', ['K', 'AE1', 'T', 'AH0', 'G', 'ER0', 'AY2', 'Z']],
    ['normalise', 'normalize', ['N', 'AO1', 'R', 'M', 'AH0', 'L', 'AY2', 'Z']],
  ])('returns british strategy for "%s" → %s', (w, americanSpelling, phonemes) => {
    expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
    expect(diagnoseUnknown(w)).toEqual({ americanSpelling, phonemes, strategy: 'british' });
  });

  it('returns compound strategy with parts for "treehouse"', () => {
    expect(lookupPronunciation('treehouse'), 'treehouse should NOT be in dictionary').toBeNull();
    expect(diagnoseUnknown('treehouse')).toEqual({
      parts: ['tree', 'house'],
      strategy: 'compound',
    });
  });

  it('returns stemming strategy with stem/suffix for "ghosting"', () => {
    expect(lookupPronunciation('ghosting'), 'ghosting should NOT be in dictionary').toBeNull();
    expect(diagnoseUnknown('ghosting')).toEqual({
      stem: 'ghost',
      strategy: 'stemming',
      suffix: 'ing',
    });
  });

  it.each([
    ['splonk', ['S', 'P', 'L', 'AA1', 'NG', 'K']],
    ['blorft', ['B', 'L', 'AO1', 'R', 'F', 'T']],
    ['zazzle', ['Z', 'AE1', 'Z', 'AH0', 'L']],
    ['crebbit', ['K', 'R', 'EH1', 'B', 'IH0', 'T']],
  ])('returns g2p strategy for "%s"', (w, phonemes) => {
    expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
    const result = diagnoseUnknown(w);
    expect(result).not.toBeNull();
    expect(result!.strategy).toBe('g2p');
    if (result!.strategy === 'g2p') {
      expect(result!.trace.phonemes).toEqual(phonemes);
    }
  });

  it.each(['ssssssss', 'brrr', 'bcdfg', 'tsk', 'pfft'])('returns null for non-word "%s"', (w) => {
    expect(diagnoseUnknown(w)).toBeNull();
  });
});

describe('diagnoseUnknown custom pronunciation', () => {
  it('diagnoses custom pronunciation words', () => {
    // 'vlog' has a custom pronunciation entry in CUSTOM_PRONUNCIATIONS
    const result = diagnoseUnknown('vlog');
    expect(result).not.toBeNull();
    expect(result!.strategy).toBe('custom');
  });
});
