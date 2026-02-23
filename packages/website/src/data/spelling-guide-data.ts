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
// Example pattern: first example should have same spelling in English and Ingglish,
// subsequent examples show different English letter patterns for the same sound.
// e.g., OY: toil (oi→oi), boy (oy→oi). Fewer examples ok if English has limited patterns.
export const vowelGroups: SoundGroup[] = [
  {
    name: 'Short Vowels',
    sounds: [
      {
        examples: 'b**a**d (bad), pl**ai**d (plad), l**au**gh (laf), s**al**mon (saman)',
        phoneme: 'AE',
      },
      {
        examples:
          'b**e**d (bed), s**ai**d (sed), h**ea**d (hed), fr**ie**nd (frend), **a**ny (enee)',
        phoneme: 'EH',
      },
      {
        examples:
          'b**i**t (bit), g**y**m (jim), b**ui**ld (bild), pr**e**tty (pritee), b**u**sy (bizee)',
        phoneme: 'IH',
      },
      { examples: 'h**o**t (hot), w**a**tch (woch)', phoneme: 'AA' },
      {
        examples: 'b**oo**k (buk), p**u**t (put), w**o**lf (wulf), c**ou**ld (kud)',
        phoneme: 'UH',
      },
      {
        examples:
          'l**aw** (law), d**o**g (dawg), th**ough**t (thawt), c**augh**t (kawt), w**al**k (wawk), s**au**ce (saws)',
        phoneme: 'AO',
      },
      {
        examples: 'b**u**t (buht), l**o**ve (luhv), bl**oo**d (bluhd), d**ou**ble (duhbal)',
        phoneme: 'AH',
      },
      {
        examples:
          '**a**bout (about), **u**pon (apon), penc**i**l (pensal), lem**o**n (leman), op**e**n (ohpan)',
        phoneme: 'AH0',
      },
    ],
  },
  {
    name: 'Long Vowels & Diphthongs',
    sounds: [
      {
        examples:
          's**ee** (see), m**e** (mee), f**ie**ld (feeld), happ**y** (hapee), b**ea**ch (beech), k**ey** (kee), p**eo**ple (peepal), sk**i** (skee), c**ei**ling (seeling)',
        phoneme: 'IY',
      },
      {
        examples:
          't**oo** (too), bl**ue** (bloo), d**o** (doo), y**ou** (yoo), thr**ough** (throo), n**ew** (noo), sh**oe** (shoo), fr**ui**t (froot), r**u**le (rool), n**eu**tral (nootral)',
        phoneme: 'UW',
      },
      {
        examples:
          'd**ay** (day), c**a**ke (kayk), w**eigh** (way), r**ai**n (rayn), th**ey** (dhay), gr**ea**t (grayt), str**aigh**t (strayt)',
        phoneme: 'EY',
      },
      {
        examples:
          'bons**ai** (bonsai), l**i**fe (laif), m**y** (mai), b**uy** (bai), h**igh** (hai), t**ie** (tai), g**ui**de (gaid), r**ye** (rai)',
        phoneme: 'AY',
      },
      { examples: '**oi**l (oil), b**oy** (boi)', phoneme: 'OY' },
      {
        examples:
          '**oh** (oh), n**o**se (nohz), sh**ow** (shoh), s**ew** (soh), b**oa**t (boht), g**o** (goh), t**oe** (toh), plat**eau** (platoh), d**ough** (doh)',
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
          '**air** (air), c**are** (kair), th**ere** (dhair), b**ear** (bair), th**eir** (dhair), ch**err**y (chairee)',
        ingglishOverride: 'air',
        ipaOverride: 'ɛɹ',
        phoneme: 'EH+R',
      },
      {
        examples:
          'b**eer** (beer), b**ear**d (beerd), h**ere** (heer), p**ier** (peer), w**eir**d (weerd)',
        ingglishOverride: 'eer',
        ipaOverride: 'ɪɹ',
        phoneme: 'IH+R',
      },
      {
        examples: 'st**ar** (star), he**ar**t (hart), gu**ar**d (gard)',
        ingglishOverride: 'ar',
        ipaOverride: 'ɑɹ',
        phoneme: 'AA+R',
      },
      {
        examples: 'l**ure** (lur), d**ur**ing (during), n**eur**al (nural)',
        ingglishOverride: 'ur',
        ipaOverride: 'ʊɹ',
        note: 'same as u + r',
        phoneme: 'UH+R',
      },
      {
        examples:
          'f**or** (for), w**ar** (wor), d**oor** (dor), m**ore** (mor), p**our** (por), b**oar**d (bord)',
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
          'h**er** (her), b**ir**d (berd), w**or**m (werm), t**ur**n (tern), l**ear**n (lern), doll**ar** (doler)',
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
      { examples: '**p**at (pat), ha**pp**y (hapee)', phoneme: 'P' },
      { examples: '**b**at (bat), ra**bb**it (rabat)', phoneme: 'B' },
      {
        examples: '**t**op (top), be**tt**er (beter), walk**ed** (wawkt), dou**bt** (dout)',
        phoneme: 'T',
      },
      { examples: 'be**d** (bed), la**dd**er (lader), play**ed** (playd)', phoneme: 'D' },
      {
        examples:
          '**k**ing (king), ba**ck** (bak), **c**at (kat), s**ch**ool (skool), a**cc**ord (akord), uni**que** (yooneek)',
        phoneme: 'K',
      },
      {
        examples: 'bi**g** (big), **gh**ost (gohst), bi**gg**er (biger), **gu**ess (ges)',
        phoneme: 'G',
      },
    ],
  },
  {
    name: 'Fricatives',
    sounds: [
      {
        examples: '**f**at (fat), o**ff** (awf), lau**gh** (laf), **ph**one (fohn)',
        phoneme: 'F',
      },
      { examples: '**v**an (van)', phoneme: 'V' },
      { examples: '**th**ink (thingk)', phoneme: 'TH' },
      { examples: '**th**e (dha)', phoneme: 'DH' },
      {
        examples: '**s**at (sat), mi**ss** (mis), **c**ity (sitee), **sc**ene (seen)',
        phoneme: 'S',
      },
      { examples: '**z**oo (zoo), bu**zz** (buhz), i**s** (iz)', phoneme: 'Z' },
      {
        examples:
          '**sh**e (shee), na**ti**on (nayshan), spe**ci**al (speshal), o**ce**an (ohshan), mi**ssi**on (mishan), **su**gar (shuger)',
        phoneme: 'SH',
      },
      { examples: 'mea**s**ure (mezher), vi**s**ion (vizhan), bei**ge** (bayzh)', phoneme: 'ZH' },
      { examples: '**h**at (hat), w**h**o (hoo)', phoneme: 'HH' },
    ],
  },
  {
    name: 'Affricates',
    sounds: [
      {
        examples:
          '**ch**at (chat), ba**tch** (bach), na**t**ure (naycher), ques**ti**on (kweschan)',
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
        examples: '**m**an (man), ha**mm**er (hamer), co**mb** (kohm), hy**mn** (him)',
        phoneme: 'M',
      },
      {
        examples: 'pe**n** (pen), di**nn**er (diner), **kn**ife (naif), **gn**at (nat)',
        phoneme: 'N',
      },
      { examples: 'si**ng** (sing), thi**n**k (thingk), to**ngue** (tuhng)', phoneme: 'NG' },
    ],
  },
  {
    name: 'Liquids & Glides',
    sounds: [
      { examples: '**l**et (let), be**ll** (bel), wa**l**k (wawk)', phoneme: 'L' },
      {
        examples: '**r**un (ruhn), ca**rr**y (karree), **wr**ite (rait), **rh**yme (raim)',
        phoneme: 'R',
      },
      {
        examples: '**w**et (wet), **wh**at (wuht), **o**ne (wuhn), peng**u**in (penggwan)',
        phoneme: 'W',
      },
      { examples: '**y**es (yes), c**u**te (kyoot), mill**i**on (milyan)', phoneme: 'Y' },
    ],
  },
];
