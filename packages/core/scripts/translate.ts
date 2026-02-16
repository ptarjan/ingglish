#!/usr/bin/env npx vite-node
/**
 * CLI tool to translate words/text to Ingglish and back.
 * Usage: npm run translate "text to translate"
 *        npm run translate -- -r "ingglish text"  (reverse)
 */
import {
  loadDictionary,
  loadReverseDictionary,
  loadFrequencies,
  lookupPronunciation,
} from '../../dictionary/src/index.js';
import { translateSync } from '../src/translate/forward.js';
import { reverseTranslateSync, reverseTranslateSyncWithMapping } from '../src/translate/reverse.js';

async function main() {
  // Load all dictionaries needed for translation and reverse translation
  await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);

  const args = process.argv.slice(2);
  const reverse = args[0] === '-r';
  const text = reverse ? args.slice(1).join(' ') : args.join(' ');

  if (!text) {
    console.log('Usage: npm run translate "text to translate"');
    console.log('       npm run translate -- -r "ingglish text"');
    process.exit(1);
  }

  if (reverse) {
    const tokens = reverseTranslateSyncWithMapping(text);
    const english = tokens
      .map((t) => (t.isWord && !t.matched ? `[${t.translated}]` : t.translated))
      .join('');
    console.log('Ingglish:', text);
    console.log('English:', english);
  } else {
    // Show detailed info for each word
    const words = text.match(/[a-zA-Z']+/g) || [];
    console.log('Input:', text);
    console.log('---');

    for (const word of words) {
      const pron = lookupPronunciation(word);
      const translated = translateSync(word);
      const back = reverseTranslateSync(translated);
      const match = back.toLowerCase() === word.toLowerCase() ? '✓' : '✗';
      console.log(
        `${match} "${word}" -> "${translated}" -> "${back}"${pron ? '' : ' (not in CMU)'}`
      );
    }

    console.log('---');
    console.log('Full translation:', translateSync(text));
  }
}

main().catch(console.error);
