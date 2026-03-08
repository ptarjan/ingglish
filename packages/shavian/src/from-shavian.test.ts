import { describe, expect, it } from 'vitest';
import { shavianToArpabet } from './from-shavian';

describe('shavianToArpabet', () => {
  it('should skip non-Shavian characters', () => {
    expect(shavianToArpabet('𐑒 𐑨')).toEqual(['K', 'AE']);
    expect(shavianToArpabet('hello')).toBeNull();
  });

  it('should return null for empty input', () => {
    expect(shavianToArpabet('')).toBeNull();
  });
});
