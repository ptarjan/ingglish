import { setDictLoader } from 'ingglish';
import { setDictionaryLoader } from '@ingglish/dictionary';
import type { PhoneDict } from '@ingglish/ipa';
import { LANGUAGES, segmentKhmerText } from '@ingglish/ipa';

export type { PhoneDict } from '@ingglish/ipa';
export { LANGUAGES, lookupDict } from '@ingglish/ipa';
export type { Language } from '@ingglish/ipa';

/** Languages whose primary script is non-Latin (need Unicode tokenizer). */
const NON_LATIN_LANGS = new Set(['ar', 'fa', 'ja', 'km', 'ko', 'or', 'yue', 'zh']);

const cache = new Map<string, PhoneDict>();

export async function loadDict(code: string): Promise<PhoneDict> {
  const cached = cache.get(code);
  if (cached) {
    return cached;
  }

  const entries = await fetchDictEntries(code);
  const dict: PhoneDict = {
    entries,
    lang: code,
    ...(code !== 'en' && { disableRColoring: true }),
    ...(NON_LATIN_LANGS.has(code) && { nonLatinScript: true }),
    ...(code === 'km' && { preprocess: segmentKhmerText }),
  };
  cache.set(code, dict);
  return dict;
}

/** Fetch a JSON dict file from the public directory. */
async function fetchDictEntries(code: string): Promise<Record<string, string[]>> {
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
  return (await response.json()) as Record<string, string[]>;
}

// Register the fetch-based loader so that `translate(text, { lang })` and
// `translateSync(text, { lang })` work automatically.
setDictLoader(loadDict);

// Override the CMU dictionary loader so English loads from en.json (same as
// other languages) instead of importing the bundled 10MB cmudict.js.
setDictionaryLoader(async () => {
  const entries = await fetchDictEntries('en');
  return entries;
});
