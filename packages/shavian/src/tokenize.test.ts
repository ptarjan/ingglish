import { describe, expect, it } from 'vitest';
import { shavianToArpabet } from './index';

describe('Shavian character recognition', () => {
  it('converts Shavian characters', () => {
    expect(shavianToArpabet('𐑐')).not.toBeNull(); // P
    expect(shavianToArpabet('𐑖')).not.toBeNull(); // SH
    expect(shavianToArpabet('𐑻')).not.toBeNull(); // ER ligature
  });

  it('rejects non-Shavian characters', () => {
    expect(shavianToArpabet('a')).toBeNull();
    expect(shavianToArpabet('Z')).toBeNull();
    expect(shavianToArpabet('')).toBeNull();
  });
});

describe('Shavian tokenization', () => {
  it('tokenizes pure Shavian text', () => {
    const result = shavianToArpabet('𐑣𐑩𐑤𐑴');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);
  });

  it('tokenizes multi-word Shavian text', () => {
    const result = shavianToArpabet('𐑣𐑩𐑤𐑴 𐑢𐑻𐑤𐑛');
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(3);
  });

  it('skips punctuation', () => {
    const withPunct = shavianToArpabet('𐑣𐑩𐑤𐑴, 𐑢𐑻𐑤𐑛!');
    const without = shavianToArpabet('𐑣𐑩𐑤𐑴 𐑢𐑻𐑤𐑛');
    expect(withPunct).toEqual(without);
  });

  it('returns null for text with no Shavian', () => {
    expect(shavianToArpabet('hello world')).toBeNull();
  });
});
