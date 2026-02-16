/**
 * NRL/Elovitz letter-to-sound rules for grapheme-to-phoneme conversion.
 *
 * Based on: Elovitz, H., Johnson, R., McHugh, A., and Shore, J. (1976)
 * "Automatic translation of English text to phonetics by means of
 * letter-to-sound rules." NRL Report 7948.
 *
 * 329 context-sensitive rules that examine left and right letter context
 * to determine pronunciation. Each rule has the form:
 *
 *   leftContext[TARGET]rightContext=/PHONEMES/
 *
 * Special context symbols:
 *   #  = 1+ vowels (AEIOUY)
 *   .  = voiced consonant (BDVGJLMNRWZ)
 *   %  = suffix (ER, E, ES, ED, ING, ELY)
 *   &  = sibilant (S, C, G, Z, X, J, CH, SH)
 *   @  = non-palate consonant (T, S, R, D, L, Z, N, J, TH, CH, SH)
 *   ^  = single consonant
 *   +  = front vowel (E, I, Y)
 *   :  = 0+ consonants
 *   ' '= word boundary (space)
 */

import { arpabetToFormat } from '@ingglish/phonemes';
import { applyStressPrediction } from './stress';
import type { OutputFormat } from '@ingglish/phonemes';

// ---------------------------------------------------------------------------
// NRL rules — grouped by first letter of the target
// ---------------------------------------------------------------------------

