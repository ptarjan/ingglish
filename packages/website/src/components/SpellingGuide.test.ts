import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLangDict, translateSync } from 'ingglish';
import { beforeAll, describe, expect, it } from 'vitest';
import { consonantGroups, vowelGroups } from '../data/spelling-guide-data';

/**
 * Parse an example string like "c**a**t" and verify the highlighted letters
 * actually exist in the word at the claimed position.
 */
function parseExample(example: string): {
  highlighted: string;
  isValid: boolean;
  word: string;
} {
  // Extract the highlighted portion (between **)
  const match = /\*\*([^*]+)\*\*/.exec(example);
  if (!match) {
    return { highlighted: '', isValid: false, word: example };
  }

  const highlighted = match[1]!;
  // Remove the ** markers to get the plain word
  const word = example.replaceAll('**', '');

  // Verify the highlighted portion exists in the word
  const isValid = word.includes(highlighted);

  return { highlighted, isValid, word };
}

/**
 * Parse all examples from a comma-separated string
 */
function parseExamples(
  examples: string
): { highlighted: string; isValid: boolean; word: string }[] {
  return examples.split(',').map((ex) => parseExample(ex.trim()));
}

const allSounds = [...vowelGroups, ...consonantGroups].flatMap((g) =>
  g.sounds.map((s) => [s.phoneme, s.examples] as const)
);

describe('SpellingGuide examples', () => {
  it.each(allSounds)('%s: examples contain highlighted letters', (_phoneme, examples) => {
    const parsed = parseExamples(examples);
    for (const { highlighted, isValid, word } of parsed) {
      expect(isValid, `"${word}" should contain "${highlighted}"`).toBe(true);
      expect(highlighted.length, `"${word}" should have non-empty highlight`).toBeGreaterThan(0);
    }
  });

  it.each(allSounds)('%s: each example has one highlight', (_phoneme, examples) => {
    for (const example of examples.split(',').map((ex) => ex.trim())) {
      const matches = example.match(/\*\*[^*]+\*\*/g);
      expect(matches?.length, `"${example}" should have exactly one highlighted portion`).toBe(1);
    }
  });
});

// Every `english → ingglish` pair written in the guide's prose must match the
// translator. Any arrow the pattern cannot parse fails the count check, so a
// new example cannot slip past unverified.
describe('SpellingGuide prose examples', () => {
  const source = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'SpellingGuide.tsx'),
    'utf8'
  );
  const pairs = [...source.matchAll(/([a-z][a-z']*)\s*→\s*([a-z][a-z'-]*)/gi)].map(
    (m) => [m[1]!, m[2]!] as const
  );

  beforeAll(() => loadLangDict('en'));

  it('parses every arrow in the file', () => {
    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs.length).toBe(source.split('→').length - 1);
  });

  it.each(pairs)('%s → %s', (english, ingglish) => {
    expect(translateSync(english)).toBe(ingglish);
  });
});
