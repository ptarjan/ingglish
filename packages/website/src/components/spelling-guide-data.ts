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
// Example pattern: first example should have same spelling in English and Ingglish,
// subsequent examples show different English letter patterns for the same sound.
// e.g., OY: toil (oi→oi), boy (oy→oi). Fewer examples ok if English has limited patterns.
export const vowelGroups: SoundGroup[] = [
  {
    name: 'Short Vowels',
    sounds: [
      { phoneme: 'AE', examples: 'b**a**d (bad), pl**ai**d (plad), s**al**mon (samun)' },
      {
        phoneme: 'EH',
        examples:
          'b**e**d (bed), s**ai**d (sed), h**ea**d (hed), fr**ie**nd (frend), **a**ny (enee)',
      },
      {
        phoneme: 'IH',
        examples:
          'b**i**t (bit), g**y**m (jim), b**u**ild (bild), pr**e**tty (pritee), b**u**sy (bizee)',
      },
      { phoneme: 'AA', examples: 'h**o**t (hot), w**a**tch (woch), f**a**ther (fodher)' },
      {
        phoneme: 'AH',
        examples: 'b**u**t (but), l**o**ve (luv), bl**oo**d (blud), d**ou**ble (dubul)',
      },
    ],
  },
  {
    name: 'Long Vowels',
    sounds: [
      {
        phoneme: 'EY',
        examples:
          'd**ay** (day), c**a**ke (kayk), w**ei**gh (way), r**ai**n (rayn), th**ey** (dhay)',
      },
      {
        phoneme: 'IY',
        examples:
          's**ee** (see), f**ie**ld (feeld), happ**y** (hapee), b**ea**ch (beech), k**ey** (kee)',
      },
      {
        phoneme: 'AY',
        examples:
          'bons**ai** (bonsai), l**i**fe (laif), b**uy** (bai), h**igh** (hai), t**ie** (tai)',
      },
      {
        phoneme: 'OW',
        examples: '**oh** (oh), n**o**se (nohz), s**ew** (soh), b**oa**t (boht), g**o** (goh)',
      },
      {
        phoneme: 'UW',
        examples:
          't**oo** (tuu), bl**ue** (bluu), thr**ough** (thruu), n**ew** (nuu), sh**oe** (shuu)',
      },
    ],
  },
  {
    name: 'Diphthongs & Other',
    sounds: [
      { phoneme: 'AW', examples: '**ou**t (out), n**ow** (nou), h**ow** (hou)' },
      { phoneme: 'OY', examples: 't**oi**l (toil), b**oy** (boi), t**oy** (toi)' },
      {
        phoneme: 'AO',
        examples:
          'l**aw** (law), th**ough**t (thawt), c**augh**t (kawt), w**al**k (wawk), s**au**ce (saws)',
      },
      {
        phoneme: 'UH',
        examples: 'b**oo**k (book), p**u**t (poot), w**o**lf (woolf), c**ou**ld (kood)',
      },
      { phoneme: 'AH0', examples: '**u**pon (upon), **a**bout (ubout), banan**a** (bunanu)' },
    ],
  },
  {
    name: 'R-Colored Vowels',
    sounds: [
      {
        phoneme: 'AE+R',
        examples: '**arr**ow (arroh), b**arr**ow (barroh), c**arr**ot (karrut)',
        ipaOverride: 'æɹ',
        ingglishOverride: 'arr',
      },
      {
        phoneme: 'EH+R',
        examples:
          '**air** (air), c**are** (kair), th**ere** (dhair), b**ear** (bair), th**eir** (dhair)',
        ipaOverride: 'ɛɹ',
        ingglishOverride: 'air',
      },
      {
        phoneme: 'IH+R',
        examples:
          'b**eer** (beer), b**ear**d (beerd), f**ear** (feer), h**ere** (heer), p**ier** (peer)',
        ipaOverride: 'ɪɹ',
        ingglishOverride: 'eer',
      },
      {
        phoneme: 'AA+R',
        examples: 'st**ar** (star), he**ar**t (hart), gu**ar**d (gard)',
        ipaOverride: 'ɑɹ',
        ingglishOverride: 'ar',
      },
      {
        phoneme: 'AO+R',
        examples: 'f**or** (for), w**ar** (wor), d**oor** (dor)',
        ipaOverride: 'ɔɹ',
        ingglishOverride: 'or',
      },
      {
        phoneme: 'ER',
        examples:
          'h**er** (her), b**ir**d (berd), w**or**m (werm), t**ur**n (tern), l**ear**n (lern)',
      },
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
      { phoneme: 'T', examples: '**t**op (top), be**tt**er (beter), walk**ed** (wawkt)' },
      { phoneme: 'D', examples: 'be**d** (bed), la**dd**er (lader), play**ed** (playd)' },
      {
        phoneme: 'K',
        examples: '**k**ing (king), ba**ck** (bak), **c**at (kat), s**ch**ool (skuul)',
      },
      { phoneme: 'G', examples: 'bi**g** (big), **g**o (goh), **gh**ost (gohst)' },
    ],
  },
  {
    name: 'Fricatives',
    sounds: [
      {
        phoneme: 'F',
        examples: '**f**at (fat), a**f**ter (after), lau**gh** (laf), **ph**one (fohn)',
      },
      { phoneme: 'V', examples: '**v**an (van), o**v**er (ohver), lo**v**e (luv)' },
      { phoneme: 'TH', examples: 'ba**th** (bath), **th**ink (thingk), no**th**ing (nuthing)' },
      { phoneme: 'DH', examples: '**th**e (dhu), fa**th**er (fodher), smoo**th** (smuudh)' },
      {
        phoneme: 'S',
        examples: '**s**at (sat), mi**ss** (mis), **c**ity (sitee), **sc**ene (seen)',
      },
      { phoneme: 'Z', examples: '**z**oo (zuu), bu**zz** (buz), i**s** (iz)' },
      {
        phoneme: 'SH',
        examples:
          '**sh**e (shee), na**ti**on (nayshun), o**ce**an (ohshun), mi**ssi**on (mishun), **su**gar (shooger)',
      },
      { phoneme: 'ZH', examples: 'mea**s**ure (mezher), vi**s**ion (vizhun), bei**ge** (beyzh)' },
      { phoneme: 'HH', examples: '**h**at (hat), a**h**ead (uhed), w**h**o (huu)' },
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
      {
        phoneme: 'M',
        examples: '**m**an (man), ha**mm**er (hamer), co**mb** (kohm), hy**mn** (him)',
      },
      { phoneme: 'N', examples: 'pe**n** (pen), **n**o (noh), k**n**ife (naif), **gn**at (nat)' },
      { phoneme: 'NG', examples: 'si**ng** (sing), thi**n**k (thingk), to**ngue** (tung)' },
    ],
  },
  {
    name: 'Liquids & Glides',
    sounds: [
      { phoneme: 'L', examples: '**l**et (let), be**ll** (bel), wa**l**k (wawk)' },
      { phoneme: 'R', examples: '**r**un (run), ca**rr**y (karree), w**r**ite (rait)' },
      { phoneme: 'W', examples: '**w**et (wet), a**w**ay (uwey), **wh**at (wut)' },
      { phoneme: 'Y', examples: '**y**es (yes), be**y**ond (beeyond), c**u**te (kyuut)' },
    ],
  },
];