const NRL_RULES: Record<string, string[]> = {
  A: [
    '[A] =/AX/',
    ' [ARE] =/AA R/',
    ' [AR]O=/AX R/',
    '[AR]#=/EH R/',
    ' ^[AS]#=/EY S/',
    '[A]WA=/AX/',
    '[AW]=/AO/',
    ' :[ANY]=/EH N IY/',
    '[A]^+#=/EY/',
    '#:[ALLY]=/AX L IY/',
    ' [AL]#=/AX L/',
    '[AGAIN]=/AX G EH N/',
    '#:[AG]E=/IH JH/',
    '[A]^+:#=/AE/',
    ' :[A]^+ =/EY/',
    '[A]^%=/EY/',
    ' [ARR]=/AX R/',
    '[ARR]=/AE R/',
    ' :[AR] =/AA R/',
    '[AR] =/ER/',
    '[AR]=/AA R/',
    '[AIR]=/EH R/',
    '[AI]=/EY/',
    '[AY]=/EY/',
    '[AU]=/AO/',
    '#:[AL] =/AX L/',
    '#:[ALS] =/AX L Z/',
    '[ALK]=/AO K/',
    '[AL]^=/AO L/',
    ' :[ABLE]=/EY B AX L/',
    '[ABLE]=/AX B AX L/',
    '[ANG]+=/EY N JH/',
    // Custom: -ance suffix with schwa (performance, distance)
    '#:[ANCE] =/AX N S/',
    // Custom: AA digraph (aardvark, baal, kraal)
    '[AA]=/AA/',
    '[A]=/AE/',
  ],
  B: [
    ' [BE]^#=/B IH/',
    '[BEING]=/B IY IH NX/',
    ' [BOTH] =/B OW TH/',
    ' [BUS]#=/B IH Z/',
    '[BUIL]=/B IH L/',
    // Custom: silent b in bt (debt, doubt, subtle)
    '[BT]=/T/',
    // Custom: collapse doubled BB
    '[BB]=/B/',
    '[B]=/B/',
  ],
  C: [
    ' [CH]^=/K/',
    '^E[CH]=/K/',
    '[CH]=/CH/',
    ' S[CI]#=/S AY/',
    '[CI]A=/SH/',
    '[CI]O=/SH/',
    '[CI]EN=/SH/',
    '[C]+=/S/',
    '[CK]=/K/',
    // Custom: CQU → K W to prevent double K from C + QU (acquire, acquaint)
    '[CQU]=/K W/',
    '[COM]%=/K AH M/',
    // Custom: CC before front vowel → /ks/ (accent, accept, accident)
    '[CC]+=/K S/',
    // Custom: collapse doubled CC (account, accommodate)
    '[CC]=/K/',
    '[C]=/K/',
  ],
  D: [
    '#:[DED] =/D IH D/',
    '.E[D] =/D/',
    '#^:E[D] =/T/',
    ' [DE]^#=/D IH/',
    ' [DO] =/D UW/',
    ' [DOES]=/D AH Z/',
    ' [DOING]=/D UW IH NX/',
    ' [DOW]=/D AW/',
    '[DU]A=/JH UW/',
    // Custom: DGE trigraph (badge, bridge, edge)
    '[DGE]=/JH/',
    // Custom: collapse doubled DD
    '[DD]=/D/',
    '[D]=/D/',
  ],
  E: [
    '#:[E] =/ /',
    "' ^:[E] =/ /",
    ' :[E] =/IY/',
    '#[ED] =/D/',
    '#:[E]D =/ /',
    '[EV]ER=/EH V/',
    '[E]^%=/IY/',
    '[ERI]#=/IY R IY/',
    '[ERI]=/EH R IH/',
    // Custom: ERR consumes double-R to prevent phoneme doubling (error, terrace)
    '[ERR]=/EH R/',
    '#:[ER]#=/ER/',
    '[ER]#=/EH R/',
    '[ER]=/ER/',
    ' [EVEN]=/IY V EH N/',
    '#:[E]W=/ /',
    '@[EW]=/UW/',
    '[EW]=/Y UW/',
    '[E]O=/IY/',
    '#:&[ES] =/IH Z/',
    '#:[E]S =/ /',
    '#:[ELY] =/L IY/',
    '#:[EMENT]=/M EH N T/',
    // Custom: -eful suffix with schwa (careful, hopeful, graceful)
    '#:[EFUL] =/F AX L/',
    '[EFUL]=/F UH L/',
    '[EE]=/IY/',
    '[EARN]=/ER N/',
    ' [EAR]^=/ER/',
    '[EAD]=/EH D/',
    '#:[EA] =/IY AX/',
    '[EA]SU=/EH/',
    '[EA]=/IY/',
    '[EIGH]=/EY/',
    '[EI]=/IY/',
    ' [EYE]=/AY/',
    '[EY]=/IY/',
    '[EU]=/Y UW/',
    // Custom: -ence suffix with schwa (difference, conference)
    '#:[ENCE] =/AX N S/',
    // Custom: -ield → E is part of IE digraph, silent (field, shield, yield)
    'I[ELD]=/L D/',
    'I[ELS] =/L Z/',
    'I[EL] =/L/',
    // Custom: -ens suffix with schwa (chickens, gardens, kittens)
    '#:[ENS] =/AX N Z/',
    // Custom: -en suffix with schwa (golden, fallen, chosen, open)
    '#:[EN] =/AX N/',
    // Custom: -el suffix with schwa (model, chapel, novel, angel)
    '#:[EL] =/AX L/',
    // Custom: -est superlative with schwa (highest, lowest, fastest)
    '#:[EST] =/AX S T/',
    '[E]=/EH/',
  ],
  F: [
    // Custom: -ful suffix with schwa (beautiful, wonderful)
    '#:[FUL] =/F AX L/',
    '[FUL]=/F UH L/',
    '[FF]=/F/',
    '[F]=/F/',
  ],
  G: [
    '[GIV]=/G IH V/',
    // Custom: silent g before n at word start (gnat, gnome, gnu)
    ' [GN]=/N/',
    ' [G]I^=/G/',
    '[GE]T=/G EH/',
    'SU[GGES]=/G JH EH S/',
    '[GG]=/G/',
    ' B#[G]=/G/',
    '[G]+=/JH/',
    '[GREAT]=/G R EY T/',
    '#[GH]=/ /',
    '[G]=/G/',
  ],
  H: [
    ' [HAV]=/HH AE V/',
    ' [HERE]=/HH IY R/',
    ' [HOUR]=/AW ER/',
    '[HOW]=/HH AW/',
    '[H]#=/HH/',
    '[H]=/ /',
  ],
  I: [
    ' [IN]=/IH N/',
    ' [I] =/AY/',
    '[IN]D=/AY N/',
    '[IER]=/IY ER/',
    '#:R[IED] =/IY D/',
    '[IED] =/AY D/',
    '[IEN]=/IY EH N/',
    '[IE]T=/AY EH/',
    ' :[I]%=/AY/',
    '[I]%=/IY/',
    '[IE]=/IY/',
    // Custom: multi-char targets must come before single-char [I] rules
    // Custom: Latin suffixes -ian, -ium, -ia, -io (media, stadium, radio)
    '[IAN] =/IY AX N/',
    '[IUM] =/IY AX M/',
    '[IA] =/IY AX/',
    '[IO] =/IY OW/',
    // Custom: -ify → schwa + F AY (modify, qualify, simplify)
    '[IFY]=/AX F AY/',
    // Custom: -ity suffix with schwa (city, quality, majority)
    '[ITY] =/AX T IY/',
    // Custom: -ible suffix with schwa (possible, terrible)
    '[IBLE]=/AX B AX L/',
    // Custom: -ious suffix (curious, previous, serious)
    '[IOUS]=/IY AX S/',
    '[I]^+:#=/IH/',
    // Custom: IRR consumes double-R to prevent phoneme doubling (mirror, stirring)
    '[IRR]=/ER/',
    '[IR]#=/AY R/',
    '[IZ]%=/AY Z/',
    '[IS]%=/AY Z/',
    '[I]D%=/AY/',
    '+^[I]^+=/IH/',
    '[I]T%=/AY/',
    '#^:[I]^+=/IH/',
    '[I]^+=/AY/',
    '[IR]=/ER/',
    '[IGH]=/AY/',
    '[ILD]=/AY L D/',
    '[IGN] =/AY N/',
    '[IGN]^=/AY N/',
    '[IGN]%=/AY N/',
    '[IQUE]=/IY K/',
    // Custom: word-final I → IY (taxi, sushi, bikini)
    '^[I] =/IY/',
    '[I]=/IH/',
  ],
  J: ['[J]=/JH/'],
  K: [' [K]N=/ /', '[KK]=/K/', '[K]=/K/'],
  L: [
    '[LO]C#=/L OW/',
    'L[L]=/ /',
    // Custom: -less must come before L% to prevent schwa insertion
    '#:[LESS] =/L AX S/',
    // Custom: -ling must come before L% to prevent schwa insertion
    '[LING]=/L IH NX/',
    '#^:[L]%=/AX L/',
    '[LEAD]=/L IY D/',
    '[L]=/L/',
  ],
  M: [
    // Custom: Mc- prefix in names (McAdam, McAllister, McCain) → M-schwa-K
    ' [MCC]=/M AX K/',
    ' [MC]=/M AX K/',
    '[MOV]=/M UW V/',
    // Custom: silent b after m at word end (lamb, climb, bomb, dumb)
    '[MB] =/M/',
    // Custom: silent n after m at word end (hymn, autumn, column)
    '[MN] =/M/',
    // Custom: -ments plural (moments, departments)
    '#:[MENTS] =/M AX N T S/',
    // Custom: -ment suffix with schwa (moment, department)
    '#:[MENT] =/M AX N T/',
    // Custom: -man suffix with schwa (fireman, policeman)
    '#:[MAN] =/M AX N/',
    // Custom: -men suffix with schwa (firemen, policemen)
    '#:[MEN] =/M AX N/',
    // Custom: collapse doubled MM
    '[MM]=/M/',
    '[M]=/M/',
  ],
  N: [
    'E[NG]+=/N JH/',
    '[NG]R=/NX G/',
    '[NG]#=/NX G/',
    '[NGL]%=/NX G AX L/',
    '[NG]=/NX/',
    '[NK]=/NX K/',
    ' [NOW] =/N AW/',
    // Custom: -ness suffix with schwa (darkness, kindness)
    '#:[NESS] =/N AX S/',
    // Custom: collapse doubled NN
    '[NN]=/N/',
    '[N]=/N/',
  ],
  O: [
    '[OF] =/AX V/',
    '[OROUGH]=/ER OW/',
    // Custom: -ory suffix (history, story, category) — must be before #:[OR]
    '#:[ORY] =/ER IY/',
    '#:[OR] =/ER/',
    '#:[ORS] =/ER Z/',
    // Custom: ORR consumes double-R to prevent phoneme doubling (correct, corridor)
    '[ORR]=/AO R/',
    '[OR]=/AO R/',
    ' [ONE]=/W AH N/',
    '[OW]=/OW/',
    ' [OVER]=/OW V ER/',
    '[OV]=/AH V/',
    '[O]^%=/OW/',
    '[O]^EN=/OW/',
    '[O]^I#=/OW/',
    // Custom: OLK with silent L (folk, yolk)
    '[OLK]=/OW K/',
    // Custom: OLT as long O (bolt, colt, jolt)
    '[OL]T=/OW L/',
    '[OL]D=/OW L/',
    '[OUGHT]=/AO T/',
    '[OUGH]=/AH F/',
    ' [OU]=/AW/',
    'H[OU]S#=/AW/',
    '[OUS]=/AX S/',
    '[OUR]=/AO R/',
    '[OULD]=/UH D/',
    '^[OU]^L=/AH/',
    '[OUP]=/UW P/',
    '[OU]=/AW/',
    '[OY]=/OY/',
    '[OING]=/OW IH NX/',
    '[OI]=/OY/',
    '[OOR]=/AO R/',
    '[OOK]=/UH K/',
    '[OOD]=/UH D/',
    '[OO]=/UW/',
    '[O]E=/OW/',
    '[O] =/OW/',
    '[OA]=/OW/',
    ' [ONLY]=/OW N L IY/',
    ' [ONCE]=/W AH N S/',
    "[ON ' T]=/OW N T/",
    'C[O]N=/AA/',
    '[O]NG=/AO/',
    ' ^:[O]N=/AH/',
    'I[ON]=/AX N/',
    '#:[ON] =/AX N/',
    '#^[ON]=/AX N/',
    '[O]ST =/OW/',
    // Custom: OFF consumes all 3 chars to prevent double-F (off, offer, office)
    '[OFF]=/AO F/',
    '[OF]^=/AO F/',
    '[OTHER]=/AH DH ER/',
    '[OSS] =/AO S/',
    '#^:[OM]=/AH M/',
    // Custom: open-syllable O before consonant+vowel (sofa, robot, bonus, focus, yoga)
    '[O]^A=/OW/',
    '[O]^O=/OW/',
    '[O]^U=/OW/',
    '[O]=/AA/',
  ],
  P: [
    '[PH]=/F/',
    '[PEOP]=/P IY P/',
    '[POW]=/P AW/',
    '[PUT] =/P UH T/',
    // Custom: silent p before s at word start (psalm, psychology)
    ' [PS]=/S/',
    // Custom: silent p before n at word start (pneumonia, pneumatic)
    ' [PN]=/N/',
    // Custom: collapse doubled PP
    '[PP]=/P/',
    '[P]=/P/',
  ],
  Q: ['[QUAR]=/K W AO R/', '[QU]=/K W/', '[Q]=/K/'],
  R: [
    ' [RE]^#=/R IY/',
    // Custom: rh → R (rhyme, rhythm, rhino)
    '[RH]=/R/',
    // Custom: collapse doubled RR
    '[RR]=/R/',
    '[R]=/R/',
  ],
  S: [
    '[SH]=/SH/',
    '#[SION]=/ZH AX N/',
    '[SOME]=/S AH M/',
    '#[SUR]#=/ZH ER/',
    '[SUR]#=/SH ER/',
    '#[SU]#=/ZH UW/',
    '#[SSU]#=/SH UW/',
    '#[SED] =/Z D/',
    '#[S]#=/Z/',
    '[SAID]=/S EH D/',
    '^[SION]=/SH AX N/',
    '[S]S=/ /',
    '.[S] =/Z/',
    '#:.E[S] =/Z/',
    '#^:##[S] =/Z/',
    '#^:#[S] =/S/',
    'U[S] =/S/',
    ' :#[S] =/Z/',
    // Custom: SCH → /ʃ/ (schafer, schmidt, school — most SCH words are German)
    ' [SCH]=/SH/',
    '[S]C+=/ /',
    '#[SM]=/Z M/',
    "#[SN] '=/Z AX N/",
    // Custom: silent T in -stle (castle, whistle, bristle)
    '[STLE]=/S AX L/',
    // Custom: silent T in -sten (listen, fasten, glisten)
    '#:[STEN]=/S AX N/',
    // Custom: -son suffix with schwa (johnson, wilson, anderson)
    '#:[SON] =/S AX N/',
    '[S]=/S/',
  ],
  T: [
    ' [THE] =/DH AX/',
    '[TO] =/T UW/',
    '[THAT] =/DH AE T/',
    ' [THIS] =/DH IH S/',
    ' [THEY]=/DH EY/',
    ' [THERE]=/DH EH R/',
    '[THER]=/DH ER/',
    '[THEIR]=/DH EH R/',
    ' [THAN] =/DH AE N/',
    ' [THEM] =/DH EH M/',
    '[THESE] =/DH IY Z/',
    ' [THEN]=/DH EH N/',
    '[THROUGH]=/TH R UW/',
    '[THOSE]=/DH OW Z/',
    '[THOUGH] =/DH OW/',
    ' [THUS]=/DH AH S/',
    '[TH]=/TH/',
    '#:[TED] =/T IH D/',
    'S[TI]#N=/CH/',
    '[TI]O=/SH/',
    '[TI]A=/SH/',
    '[TIEN]=/SH AX N/',
    '[TUR]#=/CH ER/',
    '[TU]A=/CH UW/',
    ' [TWO]=/T UW/',
    // Custom: TCH trigraph (match, catch, watch)
    '[TCH]=/CH/',
    // Custom: collapse doubled TT
    '[TT]=/T/',
    '[T]=/T/',
  ],
  U: [
    ' [UN]I=/Y UW N/',
    ' [UN]=/AH N/',
    ' [UPON]=/AX P AO N/',
    // Custom: URR consumes double-R to prevent phoneme doubling (current, hurry)
    '[URR]=/ER/',
    '@[UR]#=/UH R/',
    '[UR]#=/Y UH R/',
    '[UR]=/ER/',
    '[U]^ =/AH/',
    '[U]^^=/AH/',
    '[UY]=/AY/',
    ' G[U]#=/ /',
    'G[U]%=/ /',
    'G[U]#=/W/',
    '#N[U]=/Y UW/',
    // Custom: -ular suffix (popular, regular, cellular)
    '[ULAR]=/Y AX L ER/',
    '@[U]=/UW/',
    '[U]=/Y UW/',
  ],
  V: ['[VIEW]=/V Y UW/', '[V]=/V/'],
  W: [
    ' [WERE]=/W ER/',
    '[WA]S=/W AA/',
    '[WA]T=/W AA/',
    '[WHERE]=/WH EH R/',
    '[WHAT]=/WH AA T/',
    '[WHOL]=/HH OW L/',
    '[WHO]=/HH UW/',
    '[WH]=/WH/',
    // Custom: -ward suffix (forward, backward, awkward)
    '#:[WARD] =/W ER D/',
    '[WAR]=/W AO R/',
    '[WOR]^=/W ER/',
    '[WR]=/R/',
    '[W]=/W/',
  ],
  X: ['[X]=/K S/'],
  Y: [
    '[YOUNG]=/Y AH NX/',
    ' [YOU]=/Y UW/',
    ' [YES]=/Y EH S/',
    ' [Y]=/Y/',
    '#^:[Y] =/IY/',
    '#^:[Y]I=/IY/',
    ' :[Y] =/AY/',
    ' :[Y]#=/AY/',
    ' :[Y]^+:#=/IH/',
    ' :[Y]^#=/AY/',
    '[Y]=/IH/',
  ],
  Z: [
    // Custom: collapse doubled ZZ
    '[ZZ]=/Z/',
    '[Z]=/Z/',
  ],
};

