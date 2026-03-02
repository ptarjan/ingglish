import { setDictLoader } from 'ingglish';
import type { IpaDict } from '@ingglish/ipa';
import { LANGUAGES } from '@ingglish/ipa';

export type { IpaDict } from '@ingglish/ipa';
export { LANGUAGES, lookupIpa } from '@ingglish/ipa';
export type { Language } from '@ingglish/ipa';

const cache = new Map<string, IpaDict>();

export async function loadDict(code: string): Promise<IpaDict> {
  const cached = cache.get(code);
  if (cached) {
    return cached;
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
  const entries = (await response.json()) as Record<string, string>;
  const dict: IpaDict = { entries, lang: code };
  cache.set(code, dict);
  return dict;
}

// Register the fetch-based loader so that `translate(text, { lang })` and
// `translateSync(text, { lang })` work automatically.
setDictLoader(loadDict);
