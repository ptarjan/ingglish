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
    // Custom: -ase at word end → EY S (base, case, chase — +4)
    '[ASE] =/EY S/',
    '[A] =/AX/',
    ' [ARE] =/AA R/',
    ' [AR]O=/AX R/',
    '[AR]#=/EH R/',
    ' ^[AS]#=/EY S/',
    '[A]WA=/AX/',
    '[AWL]=/AO L/',
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
    // Custom: AIGN → EY N (campaign, arraign, champagne — G is silent, 15 words)
    '[AIGN]=/EY N/',
    '[AI]=/EY/',
    '[AY]=/EY/',
    '[AU]=/AO/',
    '#:[AL] =/AX L/',
    '#:[ALS] =/AX L Z/',
    '[ALK]=/AO K/',
    // Custom: AL before certain consonants → AE L, not AO L (album, alcohol, alfred, algebra, alpine, valve)
    '[AL]B=/AE L/',
    '[AL]C=/AE L/',
    // Custom: silent L in half/calf (half, halfway, calf — L not pronounced before F)
    'H[ALF]=/AE F/',
    'C[ALF]=/AE F/',
    '[AL]F=/AE L/',
    '[AL]G=/AE L/',
    '[AL]P=/AE L/',
    '[AL]V=/AE L/',
    // Custom: silent L in -alm at word end (calm, palm, balm, psalm, napalm — 158/172 wrong)
    '[ALM] =/AA M/',
    '[ALM]S =/AA M/',
    '[AL]^=/AO L/',
    ' :[ABLE]=/EY B AX L/',
    '[ABLE]=/AX B AX L/',
    '[ANG]+=/EY N JH/',
    // Custom: -ance suffix with schwa (performance, distance)
    '#:[ANCE] =/AX N S/',
    // Custom: -ator suffix → EY T ER (operator, elevator, alligator — +21)
    '#:[ATOR]=/EY T ER/',
    // Custom: -ant/-ants suffix with schwa (important, consultant, elegant — 92% AH in CMU)
    '#:[ANTS] =/AX N T S/',
    '#:[ANT] =/AX N T/',
    // Custom: AA digraph (aardvark, baal, kraal)
    '[AA]=/AA/',
    // Custom: AERO- prefix → EH R OW (aerospace, aerobic — +2)
    ' [AERO]=/EH R OW/',
    // Custom: AE Latin digraph → EH (aegis, aesthetic, aeon — 358 words, 0% accuracy without)
    '[AE]=/EH/',
    // Custom: word-end -as/-an with schwa (atlas, organ)
    '#:[AS] =/AH Z/',
    '#:[AN] =/AX N/',
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
    // Custom: -berg suffix → B ER G (goldberg, steinberg — 320/320 in CMU)
    '#:[BERG] =/B ER G/',
    // Custom: -burg/-burgh suffix → B ER G (hamburg, pittsburgh — 115/118 in CMU)
    '#:[BURG] =/B ER G/',
    // Custom: -bury suffix → B EH R IY (canterbury, salisbury — 57/60 in CMU)
    '#:[BURY] =/B EH R IY/',
    // Custom: collapse doubled BB
    '[BB]=/B/',
    // Custom: silent B after M at word end (comb, lamb, climb, bomb — 56 silent, 0 pronounced)
    'M[B] =/ /',
    '[B]=/B/',
  ],
  C: [
    ' [CH]^=/K/',
    '^E[CH]=/K/',
    // Custom: CHR is always Greek → K (synchronize, monochrome, chrome, Christ)
    '[CHR]=/K R/',
    // Custom: CHEM is always Greek → K (chemical, alchemy, agrochemical)
    '[CHEM]=/K EH M/',
    // Custom: word-end -ach after A/E consonant pairs → K for German names
    // -bach (98K/0CH), -tech (46K/0CH), -eich (18K/0CH), -loch (12K/0CH), -roch (5K/0CH)
    'BA[CH] =/K/',
    'TE[CH] =/K/',
    'EI[CH] =/K/',
    'LO[CH] =/K/',
    'RO[CH] =/K/',
    'MA[CH] =/K/',
    'NE[CH] =/K/',
    'NO[CH] =/K/',
    'DO[CH] =/K/',
    'ZE[CH] =/K/',
    // Custom: mid-word CH → K in Greek/Latin contexts
    'I[CH]T=/K/',
    'I[CH]EL=/K/',
    'I[CH]OL=/K/',
    'A[CH]ER=/K/',
    'A[CH]EN=/K/',
    'A[CH]TE=/K/',
    'A[CH]MA=/K/',
    // Custom: ARCH- prefix with following vowel → K (archangel, architect, archive)
    'R[CH]IV=/K/',
    'R[CH]IT=/K/',
    // Custom: SCHK → K (blaschke, geschke — German names)
    'S[CH]KE=/K/',
    '[CH]=/CH/',
    ' S[CI]#=/S AY/',
    // Custom: CIAL → SH AX L (special, social, official — +2)
    '[CIAL]=/SH AX L/',
    ' [CYBER]=/S AY B ER/',
    '[CI]A=/SH/',
    '[CI]O=/SH/',
    '[CI]EN=/SH/',
    '[C]+=/S/',
    '[CK]=/K/',
    // Custom: CZ → CH for Polish names (czar, adamczyk, barczak — 179/204 in CMU)
    '[CZ]=/CH/',
    // Custom: CQU → K W to prevent double K from C + QU (acquire, acquaint)
    '[CQU]=/K W/',
    // Custom: -ically suffix → K L IY (basically, logically, physically — schwa dropped after I)
    'I[CALLY] =/K L IY/',
    // Custom: CYCL root → S AY K AH L (cycle, bicycle, encyclopedia — Greek origin)
    '[CYCL]=/S AY K AH L/',
    // Custom: CON- prefix before consonant (conduct, connect, consider — +135 SL)
    ' [CON]^=/K AH N/',
    '[COM]%=/K AH M/',
    // Custom: CCH → K without HH (Italian: bacchi, zucchini, pinocchio — 65 words)
    '[CCH]=/K/',
    // Custom: CC before front vowel → /ks/ (accent, accept, accident)
    '[CC]+=/K S/',
    // Custom: collapse doubled CC (account, accommodate)
    '[CC]=/K/',
    '[C]=/K/',
  ],
  D: [
    '#:[DED] =/D IH D/',
    // Custom: DH at word start → D only (dhabi, dharma, dhillon — Arabic/Hindi origin, H silent)
    "' [DH]=/D/",
    '.E[D] =/D/',
    '#^:E[D] =/T/',
    // Custom: DIAG root → D AY AH G (diagnose, diagonal, diagram — Greek origin)
    '[DIAG]=/D AY AH G/',
    // Custom: DIAL root → D AY AH L (dial, dialect, dialogue — Greek origin)
    '[DIAL]=/D AY AH L/',
    // Custom: DIVE- → D AY V (diverge, diverse, divert — Latin origin)
    ' [DIVE]R=/D AY V/',
    ' [DE]^#=/D IH/',
    ' [DO] =/D UW/',
    ' [DOES]=/D AH Z/',
    ' [DOING]=/D UW IH NX/',
    ' [DOW]=/D AW/',
    '[DU]A=/JH UW/',
    // Custom: DGE trigraph (badge, bridge, edge)
    '[DGE]=/JH/',
    // Custom: DG before front vowel → JH (bridging, edging, judging)
    '[DG]+=/JH/',
    // Custom: DJ → JH (adjoin, adjust, adjacent)
    '[DJ]=/JH/',
    // Custom: collapse doubled DD
    '[DD]=/D/',
    // Custom: silent D in German -ardt suffix (barnhardt, bernhardt, borgwardt — 20 words)
    '[D]T =/ /',
    '[D]=/D/',
  ],
  E: [
    // Custom: EXH → IH G Z (exhaust, exhibit, exhort — H is silent, X voices to GZ)
    ' [EXH]=/IH G Z/',
    // Custom: EX before vowel → IH G Z (exact, exam, exist — 73% GZ in CMU)
    ' [EX]#=/IH G Z/',
    '#:[E] =/ /',
    "' ^:[E] =/ /",
    ' :[E] =/IY/',
    '#[ED] =/D/',
    '#:[E]D =/ /',
    '[EV]ER=/EH V/',
    // Custom: ER before suffix → ER, not IY+R (altered, filtering, wanderer)
    '[ER]%=/ER/',
    // Custom: -ement must come before [E]^% to avoid E+M+suffix → IY (advancement, replacement)
    ' [ELECTR]=/IH L EH K T R/',
    '#:[EMENT]=/M AX N T/',
    // Custom: -ened past tense → schwa+N+D (blackened, brightened, burdened)
    '#:[ENED] =/AX N D/',
    // Custom: -ening progressive → schwa+N+IH+NG (awakening, frightening, threatening)
    '#:[ENING]=/AX N IH NX/',
    // Custom: -eness → silent E + N schwa S (acuteness, completeness, remoteness)
    '#:[ENESS] =/N AX S/',
    // Custom: -eman suffix → silent E (fireman→M AH N, foreman, policeman — 160/166 in CMU)
    '#:[EMAN] =/M AX N/',
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
    // Custom: -eful suffix with schwa (careful, hopeful, graceful)
    '#:[EFUL] =/F AX L/',
    '[EFUL]=/F UH L/',
    // Custom: EER → IH R (beer, deer, steer, engineer — 82/83 wrong without this)
    '[EER]=/IH R/',
    '[EE]=/IY/',
    '[EARN]=/ER N/',
    // Custom: EAR before specific consonants → ER (earth, early, search, heart)
    '[EAR]TH=/ER/',
    '[EAR]L=/ER/',
    '[EAR]CH=/ER/',
    '[EAR]T=/ER/',
    ' [EAR]^=/ER/',
    // Custom: word-end EAR → IH R (hear, near, clear, fear, dear — 46/87 IH R in CMU)
    '[EAR] =/IH R/',
    '[EAR]S =/IH R/',
    '[EAD]=/EH D/',
    '#:[EA] =/IY AX/',
    // Custom: French -eau/-eaux → OW (chateau, bureau, beauchamp, beautiful — 153 word-end + 91 mid-word)
    '[EAUX]=/OW/',
    '[EAU]=/OW/',
    '[EA]SU=/EH/',
    '[EA]=/IY/',
    '[EIGH]=/EY/',
    // Custom: EI after C → IY (receive, ceiling, deceive — "i before e except after c")
    'C[EI]=/IY/',
    // Custom: EI → AY in most contexts (German: stein, wein, klein — 85%+ AY in CMU)
    '[EI]=/AY/',
    ' [EYE]=/AY/',
    '[EY]=/IY/',
    // Custom: -eur suffix → ER (amateur, chauffeur, entrepreneur — French origin)
    '[EUR] =/ER/',
    // Custom: EU → UW without Y glide (neutral, deuce, feudal — fix 98, break ~54)
    '[EU]=/UW/',
    // Custom: -ence suffix with schwa (difference, conference)
    '#:[ENCE] =/AX N S/',
    // Custom: -ent/-ents suffix with schwa (accident, component, environment — 89% AH in CMU)
    '#:[ENTS] =/AX N T S/',
    '#:[ENT] =/AX N T/',
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
    // Custom: -ess suffix with schwa (actress, princess, goddess — +11 S)
    '#:[ESS] =/AX S/',
    // Custom: -est superlative with schwa (highest, lowest, fastest)
    '#:[EST] =/AX S T/',
    // Custom: word-end -els/-ets/-ems/-em/-et with schwa (models, tickets, problems)
    '#:[ELS] =/AX L Z/',
    '#:[ETS] =/AH T S/',
    '#:[EMS] =/AX M Z/',
    '#:[EM] =/AX M/',
    '#:[ET] =/AH T/',
    '[E]=/EH/',
  ],
  F: [
    // Custom: -ford suffix → F ER D (bedford, oxford, stanford — 195 vs 16 with AO R D)
    '#:[FORD] =/F ER D/',
    // Custom: -fully/-ful suffix with schwa (beautifully, wonderful)
    '#:[FULLY] =/F AX L IY/',
    '#:[FUL] =/F AX L/',
    '[FUL]=/F UH L/',
    '[FF]=/F/',
    '[F]=/F/',
  ],
  G: [
    '[GIV]=/G IH V/',
    // Custom: silent g before n at word start (gnat, gnome, gnu)
    ' [GN]=/N/',
    // Custom: GHOST → G OW S T (ghost, ghostly, ghostbusters)
    ' [GHOST]=/G OW S T/',
    // Custom: GH at word start → G only (ghost, ghetto, ghana — 17 fix, 1 break)
    ' [GH]=/G/',
    ' [G]I^=/G/',
    // Custom: GER → hard G + ER (tiger, lager, berger — 234 fix vs 90 break)
    '[GER]=/G ER/',
    // Custom: -geon → JH AH N (surgeon, pigeon, bludgeon — E is silent in -geon)
    '[GEON]=/JH AX N/',
    '[GE]T=/G EH/',
    'SU[GGES]=/G JH EH S/',
    // Custom: GU before I → G only, U is silent (guide, guilt, guitar — +10)
    '[GU]I=/G/',
    '[GG]=/G/',
    ' B#[G]=/G/',
    '[G]+=/JH/',
    '[GREAT]=/G R EY T/',
    '#[GH]=/ /',
    '[G]=/G/',
  ],
  H: [
    // Custom: HYPER- prefix → HH AY P ER (hyperactive, hyperbole — Greek origin)
    ' [HYPER]=/HH AY P ER/',
    // Custom: HYDR- prefix → HH AY D R (hydrogen, hydraulic — Greek origin)
    ' [HYDR]=/HH AY D R/',
    ' [HAV]=/HH AE V/',
    ' [HERE]=/HH IY R/',
    ' [HOUR]=/AW ER/',
    '[HOW]=/HH AW/',
    '[H]#=/HH/',
    '[H]=/ /',
  ],
  I: [
    // Custom: ISO- prefix → AY S AH (isolate, isomer, isobar — Greek origin)
    ' [ISO]=/AY S AH/',
    // Custom: IDEA root → AY D IY (idea, ideal, idealism)
    ' [IDEA]=/AY D IY/',
    ' [IN]=/IH N/',
    ' [I] =/AY/',
    // Custom: Italian/Latin word-end patterns (I+consonant+vowel → IY)
    '[INI] =/IY N IY/',
    '[INO] =/IY N OW/',
    '[INA] =/IY N AH/',
    '[IDA] =/IY D AH/',
    '[ISA] =/IY S AH/',
    '[IVA] =/IY V AH/',
    '[IMA] =/IY M AH/',
    '[ITO] =/IY T OW/',
    '[ITA] =/IY T AH/',
    // Custom: -ial/-ially/-iate suffixes → IY
    '#:[IALLY]=/IY AX L IY/',
    '#:[IAL]=/IY AX L/',
    '#:[IATE]=/IY EY T/',
    // Custom: IND at word end → AY N (find, mind, kind, blind, grind)
    // Mid-word IND is 90% IH, handled by default I→IH.
    '[IN]D =/AY N/',
    '[IER]=/IY ER/',
    '#:R[IED] =/IY D/',
    '[IED] =/AY D/',
    // Custom: IEN → IY N (drop EH — alien, bien, orient — 46 fix vs 9 break)
    '[IEN]=/IY N/',
    // Custom: IE before consonants that are 100% IY in CMU (brief, siege, grieve, piece, field, shield, view)
    '[IE]F=/IY/',
    '[IE]G=/IY/',
    '[IE]V=/IY/',
    '[IE]C=/IY/',
    '[IE]W=/IY/',
    '[IE]P=/IY/',
    '[IE]B=/IY/',
    '[IE]L=/IY/',
    '[IE]T=/AY EH/',
    ' :[I]%=/AY/',
    // Custom: IE before consonant+suffix → single IY (achieve, believed, relieving)
    '[IE]^%=/IY/',
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
    // Removed: '#^:[I]^+=/IH/' — over-matched words like alive, alike, airline (net +103)
    // Custom: -tive/-sive suffix → IH not AY (active, native, creative, massive, passive)
    'T[I]VE=/IH/',
    'S[I]VE=/IH/',
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
    // Custom: -ism/-isms suffix → IH Z AX M (activism, tourism — 268/268 wrong without schwa)
    '#:[ISMS] =/IH Z AX M Z/',
    '#:[ISM] =/IH Z AX M/',
    '[I]=/IH/',
  ],
  J: ['[J]=/JH/'],
  K: [
    ' [K]N=/ /',
    // Custom: KH at word start → K (khan, khaki, khmer — Arabic/Persian origin, H silent)
    ' [KH]=/K/',
    '[KK]=/K/',
    '[K]=/K/',
  ],
  L: [
    '[LO]C#=/L OW/',
    'L[L]=/ /',
    // Custom: -less must come before L% to prevent schwa insertion
    // Custom: -lessly suffix (carelessly, recklessly — +10)
    '#:[LINE] =/L AY N/',
    '#:[LESSLY] =/L AX S L IY/',
    '#:[LESS] =/L AX S/',
    // Custom: -ling must come before L% to prevent schwa insertion
    '[LING]=/L IH NX/',
    // Custom: consonant+L before ER/EY → syllabic L, no schwa (adler, ainsley, butler)
    '#^:[L]ER=/L/',
    '#^:[L]EY=/L/',
    '#^:[L]%=/AX L/',
    '[LEAD]=/L IY D/',
    // Custom: LDT at word end → L T (German surnames: boldt, humboldt — 13 fix, 0 break)
    '[LDT] =/L T/',
    // Custom: collapse doubled LL
    '[LL]=/L/',
    '[L]=/L/',
  ],
  M: [
    // Custom: Mc- prefix in names (McAdam, McAllister, McCain) → M-schwa-K
    ' [MCC]=/M AX K/',
    // Custom: McK- → single K (McKay, McKain, McKenzie)
    ' [MCK]=/M AX K/',
    // Custom: McGr, McGl etc → no K before G (mcgrady, mcgrath — 37 words)
    ' [MCG]=/M AX/',
    // Custom: McQu → M AX K W (mcquade, mcqueen — 17 words)
    ' [MCQU]=/M AX K W/',
    ' [MC]=/M AX K/',
    '[MOV]=/M UW V/',
    // Custom: silent b after m at word end (lamb, climb, bomb, dumb)
    '[MBS] =/M Z/',
    '[MB] =/M/',
    // Custom: silent n after m — extends to suffixed forms (damning, damned, hymns)
    '[MN]ING=/M/',
    '[MN]ED=/M/',
    '[MN]S=/M/',
    '[MN] =/M/',
    // Custom: -ments plural (moments, departments)
    '#:[MENTS] =/M AX N T S/',
    // Custom: -ment suffix with schwa (moment, department)
    '#:[MENT] =/M AX N T/',
    // Custom: -man suffix with schwa (fireman, policeman)
    '#:[MAN] =/M AX N/',
    // Custom: -men suffix with schwa (firemen, policemen)
    '#:[MEN] =/M AX N/',
    // Custom: MULTI- prefix → M AH L T IY (multiply, multimedia — +13)
    ' [MULTI]=/M AH L T IY/',
    // Custom: MINI- prefix → M IH N IY (minimize, minivan — +6)
    ' [MINI]=/M IH N IY/',
    // Custom: MICRO- prefix → M AY K R AH (microscope, microsoft — Greek origin)
    ' [MICRO]=/M AY K R AH/',
    ' [MONO]=/M AA N AH/',
    // Custom: collapse doubled MM
    '[MM]=/M/',
    '[M]=/M/',
  ],
  N: [
    'E[NG]+=/N JH/',
    // Custom: -nger/-ngers → NG ER without hard G (307 words like singer, banger vs 31 with hard G like finger)
    '[NGER]=/NG ER/',
    // Custom: NG before -ing/-ed suffix → NX without hard G (belonging, belonged, longing)
    '[NG]ING=/NX/',
    '[NG]ED=/NX/',
    '[NG]R=/NX G/',
    '[NG]#=/NX G/',
    '[NGL]%=/NX G AX L/',
    '[NG]=/NX/',
    // Custom: NKC → single K (bankcard, bankcorp)
    '[NKC]=/NX K/',
    '[NK]=/NX K/',
    ' [NOW] =/N AW/',
    // Custom: -ness suffix with schwa (darkness, kindness)
    '#:[NESS] =/N AX S/',
    // Custom: NDT at word end → N T (German surnames: arndt, brandt — 26 fix vs 1 break)
    '[NDT] =/N T/',
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
    // Custom: O before WSK → AH (Polish names: kowalski, grabowski — prevent OW digraph)
    '[O]WSK=/AH/',
    '[OW]=/OW/',
    ' [OVER]=/OW V ER/',
    '[OV]=/AH V/',
    // Custom: -ioned/-ioning/-ioner suffixes → schwa (mentioned, stationed, conditioned)
    // Must come before [O]^% which otherwise produces OW for these
    'I[ONED] =/AX N D/',
    'I[ONING]=/AX N IH NX/',
    'I[ONER]=/AX N ER/',
    'I[ONERS]=/AX N ER Z/',
    '[O]^%=/OW/',
    '[O]^EN=/OW/',
    '[O]^I#=/OW/',
    // Custom: OLK with silent L (folk, yolk)
    '[OLK]=/OW K/',
    // Custom: OLT as long O (bolt, colt, jolt)
    '[OL]T=/OW L/',
    '[OL]D=/OW L/',
    // Custom: OL before consonants → OW L (like bolt/cold patterns)
    '[OL]Z=/OW L/',
    '[OL]G=/OW L/',
    '[OL]S=/OW L/',
    '[OL]B=/OW L/',
    '[OL]M=/OW L/',
    '[OL]N=/OW L/',
    '[OL]P=/OW L/',
    '[OL]F=/OW L/',
    '[OUGHT]=/AO T/',
    // Custom: D before OUGH → OW (dough, doughnut, doughy — 8 fix, 0 break)
    'D[OUGH]=/OW/',
    // Custom: B before OUGH at word end → AW (bough, clabough — 11 fix, 0 break)
    'B[OUGH] =/AW/',
    // Custom: tough/rough/enough keep AH F at word end
    'T[OUGH] =/AH F/',
    'R[OUGH] =/AH F/',
    'N[OUGH] =/AH F/',
    // Custom: word-end -ough → AW default (brough, plough, clough — fix 34, break 7→0 with exceptions)
    '[OUGH] =/AW/',
    '[OUGH]=/AH F/',
    // Custom: -ouse → AW S (unvoiced) — house, mouse, blouse (106 words vs 4 with Z)
    '[OUSE]=/AW S/',
    ' [OU]=/AW/',
    'H[OU]S#=/AW/',
    '[OUS]=/AX S/',
    // Custom: word-final -our → ER (honour, colour, favour — American English, +8)
    '#:[OUR] =/ER/',
    '[OUR]=/AO R/',
    // Custom: would/could/should retain UH D; others get OW L D (boulder, shoulder, mould)
    // Trailing space ensures we don't match shoulder, boulder, etc.
    'W[OULD] =/UH D/',
    'C[OULD] =/UH D/',
    'SH[OULD] =/UH D/',
    '[OULD]=/OW L D/',
    '^[OU]^L=/AH/',
    '[OUP]=/UW P/',
    '[OU]=/AW/',
    '[OY]=/OY/',
    '[OING]=/OW IH NX/',
    '[OI]=/OY/',
    '[OOR]=/AO R/',
    // Custom: OOSE → UW S (goose, moose, loose — voiceless S, +11)
    '[OOSE]=/UW S/',
    '[OOK]=/UH K/',
    '[OOD]=/UH D/',
    '[OO]=/UW/',
    // Changed from [O]E to [OE] to consume both chars (fixes German OE digraph: boehl, goethe, roebuck)
    '[OE]=/OW/',
    // Custom: word-final OH → OW (oh, stroh, pharaoh — 26 fix vs 3 break)
    '#:[OH] =/OW/',
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
    // Custom: -osis suffix → OW S IH S (diagnosis, osmosis — +1)
    '[OSIS]=/OW S IH S/',
    '[O]ST =/OW/',
    // Custom: word-final O before S → OW (abalos, adios, aficionados — fix 377, break 1)
    '[O]S =/OW/',
    // Custom: OFF consumes all 3 chars to prevent double-F (off, offer, office)
    '[OFF]=/AO F/',
    '[OF]^=/AO F/',
    '[OTHER]=/AH DH ER/',
    '[OSS] =/AO S/',
    '#^:[OM]=/AH M/',
    // Custom: -ology suffix (biology, technology, psychology)
    '[OLOGY]=/AA L AH JH IY/',
    // Custom: open-syllable O before consonant+vowel (sofa, robot, bonus, focus, yoga)
    '[O]^A=/OW/',
    '[O]^O=/OW/',
    '[O]^U=/OW/',
    // Custom: O before H → OW (ohio, mohawk, cohen, bohemian — 75% OW in CMU)
    // Custom: open-syllable O patterns (+48 combined)
    '[O]MI=/OW/',
    '[O]BI=/OW/',
    '[O]DI=/OW/',
    '[O]TI=/OW/',
    '[O]SI=/OW/',
    '[O]GL=/OW/',
    '[O]FI=/OW/',
    '[O]KI=/OW/',
    '[O]BY=/OW/',
    '[O]DY=/OW/',
    '[O]LI=/OW/',
    '[O]H=/OW/',
    // Custom: word-end -ons/-ol/-ot with schwa (persons, control, carrot)
    '#:[ONS] =/AH N Z/',
    '#:[OL] =/AO L/',
    '#:[OT] =/AH T/',
    '[O]=/AA/',
  ],
  P: [
    '[PH]=/F/',
    '[PEOP]=/P IY P/',
    '[POW]=/P AW/',
    '[PUT] =/P UH T/',
    // Custom: silent p before f at word start (Pfizer, Pfeiffer, Pfaff)
    ' [PF]=/F/',
    // Custom: PSYCH → S AY K (psychology, psycho, psychiatric — Greek origin)
    // Custom: POST- prefix → P OW S T (postal, postage, poster — not "post" word which has [O]ST rule)
    ' [POST]#=/P OW S T/',
    ' [PSYCH]=/S AY K/',
    // Custom: silent p before s at word start (psalm, psychology)
    ' [PS]=/S/',
    // Custom: silent p before n at word start (pneumonia, pneumatic)
    ' [PN]=/N/',
    // Custom: PARA- prefix → P EH R AH (paradise, parallel — +7)
    ' [PARA]=/P EH R AH/',
    // Custom: PER- prefix before consonant → P ER (perform, perhaps — +8)
    ' [PER]^=/P ER/',
    // Custom: collapse doubled PP
    '[PP]=/P/',
    '[P]=/P/',
  ],
  Q: [
    '[QUAR]=/K W AO R/',
    // Custom: QUA before L → K W AA L (qualify, quality, equal — broad A)
    '[QUA]L=/K W AA/',
    // Custom: QUE at word end → K (basque, mosque, torque, plaque — no W sound)
    '[QUE] =/K/',
    '[QU]=/K W/',
    '[Q]=/K/',
  ],
  R: [
    ' [RE]^#=/R IY/',
    // Custom: ROLL → R OW L (roll, stroll, scroll, enroll, bankroll — 80+ words need OW)
    '[ROLL]=/R OW L/',
    // Custom: rh → R (rhyme, rhythm, rhino)
    '[RH]=/R/',
    // Custom: RDT at word end → R T (German surnames: bernhardt, reinhardt — 19 fix, 0 break)
    '[RDT] =/R T/',
    // Custom: collapse doubled RR
    '[RR]=/R/',
    '[R]=/R/',
  ],
  S: [
    '[SH]=/SH/',
    '#[SION]=/ZH AX N/',
    '#:[SIDE] =/S AY D/',
    // Custom: SCH before OO → S K (school, schooner — +21)
    '[SCH]OO=/S K/',
    '[SOME]=/S AH M/',
    '#[SUR]#=/ZH ER/',
    '[SUR]#=/SH ER/',
    '#[SU]#=/ZH UW/',
    '#[SSU]#=/SH UW/',
    '#[SED] =/Z D/',
    // Custom: S before IVE always voiceless (abrasive, decisive, massive — 0 exceptions)
    '[S]IVE=/S/',
    // Custom: -ius ending → voiceless S (agius, aloysius, celsius — Latin origin)
    'IU[S] =/S/',
    // Custom: -son after vowel has voiceless S (addison, eason, mason — 203 S vs 33 Z)
    '#[SON] =/S AX N/',
    // Custom: DIS- prefix keeps S voiceless before vowels (disable, disagree, disappoint — 94% S in CMU)
    ' DI[S]#=/S/',
    // Custom: RE- prefix keeps S voiceless (reset, research, resemble — +28)
    ' RE[S]#=/S/',
    '#[S]#=/Z/',
    '[SAID]=/S EH D/',
    '^[SION]=/SH AX N/',
    '[S]S=/ /',
    '.[S] =/Z/',
    '#:.E[S] =/Z/',
    '#^:##[S] =/Z/',
    // Custom: word-final -as → Z (68% Z in CMU: atlas→Z, alias→Z — net +176)
    'A[S] =/Z/',
    // Custom: word-final -os → Z (65% Z in CMU: abalos→Z, aficionados→Z — net +115)
    'O[S] =/Z/',
    '#^:#[S] =/S/',
    'U[S] =/S/',
    ' :#[S] =/Z/',
    // Custom: silent W in "answer" (answer, answered, answering — 6 words)
    'AN[SWER]=/S ER/',
    // Custom: SCH → /ʃ/ (schafer, schmidt, altschul, fleischer — German origin, 90%+ are SH)
    '[SCH]=/SH/',
    '[S]C+=/ /',
    '#[SM]=/Z M/',
    "#[SN] '=/Z AX N/",
    // Custom: silent T in -stle (castle, whistle, bristle)
    '[STLE]=/S AX L/',
    // Custom: silent T in -sten (listen, fasten, glisten)
    '#:[STEN]=/S AX N/',
    // Custom: -stein surname suffix → S T AY N (goldstein, weinstein — 85/125 AY vs 40/125 IY)
    '#:[STEIN] =/S T AY N/',
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
    // Custom: TIAL → SH AX L (partial, essential — +4)
    '[TIAL]=/SH AX L/',
    '[TI]A=/SH/',
    '[TIEN]=/SH AX N/',
    '[TUR]#=/CH ER/',
    '[TU]A=/CH UW/',
    ' [TWO]=/T UW/',
    // Custom: TZ → T S for German-origin words (hertz, waltz, schwartz)
    '[TZ]=/T S/',
    // Custom: TELE- prefix → T EH L AH (telephone, television, telegram — +29)
    ' [TELE]=/T EH L AH/',
    // Custom: TSCH → CH (German: Tschaikowsky, Nitschke — +59)
    '[TSCH]=/CH/',
    '#:[TOWN] =/T AW N/',
    '#:[TIME] =/T AY M/',
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
    // Custom: UIT → UW T (fruit, suit, pursuit — silent I in UIT)
    '[UIT]=/UW T/',
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
    // Custom: -ulate/-ulating/-ulated/-ulation suffixes (calculate, circulate, accumulate — 84% AH)
    '[ULAT]=/Y AX L EY T/',
    // Custom: -ulous/-ulus suffix (calculus, stimulus, fabulous — Latin origin)
    '[ULOUS]=/Y AX L AH S/',
    '[ULUS]=/Y AX L AH S/',
    // Custom: -ular suffix (popular, regular, cellular)
    '[ULAR]=/Y AX L ER/',
    '@[U]=/UW/',
    // Custom: word-final U → UW without Y glide (tofu, bayou, peru)
    '[U] =/UW/',
    '[U]=/Y UW/',
  ],
  V: [
    '[VIEW]=/V Y UW/',
    // Custom: VIOL root → V AY AH L (violence, violin, violate — Latin origin)
    '[VIOL]=/V AY AH L/',
    '[V]=/V/',
  ],
  W: [
    ' [WERE]=/W ER/',
    '[WA]S=/W AA/',
    '[WA]T=/W AA/',
    // Custom: WA before N → W AA (wand, wander, want, swan — broad A after W)
    '[WA]N=/W AA/',
    // Custom: WA before M → W AA (swamp, wampum)
    '[WA]M=/W AA/',
    // Custom: WA before D → W AA (squad, waddle)
    '[WA]D=/W AA/',
    '[WHERE]=/WH EH R/',
    '[WHAT]=/WH AA T/',
    '[WHOL]=/HH OW L/',
    '[WHO]=/HH UW/',
    '[WH]=/WH/',
    // Custom: -ward suffix (forward, backward, awkward)
    '#:[WARDS] =/W ER D Z/',
    '#:[WARD] =/W ER D/',
    '[WAR]=/W AO R/',
    '[WOR]^=/W ER/',
    '[WR]=/R/',
    '[W]=/W/',
  ],
  X: [
    // Custom: X at word start → Z (xavier, xylophone, xerox — Greek origin, +12)
    ' [X]=/Z/',
    '[X]=/K S/',
  ],
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
    // Custom: word-final Y → IY (happy, baby, city — +10)
    '[Y] =/IY/',
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
