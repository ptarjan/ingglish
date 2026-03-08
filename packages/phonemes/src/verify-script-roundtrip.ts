import { ARPABET_CONSONANTS, ARPABET_VOWELS, stripStress } from './arpabet';

/**
 * Verifies that a script format's forward and reverse conversions are inverses.
 * Exercises every ARPAbet phoneme through `forward → toArpabet` and asserts
 * the round-trip matches. Only intended for use in tests — zero production cost.
 *
 * @param forward - Converts ARPAbet phonemes to the script format
 * @param toArpabet - Converts script text back to ARPAbet phonemes
 * @param multiPhonemeRules - Multi-phoneme sequences that map to single characters
 *   (e.g., `['Y', 'UW']` for Deseret Ew). Stress markers are optional — if
 *   omitted, stress 1 is used for vowels.
 */
export function verifyScriptRoundTrip(
  forward: (arpabet: string[]) => string,
  toArpabet: (text: string) => null | string[],
  multiPhonemeRules?: string[][]
): void {
  const failures: string[] = [];

  const check = (input: string[]) => {
    const expectedBase = input.map((p) => stripStress(p));
    const scriptText = forward(input);
    const result = toArpabet(scriptText);

    if (!result || result.length === 0) {
      failures.push(
        `  [${input.join(', ')}] → ${JSON.stringify(scriptText)} → ${result === null ? 'null' : '[]'} (expected [${expectedBase.join(', ')}])`
      );
      return;
    }

    const resultBase = result.map((p) => stripStress(p));
    if (
      resultBase.length !== expectedBase.length ||
      resultBase.some((p, i) => p !== expectedBase[i])
    ) {
      failures.push(
        `  [${input.join(', ')}] → ${JSON.stringify(scriptText)} → [${resultBase.join(', ')}] (expected [${expectedBase.join(', ')}])`
      );
    }
  };

  // Test all consonants as single-phoneme inputs
  for (const c of ARPABET_CONSONANTS) {
    check([c]);
  }

  // Test all vowels with stress. Most get stress 1 only, but AH and ER
  // produce different characters at stress 0 vs 1, so test both.
  for (const v of ARPABET_VOWELS) {
    if (v === 'AH' || v === 'ER') {
      check([`${v}0`]);
      check([`${v}1`]);
    } else {
      check([`${v}1`]);
    }
  }

  // Test declared multi-phoneme rules
  if (multiPhonemeRules) {
    for (const rule of multiPhonemeRules) {
      check(rule);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Script round-trip verification failed:\n${failures.join('\n')}`);
  }
}
