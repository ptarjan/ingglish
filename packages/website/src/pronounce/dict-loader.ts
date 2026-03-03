import { setDictLoader } from 'ingglish';
import {
  getDictionary,
  loadDictionary,
  loadFrequencies,
  setDictionaryLoader,
} from '@ingglish/dictionary';
import type { PhoneDict } from '@ingglish/ipa';
import { getLanguage, LANGUAGES } from '@ingglish/ipa';

export type { PhoneDict } from '@ingglish/ipa';
export { LANGUAGES, lookupDict } from '@ingglish/ipa';
export type { Language } from '@ingglish/ipa';

const cache = new Map<string, PhoneDict>();
const entriesCache = new Map<string, Record<string, string[]>>();

export async function loadDict(code: string): Promise<PhoneDict> {
  const cached = cache.get(code);
  if (cached) {
    return cached;
  }

  let entries: Record<string, string[]>;

  if (code === 'en') {
    // Load the CMU dictionary singleton and word frequencies in parallel.
    // loadDictionary() uses our custom loader (set below) which fetches en.json.
    // We then reuse getDictionary() for the PhoneDict entries — no double fetch.
    // The @ingglish/fallback package calls lookupPronunciation → getDictionary()
    // directly (compound splitting, stemming, British spelling), so the CMU
    // singleton must be populated or those calls throw.
    await Promise.all([loadDictionary(), loadFrequencies()]);
    entries = getDictionary();
  } else {
    entries = await fetchDictEntries(code);
  }

  const langMeta = getLanguage(code);
  const dict: PhoneDict = {
    conventionalCapitals: langMeta?.conventionalCapitals,
    disableRColoring: langMeta?.disableRColoring,
    entries,
    lang: code,
    nonLatinScript: langMeta?.nonLatinScript,
    preprocess: langMeta?.preprocess,
  };
  cache.set(code, dict);
  return dict;
}

/** Fetch a JSON dict file from the public directory. Cached to avoid double-fetching. */
async function fetchDictEntries(code: string): Promise<Record<string, string[]>> {
  const cachedEntries = entriesCache.get(code);
  if (cachedEntries) {
    return cachedEntries;
  }

  const lang = LANGUAGES.find((l) => l.code === code);
  if (!lang) {
    throw new Error(`Unknown language code: ${code}`);
  }
  // Use validated lang.code (not raw `code`) to build URL — satisfies CodeQL SSRF check
  const url = `${import.meta.env.BASE_URL}ipa-dicts/${lang.code}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load dictionary for ${code}: ${response.status}`);
  }
  const entries = (await response.json()) as Record<string, string[]>;
  entriesCache.set(code, entries);
  return entries;
}

// Register the fetch-based loader so that `translate(text, { lang })` and
// `translateSync(text, { lang })` work automatically.
setDictLoader(loadDict);

// Override the CMU dictionary loader so English loads from en.json (same as
// other languages) instead of importing the bundled 10MB cmudict.js.
// Uses entriesCache so this is instant if loadDict('en') already ran.
setDictionaryLoader(async () => {
  return fetchDictEntries('en');
});
