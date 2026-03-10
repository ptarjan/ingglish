import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadReverseDictionary, loadFrequencies } from '@ingglish/dictionary';
import { convertIpaEntries, getLanguage } from './src/index';
import './src/index'; // registers 'ipa' format
import { loadLangDict, setDictLoader } from 'ingglish'; // side-effect: registers English word resolver + G2P

// Pre-load all dictionaries before any tests run in this worker
await Promise.all([loadLangDict('en'), loadReverseDictionary(), loadFrequencies()]);

// Register a file-based dict loader for non-English languages
const DICT_DIR = resolve(import.meta.dirname, '..', 'website', 'public', 'ipa-dicts');
setDictLoader(async (lang) => {
  const json = await readFile(resolve(DICT_DIR, `${lang}.json`), 'utf-8');
  const raw = JSON.parse(json) as Record<string, string | string[]>;
  const langMeta = getLanguage(lang);
  return {
    conventionalCapitals: langMeta?.conventionalCapitals,
    disableRColoring: langMeta?.disableRColoring,
    entries: convertIpaEntries(raw, lang),
    lang,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
});
