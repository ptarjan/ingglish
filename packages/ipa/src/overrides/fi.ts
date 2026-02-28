/** Word-level IPA overrides for Finnish. */
export const fi: Record<string, string> = {
  // G2P handles most Finnish words. These overrides cover edge cases.

  // "ng" in inflected forms is /ŋg/ (from consonant gradation nk→ng),
  // not the standard /ŋː/ that G2P produces for "ng".
  hengessä: '/ˈheŋ.ges.sæ/',

  // Compound words — translateForeign splits on hyphens, but the override
  // provides the correct compound pronunciation as a single unit.
  'iän-ikuinen': '/ˈiænikuinen/',
  'sulhais-vaatteisin': '/ˈsulhɑisʋɑːtːeisin/',
};
