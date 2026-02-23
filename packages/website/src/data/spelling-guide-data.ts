export interface SoundEntry {
  /** Examples with **bold** markers around the relevant letters */
  examples: string;
  /** Override Ingglish display (for combinations like AA+R) */
  ingglishOverride?: string;
  /** Override IPA display (for combinations like AA+R) */
  ipaOverride?: string;
  /** Note shown next to Ingglish spelling (e.g., when R-colored is same as base+r) */
  note?: string;
  phoneme: string;
}

export interface SoundGroup {
  name: string;
  sounds: SoundEntry[];
}

// Organize vowels by type (following traditional English phonics)
// Examples are sorted by word frequency (most common first).
// e.g., OY: boy (oy→oi), point (oi→oi). Fewer examples ok if English has limited patterns.
export const vowelGroups: SoundGroup[] = [
  {
    name: 'Short Vowels',
    sounds: [
      {
        examples: 'b**a**d (bad), l**au**gh (laf), s**al**mon (saman), pl**ai**d (plad)',
        phoneme: 'AE',
      },
      {
        examples:
          'g**e**t (get), s**ai**d (sed), **a**ny (enee), fr**ie**nd (frend), h**ea**d (hed)',
        phoneme: 'EH',
      },
      {
        examples:
          'pr**e**tty (pritee), b**i**t (bit), b**u**sy (bizee), s**y**stem (sistam), b**ui**ld (bild)',
        phoneme: 'IH',
      },
      { examples: 'w**a**tch (woch), h**o**t (hot)', phoneme: 'AA' },
      {
        examples: 'c**ou**ld (kud), p**u**t (put), b**oo**k (buk), w**o**lf (wulf)',
        phoneme: 'UH',
      },
      {
        examples:
          'bec**au**se (bikawz), th**ough**t (thawt), w**al**k (wawk), d**o**g (dawg), d**augh**ter (dawter), l**aw** (law)',
        phoneme: 'AO',
      },
      {
        examples: 'b**u**t (buht), l**o**ve (luhv), y**ou**ng (yuhng), bl**oo**d (bluhd)',
        phoneme: 'AH',
      },
      {
        examples:
          '**a**bout (about), fam**i**ly (famalee), op**e**n (ohpan), **u**ntil (antil), sec**o**nd (sekand)',
        phoneme: 'AH0',
      },
    ],
  },
  {
    name: 'Long Vowels & Diphthongs',
    sounds: [
      {
        examples:
          'm**e** (mee), s**ee** (see), m**ea**n (meen), p**eo**ple (peepal), bel**ie**ve (bileev), happ**y** (hapee), k**ey** (kee), c**ei**ling (seeling), sk**i** (skee)',
        phoneme: 'IY',
      },
      {
        examples:
          'y**ou** (yoo), d**o** (doo), t**oo** (too), n**ew** (noo), thr**ough** (throo), tr**u**th (trooth), bl**ue** (bloo), sh**oe** (shoo), fr**ui**t (froot), n**eu**tral (nootral)',
        phoneme: 'UW',
      },
      {
        examples:
          'th**ey** (dhay), t**a**ke (tayk), w**ai**t (wayt), gr**ea**t (grayt), d**ay** (day), str**aigh**t (strayt), **eigh**t (ayt)',
        phoneme: 'EY',
      },
      {
        examples:
          'm**y** (mai), l**i**fe (laif), d**ie** (dai), h**igh** (hai), b**uy** (bai), b**ye** (bai), g**ui**de (gaid), bons**ai** (bonsai)',
        phoneme: 'AY',
      },
      { examples: 'b**oy** (boi), p**oi**nt (point)', phoneme: 'OY' },
      {
        examples:
          'g**o** (goh), **oh** (oh), sh**ow** (shoh), g**oe**s (gohz), b**oa**t (boht), n**o**se (nohz), d**ough** (doh), s**ew** (soh), plat**eau** (platoh)',
        phoneme: 'OW',
      },
      { examples: '**ou**t (out), n**ow** (nou), pl**ough** (plou)', phoneme: 'AW' },
    ],
  },
  {
    name: 'R-Colored Vowels',
    sounds: [
      {
        examples: '**arr**ow (arroh)',
        ingglishOverride: 'arr',
        ipaOverride: 'æɹ',
        phoneme: 'AE+R',
      },
      {
        examples:
          'th**ere** (dhair), th**eir** (dhair), c**are** (kair), **air** (air), w**ear** (wair), t**err**ible (tairabal)',
        ingglishOverride: 'air',
        ipaOverride: 'ɛɹ',
        phoneme: 'EH+R',
      },
      {
        examples:
          'h**ere** (heer), y**ear** (yeer), w**eir**d (weerd), b**eer** (beer), b**ear**d (beerd), p**ier** (peer)',
        ingglishOverride: 'eer',
        ipaOverride: 'ɪɹ',
        phoneme: 'IH+R',
      },
      {
        examples: 'c**ar** (kar), he**ar**t (hart), gu**ar**d (gard)',
        ingglishOverride: 'ar',
        ipaOverride: 'ɑɹ',
        phoneme: 'AA+R',
      },
      {
        examples: 'd**ur**ing (during), l**ure** (lur), n**eur**al (nural)',
        ingglishOverride: 'ur',
        ipaOverride: 'ʊɹ',
        note: 'same as u + r',
        phoneme: 'UH+R',
      },
      {
        examples:
          'f**or** (for), m**ore** (mor), c**our**se (kors), d**oor** (dor), w**ar** (wor), b**oar**d (bord)',
        ingglishOverride: 'or',
        ipaOverride: 'ɔɹ',
        phoneme: 'AO+R',
      },
      {
        examples: 'c**urr**y (kuhree)',
        ingglishOverride: 'uhr',
        ipaOverride: 'ʌɹ',
        note: 'same as uh + r',
        phoneme: 'AH+R',
      },
      {
        examples:
          'h**er** (her), s**ir** (ser), h**ear**d (herd), t**ur**n (tern), doct**or** (dokter), b**ir**d (berd), popul**ar** (popyaler)',
        phoneme: 'ER',
      },
    ],
  },
];