// ---------------------------------------------------------------------------
// Character class expansions (NRL special symbols → regex fragments)
// ---------------------------------------------------------------------------

const VOWELS = 'AEIOUY';
const CONSONANTS = 'BCDFGHJKLMNPQRSTVWXZ';

const CLASSES: Record<string, string> = {
  '#': `[${VOWELS}]+`,
  '.': '[BDVGJLMNRWZ]',
  '%': '(?:ER|E|ES|ED|ING|ELY)',
  '&': '(?:S|C|G|Z|X|J|CH|SH)',
  '@': '(?:T|S|R|D|L|Z|N|J|TH|CH|SH)',
  '^': `[${CONSONANTS}]`,
  '+': '[EIY]',
  ':': `[${CONSONANTS}]*`,
};

const SPECIAL_CHARS = new Set(Object.keys(CLASSES));

// ---------------------------------------------------------------------------
// NRL phoneme → ARPAbet mapping
// ---------------------------------------------------------------------------

// NRL vowels get stress markers. AX (schwa) → AH0, others → stress 1.
const NRL_VOWELS = new Set([
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
]);

function nrlToArpabet(phoneme: string): string {
  if (phoneme === 'AX') {
    return 'AH0';
  }
  if (phoneme === 'NX') {
    return 'NG';
  }
  if (phoneme === 'WH') {
    return 'W';
  }
  if (NRL_VOWELS.has(phoneme)) {
    return phoneme + '1';
  }
  return phoneme;
}

