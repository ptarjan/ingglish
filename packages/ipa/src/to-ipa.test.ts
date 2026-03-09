import { reverseTranslate, translate } from 'ingglish';
import { describe, expect, it } from 'vitest';
import './index'; // registers IPA format

describe('IPA translation', () => {
  it('should produce valid IPA output', async () => {
    const ipa = await translate('cat', { format: 'ipa' });
    expect(ipa).toBeDefined();
    expect(typeof ipa).toBe('string');
    expect(ipa).toMatch(/[æɑɛɪɔʊəɹŋʃʒθðˈˌ]/);
  });

  it('should produce non-empty IPA for any word', async () => {
    const ipa = await translate('hello', { format: 'ipa' });
    expect(ipa.length).toBeGreaterThan(0);
  });

  it('should round-trip words through IPA', async () => {
    for (const word of ['cat', 'hello', 'world', 'think', 'bird', 'the']) {
      const ipa = await translate(word, { format: 'ipa' });
      const english = await reverseTranslate(ipa, { format: 'ipa' });
      expect(english, `Failed round-trip for "${word}"`).toBe(word);
    }
  });
});
