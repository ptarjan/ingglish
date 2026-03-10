import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  CUSTOM_PRONUNCIATIONS,
  getDictionary,
  loadDictionary,
  loadReverseDictionary,
  loadFrequencies,
} from '@ingglish/dictionary';
import '@ingglish/deseret'; // registers 'deseret' format
import '@ingglish/ipa'; // registers 'ipa' format
import '@ingglish/shavian'; // registers 'shavian' format
import { convertIpaEntries, getLanguage } from '@ingglish/ipa';
import './src/register-english'; // registers English word resolver + G2P + default loader
import { loadLangDict, setDictLoader, setLangDict } from './src/dict-loader';

// Load all data before tests run in this worker
// With isolate: false, this is shared across all test files
await Promise.all([loadDictionary(), loadReverseDictionary(), loadFrequencies()]);

// Build and cache the English PhoneDict so translateSync() works without await
const entries = { ...getDictionary(), ...CUSTOM_PRONUNCIATIONS };
const enMeta = getLanguage('en');
setLangDict('en', { conventionalCapitals: enMeta?.conventionalCapitals, entries, lang: 'en' });

// Register a file-based dict loader for non-English languages (reads from website's ipa-dicts)
const DICT_DIR = resolve(import.meta.dirname, '..', 'website', 'public', 'ipa-dicts');
setDictLoader(async (lang) => {
  if (lang === 'en') {
    return { conventionalCapitals: enMeta?.conventionalCapitals, entries, lang: 'en' };
  }
  const json = await readFile(resolve(DICT_DIR, `${lang}.json`), 'utf-8');
  const raw = JSON.parse(json) as Record<string, string | string[]>;
  const langMeta = getLanguage(lang);
  const dict = {
    conventionalCapitals: langMeta?.conventionalCapitals,
    disableRColoring: langMeta?.disableRColoring,
    entries: convertIpaEntries(raw, lang),
    lang,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
  setLangDict(lang, dict);
  return dict;
});

// Pre-load non-English dicts used by tests (shared via isolate: false)
const TEST_LANGS = ['de', 'es', 'fr', 'ja'];
await Promise.all(TEST_LANGS.map((lang) => loadLangDict(lang)));