// ---------------------------------------------------------------------------
// Compiled rule structure
// ---------------------------------------------------------------------------

interface CompiledRule {
  leftRe: RegExp;
  rightRe: RegExp;
  targetLen: number;
  phonemes: string[]; // ARPAbet phonemes (empty array for silence)
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Expand NRL context symbols into regex fragments. */
function expandContext(ctx: string): string {
  let result = '';
  for (const ch of ctx) {
    if (SPECIAL_CHARS.has(ch)) {
      result += CLASSES[ch];
    } else {
      result += escapeRegex(ch);
    }
  }
  return result;
}

/** Parse a single NRL rule string into a compiled rule. */
function compileRule(ruleStr: string): CompiledRule | null {
  // Format: leftContext[TARGET]rightContext=/PHONEMES/
  const m = /^([^[]*)\[([^\]]+)\]([^=]*)=\/(.*)\/$/.exec(ruleStr);
  if (m === null) {
    return null;
  }

  const [, leftCtx, target, rightCtx, phonemeStr] = m;

  // Build left regex (anchored at end of parsed text)
  const leftPattern = expandContext(leftCtx);
  const leftRe = new RegExp(leftPattern + '$');

  // Build right regex (anchored at start: target literal + expanded context)
  const rightPattern = expandContext(rightCtx);
  const rightRe = new RegExp('^' + escapeRegex(target) + rightPattern);

  // Parse phonemes: strip delimiters, split, map to ARPAbet
  const phonemes = phonemeStr
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .map(nrlToArpabet);

  return { leftRe, rightRe, targetLen: target.length, phonemes };
}

// ---------------------------------------------------------------------------
// Compile all rules at module load time
// ---------------------------------------------------------------------------

const COMPILED_RULES: Record<string, CompiledRule[]> = {};

for (const [letter, rules] of Object.entries(NRL_RULES)) {
  const compiled: CompiledRule[] = [];
  for (const rule of rules) {
    const c = compileRule(rule);
    if (c !== null) {
      compiled.push(c);
    }
  }
  COMPILED_RULES[letter] = compiled;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Converts a word to ARPAbet using NRL context-sensitive rules.
 *
 * @param word The word to convert
 * @returns Array of ARPAbet phonemes
 */
export function wordToArpabet(word: string): string[] {
  // Pad with spaces for word-boundary matching
  const text = ' ' + word.toUpperCase() + ' ';
  const result: string[] = [];
  let pos = 1; // skip leading space

  while (pos < text.length - 1) {
    // trailing space is a boundary, not a character to process
    const parsed = text.substring(0, pos);
    const rest = text.substring(pos);
    const ch = text[pos];

    // Look up rules for this letter
    const rules = COMPILED_RULES[ch] as CompiledRule[] | undefined;
    if (rules !== undefined) {
      let matched = false;
      for (const rule of rules) {
        if (rule.leftRe.test(parsed) && rule.rightRe.test(rest)) {
          result.push(...rule.phonemes);
          pos += rule.targetLen;
          matched = true;
          break;
        }
      }
      if (!matched) {
        pos++; // skip unrecognized character
      }
    } else {
      pos++; // skip non-letter characters
    }
  }

  return applyStressPrediction(word, result);
}

/**
 * Translates an unknown word using NRL letter-to-sound rules.
 * This is a fallback when the word isn't in the dictionary.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The best-effort translation
 */
export function translateWithRules(word: string, format: OutputFormat = 'ingglish'): string {
  const arpabet = wordToArpabet(word);
  return arpabetToFormat(arpabet, format);
}
