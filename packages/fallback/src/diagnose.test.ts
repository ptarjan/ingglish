import { describe, it, expect } from 'vitest';
import { lookupPronunciation } from '@ingglish/dictionary';
import { diagnoseUnknown } from './index';

// These tests use words NOT in the CMU dictionary, so they actually reach
// diagnoseUnknown in the Word Explorer. Words already in the dictionary
// show "dictionary" or "custom override" badges instead.

describe('diagnoseUnknown', () => {
  it('returns { strategy: "initialism" } for spelled-out letter sequences', () => {
    for (const w of ['omg', 'diy', 'eta', 'faq']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      expect(diagnoseUnknown(w)).toEqual({ strategy: 'initialism' });
    }
  });

  it('returns { strategy: "british" } with americanSpelling for British spellings', () => {
    for (const w of ['organise', 'specialise', 'categorise', 'normalise']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      const result = diagnoseUnknown(w);
      expect(result).not.toBeNull();
      expect(result!.strategy).toBe('british');
      if (result!.strategy === 'british') {
        expect(result!.americanSpelling).toEqual(expect.any(String));
        expect(result!.phonemes.length).toBeGreaterThan(0);
      }
    }
  });

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

  it('returns { strategy: "g2p" } with trace for unknown words', () => {
    for (const w of ['splonk', 'blorft', 'zazzle', 'crebbit']) {
      expect(lookupPronunciation(w), `${w} should NOT be in dictionary`).toBeNull();
      const result = diagnoseUnknown(w);
      expect(result).not.toBeNull();
      expect(result!.strategy).toBe('g2p');
      if (result!.strategy === 'g2p') {
        expect(result!.trace).toBeDefined();
        expect(result!.trace.phonemes.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns null for obvious non-words (passthrough)', () => {
    // 3+ consecutive identical characters
    expect(diagnoseUnknown('ssssssss')).toBeNull();
    expect(diagnoseUnknown('brrr')).toBeNull();
    // No vowels (a/e/i/o/u/y)
    expect(diagnoseUnknown('bcdfg')).toBeNull();
    expect(diagnoseUnknown('tsk')).toBeNull();
    expect(diagnoseUnknown('pfft')).toBeNull();
  });
});

describe('diagnoseUnknown returns strategy', () => {
  it('returns correct strategy string for each type', () => {
    expect(diagnoseUnknown('omg')?.strategy).toBe('initialism');
    expect(diagnoseUnknown('organise')?.strategy).toBe('british');
    expect(diagnoseUnknown('treehouse')?.strategy).toBe('compound');
    expect(diagnoseUnknown('ghosting')?.strategy).toBe('stemming');
    expect(diagnoseUnknown('splonk')?.strategy).toBe('g2p');
    expect(diagnoseUnknown('ssssssss')).toBeNull();
  });
});
