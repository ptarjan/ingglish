import { describe, expect, it } from 'vitest';
import { deseretToArpabet } from './index';

describe('deseretToArpabet', () => {
  it('should skip non-Deseret characters', () => {
    expect(deseretToArpabet('𐐺 𐐰 𐐻')).toEqual(['B', 'AE', 'T']);
  });

  it('should return null for empty or non-Deseret input', () => {
    expect(deseretToArpabet('')).toBeNull();
    expect(deseretToArpabet('hello')).toBeNull();
  });
});
