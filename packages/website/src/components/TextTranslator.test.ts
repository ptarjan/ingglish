import { describe, expect, it } from 'vitest';
import { OUTPUT_PLACEHOLDERS } from './TextTranslator';

/** All formats cycled through in the UI (excluding 'experiment'). */
const STANDARD_FORMATS = ['ingglish', 'pronunciation', 'ipa', 'shavian', 'deseret'];

describe('OUTPUT_PLACEHOLDERS', () => {
  it.each(STANDARD_FORMATS)('has a non-empty placeholder for "%s"', (format) => {
    expect(OUTPUT_PLACEHOLDERS[format]).toBeTruthy();
  });
});
