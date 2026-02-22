import { bench, describe } from 'vitest';
import { wordToArpabet } from './g2p-rules';

describe('wordToArpabet', () => {
  bench('short word (cat)', () => {
    wordToArpabet('cat');
  });

  bench('medium word (beautiful)', () => {
    wordToArpabet('beautiful');
  });

  bench('long word (extraordinary)', () => {
    wordToArpabet('extraordinary');
  });

  bench('nonsense word (flurbletrax)', () => {
    wordToArpabet('flurbletrax');
  });
});
