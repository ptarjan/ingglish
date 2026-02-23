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
    description: 'International Phonetic Alphabet symbols',
    hash: '#m=AA:\u0251,AE:\u00E6,AH0:\u0259,AH:\u028C,AO:\u0254,AW:a\u028A,AY:a\u026A,CH:t\u0283,DH:\u00F0,EH:\u025B,ER:\u025D,EY:e\u026A,G:\u0261,IH:\u026A,IY:i,JH:d\u0292,NG:\u014B,OW:o\u028A,OY:\u0254\u026A,R:\u0279,SH:\u0283,TH:\u03B8,UH:\u028A,UW:u,Y:j,ZH:\u0292',
    label: 'IPA',
  },
  {
    description: 'Shaw alphabet \u2014 one letter per sound',
    hash: '#m=AA:𐑭,AE:𐑨,AH0:𐑩,AH:𐑳,AO:𐑷,AW:𐑬,AY:𐑲,B:𐑚,CH:𐑗,D:𐑛,DH:𐑞,EH:𐑧,ER:𐑻,EY:𐑱,F:𐑓,G:𐑜,HH:𐑣,IH:𐑦,IY:𐑰,JH:𐑡,K:𐑒,L:𐑤,M:𐑥,N:𐑯,NG:𐑙,OW:𐑴,OY:𐑶,P:𐑐,R:𐑮,S:𐑕,SH:𐑖,T:𐑑,TH:𐑔,UH:𐑫,UW:𐑵,V:𐑝,W:𐑢,Y:𐑘,Z:𐑟,ZH:𐑠',
    label: 'Shavian',
  },
  {
    description: '1850s phonetic alphabet from Utah',
    hash: '#m=AA:𐐪,AE:𐐰,AH0:𐐱,AH:𐐲,AO:𐐫,AW:𐐵,AY:𐐴,B:𐐺,CH:𐐽,D:𐐼,DH:𐑄,EH:𐐯,ER:𐐲𐑉,EY:𐐩,F:𐑁,G:𐑀,HH:𐐸,IH:𐐮,IY:𐐨,JH:𐐾,K:𐐿,L:𐑊,M:𐑋,N:𐑌,NG:𐑍,OW:𐐬,OY:𐑎,P:𐐹,R:𐑉,S:𐑅,SH:𐑇,T:𐐻,TH:𐑃,UH:𐐳,UW:𐐭,V:𐑂,W:𐐶,Y:𐐷,Z:𐑆,ZH:𐑈',
    label: 'Deseret',
  },
  {
    description: 'Doubled vowels for length, no th/dh sounds',
    hash: '#m=AA:a,AE:\u00E4,AH:a,AO:oo,AW:au,CH:t\u0161,DH:d,ER:\u00F6r,EY:ei,IY:ii,JH:d\u017E,OW:ou,SH:\u0161,TH:t,UW:uu,W:v,Y:j,Z:s,ZH:\u017E',
    label: 'Finnish',
  },
  {
    description: '5 pure vowels, j for /x/, c for /k/',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,DH:d,EY:ei,HH:j,IY:i,JH:y,K:c,OW:o,TH:z,UW:u,Z:s,ZH:y',
    label: 'Spanish',
  },
  {
    description: 'ci/gi/sci digraphs for palatals',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,CH:ci,DH:d,EY:ei,IY:i,JH:gi,K:c,OW:o,SH:sci,TH:t,UW:u,W:v,Y:i,Z:s,ZH:gi',
    label: 'Italian',
  },
  {
    description: 'sch/tsch clusters, ei\u2194ie swap, umlauts',
    hash: '#m=AA:a,AE:\u00E4,AH:a,AO:o,AW:au,AY:ei,CH:tsch,DH:d,EY:eh,IY:ie,JH:dsch,OY:eu,SH:sch,TH:t,UW:uh,V:w,Y:j,Z:s,ZH:sch',
    label: 'German',
  },
  {
    description: '\u00E7 and \u015F for affricates/fricatives',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,CH:\u00E7,DH:d,EY:ey,IY:i,JH:c,OW:o,SH:\u015F,TH:t,UW:u,W:v,ZH:j',
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
    description: 'Only 8 consonants \u2014 all sibilants and stops become k',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,B:p,CH:k,D:k,DH:k,ER:el,EY:ei,F:p,G:k,IY:i,JH:k,NG:n,OW:o,R:l,S:k,SH:k,T:k,TH:k,UW:u,V:w,Y:i,Z:k,ZH:k',
    label: 'Hawaiian',
  },
  {
    description: 'No /f/, /v/, /\u03B8/, /z/ \u2014 approximated with native sounds',
    hash: '#m=AA:a,AH:eo,AO:o,AW:au,DH:d,EY:ei,F:p,IY:i,OW:o,SH:sy,TH:s,UW:u,V:b,Z:j,ZH:j',
    label: 'Korean',
  },
  {
    description: '1:1 phonetic Cyrillic \u2014 \u0448, \u0436, \u0447, \u045F for sibilants',
    hash: '#m=AA:\u0430,AE:\u0430,AH:\u0430,AO:\u043E,AW:\u0430\u0443,AY:\u0430\u0458,B:\u0431,CH:\u0447,D:\u0434,DH:\u0434,EH:\u0435,ER:\u0435\u0440,EY:\u0435\u0458,F:\u0444,G:\u0433,HH:\u0445,IH:\u0438,IY:\u0438,JH:\u045F,K:\u043A,L:\u043B,M:\u043C,N:\u043D,NG:\u043D\u0433,OW:\u043E\u0443,OY:\u043E\u0458,P:\u043F,R:\u0440,S:\u0441,SH:\u0448,T:\u0442,TH:\u0442,UH:\u0443,UW:\u0443,V:\u0432,W:\u0432,Y:\u0458,Z:\u0437,ZH:\u0436',
    label: 'Serbian',
  },
  {
    description:
      'Native \u03B8/\u03B4 for th/dh, \u03BC\u03C0/\u03BD\u03C4/\u03B3\u03BA digraphs for voiced stops',
    hash: '#m=AA:\u03B1,AE:\u03B1,AH:\u03B1,AO:\u03BF,AW:\u03B1\u03BF\u03C5,AY:\u03B1\u03CA,B:\u03BC\u03C0,CH:\u03C4\u03C3,D:\u03BD\u03C4,DH:\u03B4,EH:\u03B5,ER:\u03B5\u03C1,EY:\u03B5\u03CA,F:\u03C6,G:\u03B3\u03BA,HH:\u03C7,IH:\u03B9,IY:\u03B9,JH:\u03C4\u03B6,K:\u03BA,L:\u03BB,M:\u03BC,N:\u03BD,NG:\u03BD\u03B3,OW:\u03BF\u03BF\u03C5,OY:\u03BF\u03CA,P:\u03C0,R:\u03C1,S:\u03C3,SH:\u03C3,T:\u03C4,TH:\u03B8,UH:\u03BF\u03C5,UW:\u03BF\u03C5,V:\u03B2,W:\u03BF\u03C5,Y:\u03B3\u03B9,Z:\u03B6,ZH:\u03B6',
    label: 'Greek',
  },
];
