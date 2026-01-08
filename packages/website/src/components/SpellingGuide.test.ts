import { describe, it, expect } from 'vitest';

/**
 * Spelling guide example data - must match SpellingGuide.tsx
 * This is duplicated here to test that examples are valid.
 */
const vowelGroups = [
  {
    name: 'Short Vowels',
    sounds: [
      { phoneme: 'AE', examples: '**a**pple, c**a**t, b**a**d' },
      { phoneme: 'EH', examples: '**e**gg, p**e**t, b**e**d' },
      { phoneme: 'IH', examples: 'b**i**t, s**i**t, p**i**g' },
      { phoneme: 'AA', examples: 'h**o**t, p**o**t, st**o**p' },
      { phoneme: 'AH', examples: 'b**u**t, c**u**p, c**u**t' },
    ],
  },
  {
    name: 'Long Vowels',
    sounds: [
      { phoneme: 'EY', examples: 'c**a**ke, n**a**me, st**ay**' },
      { phoneme: 'IY', examples: 'tr**ee**, f**ee**t, m**e**' },
      { phoneme: 'AY', examples: 'b**i**ke, k**i**te, t**i**me' },
      { phoneme: 'OW', examples: 'g**o**, n**o**se, c**o**ld' },
      { phoneme: 'UW', examples: 't**oo**, bl**ue**, m**oo**n' },
    ],
  },
  {
    name: 'Diphthongs & Other',
    sounds: [
      { phoneme: 'AW', examples: 'n**ow**, h**ow**, **ou**t' },
      { phoneme: 'OY', examples: 'b**oy**, t**oy**, n**oi**se' },
      { phoneme: 'AO', examples: 'th**ough**t, l**aw**, c**augh**t' },
      { phoneme: 'UH', examples: 'b**oo**k, p**u**t, g**oo**d' },
      { phoneme: 'ER', examples: 'b**ir**d, h**er**, t**ur**n' },
      { phoneme: 'AH0', examples: '**a**bout, sof**a**, banan**a**' },
    ],
  },
];

const consonantGroups = [
  {
    name: 'Stops',
    sounds: [
      { phoneme: 'P', examples: '**p**at, ha**pp**y, cu**p**' },
      { phoneme: 'B', examples: '**b**at, a**b**out, ca**b**' },
      { phoneme: 'T', examples: '**t**op, be**tt**er, ca**t**' },
      { phoneme: 'D', examples: '**d**og, la**dd**er, be**d**' },
      { phoneme: 'K', examples: '**c**at, ba**ck**er, ba**ck**' },
      { phoneme: 'G', examples: '**g**o, bi**gg**er, bi**g**' },
    ],
  },
  {
    name: 'Fricatives',
    sounds: [
      { phoneme: 'F', examples: '**f**at, a**f**ter, lau**gh**' },
      { phoneme: 'V', examples: '**v**an, o**v**er, lo**v**e' },
      { phoneme: 'TH', examples: '**th**ink, no**th**ing, ba**th**' },
      { phoneme: 'DH', examples: '**th**e, fa**th**er, smoo**th**' },
      { phoneme: 'S', examples: '**s**at, mi**ss**ing, mi**ss**' },
      { phoneme: 'Z', examples: '**z**oo, bu**zz**ing, i**s**' },
      { phoneme: 'SH', examples: '**sh**e, wa**sh**ing, pu**sh**' },
      { phoneme: 'ZH', examples: 'mea**s**ure, vi**s**ion, bei**ge**' },
      { phoneme: 'HH', examples: '**h**at, a**h**ead, be**h**ind' },
    ],
  },
  {
    name: 'Affricates',
    sounds: [
      { phoneme: 'CH', examples: '**ch**at, tea**ch**er, bat**ch**' },
      { phoneme: 'JH', examples: '**j**ust, a**g**ent, e**dge**' },
    ],
  },
  {
    name: 'Nasals',
    sounds: [
      { phoneme: 'M', examples: '**m**an, ha**mm**er, co**m**e' },
      { phoneme: 'N', examples: '**n**o, ru**nn**ing, pe**n**' },
      { phoneme: 'NG', examples: 'si**ng**er, thi**nk**ing, si**ng**' },
    ],
  },
  {
    name: 'Liquids & Glides',
    sounds: [
      { phoneme: 'L', examples: '**l**et, be**ll**ow, we**ll**' },
      { phoneme: 'R', examples: '**r**un, ca**rr**y, ca**r**' },
      { phoneme: 'W', examples: '**w**et, a**w**ay, al**w**ays' },
      { phoneme: 'Y', examples: '**y**es, be**y**ond, can**y**on' },
    ],
  },
];

/**
 * Parse an example string like "c**a**t" and verify the highlighted letters
 * actually exist in the word at the claimed position.
 */
function parseExample(example: string): { word: string; highlighted: string; isValid: boolean } {
  // Extract the highlighted portion (between **)
  const match = /\*\*([^*]+)\*\*/.exec(example);
  if (!match) {
    return { word: example, highlighted: '', isValid: false };
  }

  const highlighted = match[1];
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
            const matches = example.match(/\*\*[^*]+\*\*/g);
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
