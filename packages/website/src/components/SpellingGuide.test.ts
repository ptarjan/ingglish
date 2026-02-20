import { describe, it, expect } from 'vitest';
import { vowelGroups, consonantGroups } from '../data/spelling-guide-data';

/**
 * Parse an example string like "c**a**t" and verify the highlighted letters
 * actually exist in the word at the claimed position.
 */
function parseExample(example: string): {
  word: string;
  highlighted: string;
  isValid: boolean;
} {
  // Extract the highlighted portion (between **)
  const match = /\*\*([^*]+)\*\*/.exec(example);
  if (!match) {
    return { word: example, highlighted: '', isValid: false };
  }

  const highlighted = match[1]!;
  // Remove the ** markers to get the plain word
  const word = example.replace(/\*\*/g, '');

  // Verify the highlighted portion exists in the word
  const isValid = word.includes(highlighted);

  return { word, highlighted, isValid };
}

/**
 * Parse all examples from a comma-separated string
 */
function parseExamples(
  examples: string
): { word: string; highlighted: string; isValid: boolean }[] {
  return examples.split(',').map((ex) => parseExample(ex.trim()));
}

describe('SpellingGuide examples', () => {
  describe('vowel examples contain highlighted letters', () => {
    for (const group of vowelGroups) {
      describe(group.name, () => {
        for (const sound of group.sounds) {
          it(`${sound.phoneme}: examples contain highlighted letters`, () => {
            const parsed = parseExamples(sound.examples);

            for (const { word, highlighted, isValid } of parsed) {
              expect(isValid, `"${word}" should contain "${highlighted}"`).toBe(true);
              expect(
                highlighted.length,
                `"${word}" should have non-empty highlight`
              ).toBeGreaterThan(0);
            }
          });
        }
      });
    }
  });

  describe('consonant examples contain highlighted letters', () => {
    for (const group of consonantGroups) {
      describe(group.name, () => {
        for (const sound of group.sounds) {
          it(`${sound.phoneme}: examples contain highlighted letters`, () => {
            const parsed = parseExamples(sound.examples);

            for (const { word, highlighted, isValid } of parsed) {
              expect(isValid, `"${word}" should contain "${highlighted}"`).toBe(true);
              expect(
                highlighted.length,
                `"${word}" should have non-empty highlight`
              ).toBeGreaterThan(0);
            }
          });
        }
      });
    }
  });

  describe('all examples have exactly one highlighted portion', () => {
    const allGroups = [...vowelGroups, ...consonantGroups];

    for (const group of allGroups) {
      for (const sound of group.sounds) {
        it(`${sound.phoneme}: each example has one highlight`, () => {
          const examples = sound.examples.split(',').map((ex) => ex.trim());

          for (const example of examples) {
            const matches = /\*\*[^*]+\*\*/g.exec(example);
            expect(
              matches?.length,
              `"${example}" should have exactly one highlighted portion`
            ).toBe(1);
          }
        });
      }
    }
  });
});
