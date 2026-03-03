/**
 * Side-effect module: registers English word resolver, G2P converter,
 * and a default dictionary loader.
 *
 * Imported by packages/core/src/index.ts to ensure registrations happen
 * before any translate calls.
 */

import {
  getDictionary,
  getWordFrequency,
  loadDictionary,
  loadFrequencies,
  CUSTOM_PRONUNCIATIONS,
} from '@ingglish/dictionary';
import { dpDecompose, matchBritish, matchStemming } from '@ingglish/fallback';
import { wordToArpabet } from '@ingglish/g2p';
import { G2P_CONVERTERS, getLanguage, WORD_RESOLVERS } from '@ingglish/ipa';
import { isDictLoaderRegistered, setDictLoader, setLangDict } from './dict-loader';

// English word resolver: British → stemming → compounds
WORD_RESOLVERS.en = (entries, word) => {
  const lookup = (w: string) => entries[w] ?? entries[w.toLowerCase()] ?? null;

  const british = matchBritish(word, lookup);
  if (british) {
    return british.phonemes;
  }

  const stemmed = matchStemming(word, lookup);
  if (stemmed) {
    return stemmed.phonemes;
  }

  if (word.length >= 6) {
    const parts = dpDecompose(word.toLowerCase(), lookup, getWordFrequency);
    if (parts) {
      const phonemes: string[] = [];
      for (const part of parts) {
        const ph = entries[part];
        if (!ph) {
          return;
        }
        phonemes.push(...ph);
      }
      return phonemes;
    }
  }
};

// English G2P: low-confidence (49% accuracy) — forward.ts uses with matched: false
G2P_CONVERTERS.en = { confident: false, convert: wordToArpabet };

/** Build an English PhoneDict from the CMU dictionary + custom pronunciations. */
function buildEnglishPhoneDict() {
  const cmuDict = getDictionary();
  // Merge CMU dict with custom pronunciations (custom wins)
  const entries: Record<string, string[]> = { ...cmuDict, ...CUSTOM_PRONUNCIATIONS };
  const enMeta = getLanguage('en');
  return { conventionalCapitals: enMeta?.conventionalCapitals, entries, lang: 'en' as const };
}

// Register a default dict loader for Node.js/test usage.
// The website overrides this with its own fetch-based loader.
if (!isDictLoaderRegistered()) {
  setDictLoader(async (lang) => {
    if (lang === 'en') {
      await Promise.all([loadDictionary(), loadFrequencies()]);
      const dict = buildEnglishPhoneDict();
      setLangDict('en', dict);
      return dict;
    }
    throw new Error(`No dict loader for "${lang}". Call setDictLoader() first.`);
  });
}
