import { setDictLoader } from 'ingglish';
import { loadDictionary, loadFrequencies, setDictionaryLoader } from '@ingglish/dictionary';
import type { PhoneDict } from '@ingglish/ipa';
import {
  getLanguage,
  IPA_LANGUAGE_OVERRIDES,
  ipaToArpabet,
  LANGUAGES,
  toNullProto,
} from '@ingglish/ipa';
import { getStress, isVowel } from '@ingglish/phonemes';

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

  // All languages: fetch entries from the public directory (uniform path).
  // English side-effects: also populate the CMU dict singleton and word
  // frequencies — needed by diagnoseUnknown (Word Explorer) and the word
  // resolver's compound detection. The forward pipeline doesn't depend on
  // these singletons (it uses PhoneDict entries via the lookup param).
  const promises: Promise<unknown>[] = [fetchDictEntries(code)];
  if (code === 'en') {
    promises.push(loadDictionary(), loadFrequencies());
  }
  const [entries] = (await Promise.all(promises)) as [Record<string, string[]>];

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

// Pre-compiled regex to strip IPA slashes and syllable dots
const IPA_SLASH_RE = /^\/|\/$/g;

/**
 * If no vowel carries a stress digit, apply stress 1 to the last vowel.
 * Gives useful output for languages whose IPA dicts omit stress.
 */
function applyDefaultStress(arpabet: string[]): string[] {
  const hasStress = arpabet.some((p) => isVowel(p) && getStress(p) !== null);
  if (hasStress) {
    return arpabet;
  }
  const result = [...arpabet];
  for (let i = result.length - 1; i >= 0; i--) {
    if (isVowel(result[i]!)) {
      result[i] = result[i]! + '1';
      break;
    }
  }
  return result;
}

/**
 * Converts IPA string entries to ARPAbet arrays at load time.
 * Some dict files store entries as IPA strings (e.g. "/bɔ̃.ʒuʁ/") instead of
 * pre-converted ARPAbet arrays (e.g. ["B", "AO1", "N", "ZH", "UH1", "R"]).
 * This detects and converts them so the pipeline works uniformly.
 */
function convertIpaEntries(
  raw: Record<string, string | string[]>,
  langCode: string
): Record<string, string[]> {
  // Check first entry to detect format
  const firstValue = Object.values(raw)[0];
  if (firstValue === undefined || Array.isArray(firstValue)) {
    return toNullProto(raw as Record<string, string[]>);
  }

  // Entries are IPA strings — convert to ARPAbet
  const overrides = IPA_LANGUAGE_OVERRIDES[langCode];
  const result: Record<string, string[]> = Object.create(null) as Record<string, string[]>;
  for (const [word, ipa] of Object.entries(raw)) {
    const clean = (ipa as string).replaceAll(IPA_SLASH_RE, '').replaceAll('.', '');
    const arpabet = applyDefaultStress(ipaToArpabet(clean, overrides));
    if (arpabet.length > 0) {
      result[word] = arpabet;
    }
  }
  return result;
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
  const raw = (await response.json()) as Record<string, string | string[]>;
  const entries = convertIpaEntries(raw, lang.code);
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
