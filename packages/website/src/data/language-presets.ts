/**
 * Language orthography presets for the Experiment page.
 *
 * Each preset shows how a phonetically-spelled language would write English sounds.
 * The `hash` is a pre-computed URL hash string (diffs from Ingglish defaults only).
 */

export interface LanguagePreset {
  description: string;
  flag: string;
  hash: string;
  label: string;
}

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  {
    description: 'Doubled vowels for length, no th/dh sounds',
    flag: '\u{1F1EB}\u{1F1EE}',
    hash: '#m=AA:a,AH:a,AO:oo,CH:tš,DH:d,EY:ei,IY:ii,JH:dž,OW:ou,SH:š,TH:t,UW:uu,W:v,Y:j,Z:s,ZH:ž',
    label: 'Finnish',
  },
  {
    description: '5 pure vowels, j for /x/, c for /k/',
    flag: '\u{1F1EA}\u{1F1F8}',
    hash: '#m=AA:a,AH:a,AO:o,DH:d,EY:ei,HH:j,IY:i,JH:y,K:c,OW:ou,TH:z,UW:u,Z:s,ZH:y',
    label: 'Spanish',
  },
  {
    description: 'ci/gi/sci digraphs for palatals',
    flag: '\u{1F1EE}\u{1F1F9}',
    hash: '#m=AA:a,AH:a,AO:o,CH:ci,DH:d,EY:ei,IY:i,JH:gi,K:c,OW:o,SH:sci,TH:t,UW:u,Z:s,ZH:gi',
    label: 'Italian',
  },
  {
    description: 'sch/tsch clusters, ei↔ie swap, umlauts',
    flag: '\u{1F1E9}\u{1F1EA}',
    hash: '#m=AA:a,AE:ä,AH:a,AO:o,AY:ei,CH:tsch,DH:d,EY:eh,IY:ie,JH:dsch,OY:eu,SH:sch,TH:t,UW:uh,Y:j,Z:s,ZH:sch',
    label: 'German',
  },
  {
    description: 'ç and ş for affricates/fricatives',
    flag: '\u{1F1F9}\u{1F1F7}',
    hash: '#m=AA:a,AH:a,AO:o,CH:ç,DH:d,EY:ey,IY:i,JH:c,OW:o,SH:ş,TH:t,UW:u,ZH:j',
    label: 'Turkish',
  },
  {
    description: 'Háčeks: č, š, ž for sibilants',
    flag: '\u{1F1E8}\u{1F1FF}',
    hash: '#m=AA:a,AH:a,AO:o,AY:aj,CH:č,DH:d,EY:ej,IY:í,JH:dž,OW:ou,SH:š,TH:t,UW:ú,Y:j,ZH:ž',
    label: 'Czech',
  },
  {
    description: 'Circumflexed consonants, ŭ for /w/',
    flag: '\u{1F30D}',
    hash: '#m=AA:a,AH:a,AO:o,AW:aŭ,AY:aj,CH:ĉ,DH:d,EY:ej,IY:i,JH:ĝ,OW:oŭ,OY:oj,SH:ŝ,TH:t,UW:u,W:ŭ,Y:j,ZH:ĵ',
    label: 'Esperanto',
  },
  {
    description: 'Only 8 consonants — everything else maps to k',
    flag: '\u{1F33A}',
    hash: '#m=AA:a,AH:a,AO:o,B:p,CH:k,D:k,DH:k,F:p,G:k,IY:i,JH:k,NG:n,OW:o,R:l,S:k,SH:k,T:k,TH:k,UW:u,V:w,Y:i,Z:k,ZH:k',
    label: 'Hawaiian',
  },
  {
    description: 'No /f/, /v/, /z/ — approximated with native sounds',
    flag: '\u{1F1F0}\u{1F1F7}',
    hash: '#m=AA:a,AH:eo,AO:o,DH:d,EY:ei,F:p,IY:i,OW:o,SH:sy,TH:t,UW:u,V:b,Z:j,ZH:j',
    label: 'Korean',
  },
];