// Organize consonants by type
export const consonantGroups: SoundGroup[] = [
  {
    name: 'Stops',
    sounds: [
      { examples: 'ha**pp**y (hapee), **p**at (pat)', phoneme: 'P' },
      { examples: 'ra**bb**it (rabat), **b**at (bat)', phoneme: 'B' },
      {
        examples: 'be**tt**er (beter), **t**op (top), dou**bt** (dout), walk**ed** (wawkt)',
        phoneme: 'T',
      },
      { examples: 'be**d** (bed), da**dd**y (dadee), play**ed** (playd)', phoneme: 'D' },
      {
        examples:
          'ba**ck** (bak), s**ch**ool (skool), **k**ing (king), **c**at (kat), uni**que** (yooneek), o**cc**ur (aker)',
        phoneme: 'K',
      },
      {
        examples: 'bi**g** (big), **gu**ess (ges), bi**gg**er (biger), **gh**ost (gohst)',
        phoneme: 'G',
      },
    ],
  },
  {
    name: 'Fricatives',
    sounds: [
      {
        examples: 'o**ff** (awf), **ph**one (fohn), **f**at (fat), lau**gh** (laf)',
        phoneme: 'F',
      },
      { examples: '**v**an (van)', phoneme: 'V' },
      { examples: '**th**ink (thingk)', phoneme: 'TH' },
      { examples: '**th**e (dha)', phoneme: 'DH' },
      {
        examples: 'mi**ss** (mis), **s**ame (saym), **c**ity (sitee), **sc**ene (seen)',
        phoneme: 'S',
      },
      { examples: 'i**s** (iz), bu**zz** (buhz), **z**oo (zoo)', phoneme: 'Z' },
      {
        examples:
          '**sh**e (shee), spe**ci**al (speshal), atten**ti**on (atenshan), mi**ssi**on (mishan), **su**gar (shuger), o**ce**an (ohshan)',
        phoneme: 'SH',
      },
      { examples: 'vi**s**ion (vizhan), mea**s**ure (mezher), bei**ge** (bayzh)', phoneme: 'ZH' },
      { examples: '**h**ave (hav), w**h**o (hoo)', phoneme: 'HH' },
    ],
  },
  {
    name: 'Affricates',
    sounds: [
      {
        examples:
          'mu**ch** (muhch), wa**tch** (woch), ques**ti**on (kweschan), na**t**ure (naycher)',
        phoneme: 'CH',
      },
      {
        examples: '**j**ust (juhst), a**g**ent (ayjant), e**dge** (ej), a**dj**ust (ajuhst)',
        phoneme: 'JH',
      },
    ],
  },
  {
    name: 'Nasals',
    sounds: [
      {
        examples: '**m**an (man), da**mn** (dam), su**mm**er (suhmer), bo**mb** (bom)',
        phoneme: 'M',
      },
      {
        examples: 'di**nn**er (diner), **kn**ife (naif), pe**n** (pen), **gn**at (nat)',
        phoneme: 'N',
      },
      { examples: 'thi**n**k (thingk), thi**ng** (thing)', phoneme: 'NG' },
    ],
  },
  {
    name: 'Liquids & Glides',
    sounds: [
      { examples: 'we**ll** (wel), **l**et (let), wa**l**k (wawk)', phoneme: 'L' },
      {
        examples: '**r**ight (rait), **wr**ong (rawng), ca**rr**y (karree), **rh**yme (raim)',
        phoneme: 'R',
      },
      {
        examples: '**wh**at (wuht), **o**ne (wuhn), **w**et (wet), lang**u**age (langgwaj)',
        phoneme: 'W',
      },
      { examples: '**y**es (yes), mill**i**on (milyan), c**u**te (kyoot)', phoneme: 'Y' },
    ],
  },
];
