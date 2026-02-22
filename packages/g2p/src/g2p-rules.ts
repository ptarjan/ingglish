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
    '[ALLO] =/AA L OW/',
    '[ACCI] =/AA CH IY/',
    ' [AYE] =/AY/',
    ' [AGO] =/AH G OW/',
    ' [AND] =/AH N D/',
    ' [ARE] =/AA R/',
    ' [A]BO=/AH/',
    'F[A]VO=/EY/',
    'TR[A]VE=/AE/',
    'F[A]TH=/AA/',
    '[ASTE] =/EY S T/',
    '[ASE] =/EY S/',
    '[A] =/AX/',
    ' [AR]OU=/ER/',
    ' [AR]EN =/AA R/',
    'EP[AR]AT=/ER/',
    '[AR]#=/EH R/',
    ' [AR]O=/AX R/',
    ' ^[AS]#=/EY S/',
    '[A]WA=/AX/',
    '[AWL]=/AO L/',
    '[AW]FU=/AA/',
    '[AW]=/AO/',
    ' :[ANY]=/EH N IY/',
    '[A]HE=/AH/',
    '[A]^+#=/EY/',
    '#:[ALLY]=/AX L IY/',
    ' [AL]#=/AX L/',
    '[AGAIN]=/AX G EH N/',
    'SS[AG]E=/AH JH/',
    '#:[AG]E=/IH JH/',
    ' :[A]^+ =/EY/',
    '[A]^%=/EY/',
    'M[ARR]IE=/EH R/',
    '[ARR]ES=/ER/',
    '[ARR]IV=/ER/',
    '[ARR]=/AE R/',
    ' :[AR] =/AA R/',
    'ST[AR] =/AA R/',
    '[AR] =/ER/',
    'ST[AR]D=/ER/',
    '[AR]=/AA R/',
    '[AIR]=/EH R/',
    '[AIGN]=/EY N/',
    'RT[AI]NL=/AH/',
    '[AI]=/EY/',
    '[AY]=/EY/',
    ' L[AUGH]=/AE F/',
    '[AUGH]=/AO/',
    '[AUER]=/AW ER/',
    '[AU]=/AO/',
    '#:[AL] =/AX L/',
    '#:[ALS] =/AX L Z/',
    '[ALK]=/AO K/',
    '[AL]B=/AE L/',
    '[AL]C=/AE L/',
    'H[ALF]=/AE F/',
    'C[ALF]=/AE F/',
    '[AL]F=/AE L/',
    '[AL]G=/AE L/',
    '[AL]P=/AE L/',
    '[AL]V=/AE L/',
    '[ALM] =/AA M/',
    '[ALM]S =/AA M/',
    ' [AL]LE=/AE L/',
    'SH[AL]L=/AE L/',
    ' [AL]LOT=/AH L/',
    '[AL]^=/AO L/',
    ' :[ABLE]=/EY B AX L/',
    '[ABLE]=/AX B AX L/',
    '[ANG]+=/EY N JH/',
    '#:[ANCE] =/AX N S/',
    '#:[ANTS] =/AX N T S/',
    '#:[ANT] =/AX N T/',
    '[AA]=/AA/',
    '[AE]=/EH/',
    ' [A]NO=/AH/',
    '#:[AS] =/AH Z/',
    'M[A]JO=/EY/',
    'SW[A]LL=/AA/',
    'SW[A]P=/AA/',
    'SQU[A]=/AA/',
    'QU[A]NT=/AA/',
    '[A]=/AE/',
    '#:[AN] =/AX N/',
  ],
  B: [
    '[BEEN] =/B IH N/',
    ' [BRA] =/B R AA/',
    ' [BOW] =/B AW/',
    ' [BOTH] =/B OW TH/',
    ' [BE]NE=/B EH/',
    ' [BE]^#=/B IH/',
    '[BEING]=/B IY IH NX/',
    ' [BUS]#=/B IH Z/',
    '[BUIL]=/B IH L/',
    '[BT]=/T/',
    '#:[BERG] =/B ER G/',
    '#:[BURG] =/B ER G/',
    '#:[BURY] =/B EH R IY/',
    '[BB]=/B/',
    'M[B] =/ /',
    '[B]=/B/',
  ],
  C: [
    ' [COS] =/K AO S/',
    ' [CHA]R=/CH AA/',
    ' [CH]^=/K/',
    '^E[CH]=/K/',
    '[CHEM]=/K EH M/',
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
    'I[CH]T=/K/',
    'I[CH]EL=/K/',
    'I[CH]OL=/K/',
    'A[CH]EN=/K/',
    'A[CH]TE=/K/',
    'R[CH]IV=/K/',
    'R[CH]IT=/K/',
    'S[CH]KE=/K/',
    'RI[CH]S=/K/',
    'LI[CH] =/K/',
    'EI[CH]ER=/K/',
    'EI[CH]EN=/K/',
    'EI[CH]MA=/K/',
    '[CH]OR=/K/',
    '#RI[CH] =/K/',
    'TRI[CH] =/K/',
    'BRI[CH] =/K/',
    'MA[CH]ER =/K/',
    'LA[CH]ER =/K/',
    'RA[CH]ER =/K/',
    '[CH]=/CH/',
    ' S[CI]#=/S AY/',
    '[CIAL]=/SH AX L/',
    '[CI]A=/SH/',
    '[CI]O=/SH/',
    '[CI]EN=/SH/',
    'EX[C]IT=//',
    'EX[C]E=//',
    'M[C]E=/AH K/',
    '[C]+=/S/',
    '[CK]=/K/',
    '[CZ]=/CH/',
    '[CQU]=/K W/',
    'I[CALLY] =/K L IY/',
    '[CYCL]=/S AY K AH L/',
    ' [CON]^=/K AH N/',
    '[COM]%=/K AH M/',
    '[CCH]=/K/',
    'M[CC]=/AH K/',
    '[CC]+=/K S/',
    '[CC]=/K/',
    'M[C]G=/AH/',
    'M[C]^=/AH K/',
    '[C]=/K/',
  ],
  D: [
    ' [DOING]=/D UW IH NX/',
    '#:[DED] =/D IH D/',
    '.E[D] =/D/',
    '#TE[D] =/IH D/',
    '^TE[D] =/IH D/',
    '#^:E[D] =/T/',
    '[DIAG]=/D AY AH G/',
    '[DIAL]=/D AY AH L/',
    ' [DE]^#=/D IH/',
    '[DU]A=/JH UW/',
    '[DG]+=/JH/',
    '[DJ]=/JH/',
    '#:[DDED] =/D IH D/',
    '[DD]=/D/',
    '[D]T =/ /',
    '[D]=/D/',
  ],
  E: [
    '[EAR]D=/ER/',
    'H[EAR] =/IY R/',
    'W[EAR]=/EH R/',
    'B[EAR]=/EH R/',
    'BR[EAK]F=/EH K/',
    'H[EA]VY=/EH/',
    '[EWSKI] =/EH F S K IY/',
    '[ELLI] =/EH L IY/',
    ' [EVE] =/IY V/',
    ' [EAR] =/IY R/',
    ' [EVERY]^=/EH V R IY/',
    ' [EVE]N=/IY V/',
    '[E]LECT=/IH/',
    '[E]LIM=/IH/',
    ' [E]LE=/IH/',
    ' [E]NO=/IH/',
    ' [EX]#=/IH G Z/',
    '#:[E] =/ /',
    ' :[E] =/IY/',
    '#[ED] =/D/',
    'D[ED] =/IH D/',
    '#:[E]D =/ /',
    '[EV]ER=/EH V/',
    '[ER]%=/ER/',
    '#:[EMENT]=/M AX N T/',
    '#:[ENED] =/AX N D/',
    '#:[ENING]=/AX N IH NX/',
    '#:[ENESS] =/N AX S/',
    '#:[EMAN] =/M AX N/',
    'NT[ERR]UP=/ER/',
    '[ERR]=/EH R/',
    'XP[ER]IE=/IH R/',
    '#:[ER]#=/ER/',
    'S[ER]IO=/IH R/',
    '[ER]#=/EH R/',
    '[ER]=/ER/',
    '@[EW]=/UW/',
    '#:[E]W=/ /',
    '[EW]=/Y UW/',
    'G[E]OR=//',
    '[E]O=/IY/',
    'IC[ES] =/AH Z/',
    '#:&[ES] =/IH Z/',
    '#:[E]S =/ /',
    '#:[ELY] =/L IY/',
    '#:[EFUL] =/F AX L/',
    '[EFUL]=/F UH L/',
    '[EER]=/IH R/',
    '[EE]=/IY/',
    '[EARN]=/ER N/',
    '[EAR]TH=/ER/',
    '[EAR]L=/ER/',
    '[EAR]CH=/ER/',
    '[EAR]T=/ER/',
    '[EAR] =/IH R/',
    '[EAR]S =/IH R/',
    '[EAD]=/EH D/',
    '#:[EA] =/IY AX/',
    '[EAUX]=/OW/',
    'B[EAU]TI=/Y UW/',
    '[EAU]=/OW/',
    '[EA]LTH=/EH/',
    '[EA]THER=/EH/',
    'BR[EA]TH=/EH/',
    '[EA]VEN=/EH/',
    'ST[EA]K=/EY/',
    '[EA]SU=/EH/',
    'D[EA]TH=/EH/',
    'BR[EA]K=/EY/',
    'W[EA]PO=/EH/',
    '[EA]=/IY/',
    '[EIGN]=/EY N/',
    '[EIGH]=/EY/',
    'C[EI]=/IY/',
    'W[EI]RD=/IH/',
    '[EI]=/AY/',
    '[EU]RO=/Y UW/',
    '[EY]E=/AY/',
    '[EY]=/IY/',
    '[EUR] =/ER/',
    '[EU]=/UW/',
    '#:[ENCE] =/AX N S/',
    '#:[ENTS] =/AX N T S/',
    '#:[ENT] =/AX N T/',
    'I[ELD]=/L D/',
    'I[ELS] =/L Z/',
    'I[EL] =/L/',
    '#:[ENS] =/AX N Z/',
    'GR[EN] =/EH N/',
    '#:[EN] =/AX N/',
    'OT[EL]=/EH L/',
    '#:[EL] =/AX L/',
    '#:[EST] =/AX S T/',
    '[EX]TR=/EH K S/',
    ' [EX]^=/IH K S/',
    '#:[ELS] =/AX L Z/',
    '#:[ETS] =/AH T S/',
    '#:[EMS] =/AX M Z/',
    '#:[EM] =/AX M/',
    '#:[ET] =/AH T/',
    'P[E]TE=/IY/',
    'D[E]FE=/IH/',
    'D[E]FI=/IH/',
    'R[E]CE=/IH/',
    'D[E]CI=/IH/',
    'R[E]SP=/IH/',
    'R[E]PR=/IY/',
    'S[E]CR=/IY/',
    'S[E]CU=/IH/',
    'R[E]TR=/IY/',
    'D[E]PR=/IH/',
    'D[E]STR=/IH/',
    'D[E]PL=/IH/',
    'D[E]CL=/IH/',
    'D[E]PE=/IH/',
    'D[E]SI=/IH/',
    'D[E]TE=/IH/',
    'R[E]SU=/IH/',
    'R[E]GA=/IH/',
    '[E]VOL=/IH/',
    'CK[E]TT=/IH/',
    'NN[E]LL=/AH/',
    'SS[E]LL=/AH/',
    'DD[E]LL=/AH/',
    'PP[E]LL=/AH/',
    'RR[E]LL=/AH/',
    'TT[E]LL=/AH/',
    'NK[E]TT=/IH/',
    'FF[E]LL=/AH/',
    'LL[E]TT=/IH/',
    'RR[E]TT=/IH/',
    'MM[E]LL=/AH/',
    'NN[E]TT=/IH/',
    'NN[E]SS=/IH/',
    'MM[E]TT=/IH/',
    'GG[E]TT=/IH/',
    'LL[E]NG=/IH/',
    'TL[E]ME=//',
    'B[E]TW=/IH/',
    'PR[E]TT=/IH/',
    'PR[E]TE=/IY/',
    'PR[E]PA=/IY/',
    'PR[E]VE=/IY/',
    'PR[E]CA=/IY/',
    'PR[E]MI=/IY/',
    'PR[E]SC=/IY/',
    'PR[E]VI=/IY/',
    'CR[E]TE=/IY/',
    'PL[E]TE=/IY/',
    'TL[E]ME=//',
    'ST[E]VE=/IY/',
    ' [E]QU=/IH/',
    ' [E]FF=/IH/',
    ' [E]MI=/IH/',
    'D[E]SC=/IH/',
    'EL[E]BR=/AH/',
    'EL[E]PH=/AH/',
    '[E]NB=/AH/',
    '[E]NFEL=/AH/',
    '[E]NSTE=/AH/',
    'SS[E]L=/AH/',
    'CI[E]NT=/AH/',
    'SS[E]NG=/AH/',
    'TN[E]SS=/AH/',
    '[ETTE] =/EH T/',
    '[E]^E =/IY/',
    '[E]=/EH/',
  ],
  F: [
    '[FROM] =/F R AH M/',
    ' [FIX]=/F IH K S/',
    '#:[FORD] =/F ER D/',
    '#:[FULLY] =/F AX L IY/',
    '#:[FUL] =/F AX L/',
    '[FUL]=/F UH L/',
    '[FF]=/F/',
    '[F]=/F/',
  ],
  G: [
    ' [GIN] =/JH IH N/',
    ' [GHOST]=/G OW S T/',
    ' [GAS] =/G AE S/',
    ' [GN]=/N/',
    '[G]EI=/G/',
    '[GIV]=/G IH V/',
    ' [G]I^=/G/',
    '[GEON]=/JH AX N/',
    '[GE]T=/G EH/',
    'SU[GGES]=/G JH EH S/',
    '[GU]I=/G/',
    'EXA[GG]ER=/JH/',
    '[GG]=/G/',
    ' B#[G]=/G/',
    'ER[G]ER=/G/',
    '[G]ERN=/G/',
    'L[G]ER=/G/',
    '[G]ER =/G/',
    '[G]ERS=/G/',
    '[G]ERT=/G/',
    '[G]ERD=/G/',
    '[G]ERH=/G/',
    '[G]EL=/G/',
    'IE[G]EL=/G/',
    '[G]+=/JH/',
    '[GREAT]=/G R EY T/',
    '#[GH]=/ /',
    '[G]=/G/',
  ],
  H: [
    ' [HAVE] =/HH AE V/',
    ' [HAVING]=/HH AE V IH NG/',
    '[HERE] =/HH IY R/',
    '[HELLO]=/HH AH L OW/',
    ' [HONEY]=/HH AH N IY/',
    ' [HEIR]=/EH R/',
    ' [HON]OR=/AA N/',
    ' [HON]EST=/AA N/',
    ' [HMM]=/HH M/',
    ' [HOUR]=/AW ER/',
    ' [HEY] =/HH EY/',
    ' [HER] =/HH ER/',
    ' [HIM] =/HH IH M/',
    ' [HIS] =/HH IH Z/',
    '[HOW]=/HH AW/',
    '[H]#=/HH/',
    '[H]=/ /',
  ],
  I: [
    ' [INTO] =/IH N T UW/',
    '[ICCI] =/IY CH IY/',
    'CH[ILD]RE=/IH L D/',
    'LL[I]ON=/Y/',
    'M[I]CR=/AY/',
    'WH[I]TE=/AY/',
    '[I]DEA=/AY/',
    '[INI] =/IY N IY/',
    '[INO] =/IY N OW/',
    '[INA] =/IY N AH/',
    '[ISA] =/IY S AH/',
    '[IVA] =/IY V AH/',
    '[IMA] =/IY M AH/',
    '[ITO] =/IY T OW/',
    '[ITA] =/IY T AH/',
    '#:[IALLY]=/IY AX L IY/',
    '#:[IAL]=/IY AX L/',
    '#:[IATE]=/IY EY T/',
    '[INDS] =/AY N D Z/',
    '[IN]D =/AY N/',
    '#:R[IED] =/IY D/',
    '[IED] =/AY D/',
    'FR[IEN]=/EH N/',
    '[IE]F=/IY/',
    '[IE]G=/IY/',
    '[IE]V=/IY/',
    '[IE]C=/IY/',
    '[IE]W=/IY/',
    '[IE]P=/IY/',
    '[IE]B=/IY/',
    '[IE]L=/IY/',
    '[IE]^%=/IY/',
    ' :[I]%=/AY/',
    'QU[I]ET=/AY/',
    '[I]%=/IY/',
    '[IE]=/IY/',
    '[IAN] =/IY AX N/',
    '[IUM] =/IY AX M/',
    '[IA] =/IY AX/',
    '[IO] =/IY OW/',
    '[IFY]=/AX F AY/',
    '[ITY] =/AX T IY/',
    '[IBLE]=/AX B AX L/',
    '[IOUS]=/IY AX S/',
    ' [I]DE=/AY/',
    'L[I]KE=/AY/',
    'W[I]DE=/AY/',
    'W[I]SE=/AY/',
    'T[I]RE=/AY/',
    'R[I]PE=/AY/',
    'PR[I]CE=/AY/',
    'SP[I]TE=/AY/',
    'FF[I]CU=/AH/',
    'SP[IR]IT=/IH R/',
    '[I]^EM=/AY/',
    'OT[I]CE=/AH/',
    'RV[I]CE=/AH/',
    'EV[I]DE=/AH/',
    'CT[I]CE=/AH/',
    'ACR[I]F=/AH/',
    'LT[I]PL=/AH/',
    'DR[I]VE=/AY/',
    'GU[I]LD=/IH/',
    'UN[I]VE=/AH/',
    '[I]^+:#=/IH/',
    '[IRR]=/ER/',
    '[IR]#=/AY R/',
    '[IZ]%=/AY Z/',
    'ES[I]DE=/AH/',
    '[I]D%=/AY/',
    '[I]T%=/AY/',
    'T[I]VE=/IH/',
    'S[I]VE=/IH/',
    'AL[I]VE=/AY/',
    'L[I]VI=/IH/',
    'AM[I]LY=/AH/',
    'FF[I]CER=/AH/',
    'OM[I]NI=/AH/',
    'PRES[I]DE=/AH/',
    'UT[I]FU=/AH/',
    'D[I]VER=/AY/',
    '[I]^+=/AY/',
    '[IR]=/ER/',
    '[IGH]=/AY/',
    '[ILD]=/AY L D/',
    '[IGN] =/AY N/',
    '[IGN]^=/AY N/',
    '[IGN]%=/AY N/',
    '[IQUE]=/IY K/',
    '^[I] =/IY/',
    '#:[ISMS] =/IH Z AX M Z/',
    '#:[ISM] =/IH Z AX M/',
    'RM[I]NA=/AH/',
    'IM[I]NA=/AH/',
    'OM[I]NA=/AH/',
    'EM[I]NA=/AH/',
    'ED[I]CA=/AH/',
    'UN[I]CA=/AH/',
    'AM[I]NA=/AH/',
    'UM[I]NA=/AH/',
    'OL[I]DA=/AH/',
    'AN[I]MA=/AH/',
    'IN[I]ST=/AH/',
    'NT[I]MA=/AH/',
    'IC[I]PA=/AH/',
    'EC[I]FI=/AH/',
    'IL[I]TA=/AH/',
    'IM[I]TA=/AH/',
    'IG[I]TA=/AH/',
    'ON[I]TO=/AH/',
    'F[I]NA=/AY/',
    'ST[I]GA=/AH/',
    '[I]BLY=/AH/',
    'MP[I]ON=/IY/',
    '[I]NIZE=/AH/',
    'SS[I]BI=/AH/',
    '[ITLE] =/AY T AH L/',
    '[IDLE] =/AY D AH L/',
    '[I]=/IH/',
  ],
  J: ['[J]=/JH/'],
  K: [' [K]N=/ /', '[KK]=/K/', '[K]=/K/'],
  L: [
    ' [LOG] =/L AO G/',
    ' [LAS] =/L AA S/',
    '[LO]C#=/L OW/',
    'L[L]=/ /',
    '#:[LINE] =/L AY N/',
    '#:[LESSLY] =/L AX S L IY/',
    'UN[LESS]=/L EH S/',
    '#:[LESS] =/L AX S/',
    '[LING]=/L IH NX/',
    '#^:[L]ER=/L/',
    '#^:[L]EY=/L/',
    '[LEAD]=/L IY D/',
    'OB[L]EM=/L/',
    '#^:[L]ET=/L/',
    '#^:[L]%=/AX L/',
    '[LDT] =/L T/',
    '[LL]=/L/',
    'EA[L]IZ=/AH L/',
    '[L]=/L/',
  ],
  M: [
    ' [MONEY]=/M AH N IY/',
    ' [MON] =/M OW N/',
    ' [MRS]=/M IH S IH Z/',
    ' [MIX]=/M IH K S/',
    '[MOV]=/M UW V/',
    '[MBS] =/M Z/',
    '[MB] =/M/',
    ' [MN]=/N/',
    '[MN]ING=/M/',
    '[MN]ED=/M/',
    '[MN]S=/M/',
    '[MN] =/M/',
    '#:[MENTS] =/M AX N T S/',
    '#:[MENT] =/M AX N T/',
    '#:[MAN] =/M AX N/',
    '#:[MEN] =/M AX N/',
    '[MM]=/M/',
    '[M]=/M/',
  ],
  N: [
    ' [NAH] =/N AA/',
    ' [NOW]=/N AW/',
    'E[NG]+=/N JH/',
    '[NG]ING=/NX/',
    '[NG]ED=/NX/',
    'LI[NG]ER=/NX/',
    'NI[NG]ER=/NX/',
    'DI[NG]ER=/NX/',
    'RI[NG]ER=/NX/',
    'SI[NG]ER=/NX/',
    'TI[NG]ER=/NX/',
    'ZI[NG]ER=/NX/',
    'MI[NG]ER=/NX/',
    'BI[NG]ER=/NX/',
    '[NG]R=/NX G/',
    '[NG]#=/NX G/',
    '[NGL]%=/NX G AX L/',
    '[NG]=/NX/',
    '[NKC]=/NX K/',
    '[NK]=/NX K/',
    '#:[NESS] =/N AX S/',
    '[NDT] =/N T/',
    '[NN]=/N/',
    '[N]CT=/NG/',
    '[N]X=/NG/',
    '[N]=/N/',
  ],
  O: [
    ' [ONCE]=/W AH N S/',
    ' [ONES] =/W AH N Z/',
    'D[OE]S=/AH/',
    'D[ONE] =/AH N/',
    'G[ONE] =/AO N/',
    '#[ONE] =/W AH N/',
    '[OWSKI] =/AO F S K IY/',
    ' [O]CC=/AH/',
    ' [O]PP=/AH/',
    ' [ONLY]=/OW N L IY/',
    ' [ONE] =/W AH N/',
    ' [OUR]=/AW ER/',
    '[OROUGH]=/ER OW/',
    '#:[ORY] =/ER IY/',
    '#:[OR] =/ER/',
    '#:[ORS] =/ER Z/',
    '[ORR]=/AO R/',
    '[OR]=/AO R/',
    'T[OWN]=/AW N/',
    'D[OWN]=/AW N/',
    'R[OWN]=/AW N/',
    'G[OWN]=/AW N/',
    'P[OW]=/AW/',
    'C[OW]=/AW/',
    'V[OW]=/AW/',
    'F[OW]L=/AW/',
    'FL[OW]ER=/AW/',
    'T[OW]ER=/AW/',
    '[OW]=/OW/',
    'I[ONED] =/AX N D/',
    'I[ONING]=/AX N IH NX/',
    'I[ONER]=/AX N ER/',
    'I[ONERS]=/AX N ER Z/',
    'C[O]MP=/AH/',
    'C[O]MM=/AH/',
    'C[O]LL=/AH/',
    'M[O]N%=/AH/',
    'L[O]V=/AH/',
    'N[O]TH=/AH/',
    'T[O]GE=/AH/',
    'W[O]ND=/AH/',
    'PR[O]VE=/UW/',
    'C[O]MF=/AH/',
    'C[O]VE=/AH/',
    'PR[O]TE=/AH/',
    'PR[O]VI=/AH/',
    'PR[O]PO=/AH/',
    'PR[O]FE=/AH/',
    'PR[O]DU=/AH/',
    'PR[O]NO=/AH/',
    'G[O]VE=/AH/',
    'P[O]LI=/AH/',
    'SH[O]VE=/AH/',
    'AB[O]VE=/AH/',
    'M[O]DE=/AA/',
    ' [O]BS=/AH/',
    'D[O]G=/AO/',
    'N[O]MI=/AA/',
    ' [O]PEN=/OW/',
    ' [O]PE=/AA/',
    'M[O]NTH=/AH/',
    'N[O]NE=/AH/',
    'PR[O]PE=/AA/',
    'IS[O]NE=/AH/',
    'S[O]NE=/AH/',
    'PR[O]CE=/AH/',
    '[O]^%=/OW/',
    '[O]^EN=/OW/',
    '[O]^I#=/OW/',
    '[OLK]=/OW K/',
    '[OL]T=/OW L/',
    '[OL]D=/OW L/',
    '[OL]Z=/OW L/',
    '[OL]S=/OW L/',
    '[OL]B=/OW L/',
    '[OL]M=/OW L/',
    '[OL]N=/OW L/',
    '[OL]P=/OW L/',
    '[OUGHT]=/AO T/',
    'DR[OUGH]T=/AW/',
    'D[OUGH]=/OW/',
    'B[OUGH] =/AW/',
    'C[OUGH]=/AA F/',
    'T[OUGH] =/AH F/',
    'R[OUGH] =/AH F/',
    'N[OUGH] =/AH F/',
    '[OUGH] =/AW/',
    '[OUGH]=/AH F/',
    '[OUSE]=/AW S/',
    'H[OU]S#=/AW/',
    '[OUS]=/AX S/',
    '#:[OUR] =/ER/',
    '[OUR]=/AO R/',
    'W[OULD] =/UH D/',
    'C[OULD] =/UH D/',
    'SH[OULD] =/UH D/',
    '[OULD]=/OW L D/',
    '^[OU]^L=/AH/',
    '[OUP]=/UW P/',
    'T[OU]CH=/AH/',
    'Y[OU]NG=/AH/',
    '[OU]=/AW/',
    '[OY]=/OY/',
    '[OING]=/OW IH NX/',
    '[OI]=/OY/',
    '[OOR]=/AO R/',
    '[OOSE]=/UW S/',
    '[OOK]=/UH K/',
    'BL[OOD]=/AH D/',
    'F[OOD]=/UW D/',
    'FL[OOD]=/AH D/',
    'M[OOD]=/UW D/',
    'BR[OOD]=/UW D/',
    '[OOD]=/UH D/',
    '[OO]=/UW/',
    'SH[OE]=/UW/',
    '[OE]=/OW/',
    '#:[OH] =/OW/',
    '[O] =/OW/',
    '[OAR]=/AO R/',
    '[OA]=/OW/',
    '[O]NG=/AO/',
    'I[ON]=/AX N/',
    '#:[ON] =/AX N/',
    '#^[ON]=/AX N/',
    '[OSIS]=/OW S IH S/',
    '[O]ST =/OW/',
    '[O]S =/OW/',
    '[OFF]=/AO F/',
    '[OTHER]=/AH DH ER/',
    '#^:[OM]=/AH M/',
    '[OLOGY]=/AA L AH JH IY/',
    'T[O]DA=/AH/',
    'W[O]MA=/UH/',
    '[O]^A=/OW/',
    'C[O]LO=/AH/',
    '[O]^O=/OW/',
    '[O]BI=/OW/',
    '[O]TI=/OW/',
    '[O]SI=/OW/',
    '[O]GL=/OW/',
    '[O]FI=/OW/',
    '[O]KI=/OW/',
    'P[O]ST=/OW/',
    'CR[O]SS=/AO/',
    'FR[O]NT=/AH/',
    '#:[ONS] =/AH N Z/',
    '#:[OL] =/AO L/',
    'D[O]ZEN=/AH/',
    'TR[O]DU=/AH/',
    'M[O]NK=/AH/',
    'W[O]MAN=/UH/',
    'M[O]NGO=/AA/',
    'W[O]LF=/UH/',
    'L[O]FT=/AO/',
    'CR[O]FT=/AO/',
    '[O]BLIG=/AH/',
    'D[O]MEST=/AH/',
    'ST[O]ME=/AH/',
    '[O]LOGI=/AH/',
    '[O]NIZE=/AH/',
    '[O]NOMI=/AH/',
    '[O]CRAT=/AH/',
    '[O]SCOPE=/AH/',
    '[O]SCOPI=/AH/',
    '[O]PHOB=/AH/',
    '[O]LITH=/AH/',
    'DR[O]GEN=/AH/',
    '[OBLE] =/OW B AH L/',
    '[O]=/AA/',
    '#:[OT] =/AH T/',
  ],
  P: [
    ' [PF]=/F/',
    ' [PN]=/N/',
    ' [PS]=/S/',
    ' [PT]=/T/',
    '[PH]=/F/',
    '[PEOP]=/P IY P/',
    '[POW]=/P AW/',
    '[PUT] =/P UH T/',
    '[PP]=/P/',
    '[P]=/P/',
  ],
  Q: ['[QUAR]=/K W AO R/', '[QUA]L=/K W AA/', '[QUE] =/K/', '[QU]=/K W/', '[Q]=/K/'],
  R: [
    '[REALLY]=/R IH L IY/',
    ' [RAW] =/R AA/',
    ' [RE]ME=/R IH/',
    ' [RE]SP=/R IH/',
    ' [RE]QU=/R IH/',
    ' [RE]MA=/R IH/',
    ' [RE]TU=/R IH/',
    ' [RE]FU=/R IH/',
    ' [RE]GA=/R IH/',
    ' [RE]VE=/R IH/',
    ' [RE]GI=/R EH/',
    ' [RE]^#=/R IY/',
    '[ROLL]=/R OW L/',
    '[RH]=/R/',
    '[RDT] =/R T/',
    '[RR]=/R/',
    '[R]=/R/',
  ],
  S: [
    ' [SURE] =/SH UH R/',
    '[SORRY]=/S AA R IY/',
    ' [SWOR]D=/S AO R/',
    ' [SON] =/S AH N/',
    '[SH]=/SH/',
    '#[SION]=/ZH AX N/',
    '#:[SIDE] =/S AY D/',
    '[SCH]OO=/S K/',
    '[SOME]=/S AH M/',
    '#[SUR]#=/ZH ER/',
    '[SUR]#=/SH ER/',
    '#[SU]#=/ZH UW/',
    '#[SSU]#=/SH UW/',
    '#[SED] =/Z D/',
    '[S]IVE=/S/',
    'IU[S] =/S/',
    ' RE[S]#=/S/',
    ' DI[S]I=/S/',
    ' DI[S]O=/S/',
    ' DI[S]AR=/S/',
    ' DI[S]T=/S/',
    ' DI[S]AG=/S/',
    ' DI[S]EM=/S/',
    ' DI[S]AP=/S/',
    ' DI[S]AF=/S/',
    'MY[S]EL=/S/',
    'I[S]O=/S/',
    'O[S]O=/S/',
    'E[S]A=/S/',
    'O[S]A=/S/',
    'A[S]I=/S/',
    'Y[S]O=/S/',
    'E[S]O=/S/',
    'U[S]O=/S/',
    'Y[S]E=/S/',
    'E[S]E=/S/',
    'A[S]A=/S/',
    'I[S]A=/S/',
    'U[S]A=/S/',
    'E[S]I=/S/',
    'O[S]I=/S/',
    '#[S]#=/Z/',
    '[SAID]=/S EH D/',
    '^[SION]=/SH AX N/',
    '[S]S=/ /',
    'SE[S] =/AH Z/',
    'GE[S] =/AH Z/',
    '.[S] =/Z/',
    '#:.E[S] =/Z/',
    '#^:##[S] =/Z/',
    'A[S] =/Z/',
    'O[S] =/Z/',
    '#^:#[S] =/S/',
    'U[S] =/S/',
    ' :#[S] =/Z/',
    'AN[SWER]=/S ER/',
    '[SCH]=/SH/',
    '[S]C+=/ /',
    '[STLE]=/S AX L/',
    '#:[STEN]=/S AX N/',
    '#:[STEIN] =/S T AY N/',
    '#:[SON] =/S AX N/',
    '[SS]=/S/',
    'OB[S]ER=/Z/',
    'AB[S]OR=/Z/',
    'AB[S]OL=/Z/',
    'TRAN[S]#=/Z/',
    '[S]=/S/',
  ],
  T: [
    ' [THY] =/DH AY/',
    ' [THE] =/DH AX/',
    ' [THIS] =/DH IH S/',
    ' [THEY]=/DH EY/',
    ' [THERE]=/DH EH R/',
    ' [THEN]=/DH EH N/',
    ' [THAN] =/DH AE N/',
    ' [THEM] =/DH EH M/',
    ' [TWO]=/T UW/',
    '[THAT] =/DH AE T/',
    '[THER]=/DH ER/',
    '[THEIR]=/DH EH R/',
    '[THESE] =/DH IY Z/',
    '[THROUGH]=/TH R UW/',
    '[THOSE]=/DH OW Z/',
    '[THOUGH] =/DH OW/',
    '[TH]=/TH/',
    '#:[TED] =/T IH D/',
    'S[TI]#N=/CH/',
    '[TI]O=/SH/',
    '[TIAL]=/SH AX L/',
    '[TI]A=/SH/',
    '[TIEN]=/SH AX N/',
    '[TUR]#=/CH ER/',
    '[TU]A=/CH UW/',
    '[TZ]=/T S/',
    '[TSCH]=/CH/',
    '#:[TOWN] =/T AW N/',
    '#:[TIME] =/T AY M/',
    '[TCH]=/CH/',
    '#:[TTED] =/T IH D/',
    '[TT]=/T/',
    '[T]=/T/',
  ],
  U: [
    '[UCCIO] =/UW CH IY OW/',
    '[UCCI] =/UW CH IY/',
    '[ULLO] =/UW L OW/',
    '[UZZI] =/UW T S IY/',
    '[ULLI] =/UW L IY/',
    '[USSO] =/UW S OW/',
    ' [USE] =/Y UW S/',
    'IN[U]TE=/AH/',
    'TR[U]TH=/UW/',
    'P[U]LL=/UH/',
    'B[U]LL=/UH/',
    'P[U]SH=/UH/',
    ' [UGH] =/AH G/',
    ' [UN]IN=/AH N/',
    ' [UN]I=/Y UW N/',
    ' [UN]#=/AH N/',
    ' [UN]^=/AH N/',
    '[UIT]=/UW T/',
    '[URR]=/ER/',
    '@[UR]#=/UH R/',
    '[UR]#=/Y UH R/',
    '[UR]=/ER/',
    '[U]^ =/AH/',
    'C[U]SH=/UH/',
    'B[U]SH=/UH/',
    'P[U]NI=/AH/',
    '[U]^^=/AH/',
    '[UY]=/AY/',
    ' G[U]#=/ /',
    'G[U]%=/ /',
    'G[U]#=/W/',
    '#N[U]=/Y UW/',
    '[ULAT]=/Y AX L EY T/',
    '[ULOUS]=/Y AX L AH S/',
    '[ULUS]=/Y AX L AH S/',
    '[ULAR]=/Y AX L ER/',
    'ST[U]DY=/AH/',
    '@[U]=/UW/',
    '[U] =/UW/',
    '[U]=/Y UW/',
  ],
  V: [' [VON] =/V AO N/', '[VIEW]=/V Y UW/', '[VIOL]=/V AY AH L/', '[V]=/V/'],
  W: [
    ' [WANTED]=/W AO N T IH D/',
    '[WATER]=/W AO T ER/',
    ' [WON] =/W AH N/',
    '[WA]STE=/W EY/',
    '[WA]S=/W AA/',
    '[WA]T=/W AA/',
    '[WA]N=/W AA/',
    '[WA]M=/W AA/',
    '[WHERE]=/WH EH R/',
    '[WHAT]=/WH AH T/',
    '[WHOL]=/HH OW L/',
    '[WHO]=/HH UW/',
    '[WH]=/WH/',
    '#:[WARDS] =/W ER D Z/',
    '#:[WARD] =/W ER D/',
    '[WAR]=/W AO R/',
    '[WOR]^=/W ER/',
    ' [WOW]=/W AW/',
    '[WR]=/R/',
    '[W]=/W/',
  ],
  X: [' [X]#=/Z/', '[X]=/K S/'],
  Y: [
    '[YOUR]=/Y AO R/',
    '[YEAH] =/Y AE/',
    ' [YET] =/Y EH T/',
    ' [YES] =/Y EH S/',
    'H[Y]DR=/AY/',
    'H[Y]PE=/AY/',
    '#^:[Y] =/IY/',
    '#^:[Y]I=/IY/',
    ' :[Y] =/AY/',
    ' [YOU] =/Y UW/',
    ' [Y]#=/Y/',
    ' :[Y]#=/AY/',
    ' :[Y]^+:#=/IH/',
    ' :[Y]^#=/AY/',
    '[Y] =/IY/',
    'AW[Y]ER=/Y/',
    'DB[Y]E=/AY/',
    '[Y]=/IH/',
  ],
  Z: [' [ZERO]=/Z IH R OW/', '[ZZ]=/Z/', '[Z]=/Z/'],
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
  leftRe: RegExp | null; // null when left context is empty (always matches)
  rightRe: RegExp;
  target: string; // Target letters (e.g., "ASE") for fast pre-check
  targetLen: number;
  phonemes: string[]; // ARPAbet phonemes (empty array for silence)
  ruleStr: string; // Original NRL rule string
}

