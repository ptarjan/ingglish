/**
 * Word-level IPA overrides per language.
 *
 * Some IPA dictionary entries are incorrect or represent a different
 * word form. These overrides take priority over the dictionary.
 */
const OVERRIDES: Record<string, Record<string, string>> = {
  // French
  fr: {
    est: '/ɛ/', // verb "is" — st is silent (dict has /ɛst/)
  },
};

export function getIpaOverride(lang: string, word: string): string | undefined {
  return OVERRIDES[lang]?.[word];
}
