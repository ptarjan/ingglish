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
      { phoneme: 'AE', examples: 'b**a**d (bad), c**a**t (kat), **a**pple (apul)' },
      { phoneme: 'EH', examples: 'b**e**d (bed), **e**gg (eg), r**e**d (red)' },
      { phoneme: 'IH', examples: 'b**i**t (bit), s**i**t (sit), p**i**g (pig)' },
      { phoneme: 'AA', examples: 'h**o**t (hot), p**o**t (pot), st**o**p (stop)' },
      { phoneme: 'AH', examples: 'b**u**t (but), c**u**p (kup), c**u**t (kut)' },
    ],
  },
  {
    name: 'Long Vowels',
    sounds: [
      { phoneme: 'EY', examples: 'st**ay** (stay), c**a**ke (kayk), n**a**me (naym)' },
      { phoneme: 'IY', examples: 'tr**ee** (tree), f**ee**t (feet), m**e** (mee)' },
      { phoneme: 'AY', examples: 'l**i**fe (laif), b**i**ke (baik), t**i**me (taim)' },
      { phoneme: 'OW', examples: 'g**o** (goh), n**o**se (nohz), c**o**ld (kohld)' },
      { phoneme: 'UW', examples: 'bl**ue** (bluu), t**oo** (tuu), m**oo**n (muun)' },
    ],
  },
  {
    name: 'Diphthongs & Other',
    sounds: [
      { phoneme: 'AW', examples: '**ou**t (out), n**ow** (nou), h**ow** (hou)' },
      { phoneme: 'OY', examples: 'b**oy** (boi), t**oy** (toi), n**oi**se (noiz)' },
      { phoneme: 'AO', examples: 'l**aw** (law), th**ough**t (thawt), c**augh**t (kawt)' },
      { phoneme: 'UH', examples: 'b**oo**k (book), g**oo**d (good), p**u**t (puut)' },
      { phoneme: 'AH0', examples: '**a**bout (ubout), sof**a** (sohfu), banan**a** (bunanu)' },
    ],
  },
  {
    name: 'R-Colored Vowels',
    sounds: [
      {
        phoneme: 'AA+R',
        examples: 'st**ar** (star), c**ar** (kar), f**ar** (far)',
        ipaOverride: 'ɑɹ',
        ingglishOverride: 'ar',
      },
      {
        phoneme: 'AO+R',
        examples: 'f**or** (for), st**ore** (stor), m**ore** (mor)',
        ipaOverride: 'ɔɹ',
        ingglishOverride: 'or',
      },
      {
        phoneme: 'EH+R',
        examples: '**air** (air), c**are** (kair), th**ere** (dhair)',
        ipaOverride: 'ɛɹ',
        ingglishOverride: 'air',
      },
      {
        phoneme: 'AE+R',
        examples: '**arr**ow (arroh), b**arr**ow (barroh), c**arr**ot (karrit)',
        ipaOverride: 'æɹ',
        ingglishOverride: 'arr',
      },
      { phoneme: 'ER', examples: 'h**er** (her), b**ir**d (berd), t**ur**n (tern)' },
    ],
  },
];

// Organize consonants by type
export const consonantGroups: SoundGroup[] = [
  {
    name: 'Stops',
    sounds: [
      { phoneme: 'P', examples: '**p**at (pat), ha**pp**y (hapee), cu**p** (kup)' },
      { phoneme: 'B', examples: '**b**at (bat), a**b**out (ubout), ca**b** (kab)' },
      { phoneme: 'T', examples: '**t**op (top), be**tt**er (beter), ca**t** (kat)' },
      { phoneme: 'D', examples: 'be**d** (bed), la**dd**er (lader), **d**og (dawg)' },
      { phoneme: 'K', examples: 'ba**ck** (bak), **c**at (kat), ba**ck**er (baker)' },
      { phoneme: 'G', examples: 'bi**g** (big), **g**o (goh), bi**gg**er (biger)' },
    ],
  },
  {
    name: 'Fricatives',
    sounds: [
      { phoneme: 'F', examples: '**f**at (fat), a**f**ter (after), lau**gh** (laf)' },
      { phoneme: 'V', examples: '**v**an (van), o**v**er (ohver), lo**v**e (luv)' },
      { phoneme: 'TH', examples: 'ba**th** (bath), **th**ink (thingk), no**th**ing (nuthing)' },
      { phoneme: 'DH', examples: '**th**e (dhu), fa**th**er (fodher), smoo**th** (smuudh)' },
      { phoneme: 'S', examples: '**s**at (sat), mi**ss**ing (mising), mi**ss** (mis)' },
      { phoneme: 'Z', examples: '**z**oo (zuu), bu**zz**ing (buzing), i**s** (iz)' },
      { phoneme: 'SH', examples: '**sh**e (shee), wa**sh**ing (woshing), pu**sh** (puush)' },
      { phoneme: 'ZH', examples: 'mea**s**ure (mezher), vi**s**ion (vizhun), bei**ge** (beyzh)' },
      { phoneme: 'HH', examples: '**h**at (hat), a**h**ead (uhed), be**h**ind (bihaind)' },
    ],
  },
  {
    name: 'Affricates',
    sounds: [
      { phoneme: 'CH', examples: '**ch**at (chat), tea**ch**er (teecher), bat**ch** (bach)' },
      { phoneme: 'JH', examples: '**j**ust (just), a**g**ent (eyjunt), e**dge** (ej)' },
    ],
  },
  {
    name: 'Nasals',
    sounds: [
      { phoneme: 'M', examples: '**m**an (man), ha**mm**er (hamer), co**m**e (kum)' },
      { phoneme: 'N', examples: 'pe**n** (pen), **n**o (noh), ru**nn**ing (runing)' },
      { phoneme: 'NG', examples: 'si**ng** (sing), si**ng**er (singer), thi**nk**ing (thingking)' },
    ],
  },
  {
    name: 'Liquids & Glides',
    sounds: [
      { phoneme: 'L', examples: '**l**et (let), be**ll**ow (beloh), we**ll** (wel)' },
      { phoneme: 'R', examples: '**r**un (run), ca**rr**y (karree), ca**r** (kar)' },
      { phoneme: 'W', examples: '**w**et (wet), a**w**ay (uwey), al**w**ays (olweyz)' },
      { phoneme: 'Y', examples: '**y**es (yes), be**y**ond (beeyond), can**y**on (kanyun)' },
    ],
  },
];
