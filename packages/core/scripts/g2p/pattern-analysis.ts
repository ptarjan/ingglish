#!/usr/bin/env -S npx vite-node --script
/**
 * Analyze G2P error patterns to identify the best rules to add.
 */
import { loadDictionary } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { parseWordLimit } from './eval-g2p.js';

export async function main() {
  const dict = await loadDictionary();
  const limit = parseWordLimit();

  const patterns: Record<string, { total: number; wrong: number; examples: string[] }> = {};

  function track(name: string, word: string, g2p: string[], cmu: string[]) {
    if (!patterns[name]) {
      patterns[name] = { total: 0, wrong: 0, examples: [] };
    }
    patterns[name].total++;
    const g = g2p.map((p) => p.replace(/[012]/g, '')).join(' ');
    const c = cmu.map((p) => p.replace(/[012]/g, '')).join(' ');
    if (g !== c) {
      patterns[name].wrong++;
      if (patterns[name].examples.length < 5) {
        patterns[name].examples.push(`${word}: G=${g2p.join(' ')}  C=${cmu.join(' ')}`);
      }
    }
  }

  let count = 0;
  for (const [word, cmu] of Object.entries(dict) as [string, string[]][]) {
    if (++count > limit) break;
    const g2p = wordToArpabet(word);

    // AA digraph
    if (word.includes('aa')) track('AA digraph', word, g2p, cmu);
    // CC doubled
    const ccIdx = word.indexOf('cc');
    if (ccIdx >= 0) {
      const after = word[ccIdx + 2];
      if (after && 'eiy'.includes(after)) track('CC+front(e/i/y)', word, g2p, cmu);
      else track('CC+other', word, g2p, cmu);
    }
    // -TION
    if (word.includes('tion')) track('-tion', word, g2p, cmu);
    // -SION
    if (word.includes('sion')) track('-sion', word, g2p, cmu);
    // -ABLE
    if (word.endsWith('able')) track('-able final', word, g2p, cmu);
    // -IBLE
    if (word.endsWith('ible')) track('-ible final', word, g2p, cmu);
    // -MENT
    if (word.endsWith('ment')) track('-ment final', word, g2p, cmu);
    // -NESS
    if (word.endsWith('ness')) track('-ness final', word, g2p, cmu);
    // -LESS
    if (word.endsWith('less')) track('-less final', word, g2p, cmu);
    // -FUL
    if (word.endsWith('ful')) track('-ful final', word, g2p, cmu);
    // -LY
    if (word.endsWith('ly')) track('-ly final', word, g2p, cmu);
    // -ING
    if (word.endsWith('ing')) track('-ing final', word, g2p, cmu);
    // -ER final
    if (word.endsWith('er')) track('-er final', word, g2p, cmu);
    // -ED final
    if (word.endsWith('ed')) track('-ed final', word, g2p, cmu);
    // -IOUS/-EOUS
    if (word.endsWith('ious') || word.endsWith('eous')) track('-ious/-eous', word, g2p, cmu);
    // SC before E/I
    if (/sc[ei]/.test(word)) track('SC+front', word, g2p, cmu);
    // OO
    if (word.includes('oo')) track('OO', word, g2p, cmu);
    // Final -LE after consonant
    if (/[bcdfghjklmnpqrstvwxz]le$/.test(word)) track('C+le final', word, g2p, cmu);
    // Final -AGE
    if (word.endsWith('age')) track('-age final', word, g2p, cmu);
    // Final -ATE
    if (word.endsWith('ate')) track('-ate final', word, g2p, cmu);
    // Final -ITE
    if (word.endsWith('ite')) track('-ite final', word, g2p, cmu);
    // -OUGH
    if (word.includes('ough')) track('-ough', word, g2p, cmu);
    // SCH
    if (word.startsWith('sch')) track('SCH- prefix', word, g2p, cmu);
    // Final -MAN
    if (word.endsWith('man')) track('-man final', word, g2p, cmu);
    // Final -MEN
    if (word.endsWith('men')) track('-men final', word, g2p, cmu);
    // -ICAL
    if (word.endsWith('ical')) track('-ical final', word, g2p, cmu);
    // Final -ISH
    if (word.endsWith('ish')) track('-ish final', word, g2p, cmu);
    // Final -IOUS
    if (word.endsWith('ious')) track('-ious final', word, g2p, cmu);
    // Final -OUS
    if (word.endsWith('ous')) track('-ous final', word, g2p, cmu);
    // EI digraph
    if (word.includes('ei') && !word.includes('eig') && !word.includes('eiv')) {
      track('EI digraph', word, g2p, cmu);
    }
    // -LING final
    if (word.endsWith('ling')) track('-ling final', word, g2p, cmu);
    // -TING final
    if (word.endsWith('ting')) track('-ting final', word, g2p, cmu);
  }

  // Sort by wrong count descending
  const sorted = Object.entries(patterns).sort((a, b) => b[1].wrong - a[1].wrong);
  console.log('Pattern analysis (sorted by error count):\n');
  for (const [name, data] of sorted) {
    const pct = (((data.total - data.wrong) / data.total) * 100).toFixed(0);
    console.log(`${name}: ${data.wrong}/${data.total} wrong (${pct}% correct)`);
    for (const e of data.examples) {
      console.log(`  ${e}`);
    }
    console.log();
  }
}

main();