export interface G2PTraceStep {
  letters: string; // Target letters consumed (e.g., "ASE")
  rule: string; // Original NRL rule string (e.g., "[ASE] =/EY S/")
  phonemes: string[]; // ARPAbet output after stress (e.g., ["EY1", "S"])
}

export interface G2PTrace {
  phonemes: string[]; // Final ARPAbet (after stress prediction)
  steps: G2PTraceStep[]; // Rules that fired, in order
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Expand NRL context symbols into regex fragments. */
function expandContext(ctx: string): string {
  let result = '';
  for (const ch of ctx) {
    if (SPECIAL_CHARS.has(ch)) {
      result += CLASSES[ch]!;
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

  const leftCtx = m[1]!;
  const target = m[2]!;
  const rightCtx = m[3]!;
  const phonemeStr = m[4]!;

  // Build left regex (anchored at end of parsed text), null if no left context
  const leftPattern = expandContext(leftCtx);
  const leftRe = leftPattern.length > 0 ? new RegExp(leftPattern + '$') : null;

  // Build right regex with sticky flag (avoids substring allocation)
  // Sticky (y) anchors at lastIndex, so we set lastIndex = pos before testing
  const rightPattern = expandContext(rightCtx);
  const rightRe = new RegExp(escapeRegex(target) + rightPattern, 'y');

  // Parse phonemes: strip delimiters, split, map to ARPAbet
  const phonemes = phonemeStr
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .map(nrlToArpabet);

  return { leftRe, rightRe, target, targetLen: target.length, phonemes, ruleStr };
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
 * Converts a word to ARPAbet using NRL context-sensitive rules,
 * returning both the phonemes and a trace of which rules fired.
 */
export function wordToArpabetTraced(word: string): G2PTrace {
  // Pad with spaces for word-boundary matching
  const text = ' ' + word.toUpperCase() + ' ';
  const rawPhonemes: string[] = [];
  const rawSteps: { letters: string; ruleStr: string; count: number }[] = [];
  let pos = 1; // skip leading space

  while (pos < text.length - 1) {
    // trailing space is a boundary, not a character to process
    const ch = text[pos]!;

    // Look up rules for this letter
    const rules = COMPILED_RULES[ch] as CompiledRule[] | undefined;
    if (rules !== undefined) {
      let matched = false;
      // Lazily compute left context substring (only if a rule needs it)
      let parsed: string | null = null;
      for (const rule of rules) {
        // Fast pre-check: skip if target literal doesn't match at this position.
        // For multi-letter targets (e.g., "ALLO", "ASE"), this eliminates ~80% of
        // rules before any regex runs. Single-letter targets always pass since we
        // already indexed by first letter.
        if (rule.targetLen > 1 && !text.startsWith(rule.target, pos)) {
          continue;
        }
        // Use sticky regex for right context (avoids rest substring allocation)
        rule.rightRe.lastIndex = pos;
        // Skip left regex when null (no left context — always matches)
        if (
          (rule.leftRe === null ||
            ((parsed ??= text.substring(0, pos)), rule.leftRe.test(parsed))) &&
          rule.rightRe.test(text)
        ) {
          rawPhonemes.push(...rule.phonemes);
          rawSteps.push({
            letters: rule.target,
            ruleStr: rule.ruleStr,
            count: rule.phonemes.length,
          });
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

  const phonemes = applyStressPrediction(word, rawPhonemes);

  // Map post-stress phonemes back to each step
  const steps: G2PTraceStep[] = [];
  let offset = 0;
  for (const raw of rawSteps) {
    steps.push({
      letters: raw.letters,
      rule: raw.ruleStr,
      phonemes: phonemes.slice(offset, offset + raw.count),
    });
    offset += raw.count;
  }

  return { phonemes, steps };
}

/**
 * Converts a word to ARPAbet using NRL context-sensitive rules.
 *
 * @param word The word to convert
 * @returns Array of ARPAbet phonemes
 */
export function wordToArpabet(word: string): string[] {
  return wordToArpabetTraced(word).phonemes;
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
