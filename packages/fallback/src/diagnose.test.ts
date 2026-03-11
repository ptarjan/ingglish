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

  it.each(['organise', 'specialise', 'categorise', 'normalise'])(
    'returns british strategy for "%s"',
    (w) => {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      const result = diagnoseUnknown(w);
      expect(result).not.toBeNull();
      expect(result!.strategy).toBe('british');
      if (result!.strategy === 'british') {
        expect(result!.americanSpelling).toEqual(expect.any(String));
        expect(result!.phonemes.length).toBeGreaterThan(0);
      }
    }
  );

  it('returns americanSpelling "organize" for "organise"', () => {
    const result = diagnoseUnknown('organise');
    expect(result).toEqual(
      expect.objectContaining({ americanSpelling: 'organize', strategy: 'british' })
    );
  });

  it('returns { strategy: "compound" } with parts for compound words', () => {
    expect(lookupPronunciation('treehouse'), 'treehouse should NOT be in dictionary').toBeNull();
    const result = diagnoseUnknown('treehouse');
    expect(result).not.toBeNull();
    expect(result!.strategy).toBe('compound');
    if (result!.strategy === 'compound') {
      expect(result!.parts).toEqual(['tree', 'house']);
    }
  });

  it('returns { strategy: "stemming" } with stem/suffix for stemmed words', () => {
    expect(lookupPronunciation('ghosting'), 'ghosting should NOT be in dictionary').toBeNull();
    const result = diagnoseUnknown('ghosting');
    expect(result).not.toBeNull();
    expect(result!.strategy).toBe('stemming');
    if (result!.strategy === 'stemming') {
      expect(result!.stem).toBe('ghost');
      expect(result!.suffix).toBe('ing');
    }
  });

  it.each(['splonk', 'blorft', 'zazzle', 'crebbit'])('returns g2p strategy for "%s"', (w) => {
    expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
    const result = diagnoseUnknown(w);
    expect(result).not.toBeNull();
    expect(result!.strategy).toBe('g2p');
    if (result!.strategy === 'g2p') {
      expect(result!.trace).toBeDefined();
      expect(result!.trace.phonemes.length).toBeGreaterThan(0);
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
