/**
 * Detailed G2P backtest — analyze specific fixable patterns.
 *
 * Usage: npx tsx scripts/g2p-error-analysis.ts
 */

import { loadDictionary } from '../src/dictionary/loader';
import { wordToArpabet } from '../src/fallback/g2p-rules';
import { stripStress } from '../src/phonemes/arpabet';

interface PatternAnalysis {
  name: string;
  test: (word: string, cmu: string[], g2p: string[]) => boolean;
  samples: { word: string; g2p: string; cmu: string }[];
  count: number;
}

async function main() {
  const dict = await loadDictionary();

  const patterns: PatternAnalysis[] = [
    {
      name: 'aa digraph → should be AA (aardvark, baal)',
      test: (w) => /aa/.test(w),
      samples: [],
      count: 0,
    },
    {
      name: 'Final o → should be OW (tomato, zero)',
      test: (w, cmu, g2p) =>
        /o$/.test(w) && g2p.map(stripStress).includes('AA') && cmu.map(stripStress).includes('OW'),
      samples: [],
      count: 0,
    },
    {
      name: 'ar → should be AA R (car, star)',
      test: (w, cmu, g2p) => {
        const g = g2p.map(stripStress).join(' ');
        const c = cmu.map(stripStress).join(' ');
        return /ar/.test(w) && g.includes('AE') && c.includes('AA');
      },
      samples: [],
      count: 0,
    },
    {
      name: 'or → should be AO R (for, story)',
      test: (w, cmu, g2p) => {
        const g = g2p.map(stripStress).join(' ');
        const c = cmu.map(stripStress).join(' ');
        return /or/.test(w) && g.includes('AA') && c.includes('AO');
      },
      samples: [],
      count: 0,
    },
    {
      name: 'Final s → should be Z (dogs, runs)',
      test: (w, cmu, g2p) => {
        const gArr = g2p.map(stripStress);
        const cArr = cmu.map(stripStress);
        return /s$/.test(w) && gArr[gArr.length - 1] === 'S' && cArr[cArr.length - 1] === 'Z';
      },
      samples: [],
      count: 0,
    },
    {
      name: 'Final e not silent (recipe, finale)',
      test: (w, cmu, g2p) => {
        return /[^aeiou][^cg]e$/.test(w) && cmu.length > g2p.length;
      },
      samples: [],
      count: 0,
    },
    {
      name: 'o as schwa AH (common, occur)',
      test: (w, cmu, g2p) => {
        const g = g2p.map(stripStress);
        const c = cmu.map(stripStress);
        return /o/.test(w) && g.includes('AA') && c.includes('AH') && !c.includes('AA');
      },
      samples: [],
      count: 0,
    },
    {
      name: 'a as schwa AH (about, banana)',
      test: (w, cmu, g2p) => {
        const g = g2p.map(stripStress);
        const c = cmu.map(stripStress);
        return g.includes('AE') && c.includes('AH') && !c.includes('AE');
      },
      samples: [],
      count: 0,
    },
    {
      name: 'i as long IY (machine, ski)',
      test: (w, cmu, g2p) => {
        const g = g2p.map(stripStress);
        const c = cmu.map(stripStress);
        return g.includes('IH') && c.includes('IY') && !c.includes('IH');
      },
      samples: [],
      count: 0,
    },
    {
      name: 'Final ed → should be D or T not EH D',
      test: (w, cmu, g2p) => {
        const g = g2p.map(stripStress).join(' ');
        return /ed$/.test(w) && g.endsWith('EH D');
      },
      samples: [],
      count: 0,
    },
    {
      name: 'oo as UH (book, good, foot)',
      test: (w, cmu) => {
        return /oo/.test(w) && cmu.map(stripStress).includes('UH');
      },
      samples: [],
      count: 0,
    },
    {
      name: 'al as AO L (all, call, tall)',
      test: (w, cmu, g2p) => {
        const g = g2p.map(stripStress).join(' ');
        const c = cmu.map(stripStress).join(' ');
        return /al/.test(w) && g.includes('AE L') && c.includes('AO L');
      },
      samples: [],
      count: 0,
    },
  ];

  let total = 0;

  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    total++;

    const cmu = dict[word];
    const g2p = wordToArpabet(word);
    const cmuNoStress = cmu.map(stripStress).join(' ');
    const g2pNoStress = g2p.map(stripStress).join(' ');

    if (cmuNoStress === g2pNoStress) continue;

    for (const p of patterns) {
      if (p.test(word, cmu, g2p)) {
        p.count++;
        if (p.samples.length < 10) {
          p.samples.push({
            word,
            g2p: g2p.join(' '),
            cmu: cmu.join(' '),
          });
        }
      }
    }
  }

  console.log(`Total words: ${total}\n`);

  for (const p of patterns.sort((a, b) => b.count - a.count)) {
    console.log(`\n=== ${p.name} (${p.count} words) ===`);
    for (const s of p.samples) {
      console.log(`  ${s.word.padEnd(18)} G2P: ${s.g2p.padEnd(35)} CMU: ${s.cmu}`);
    }
  }
}

main().catch(console.error);
