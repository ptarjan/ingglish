import { getIpaOverride } from './ipa-overrides';

export type IpaDict = Record<string, string>;

export interface Language {
  code: string;
  label: string;
}

export const LANGUAGES: Language[] = [
  { code: 'ar', label: 'Arabic' },
  { code: 'de', label: 'German' },
  { code: 'es', label: 'Spanish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'fr', label: 'French' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'nl', label: 'Dutch' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Mandarin' },
];

const cache = new Map<string, IpaDict>();

export async function loadDict(code: string): Promise<IpaDict> {
  const cached = cache.get(code);
  if (cached) {
    return cached;
  }

  if (!LANGUAGES.some((l) => l.code === code)) {
    throw new Error(`Unknown language code: ${code}`);
  }

  const url = `${import.meta.env.BASE_URL}ipa-dicts/${code}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load dictionary for ${code}: ${response.status}`);
  }
  const dict = (await response.json()) as IpaDict;
  cache.set(code, dict);
  return dict;
}

export function lookupIpa(dict: IpaDict, word: string, lang?: string): string | undefined {
  if (lang) {
    const override = getIpaOverride(lang, word) ?? getIpaOverride(lang, word.toLowerCase());
    if (override) {
      return override;
    }
  }
  return dict[word] ?? dict[word.toLowerCase()];
}
