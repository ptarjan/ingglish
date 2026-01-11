export interface SoundEntry {
  phoneme: string;
  /** Examples with **bold** markers around the relevant letters */
  examples: string;
  /** Override IPA display (for combinations like AA+R) */
  ipaOverride?: string;
  /** Override Ingglish display (for combinations like AA+R) */
  ingglishOverride?: string;
}

export interface SoundGroup {
  name: string;
  sounds: SoundEntry[];
}

// Organize vowels by type (following traditional English phonics)
export const vowelGroups: SoundGroup[] = [
  {
    name: 'Short Vowels',
    sounds: [
      { phoneme: 'AE', examples: '**a**pple, c**a**t, b**a**d' },
      { phoneme: 'EH', examples: '**e**gg, p**e**t, b**e**d' },
      { phoneme: 'IH', examples: 'b**i**t, s**i**t, p**i**g' },
      { phoneme: 'AA', examples: 'h**o**t, p**o**t, st**o**p' },
      { phoneme: 'AH', examples: 'b**u**t, c**u**p, c**u**t' },
    ],
  },
  {
    name: 'Long Vowels',
    sounds: [
      { phoneme: 'EY', examples: 'c**a**ke, n**a**me, st**ay**' },
      { phoneme: 'IY', examples: 'tr**ee**, f**ee**t, m**e**' },
      { phoneme: 'AY', examples: 'b**i**ke, k**i**te, t**i**me' },
      { phoneme: 'OW', examples: 'g**o**, n**o**se, c**o**ld' },
      { phoneme: 'UW', examples: 't**oo**, bl**ue**, m**oo**n' },
    ],
  },
  {
    name: 'Diphthongs & Other',
    sounds: [
      { phoneme: 'AW', examples: 'n**ow**, h**ow**, **ou**t' },
      { phoneme: 'OY', examples: 'b**oy**, t**oy**, n**oi**se' },
      { phoneme: 'AO', examples: 'th**ough**t, l**aw**, c**augh**t' },
      { phoneme: 'UH', examples: 'b**oo**k, p**u**t, g**oo**d' },
      { phoneme: 'AH0', examples: '**a**bout, sof**a**, banan**a**' },
    ],
  },
  {
    name: 'R-Colored Vowels',
    sounds: [
      {
        phoneme: 'AA+R',
        examples: 'st**ar**, c**ar**, f**ar**',
        ipaOverride: 'ɑɹ',
        ingglishOverride: 'ar',
      },
      {
        phoneme: 'AO+R',
        examples: 'st**ore**, m**ore**, f**or**',
        ipaOverride: 'ɔɹ',
        ingglishOverride: 'or',
      },
      { phoneme: 'ER', examples: 'b**ir**d, h**er**, t**ur**n' },
    ],
  },
];

// Organize consonants by type
export const consonantGroups: SoundGroup[] = [
  {
    name: 'Stops',
    sounds: [
      { phoneme: 'P', examples: '**p**at, ha**pp**y, cu**p**' },
      { phoneme: 'B', examples: '**b**at, a**b**out, ca**b**' },
      { phoneme: 'T', examples: '**t**op, be**tt**er, ca**t**' },
      { phoneme: 'D', examples: '**d**og, la**dd**er, be**d**' },
      { phoneme: 'K', examples: '**c**at, ba**ck**er, ba**ck**' },
      { phoneme: 'G', examples: '**g**o, bi**gg**er, bi**g**' },
    ],
  },
  {
    name: 'Fricatives',
    sounds: [
      { phoneme: 'F', examples: '**f**at, a**f**ter, lau**gh**' },
      { phoneme: 'V', examples: '**v**an, o**v**er, lo**v**e' },
      { phoneme: 'TH', examples: '**th**ink, no**th**ing, ba**th**' },
      { phoneme: 'DH', examples: '**th**e, fa**th**er, smoo**th**' },
      { phoneme: 'S', examples: '**s**at, mi**ss**ing, mi**ss**' },
      { phoneme: 'Z', examples: '**z**oo, bu**zz**ing, i**s**' },
      { phoneme: 'SH', examples: '**sh**e, wa**sh**ing, pu**sh**' },
      { phoneme: 'ZH', examples: 'mea**s**ure, vi**s**ion, bei**ge**' },
      { phoneme: 'HH', examples: '**h**at, a**h**ead, be**h**ind' },
    ],
  },
  {
    name: 'Affricates',
    sounds: [
      { phoneme: 'CH', examples: '**ch**at, tea**ch**er, bat**ch**' },
      { phoneme: 'JH', examples: '**j**ust, a**g**ent, e**dge**' },
    ],
  },
  {
    name: 'Nasals',
    sounds: [
      { phoneme: 'M', examples: '**m**an, ha**mm**er, co**m**e' },
      { phoneme: 'N', examples: '**n**o, ru**nn**ing, pe**n**' },
      { phoneme: 'NG', examples: 'si**ng**er, thi**nk**ing, si**ng**' },
    ],
  },
  {
    name: 'Liquids & Glides',
    sounds: [
      { phoneme: 'L', examples: '**l**et, be**ll**ow, we**ll**' },
      { phoneme: 'R', examples: '**r**un, ca**rr**y, ca**r**' },
      { phoneme: 'W', examples: '**w**et, a**w**ay, al**w**ays' },
      { phoneme: 'Y', examples: '**y**es, be**y**ond, can**y**on' },
    ],
  },
];
