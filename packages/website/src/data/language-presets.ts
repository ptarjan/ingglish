/**
 * Language orthography presets for the Experiment page.
 *
 * Each preset shows how a phonetically-spelled language would write English sounds.
 * The `hash` is a pre-computed URL hash string (diffs from Ingglish defaults only).
 * Grouped by category, alphabetical within each group.
 */

export interface LanguagePreset {
  description: string;
  group: 'alphabet' | 'language';
  hash: string;
  label: string;
}

export const LANGUAGE_PRESETS: LanguagePreset[] = [
  // ── Languages ──────────────────────────────────────────────────────
  {
    description: 'H\u00E1\u010Deks: \u010D, \u0161, \u017E for sibilants, w\u2192v',
    group: 'language',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,AY:aj,CH:\u010D,DH:d,EY:ej,IY:\u00ED,JH:d\u017E,OW:ou,SH:\u0161,TH:t,UW:\u00FA,W:v,Y:j,ZH:\u017E',
    label: 'Czech',
  },
  {
    description: 'Circumflexed consonants, \u016D for /w/',
    group: 'language',
    hash: '#m=AA:a,AH:a,AO:o,AW:a\u016D,AY:aj,CH:\u0109,DH:d,EY:ej,IY:i,JH:\u011D,OW:o\u016D,OY:oj,SH:\u015D,TH:t,UW:u,W:\u016D,Y:j,ZH:\u0135',
    label: 'Esperanto',
  },
  {
    description: 'Doubled vowels for length, b\u2192p, f\u2192v, no th/dh',
    group: 'language',
    hash: '#m=AA:a,AE:\u00E4,AH:a,AO:oo,AW:au,B:p,CH:t\u0161,DH:d,ER:\u00F6r,EY:ei,F:v,IY:ii,JH:d\u017E,OW:ou,SH:\u0161,TH:t,UW:uu,W:v,Y:j,Z:s,ZH:\u017E',
    label: 'Finnish',
  },
  {
    description: 'sch/tsch clusters, ei\u2194ie swap, umlauts',
    group: 'language',
    hash: '#m=AA:a,AE:\u00E4,AH:a,AO:o,AW:au,AY:ei,CH:tsch,DH:d,EY:eh,IY:ie,JH:dsch,OY:eu,SH:sch,TH:t,UW:uh,V:w,Y:j,Z:s,ZH:sch',
    label: 'German',
  },
  {
    description:
      'Native \u03B8/\u03B4 for th/dh, \u03BC\u03C0/\u03BD\u03C4/\u03B3\u03BA digraphs for voiced stops',
    group: 'language',
    hash: '#m=AA:\u03B1,AE:\u03B1,AH:\u03B1,AO:\u03BF,AW:\u03B1\u03BF\u03C5,AY:\u03B1\u03CA,B:\u03BC\u03C0,CH:\u03C4\u03C3,D:\u03BD\u03C4,DH:\u03B4,EH:\u03B5,ER:\u03B5\u03C1,EY:\u03B5\u03CA,F:\u03C6,G:\u03B3\u03BA,HH:\u03C7,IH:\u03B9,IY:\u03B9,JH:\u03C4\u03B6,K:\u03BA,L:\u03BB,M:\u03BC,N:\u03BD,NG:\u03BD\u03B3,OW:\u03BF\u03BF\u03C5,OY:\u03BF\u03CA,P:\u03C0,R:\u03C1,S:\u03C3,SH:\u03C3,T:\u03C4,TH:\u03B8,UH:\u03BF\u03C5,UW:\u03BF\u03C5,V:\u03B2,W:\u03BF\u03C5,Y:\u03B3\u03B9,Z:\u03B6,ZH:\u03B6',
    label: 'Greek',
  },
  {
    description: 'Only 8 consonants \u2014 all sibilants and stops become k',
    group: 'language',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,B:p,CH:k,D:k,DH:k,ER:el,EY:ei,F:p,G:k,IY:i,JH:k,NG:n,OW:o,R:l,S:k,SH:k,T:k,TH:k,UW:u,V:w,Y:i,Z:k,ZH:k',
    label: 'Hawaiian',
  },
  {
    description: 's=/\u0283/ and sz=/s/ swap, cs/dzs/zs digraphs',
    group: 'language',
    hash: '#m=AA:\u00E1,AH:a,AO:o,AW:\u00E1u,AY:\u00E1j,CH:cs,DH:d,EY:\u00E9j,IY:\u00ED,JH:dzs,OW:\u00F3,OY:oj,S:sz,SH:s,TH:t,UW:\u00FA,W:v,Y:j,ZH:zs',
    label: 'Hungarian',
  },
  {
    description: 'ci/gi/sci digraphs for palatals',
    group: 'language',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,CH:ci,DH:d,EY:ei,IY:i,JH:gi,K:c,OW:o,SH:sci,TH:t,UW:u,W:v,Y:i,Z:s,ZH:gi',
    label: 'Italian',
  },
  {
    description: 'No /f/, /v/, /\u03B8/, /z/ \u2014 approximated with native sounds',
    group: 'language',
    hash: '#m=AA:a,AH:eo,AO:o,AW:au,DH:d,EY:ei,F:p,IY:i,OW:o,SH:sy,TH:s,UW:u,V:b,Z:j,ZH:j',
    label: 'Korean',
  },
  {
    description: '1:1 phonetic Cyrillic \u2014 \u0448, \u0436, \u0447, \u045F for sibilants',
    group: 'language',
    hash: '#m=AA:\u0430,AE:\u0430,AH:\u0430,AO:\u043E,AW:\u0430\u0443,AY:\u0430\u0458,B:\u0431,CH:\u0447,D:\u0434,DH:\u0434,EH:\u0435,ER:\u0435\u0440,EY:\u0435\u0458,F:\u0444,G:\u0433,HH:\u0445,IH:\u0438,IY:\u0438,JH:\u045F,K:\u043A,L:\u043B,M:\u043C,N:\u043D,NG:\u043D\u0433,OW:\u043E\u0443,OY:\u043E\u0458,P:\u043F,R:\u0440,S:\u0441,SH:\u0448,T:\u0442,TH:\u0442,UH:\u0443,UW:\u0443,V:\u0432,W:\u0432,Y:\u0458,Z:\u0437,ZH:\u0436',
    label: 'Serbian',
  },
  {
    description: '5 pure vowels, j for /x/, sh merges with ch',
    group: 'language',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,DH:d,EY:ei,HH:j,IY:i,JH:y,K:c,OW:o,SH:ch,TH:z,UW:u,Z:s,ZH:y',
    label: 'Spanish',
  },
  {
    description: '\u00E7 and \u015F for affricates/fricatives',
    group: 'language',
    hash: '#m=AA:a,AH:a,AO:o,AW:au,CH:\u00E7,DH:d,EY:ey,IY:i,JH:c,OW:o,SH:\u015F,TH:t,UW:u,W:v,ZH:j',
    label: 'Turkish',
  },
  {
    description: 'f/ff swap (f=/v/, ff=/f/), dd for /\u00F0/, w as vowel',
    group: 'language',
    hash: '#m=AA:a,AH:a,AO:o,AW:aw,DH:dd,EY:ei,F:ff,IY:i,K:c,OW:o,UW:w,V:f,Z:s,ZH:s',
    label: 'Welsh',
  },
  // ── Alphabets ──────────────────────────────────────────────────────
  {
    description: '1850s phonetic alphabet from Utah',
    group: 'alphabet',
    hash: '#m=AA:\uD801\uDC2A,AE:\uD801\uDC30,AH0:\uD801\uDC31,AH:\uD801\uDC32,AO:\uD801\uDC2B,AW:\uD801\uDC35,AY:\uD801\uDC34,B:\uD801\uDC3A,CH:\uD801\uDC3D,D:\uD801\uDC3C,DH:\uD801\uDC44,EH:\uD801\uDC2F,ER:\uD801\uDC32\uD801\uDC49,EY:\uD801\uDC29,F:\uD801\uDC41,G:\uD801\uDC40,HH:\uD801\uDC38,IH:\uD801\uDC2E,IY:\uD801\uDC28,JH:\uD801\uDC3E,K:\uD801\uDC3F,L:\uD801\uDC4A,M:\uD801\uDC4B,N:\uD801\uDC4C,NG:\uD801\uDC4D,OW:\uD801\uDC2C,OY:\uD801\uDC4E,P:\uD801\uDC39,R:\uD801\uDC49,S:\uD801\uDC45,SH:\uD801\uDC47,T:\uD801\uDC3B,TH:\uD801\uDC43,UH:\uD801\uDC33,UW:\uD801\uDC2D,V:\uD801\uDC42,W:\uD801\uDC36,Y:\uD801\uDC37,Z:\uD801\uDC46,ZH:\uD801\uDC48',
    label: 'Deseret',
  },
  {
    description: 'International Phonetic Alphabet symbols',
    group: 'alphabet',
    hash: '#m=AA:\u0251,AE:\u00E6,AH0:\u0259,AH:\u028C,AO:\u0254,AW:a\u028A,AY:a\u026A,CH:t\u0283,DH:\u00F0,EH:\u025B,ER:\u025D,EY:e\u026A,G:\u0261,IH:\u026A,IY:i,JH:d\u0292,NG:\u014B,OW:o\u028A,OY:\u0254\u026A,R:\u0279,SH:\u0283,TH:\u03B8,UH:\u028A,UW:u,Y:j,ZH:\u0292',
    label: 'IPA',
  },
  {
    description: 'Shaw alphabet \u2014 one letter per sound',
    group: 'alphabet',
    hash: '#m=AA:\uD801\uDC6D,AE:\uD801\uDC68,AH0:\uD801\uDC69,AH:\uD801\uDC73,AO:\uD801\uDC77,AW:\uD801\uDC6C,AY:\uD801\uDC72,B:\uD801\uDC5A,CH:\uD801\uDC57,D:\uD801\uDC5B,DH:\uD801\uDC5E,EH:\uD801\uDC67,ER:\uD801\uDC7B,EY:\uD801\uDC71,F:\uD801\uDC53,G:\uD801\uDC5C,HH:\uD801\uDC63,IH:\uD801\uDC66,IY:\uD801\uDC70,JH:\uD801\uDC61,K:\uD801\uDC52,L:\uD801\uDC64,M:\uD801\uDC65,N:\uD801\uDC6F,NG:\uD801\uDC59,OW:\uD801\uDC74,OY:\uD801\uDC76,P:\uD801\uDC50,R:\uD801\uDC6E,S:\uD801\uDC55,SH:\uD801\uDC56,T:\uD801\uDC51,TH:\uD801\uDC54,UH:\uD801\uDC6B,UW:\uD801\uDC75,V:\uD801\uDC5D,W:\uD801\uDC62,Y:\uD801\uDC58,Z:\uD801\uDC5F,ZH:\uD801\uDC60',
    label: 'Shavian',
  },
];
