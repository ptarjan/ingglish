#!/usr/bin/env npx vite-node
/**
 * CLI tool to translate words/text to Ingglish and back.
 * Usage: npm run translate "text to translate"
 *        npm run translate -- -r "ingglish text"        (reverse)
 *        npm run translate -- -l fr "bonjour monde"     (foreign language)
 */
import {
  CUSTOM_PRONUNCIATIONS,
  getDictionary,
  loadDictionary,
  loadReverseDictionary,
  loadFrequencies,
  lookupPronunciation,
} from '@ingglish/dictionary';
import { translateSync } from '../../src/translate/forward.js';
import {
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
} from '../../src/translate/reverse.js';
import '../../src/register-english.js';
import { setLangDict } from '../../src/dict-loader.js';
import { getLanguage, LANGUAGES, NOT_FOUND_MARKER, translateDict } from '@ingglish/ipa';
import type { PhoneDict } from '@ingglish/ipa';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadPhoneDict(langCode: string): PhoneDict {
  const dictPath = resolve(
    import.meta.dirname,
    '../../../website/public/ipa-dicts',
    `${langCode}.json`
  );
  const entries = JSON.parse(readFileSync(dictPath, 'utf-8')) as Record<string, string[]>;
  const langMeta = getLanguage(langCode);
  return {
    disableRColoring: langMeta?.disableRColoring,
    entries,
    lang: langCode,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
}

async function main() {
  const args = process.argv.slice(2);

  // Parse flags
  let reverse = false;
  let langCode: string | undefined;
  let textArgs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-r') {
      reverse = true;
    } else if (args[i] === '-l') {
      i++;
      langCode = args[i];
    } else {
      textArgs.push(args[i]!);
    }
  }

  const text = textArgs.join(' ');

  if (!text) {
    console.log('Usage: npm run translate "text to translate"');
    console.log('       npm run translate -- -r "ingglish text"');
    console.log('       npm run translate -- -l <lang> "foreign text"');
    console.log();
    console.log('Languages:');
    for (const lang of LANGUAGES) {
      console.log(`  ${lang.code}  ${lang.label}`);
    }
    process.exit(1);
  }

  if (langCode) {
    // Foreign language mode
    const lang = LANGUAGES.find((l) => l.code === langCode);
    if (!lang) {
      console.error(
        `Unknown language: ${langCode}. Available: ${LANGUAGES.map((l) => l.code).join(', ')}`
      );
      process.exit(1);
    }

    const dict = loadPhoneDict(langCode);
    console.log(`${lang.label}:`, text);
    console.log('---');

    // Show per-word output
    const words = text.match(/\S+/g) || [];
    for (const word of words) {
      const result = translateDict(word, dict, 'ingglish');
      if (result.includes(NOT_FOUND_MARKER)) {
        const clean = result.replaceAll(NOT_FOUND_MARKER, '');
        console.log(`? "${word}" -> not found (kept as "${clean}")`);
      } else {
        console.log(`✓ "${word}" -> "${result}"`);
      }
    }

    console.log('---');
    console.log('Full translation:', translateDict(text, dict, 'ingglish'));
    return;
  }

  // English mode — load dictionaries and build PhoneDict
  await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);
  const entries = { ...getDictionary(), ...CUSTOM_PRONUNCIATIONS };
  const enMeta = getLanguage('en');
  setLangDict('en', { conventionalCapitals: enMeta?.conventionalCapitals, entries, lang: 'en' });

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
