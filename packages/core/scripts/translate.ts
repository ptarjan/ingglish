#!/usr/bin/env npx vite-node
/**
 * CLI tool to translate words/text to Ingglish and back.
 * Usage: npm run translate "text to translate"
 *        npm run translate -- -r "ingglish text"  (reverse)
 */
import { loadDictionary, translateText, lookupPronunciation } from '../src/translator.js';
import { reverseTranslateText } from '../src/reverse-translator.js';

async function main() {
  await loadDictionary();

  const args = process.argv.slice(2);
  const reverse = args[0] === '-r';
  const text = reverse ? args.slice(1).join(' ') : args.join(' ');

  if (!text) {
    console.log('Usage: npm run translate "text to translate"');
    console.log('       npm run translate -- -r "ingglish text"');
    process.exit(1);
  }

  if (reverse) {
    console.log('Ingglish:', text);
    console.log('English:', reverseTranslateText(text));
  } else {
    // Show detailed info for each word
    const words = text.match(/[a-zA-Z']+/g) || [];
    console.log('Input:', text);
    console.log('---');

    for (const word of words) {
      const pron = lookupPronunciation(word);
      const translated = translateText(word);
      const back = reverseTranslateText(translated);
      const match = back.toLowerCase() === word.toLowerCase() ? '✓' : '✗';
      console.log(`${match} "${word}" -> "${translated}" -> "${back}"${pron ? '' : ' (not in CMU)'}`);
    }

    console.log('---');
    console.log('Full translation:', translateText(text));
  }
}

main().catch(console.error);
