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
import { getLanguage, IPA_LANGUAGE_OVERRIDES, ipaToArpabet, toNullProto } from '@ingglish/ipa';
import { getStress, isVowel } from '@ingglish/phonemes';
import './src/register-english'; // registers English word resolver + G2P + default loader
import { setDictLoader, setLangDict } from './src/dict-loader';

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
  // Convert IPA strings to ARPABET arrays (mirrors website's convertIpaEntries)
  const firstValue = Object.values(raw)[0];
  let converted: Record<string, string[]>;
  if (firstValue === undefined || Array.isArray(firstValue)) {
    converted = toNullProto(raw as Record<string, string[]>);
  } else {
    const IPA_SLASH_RE = /^\/|\/$/g;
    const overrides = IPA_LANGUAGE_OVERRIDES[lang];
    converted = Object.create(null) as Record<string, string[]>;
    for (const [word, ipa] of Object.entries(raw)) {
      const clean = (ipa as string).replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
      const arpabet = ipaToArpabet(clean, overrides);
      // Apply default stress if needed
      const hasStress = arpabet.some((p) => isVowel(p) && getStress(p) !== null);
      if (!hasStress) {
        for (let i = arpabet.length - 1; i >= 0; i--) {
          if (isVowel(arpabet[i]!)) {
            arpabet[i] = arpabet[i]! + '1';
            break;
          }
        }
      }
      if (arpabet.length > 0) {
        converted[word] = arpabet;
      }
    }
  }
  const dict = {
    conventionalCapitals: langMeta?.conventionalCapitals,
    disableRColoring: langMeta?.disableRColoring,
    entries: converted,
    lang,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
  setLangDict(lang, dict);
  return dict;
});
