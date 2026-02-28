/** Word-level IPA overrides for Swahili. */
export const sw: Record<string, string> = {
  // G2P handles most Swahili words. These overrides cover edge cases
  // that G2P can't handle (Arabic loanwords, foreign names).

  // Arabic loanword with "qi" — G2P doesn't have a rule for 'q'
  sadiqi: '/saˈdiːki/',
  ulithiqi: '/uliˈθiki/',
  // Arabic "kh" = /x/ (voiceless velar fricative), not /kh/
  usiikhini: '/usiiˈxini/',
  // Foreign name — 'c' alone is not a Swahili phoneme
  Victoria: '/viktɔˈɾia/',
};
