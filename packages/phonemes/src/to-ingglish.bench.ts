import { bench, describe } from 'vitest';
import { arpabetToIngglish } from './to-ingglish';

describe('arpabetToIngglish', () => {
  // 4 phonemes: "cat" = K AE1 T
  bench('short (3 phonemes)', () => {
    arpabetToIngglish(['K', 'AE1', 'T']);
  });

  // 8 phonemes: "beautiful" ≈ B Y UW1 T AH0 F AH0 L
  bench('medium (8 phonemes)', () => {
    arpabetToIngglish(['B', 'Y', 'UW1', 'T', 'AH0', 'F', 'AH0', 'L']);
  });

  // r-colored vowel path: "worker" = W ER1 K ER0
  bench('r-colored vowels (4 phonemes)', () => {
    arpabetToIngglish(['W', 'ER1', 'K', 'ER0']);
  });
});
