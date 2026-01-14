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
      { phoneme: 'AE', examples: '**a**pple (apul), c**a**t (kat), b**a**d (bad)' },
      { phoneme: 'EH', examples: '**e**gg (eg), p**e**t (pet), b**e**d (bed)' },
      { phoneme: 'IH', examples: 'b**i**t (bit), s**i**t (sit), p**i**g (pig)' },
      { phoneme: 'AA', examples: 'h**o**t (hot), p**o**t (pot), st**o**p (stop)' },
      { phoneme: 'AH', examples: 'b**u**t (but), c**u**p (kup), c**u**t (kut)' },
    ],
  },
  {
    name: 'Long Vowels',
    sounds: [
      { phoneme: 'EY', examples: 'c**a**ke (keyk), n**a**me (neym), st**ay** (stey)' },
      { phoneme: 'IY', examples: 'tr**ee** (tree), f**ee**t (feet), m**e** (mee)' },
      { phoneme: 'AY', examples: 'b**i**ke (baik), k**i**te (kait), t**i**me (taim)' },
      { phoneme: 'OW', examples: 'g**o** (goh), n**o**se (nohz), c**o**ld (kohld)' },
    ],
  },
  {
    name: 'OO Sounds',
    sounds: [
      { phoneme: 'UH', examples: 'b**oo**k (buuk), p**u**t (puut), g**oo**d (guud)' },
      { phoneme: 'UW', examples: 't**oo** (tuu), bl**ue** (bluu), m**oo**n (muun)' },
    ],
  },
  {
    name: 'Diphthongs & Other',
    sounds: [
      { phoneme: 'AW', examples: 'n**ow** (nou), h**ow** (hou), **ou**t (out)' },
      { phoneme: 'OY', examples: 'b**oy** (boi), t**oy** (toi), n**oi**se (noiz)' },
      { phoneme: 'AO', examples: 'th**ough**t (thawt), l**aw** (law), c**augh**t (kawt)' },
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
        examples: 'st**ore** (stor), m**ore** (mor), f**or** (for)',
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
      { phoneme: 'ER', examples: 'b**ir**d (berd), h**er** (her), t**ur**n (tern)' },
    ],
  },
];

// Organize consonants by type
export const consonantGroups: SoundGroup[] = [
  {
    name: 'Stops',
    sounds: [
      { phoneme: 'P', examples: '**p**at (pat), ha**pp**y (hapi), cu**p** (kup)' },
      { phoneme: 'B', examples: '**b**at (bat), a**b**out (ubout), ca**b** (kab)' },
      { phoneme: 'T', examples: '**t**op (top), be**tt**er (beter), ca**t** (kat)' },
      { phoneme: 'D', examples: '**d**og (dawg), la**dd**er (lader), be**d** (bed)' },
      { phoneme: 'K', examples: '**c**at (kat), ba**ck**er (baker), ba**ck** (bak)' },
      { phoneme: 'G', examples: '**g**o (goh), bi**gg**er (biger), bi**g** (big)' },
    ],
  },
  {
    name: 'Fricatives',
    sounds: [
      { phoneme: 'F', examples: '**f**at (fat), a**f**ter (after), lau**gh** (laf)' },
      { phoneme: 'V', examples: '**v**an (van), o**v**er (ohver), lo**v**e (luv)' },
      { phoneme: 'TH', examples: '**th**ink (think), no**th**ing (nuthing), ba**th** (bath)' },
      { phoneme: 'DH', examples: '**th**e (dhu), fa**th**er (fahdher), smoo**th** (smuudh)' },
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
      { phoneme: 'N', examples: '**n**o (noh), ru**nn**ing (runing), pe**n** (pen)' },
      { phoneme: 'NG', examples: 'si**ng**er (singer), thi**nk**ing (thinking), si**ng** (sing)' },
    ],
  },
  {
    name: 'Liquids & Glides',
    sounds: [
      { phoneme: 'L', examples: '**l**et (let), be**ll**ow (beloh), we**ll** (wel)' },
      { phoneme: 'R', examples: '**r**un (run), ca**rr**y (kari), ca**r** (kar)' },
      { phoneme: 'W', examples: '**w**et (wet), a**w**ay (uwey), al**w**ays (olweyz)' },
      { phoneme: 'Y', examples: '**y**es (yes), be**y**ond (beeyond), can**y**on (kanyun)' },
    ],
  },
];
