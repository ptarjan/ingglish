#!/usr/bin/env npx vite-node
/**
 * Quick G2P accuracy measurement with frequency weighting.
 *
 * Usage: npx tsx --conditions=source packages/core/scripts/g2p/measure.ts
 */
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';
async function main() {
  const dict = await loadDictionary();
  await loadFrequencies();
  let total = 0,
    match = 0;
  let freqTotal = 0,
    freqMatch = 0;
  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    total++;
    const freq = getWordFrequency(word) ?? 0;
    freqTotal += freq;
    if (wordToArpabet(word).map(stripStress).join(' ') === dict[word].map(stripStress).join(' ')) {
      match++;
      freqMatch += freq;
    }
  }
  const unweighted = ((match / total) * 100).toFixed(2);
  const weighted = freqTotal > 0 ? ((freqMatch / freqTotal) * 100).toFixed(2) : 'N/A';
  console.log(`Unweighted: ${match}/${total} = ${unweighted}%`);
  console.log(`Freq-weighted: ${weighted}%`);
}
main().catch(console.error);
