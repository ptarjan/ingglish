import { setDictLoader } from 'ingglish';
import { loadDictionary, loadFrequencies, setDictionaryLoader } from '@ingglish/dictionary';
import type { PhoneDict } from '@ingglish/ipa';
import { convertIpaEntries, getLanguage, LANGUAGES } from '@ingglish/ipa';

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
    // loadDictionary() resolves through fetchDictEntries (already resilient);
    // loadFrequencies() is a dynamic import, so retry it too.
    promises.push(loadDictionary(), retryAsync(loadFrequencies));
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

/** Max attempts (1 initial + retries) for a dictionary fetch before giving up. */
const FETCH_ATTEMPTS = 4;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const backoff = (attempt: number) => Math.min(400 * 2 ** (attempt - 1), 3000) + Math.random() * 200;

/**
 * Fetches a URL with retries and exponential backoff so a transient network
 * blip (the dictionary is several MB, and mobile connections drop) recovers on
 * its own instead of failing the whole app. Retries network errors and
 * transient server statuses (5xx/408/429); a permanent 4xx fails immediately.
 */
export async function fetchWithRetry(url: string, attempts = FETCH_ATTEMPTS): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    let response: Response | undefined;
    try {
      response = await fetch(url);
    } catch (error) {
      lastError = error; // network failure (e.g. Safari "Load failed")
    }
    if (response) {
      if (response.ok) {
        return response;
      }
      const retryable =
        response.status >= 500 || response.status === 408 || response.status === 429;
      if (!retryable) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      lastError = new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    if (attempt < attempts) {
      // 400ms, 800ms, 1600ms (capped), plus jitter to avoid thundering herds.
      await sleep(backoff(attempt));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}

/** Retries a promise-returning operation with exponential backoff. */
export async function retryAsync<T>(fn: () => Promise<T>, attempts = FETCH_ATTEMPTS): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(backoff(attempt));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Operation failed after retries');
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
  const response = await fetchWithRetry(url);
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
