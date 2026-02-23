/**
 * Language orthography presets for the Experiment page.
 *
 * Each preset shows how a phonetically-spelled language would write English sounds.
 * The `hash` is a pre-computed URL hash string (diffs from Ingglish defaults only).
 */

export interface LanguagePreset {
  description: string;
  hash: string;
  label: string;
}

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  {
    description: 'Doubled vowels for length, no th/dh sounds',
    hash: '#m=AA:a,AE:\u00E4,AH:a,AO:oo,AW:au,CH:t\u0161,DH:d,EY:ei,IY:ii,JH:d\u017E,OW:ou,SH:\u0161,TH:t,UW:uu,W:v,Y:j,Z:s,ZH:\u017E',
    label: 'Finnish',
  },
  {
    description: '5 pure vowels, j for /x/, c for /k/',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,DH:d,EY:ei,HH:j,IY:i,JH:y,K:c,OW:o,TH:z,UW:u,Z:s,ZH:y',
    label: 'Spanish',
  },
  {
    description: 'ci/gi/sci digraphs for palatals',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,CH:ci,DH:d,EY:ei,IY:i,JH:gi,K:c,OW:o,SH:sci,TH:t,UW:u,Z:s,ZH:gi',
    label: 'Italian',
  },
  {
    description: 'sch/tsch clusters, ei\u2194ie swap, umlauts',
    hash: '#m=AA:a,AE:\u00E4,AH:a,AO:o,AW:au,AY:ei,CH:tsch,DH:d,EY:eh,IY:ie,JH:dsch,OY:eu,SH:sch,TH:t,UW:uh,Y:j,Z:s,ZH:sch',
    label: 'German',
  },
  {
    description: '\u00E7 and \u015F for affricates/fricatives',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,CH:\u00E7,DH:d,EY:ey,IY:i,JH:c,OW:o,SH:\u015F,TH:t,UW:u,ZH:j',
    label: 'Turkish',
  },
  {
    description: 'H\u00E1\u010Deks: \u010D, \u0161, \u017E for sibilants',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,AY:aj,CH:\u010D,DH:d,EY:ej,IY:\u00ED,JH:d\u017E,OW:ou,SH:\u0161,TH:t,UW:\u00FA,Y:j,ZH:\u017E',
    label: 'Czech',
  },
  {
    description: 'Circumflexed consonants, \u016D for /w/',
    hash: '#m=AA:a,AH:a,AO:o,AW:a\u016D,AY:aj,CH:\u0109,DH:d,EY:ej,IY:i,JH:\u011D,OW:o\u016D,OY:oj,SH:\u015D,TH:t,UW:u,W:\u016D,Y:j,ZH:\u0135',
    label: 'Esperanto',
  },
  {
    description: 'Only 8 consonants (p, k, h, m, n, l, w, \u02BB)',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,B:p,CH:k,D:k,DH:,F:p,G:k,IY:i,JH:k,NG:n,OW:o,R:l,S:h,SH:h,T:k,TH:h,UW:u,V:w,Y:i,Z:h,ZH:h',
    label: 'Hawaiian',
  },
  {
    description: 'No /f/, /v/, /z/ \u2014 approximated with native sounds',
    hash: '#m=AA:a,AH:eo,AO:o,AW:au,DH:d,EY:ei,F:p,IY:i,OW:o,SH:sy,TH:t,UW:u,V:b,Z:j,ZH:j',
    label: 'Korean',
  },
];
