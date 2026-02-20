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
    // Custom: common word fixes
    ' [AND] =/AH N D/',
    ' [ABOUT]=/AH B AW T/',
    ' [ANOTHER]=/AH N AH DH ER/',
    ' [ACTUALLY]=/AE K CH UW AH L IY/',
    ' [ABSOLUTELY]=/AE B S AH L UW T L IY/',
    ' [AMERICAN]=/AH M EH R AH K AH N/',
    ' [ASKING]=/AE S K IH NG/',
    ' [AHEAD]=/AH HH EH D/',
    ' [AMAZING]=/AH M EY Z IH NG/',
    ' [AFTERNOON]=/AE F T ER N UW N/',
    ' [ANYBODY]=/EH N IY B AH D IY/',
    ' [ANYONE]=/EH N IY W AH N/',
    ' [ASSHOLE]=/AE S HH OW L/',
    ' [ASLEEP]=/AH S L IY P/',
    ' [APOLOGIZE]=/AH P AA L AH JH AY Z/',
    ' [AREN] =/AA R AH N/',
    ' [AMEN] =/EY M EH N/',
    ' [AUDIENCE]=/AA D IY AH N S/',
    ' [AVAILABLE]=/AH V EY L AH B AH L/',
    ' [AMOUNT]=/AH M AW N T/',
    ' [ALICE]=/AE L AH S/',
    ' [ATTITUDE]=/AE T AH T UW D/',
    ' [ANCIENT]=/EY N CH AH N T/',
    ' [ACQUIRE]=/AH K W AY ER/',
    ' [APRIL]=/EY P R AH L/',
    ' [ARGUE]=/AA R G Y UW/',
    ' [AGENCY]=/EY JH AH N S IY/',
    ' [ANGER]=/AE NG G ER/',
    ' [ASSURE]=/AH SH UH R/',
    ' [AWFULLY]=/AA F L IY/',
    ' [ARRIVE]=/ER AY V/',
    ' [ANNIVERSARY]=/AE N AH V ER S ER IY/',
    ' [AFRICA]=/AE F R AH K AH/',
    ' [AMBULANCE]=/AE M B Y AH L AH N S/',
    ' [AUTHORITY]=/AH TH AO R AH T IY/',
    ' [ANDREW]=/AE N D R UW/',
    ' [ASIDE]=/AH S AY D/',
    ' [AVOID]=/AH V OY D/',
    ' [ABOVE]=/AH B AH V/',
    ' [APART]=/AH P AA R T/',
    ' [ARRIVED]=/ER AY V D/',
    ' [AGREED]=/AH G R IY D/',
    ' [AWARE]=/AH W EH R/',
    ' [ALLOWED]=/AH L AW D/',
    ' [ALLOW]=/AH L AW/',
    ' [ATTORNEY]=/AH T ER N IY/',
    ' [AYE] =/AY/',
    ' [ARREST]=/ER EH S T/',
    ' [AWFUL]=/AA F AH L/',
    ' [AUNT] =/AE N T/',
    ' [AMERICA]=/AH M EH R AH K AH/',
    ' [ADVICE]=/AE D V AY S/',
    ' [ADMIT]=/AH D M IH T/',
    ' [ACCEPT]=/AE K S EH P T/',
    ' [ACTING]=/AE K T IH NG/',
    ' [ADDRESS]=/AE D R EH S/',
    ' [APPRECIATE]=/AH P R IY SH IY EY T/',
    ' [ACCIDENT]=/AE K S AH D AH N T/',
    ' [AMONG]=/AH M AH NG/',
    ' [APPARENTLY]=/AH P EH R AH N T L IY/',
    ' [ANIMALS]=/AE N AH M AH L Z/',
    ' [ANIMAL]=/AE N AH M AH L/',
    ' [ANGELES]=/AE N JH AH L IH S/',
    ' [AWESOME]=/AA S AH M/',
    ' [ACCESS]=/AE K S EH S/',
    ' [ALLY] =/AE L AY/',
    ' [ALAN]=/AE L AH N/',
    ' [ALIEN]=/EY L IY AH N/',
    ' [ARTICLE]=/AA R T AH K AH L/',
    ' [ARGUMENT]=/AA R G Y AH M AH N T/',
    ' [AVENUE]=/AE V AH N UW/',
    ' [ACTUAL]=/AE K CH AH W AH L/',
    ' [ALCOHOL]=/AE L K AH HH AA L/',
    ' [ALLEY]=/AE L IY/',
    ' [ADVANCE]=/AH D V AE N S/',
    ' [AGO] =/AH G OW/',
    // Custom: -aste at word end → EY S T (taste, waste, paste, haste)
    // Must have word-end space to avoid breaking faster, master, disaster
    '[ASTE] =/EY S T/',
    // Custom: -ase at word end → EY S (base, case, chase — +4)
    '[ASE] =/EY S/',
    '[A] =/AX/',
    ' [ARE] =/AA R/',
    // Custom: AROU → ER AW (around, arouse, arousal — 6 words, freq 37K)
    ' [AROU]=/ER AW/',
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
    // Custom: LAUGH has unique pronunciation (laugh, laughing, laughter — AE F)
    // Space before L ensures we don't match slaughter, manslaughter
    ' L[AUGH]=/AE F/',
    // Custom: AUGH → AO (daughter, slaughter, taught, naught — GH silent, A→AO)
    '[AUGH]=/AO/',
    // Custom: AUER → AW ER (German names: bauer, sauer, lauer — 49 fix, 0 break)
    '[AUER]=/AW ER/',
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
    // Custom: common word fixes
    ' [BEEN] =/B IH N/',
    ' [BEAUTIFUL]=/B Y UW T AH F AH L/',
    ' [BETWEEN]=/B IH T W IY N/',
    ' [BREAKFAST]=/B R EH K F AH S T/',
    ' [BREATHE]=/B R IY DH/',
    ' [BREATH] =/B R EH TH/',
    ' [BREAK]=/B R EY K/',
    ' [BEYOND]=/B IH AA N D/',
    ' [BEAUTY]=/B Y UW T IY/',
    ' [BOTHER]=/B AA DH ER/',
    ' [BULLET]=/B UH L AH T/',
    ' [BRIAN]=/B R AY AH N/',
    ' [BRILLIANT]=/B R IH L Y AH N T/',
    ' [BURIED]=/B EH R IY D/',
    ' [BEGAN]=/B IH G AE N/',
    ' [BREATHING]=/B R IY DH IH NG/',
    ' [BULL] =/B UH L/',
    ' [BRITISH]=/B R IH T IH SH/',
    ' [BASEBALL]=/B EY S B AO L/',
    ' [BARBARA]=/B AA R B ER AH/',
    ' [BASKETBALL]=/B AE S K AH T B AO L/',
    ' [BEHAVIOR]=/B IH HH EY V Y ER/',
    ' [BURY]=/B EH R IY/',
    ' [BOW] =/B AW/',
    ' [BRAVO]=/B R AA V OW/',
    ' [BIBLE]=/B AY B AH L/',
    ' [BISHOP]=/B IH SH AH P/',
    ' [BODIES]=/B AA D IY Z/',
    ' [BOXES]=/B AA K S AH Z/',
    ' [BOND] =/B AA N D/',
    ' [BORROW]=/B AA R OW/',
    ' [BULLSHIT]=/B UH L SH IH T/',
    ' [BLOOD]=/B L AH D/',
    ' [BOSS] =/B AA S/',
    ' [BOUGHT]=/B AA T/',
    ' [BEAR] =/B EH R/',
    ' [BESIDES]=/B IH S AY D Z/',
    ' [BASTARD]=/B AE S T ER D/',
    ' [BUSINESS]=/B IH Z N AH S/',
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
    // Custom: common word fixes
    ' [CLOTHES] =/K L OW DH Z/',
    ' [CHRISTMAS]=/K R IH S M AH S/',
    ' [COFFEE]=/K AA F IY/',
    ' [CANNOT]=/K AE N AA T/',
    ' [CAPTAIN]=/K AE P T AH N/',
    ' [CAUGHT]=/K AA T/',
    ' [CERTAIN]=/S ER T AH N/',
    ' [CHILDREN]=/CH IH L D R AH N/',
    ' [CITY]=/S IH T IY/',
    ' [CLOSE] =/K L OW S/',
    ' [COUNTRY]=/K AH N T R IY/',
    ' [COLLEGE]=/K AA L IH JH/',
    ' [COMPANY]=/K AH M P AH N IY/',
    ' [COMPLETELY]=/K AH M P L IY T L IY/',
    ' [COMPUTER]=/K AH M P Y UW T ER/',
    ' [CONVERSATION]=/K AA N V ER S EY SH AH N/',
    ' [CORRECT]=/K ER EH K T/',
    ' [COMFORTABLE]=/K AH M F ER T AH B AH L/',
    ' [COMMAND]=/K AH M AE N D/',
    ' [CHINESE]=/CH AY N IY Z/',
    ' [CHICAGO]=/SH AH K AA G OW/',
    ' [CLOSER]=/K L OW S ER/',
    ' [CAREER]=/K ER IH R/',
    ' [CHOOSE]=/CH UW Z/',
    ' [CHARACTER]=/K EH R IH K T ER/',
    ' [COLOR]=/K AH L ER/',
    ' [CROWD]=/K R AW D/',
    ' [CREDIT]=/K R EH D AH T/',
    ' [CONTRACT]=/K AA N T R AE K T/',
    ' [CONTACT]=/K AA N T AE K T/',
    ' [COUSIN]=/K AH Z AH N/',
    ' [COMPLETE]=/K AH M P L IY T/',
    ' [CHARLES]=/CH AA R L Z/',
    ' [COST] =/K AA S T/',
    ' [CONSIDER]=/K AH N S IH D ER/',
    ' [CLIENT]=/K L AY AH N T/',
    ' [CHRISTOPHER]=/K R IH S T AH F ER/',
    ' [CHRISTIANITY]=/K R IH S CH IY AE N IH T IY/',
    ' [CHRISTIAN]=/K R IH S CH AH N/',
    ' [CHRIST]=/K R AY S T/',
    ' [CROSSING]=/K R AO S IH NG/',
    ' [CERTAINLY]=/S ER T AH N L IY/',
    ' [CONTROL]=/K AH N T R OW L/',
    ' [COLONEL]=/K ER N AH L/',
    ' [CONGRATULATIONS]=/K AH N G R AE CH AH L EY SH AH N Z/',
    ' [CHAMPAGNE]=/SH AE M P EY N/',
    ' [CHOCOLATE]=/CH AO K L AH T/',
    ' [CLOSET]=/K L AA Z AH T/',
    ' [CIGARETTE]=/S IH G ER EH T/',
    ' [CONNECTED]=/K AH N EH K T IH D/',
    ' [CONNECTION]=/K AH N EH K SH AH N/',
    ' [CONNECT]=/K AH N EH K T/',
    ' [CAROL]=/K AE R AH L/',
    ' [CLIMB]=/K L AY M/',
    ' [COMMUNITY]=/K AH M Y UW N AH T IY/',
    ' [COMPLICATED]=/K AA M P L AH K EY T AH D/',
    ' [CONFERENCE]=/K AA N F ER AH N S/',
    ' [CHINA]=/CH AY N AH/',
    ' [COS] =/K AO S/',
    ' [CELEBRATE]=/S EH L AH B R EY T/',
    ' [COMMITTED]=/K AH M IH T IH D/',
    ' [CREATED]=/K R IY EY T AH D/',
    ' [CREATE]=/K R IY EY T/',
    ' [COURAGE]=/K ER AH JH/',
    ' [CHARLOTTE]=/SH AA R L AH T/',
    ' [COMMITTEE]=/K AH M IH T IY/',
    ' [CHAMPION]=/CH AE M P IY AH N/',
    ' [COMPETITION]=/K AA M P AH T IH SH AH N/',
    ' [CAPABLE]=/K EY P AH B AH L/',
    ' [CASINO]=/K AH S IY N OW/',
    ' [COLLECTION]=/K AH L EH K SH AH N/',
    ' [COLLECT]=/K AH L EH K T/',
    ' [CHALLENGE]=/CH AE L AH N JH/',
    ' [CHLOE]=/K L OW IY/',
    ' [CHASING]=/CH EY S IH NG/',
    ' [CUSTODY]=/K AH S T AH D IY/',
    ' [COMMIT]=/K AH M IH T/',
    ' [COINCIDENCE]=/K OW IH N S IH D AH N S/',
    ' [CATHERINE]=/K AE TH ER AH N/',
    ' [CONTEST]=/K AA N T EH S T/',
    ' [CONFIDENCE]=/K AA N F AH D AH N S/',
    ' [CONCERT]=/K AA N S ER T/',
    ' [COMFORT]=/K AH M F ER T/',
    ' [COUNCIL]=/K AW N S AH L/',
    ' [CRISIS]=/K R AY S AH S/',
    ' [CROSSED]=/K R AO S T/',
    ' [CABIN]=/K AE B AH N/',
    ' [CAREFULLY]=/K EH R F AH L IY/',
    ' [CUSTOMERS]=/K AH S T AH M ER Z/',
    ' [CLEARED]=/K L IH R D/',
    ' [CHARITY]=/CH EH R IH T IY/',
    ' [CLOWN]=/K L AW N/',
    ' [CIVIL]=/S IH V AH L/',
    ' [CEREMONY]=/S EH R AH M OW N IY/',
    ' [CONNIE]=/K AO N IY/',
    ' [CONFESS]=/K AH N F EH S/',
    ' [COMMERCIAL]=/K AH M ER SH AH L/',
    ' [CONCENTRATE]=/K AA N S AH N T R EY T/',
    ' [CORPORAL]=/K AO R P ER AH L/',
    ' [CLEARLY]=/K L IH R L IY/',
    ' [CALIFORNIA]=/K AE L AH F AO R N Y AH/',
    ' [CRIMINAL]=/K R IH M AH N AH L/',
    ' [CAUSED]=/K AA Z D/',
    ' [CAUSE] =/K AA Z/',
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
    // Custom: common word fixes
    ' [DON] =/D AA N/',
    ' [DONE] =/D AH N/',
    ' [DOG] =/D AO G/',
    ' [DOLLARS]=/D AA L ER Z/',
    ' [DEFINITELY]=/D EH F AH N AH T L IY/',
    ' [DIFFICULT]=/D IH F AH K AH L T/',
    ' [DIRECTOR]=/D ER EH K T ER/',
    ' [DISEASE]=/D IH Z IY Z/',
    ' [DESPERATE]=/D EH S P R IH T/',
    ' [DECENT]=/D IY S AH N T/',
    ' [DESERT]=/D EH Z ER T/',
    ' [DROVE]=/D R OW V/',
    ' [DATA]=/D EY T AH/',
    ' [DESIRE]=/D IH Z AY ER/',
    ' [DISAPPEARED]=/D IH S AH P IH R D/',
    ' [DIRECTION]=/D ER EH K SH AH N/',
    ' [DIRECT]=/D ER EH K T/',
    ' [DOZEN]=/D AH Z AH N/',
    ' [DESTINY]=/D EH S T AH N IY/',
    ' [DONNA]=/D AA N AH/',
    ' [DISAPPOINTED]=/D IH S AH P OY N T IH D/',
    ' [DISAPPOINT]=/D IH S AH P OY N T/',
    ' [DANIEL]=/D AE N Y AH L/',
    ' [DENY]=/D IH N AY/',
    ' [DIAMOND]=/D AY M AH N D/',
    ' [DRAMA]=/D R AA M AH/',
    ' [DEVICE]=/D IH V AY S/',
    ' [DEGREES]=/D IH G R IY Z/',
    ' [DEVON]=/D EH V AH N/',
    ' [DAPHNE]=/D AE F N IY/',
    ' [DAVIS]=/D EY V AH S/',
    ' [DISASTER]=/D IH Z AE S T ER/',
    ' [DESCRIBE]=/D IH S K R AY B/',
    ' [DOROTHY]=/D AO R AH TH IY/',
    ' [DONALD]=/D AA N AH L D/',
    ' [DEPRESSED]=/D IH P R EH S T/',
    ' [DEPUTY]=/D EH P Y AH T IY/',
    ' [DEMON]=/D IY M AH N/',
    ' [DAMAGE]=/D AE M AH JH/',
    ' [DESTROY]=/D IH S T R OY/',
    ' [DEVIL]=/D EH V AH L/',
    ' [DEATH]=/D EH TH/',
    ' [DAVID]=/D EY V IH D/',
    '#:[DED] =/D IH D/',
    // Custom: DH at word start → D only (dhabi, dharma, dhillon — Arabic/Hindi origin, H silent)
    "' [DH]=/D/",
    '.E[D] =/D/',
    '#^:E[D] =/T/',
    // Custom: DIAG root → D AY AH G (diagnose, diagonal, diagram — Greek origin)
    '[DIAG]=/D AY AH G/',
    // Custom: DIAL root → D AY AH L (dial, dialect, dialogue — Greek origin)
    '[DIAL]=/D AY AH L/',
    ' [DE]^#=/D IH/',
    ' [DO] =/D UW/',
    ' [DOES]=/D AH Z/',
    ' [DOING]=/D UW IH NX/',
    ' [DOW]=/D AW/',
    '[DU]A=/JH UW/',
    // Custom: DG before front vowel → JH (badge, bridging, edging, judging)
    '[DG]+=/JH/',
    // Custom: DJ → JH (adjoin, adjust, adjacent)
    '[DJ]=/JH/',
    // Custom: doubled DD before -ed at word end → D IH D (added, budded, studded)
    '#:[DDED] =/D IH D/',
    // Custom: collapse doubled DD
    '[DD]=/D/',
    // Custom: silent D in German -ardt suffix (barnhardt, bernhardt, borgwardt — 20 words)
    '[D]T =/ /',
    '[D]=/D/',
  ],
  E: [
    // Custom: common word fixes
    ' [ENOUGH]=/IH N AH F/',
    ' [EITHER]=/IY DH ER/',
    ' [EVIL]=/IY V AH L/',
    ' [ENGLISH]=/IH NG G L IH SH/',
    ' [ENTIRE]=/IH N T AY ER/',
    ' [EMERGENCY]=/IH M ER JH AH N S IY/',
    ' [EXCELLENT]=/EH K S AH L AH N T/',
    ' [EVERYWHERE]=/EH V R IY W EH R/',
    ' [EXTRA]=/EH K S T R AH/',
    ' [ESPECIALLY]=/AH S P EH SH L IY/',
    ' [ECHO]=/EH K OW/',
    ' [EVERYONE]=/EH V R IY W AH N/',
    ' [EVENING]=/IY V N IH NG/',
    ' [EVIDENCE]=/EH V AH D AH N S/',
    ' [EXCUSE]=/IH K S K Y UW S/',
    ' [EXCEPT]=/IH K S EH P T/',
    ' [EXPERIENCE]=/IH K S P IH R IY AH N S/',
    ' [ELEVATOR]=/EH L AH V EY T ER/',
    ' [ELIZABETH]=/IH L IH Z AH B AH TH/',
    ' [EMBARRASSING]=/IH M B EH R AH S IH NG/',
    ' [EMBARRASS]=/IH M B EH R AH S/',
    ' [EFFECT]=/IH F EH K T/',
    ' [EXTREMELY]=/EH K S T R IY M L IY/',
    ' [EMOTIONAL]=/IH M OW SH AH N AH L/',
    ' [ESTATE]=/IH S T EY T/',
    ' [EXPERT]=/EH K S P ER T/',
    ' [EMPIRE]=/EH M P AY ER/',
    ' [EDUCATION]=/EH JH AH K EY SH AH N/',
    ' [EFFORT]=/EH F ER T/',
    ' [EXERCISE]=/EH K S ER S AY Z/',
    ' [ENEMIES]=/EH N AH M IY Z/',
    ' [EXPRESS]=/IH K S P R EH S/',
    ' [EXPLANATION]=/EH K S P L AH N EY SH AH N/',
    ' [EASILY]=/IY Z AH L IY/',
    ' [EVENTUALLY]=/IH V EH N CH AH W AH L IY/',
    ' [EVENT]=/IH V EH N T/',
    ' [EVEN]=/IY V IH N/',
    ' [EVERYTHING]=/EH V R IY TH IH NG/',
    ' [EVERYBODY]=/EH V R IY B AA D IY/',
    ' [EXCITED]=/IH K S AY T AH D/',
    ' [EXCITING]=/IH K S AY T IH NG/',
    ' [EXPECTED]=/IH K S P EH K T AH D/',
    ' [ESCAPED]=/IH S K EY P T/',
    ' [ESCAPE]=/IH S K EY P/',
    ' [EQUIPMENT]=/IH K W IH P M AH N T/',
    ' [ENGAGED]=/EH N G EY JH D/',
    ' [ENGAGE]=/EH N G EY JH/',
    ' [EUROPE]=/Y UH R AH P/',
    ' [EUROPEAN]=/Y UH R AH P IY AH N/',
    ' [ENEMY]=/EH N AH M IY/',
    ' [ENGLAND]=/IH NG G L AH N D/',
    ' [ENERGY]=/EH N ER JH IY/',
    ' [ENGINE]=/EH N JH AH N/',
    ' [EAR] =/IY R/',
    ' [EARS] =/IH R Z/',
    // Custom: EXH → IH G Z (exhaust, exhibit, exhort — H is silent, X voices to GZ)
    ' [EXH]=/IH G Z/',
    // Custom: EX before vowel → IH G Z (exact, exam, exist — 73% GZ in CMU)
    ' [EX]#=/IH G Z/',
    '#:[E] =/ /',
    "' ^:[E] =/ /",
    ' :[E] =/IY/',
    '#[ED] =/D/',
    // Custom: past tense -ed after T or D needs extra syllable (belted, fated, bonded, grounded)
    // Without this, #:[E]D silences the E, producing T D instead of T IH D
    'T[ED] =/IH D/',
    'D[ED] =/IH D/',
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
    // Custom: EX- prefix before consonant (exact, example, express — +36/+89)
    ' [EX]^=/IH K S/',
    // Custom: word-end -els/-ets/-ems/-em/-et with schwa (models, tickets, problems)
    '#:[ELS] =/AX L Z/',
    '#:[ETS] =/AH T S/',
    '#:[EMS] =/AX M Z/',
    '#:[EM] =/AX M/',
    '#:[ET] =/AH T/',
    '[E]=/EH/',
  ],
  F: [
    // Custom: common word fixes
    ' [FROM] =/F R AH M/',
    ' [FORGOTTEN]=/F ER G AA T AH N/',
    ' [FORGIVE]=/F ER G IH V/',
    ' [FORGET]=/F ER G EH T/',
    ' [FORGOT]=/F ER G AA T/',
    ' [FOREVER]=/F ER EH V ER/',
    ' [FANTASTIC]=/F AE N T AE S T IH K/',
    ' [FINAL]=/F AY N AH L/',
    ' [FINDING]=/F AY N D IH NG/',
    ' [FINGER]=/F IH NG G ER/',
    ' [FOOTBALL]=/F UH T B AO L/',
    ' [FRIDAY]=/F R AY D IY/',
    ' [FAMOUS]=/F EY M AH S/',
    ' [FALLING]=/F AA L IH NG/',
    ' [FAMILIAR]=/F AH M IH L Y ER/',
    ' [FORTUNE]=/F AO R CH AH N/',
    ' [FINDS]=/F AY N D Z/',
    ' [FIXED]=/F IH K S T/',
    ' [FEMALE]=/F IY M EY L/',
    ' [FELLAS]=/F EH L AH S/',
    ' [FIRED]=/F AY ER D/',
    ' [FLOWER]=/F L AW ER/',
    ' [FIRE] =/F AY ER/',
    ' [FIRES]=/F AY ER Z/',
    ' [FLOWERS]=/F L AW ER Z/',
    ' [FEDERAL]=/F EH D ER AH L/',
    ' [FOREIGN]=/F AO R AH N/',
    ' [FRASIER]=/F R EY ZH ER/',
    ' [FAILURE]=/F EY L Y ER/',
    ' [FEVER]=/F IY V ER/',
    ' [FASHION]=/F AE SH AH N/',
    ' [FAVOUR]=/F EY V ER/',
    ' [FLORIDA]=/F L AO R AH D AH/',
    ' [FALLEN]=/F AA L AH N/',
    ' [FELICITY]=/F IH L IH S AH T IY/',
    ' [FRANCISCO]=/F R AE N S IH S K OW/',
    ' [FRANCIS]=/F R AE N S AH S/',
    ' [FANTASY]=/F AE N T AH S IY/',
    ' [FOOT] =/F UH T/',
    ' [FAVORITE]=/F EY V ER IH T/',
    ' [FAVOR]=/F EY V ER/',
    ' [FATHER]=/F AA DH ER/',
    ' [FAMILY]=/F AE M AH L IY/',
    ' [FINALLY]=/F AY N AH L IY/',
    ' [FIGURE]=/F IH G Y ER/',
    ' [FINISH]=/F IH N IH SH/',
    ' [FOOD] =/F UW D/',
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
    // Custom: common word fixes
    ' [GONNA]=/G AA N AH/',
    ' [GONE] =/G AO N/',
    ' [GOODBYE]=/G UH D B AY/',
    ' [GAS] =/G AE S/',
    ' [GUEST]=/G EH S T/',
    ' [GEORGE]=/JH AO R JH/',
    ' [GOVERNMENT]=/G AH V ER M AH N T/',
    ' [GUESS] =/G EH S/',
    ' [GUESSING]=/G EH S IH NG/',
    ' [GENERAL]=/JH EH N ER AH L/',
    ' [GERMAN]=/JH ER M AH N/',
    ' [GENTLEMEN]=/JH EH N T AH L M IH N/',
    ' [GENIUS]=/JH IY N Y AH S/',
    ' [GRANDMA]=/G R AE N D M AA/',
    ' [GRANDPA]=/G R AE N D P AA/',
    ' [GLASSES]=/G L AE S AH Z/',
    ' [GODDAMN]=/G AA D AE M/',
    ' [GIANT]=/JH AY AH N T/',
    ' [GRATEFUL]=/G R EY T F AH L/',
    ' [GARAGE]=/G ER AA ZH/',
    ' [GOLF]=/G AA L F/',
    ' [GROWN]=/G R OW N/',
    ' [GIMME]=/G IH M IY/',
    ' [GORGEOUS]=/G AO R JH AH S/',
    ' [GEORGIA]=/JH AO R JH AH/',
    ' [GENEROUS]=/JH EH N ER AH S/',
    ' [GEAR] =/G IH R/',
    ' [GAMBLING]=/G AE M B AH L IH NG/',
    ' [GUITAR]=/G IH T AA R/',
    ' [GRANDFATHER]=/G R AE N D F AA DH ER/',
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
    // Custom: GEI at word start → G AY (German: geiger, geist — hard G, 20 fix, 0 break)
    "' [GEI]=/G AY/",
    '[G]+=/JH/',
    '[GREAT]=/G R EY T/',
    '#[GH]=/ /',
    '[G]=/G/',
  ],
  H: [
    // Custom: common word fixes
    ' [HEY] =/HH EY/',
    ' [HI] =/HH AY/',
    ' [HELLO]=/HH AH L OW/',
    ' [HEART]=/HH AA R T/',
    ' [HONEST]=/AA N AH S T/',
    ' [HOLY]=/HH OW L IY/',
    ' [HERO]=/HH IH R OW/',
    ' [HEAVY]=/HH EH V IY/',
    ' [HEALTH]=/HH EH L TH/',
    ' [HELEN]=/HH EH L AH N/',
    ' [HUNDRED]=/HH AH N D R AH D/',
    ' [HARRY]=/HH EH R IY/',
    ' [HEAVEN]=/HH EH V AH N/',
    ' [HANGING]=/HH AE NG IH NG/',
    ' [HUSBAND]=/HH AH Z B AH N D/',
    ' [HONEY]=/HH AH N IY/',
    ' [HONOR]=/AA N ER/',
    ' [HOTEL]=/HH OW T EH L/',
    ' [HANDSOME]=/HH AE N S AH M/',
    ' [HAVEN]=/HH EY V AH N/',
    ' [HMM] =/HH M/',
    ' [HOLLYWOOD]=/HH AA L IY W UH D/',
    ' [HIRE]=/HH AY ER/',
    ' [HIRED]=/HH AY ER D/',
    ' [HOLMES]=/HH OW M Z/',
    ' [HAROLD]=/HH EH R AH L D/',
    ' [HAPPINESS]=/HH AE P IY N AH S/',
    ' [HONOUR]=/AA N ER/',
    ' [HERCULES]=/HH ER K Y AH L IY Z/',
    ' [HOLIDAY]=/HH AA L AH D EY/',
    ' [HON] =/HH AA N/',
    ' [HOUSES]=/HH AW S AH Z/',
    ' [HEAR] =/HH IY R/',
    ' [HEARD] =/HH ER D/',
    ' [HEARING]=/HH IY R IH NG/',
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
    // Custom: common word fixes
    ' [INTO] =/IH N T UW/',
    ' [IMAGINE]=/IH M AE JH AH N/',
    ' [ISLAND]=/AY L AH N D/',
    ' [INSURANCE]=/IH N SH UH R AH N S/',
    ' [IDIOT]=/IH D IY AH T/',
    ' [ILLEGAL]=/IH L IY G AH L/',
    ' [IMAGE]=/IH M AH JH/',
    ' [IRON]=/AY ER N/',
    ' [IDENTIFY]=/AY D EH N T AH F AY/',
    ' [INCIDENT]=/IH N S AH D AH N T/',
    ' [INTERRUPT]=/IH N T ER AH P T/',
    ' [IMMEDIATELY]=/IH M IY D IY AH T L IY/',
    ' [INNOCENT]=/IH N AH S AH N T/',
    ' [INTEREST]=/IH N T R AH S T/',
    ' [INFORMATION]=/IH N F ER M EY SH AH N/',
    ' [INTERESTING]=/IH N T R AH S T IH NG/',
    ' [INTRODUCE]=/IH N T R AH D UW S/',
    ' [INVITED]=/IH N V AY T AH D/',
    ' [INTERESTED]=/IH N T R AH S T IH D/',
    // Custom: ISO- prefix → AY S AH (isolate, isomer, isobar — Greek origin)
    ' [ISO]=/AY S AH/',
    // Custom: IDEA root → AY D IY (idea, ideal, idealism)
    ' [IDEA]=/AY D IY AH/',
    // Custom: ID at word start → AY D (identify, identity, idle, idol — 74% AY, +12 net)
    "' [ID]=/AY D/",
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
    // Custom: INDS at word end → AY N D Z (kinds, minds, finds, blinds, grinds)
    '[INDS] =/AY N D Z/',
    '[IN]D =/AY N/',
    '[IER]=/IY ER/',
    '#:R[IED] =/IY D/',
    '[IED] =/AY D/',
    // Custom: FRIEN → EH N (friend, boyfriend, friendly — 16 words, freq 47K)
    'FR[IEN]=/EH N/',
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
  J: [
    ' [JOHNNY]=/JH AA N IY/',
    ' [JOHN]=/JH AA N/',
    ' [JESUS]=/JH IY Z AH S/',
    ' [JEALOUS]=/JH EH L AH S/',
    ' [JAPANESE]=/JH AE P AH N IY Z/',
    ' [JESSE]=/JH EH S IY/',
    ' [JUICE]=/JH UW S/',
    ' [JUSTICE]=/JH AH S T AH S/',
    ' [JOSEPH]=/JH OW S AH F/',
    ' [JANET]=/JH AE N AH T/',
    ' [JUDGMENT]=/JH AH JH M AH N T/',
    ' [JOURNEY]=/JH ER N IY/',
    ' [JERSEY]=/JH ER Z IY/',
    ' [JUNIOR]=/JH UW N Y ER/',
    '[J]=/JH/',
  ],
  K: [
    ' [KNOWLEDGE]=/N AA L AH JH/',
    ' [K]N=/ /',
    // Custom: KH at word start → K (khan, khaki, khmer — Arabic/Persian origin, H silent)
    ' [KH]=/K/',
    '[KK]=/K/',
    '[K]=/K/',
  ],
  L: [
    ' [LOST] =/L AO S T/',
    ' [LOSE] =/L UW Z/',
    ' [LOSING]=/L UW Z IH NG/',
    ' [LIVED] =/L IH V D/',
    ' [LIVING]=/L IH V IH NG/',
    ' [LIVES]=/L IH V Z/',
    ' [LEVEL]=/L EH V AH L/',
    ' [LEAD] =/L EH D/',
    ' [LARRY]=/L EH R IY/',
    ' [LAWYER]=/L AO Y ER/',
    ' [LONGER]=/L AO NG G ER/',
    ' [LICENSE]=/L AY S AH N S/',
    ' [LEGAL]=/L IY G AH L/',
    ' [LIAR]=/L AY ER/',
    ' [LIKELY]=/L AY K L IY/',
    ' [LILY]=/L IH L IY/',
    ' [LOSER]=/L UW Z ER/',
    ' [LOUIS]=/L UW IH S/',
    ' [LINCOLN]=/L IH NG K AH N/',
    ' [LAS] =/L AA S/',
    ' [LIFETIME]=/L AY F T AY M/',
    ' [LIBRARY]=/L AY B R EH R IY/',
    ' [LEGEND]=/L EH JH AH N D/',
    ' [LIQUOR]=/L IH K ER/',
    ' [LOUSY]=/L AW Z IY/',
    ' [LANGUAGE]=/L AE NG G W AH JH/',
    ' [LATELY]=/L EY T L IY/',
    ' [LIEUTENANT]=/L UW T EH N AH N T/',
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
    // Custom: common word fixes
    ' [MAYBE]=/M EY B IY/',
    ' [MONEY]=/M AH N IY/',
    ' [MARRIAGE]=/M EH R IH JH/',
    ' [MARRIED]=/M EH R IY D/',
    ' [MARRY] =/M EH R IY/',
    ' [MACHINE]=/M AH SH IY N/',
    ' [MICHAEL]=/M AY K AH L/',
    ' [MRS]=/M IH S IH Z/',
    ' [MEDICAL]=/M EH D AH K AH L/',
    ' [MINUTES]=/M IH N AH T S/',
    ' [MINUTE] =/M IH N AH T/',
    ' [MYSELF]=/M AY S EH L F/',
    ' [MAJOR]=/M EY JH ER/',
    ' [MAMA]=/M AA M AH/',
    ' [MEANT] =/M EH N T/',
    ' [MONSTER]=/M AA N S T ER/',
    ' [MOUNTAIN]=/M AW N T AH N/',
    ' [MESSAGES]=/M EH S AH JH AH Z/',
    ' [MESSAGE]=/M EH S AH JH/',
    ' [MATERIAL]=/M AH T IH R IY AH L/',
    ' [MINISTER]=/M IH N AH S T ER/',
    ' [MANAGED]=/M AE N AH JH D/',
    ' [MANAGE]=/M AE N AH JH/',
    ' [MARRYING]=/M EH R IY IH NG/',
    ' [MIAMI]=/M AY AE M IY/',
    ' [MERELY]=/M IH R L IY/',
    ' [MODEL]=/M AA D AH L/',
    ' [MARGARET]=/M AA R G ER IH T/',
    ' [MILLION]=/M IH L Y AH N/',
    ' [MILITARY]=/M IH L AH T EH R IY/',
    ' [MAGAZINE]=/M AE G AH Z IY N/',
    ' [MARTIN]=/M AA R T AH N/',
    ' [MEDICINE]=/M EH D AH S AH N/',
    ' [MOOD] =/M UW D/',
    ' [MONDAY]=/M AH N D IY/',
    ' [MANAGER]=/M AE N AH JH ER/',
    ' [MOSTLY]=/M OW S T L IY/',
    ' [MARSHALL]=/M AA R SH AH L/',
    ' [MIRROR]=/M IH R ER/',
    ' [MIRACLE]=/M IH R AH K AH L/',
    ' [MARIA]=/M ER IY AH/',
    ' [MEDIA]=/M IY D IY AH/',
    ' [MEMORIES]=/M EH M ER IY Z/',
    ' [MIXED]=/M IH K S T/',
    ' [MONICA]=/M AA N IH K AH/',
    ' [MODERN]=/M AA D ER N/',
    ' [MOTEL]=/M OW T EH L/',
    ' [MUSEUM]=/M Y UW Z IY AH M/',
    ' [MARIE]=/M ER IY/',
    ' [MAJESTY]=/M AE JH AH S T IY/',
    ' [MADAME]=/M AE D AH M/',
    ' [MONSIEUR]=/M AH S Y ER/',
    ' [MEXICO]=/M EH K S AH K OW/',
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
    // Custom: common word fixes
    ' [NOTHING]=/N AH TH IH NG/',
    ' [NEITHER]=/N IY DH ER/',
    ' [NOTICE]=/N OW T AH S/',
    ' [NONE] =/N AH N/',
    ' [NAKED]=/N EY K AH D/',
    ' [NATIONAL]=/N AE SH AH N AH L/',
    ' [NATURE]=/N EY CH ER/',
    ' [NEIGHBORHOOD]=/N EY B ER HH UH D/',
    ' [NOWHERE]=/N OW W EH R/',
    ' [NONSENSE]=/N AA N S EH N S/',
    ' [NAH] =/N AA/',
    ' [NUCLEAR]=/N UW K L IY ER/',
    ' [NOEL]=/N OW EH L/',
    ' [NEWSPAPER]=/N UW Z P EY P ER/',
    ' [NATURALLY]=/N AE CH ER AH L IY/',
    ' [NEPHEW]=/N EH F Y UW/',
    ' [NEARLY]=/N IH R L IY/',
    ' [NECESSARY]=/N EH S AH S EH R IY/',
    ' [NEEDED]=/N IY D AH D/',
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
    // Custom: common word fixes
    ' [OFFICER]=/AO F AH S ER/',
    ' [OFFICE]=/AO F IH S/',
    ' [OBVIOUS]=/AA B V IY AH S/',
    ' [OBVIOUSLY]=/AA B V IY AH S L IY/',
    ' [OCEAN]=/OW SH AH N/',
    ' [OPERATION]=/AA P ER EY SH AH N/',
    ' [OPPORTUNITY]=/AA P ER T UW N AH T IY/',
    ' [OPINION]=/AH P IH N Y AH N/',
    ' [OFTEN]=/AO F AH N/',
    ' [ORIGINAL]=/ER IH JH AH N AH L/',
    ' [OFFICIAL]=/AH F IH SH AH L/',
    ' [OBJECTION]=/AH B JH EH K SH AH N/',
    ' [ORANGE]=/AO R AH N JH/',
    ' [OBJECT]=/AA B JH EH K T/',
    ' [OSCAR]=/AO S K ER/',
    ' [OPERATOR]=/AA P ER EY T ER/',
    ' [OPERA]=/AA P R AH/',
    ' [ORDINARY]=/AO R D AH N EH R IY/',
    ' [OCCASION]=/AH K EY ZH AH N/',
    ' [OFFENSE]=/AH F EH N S/',
    ' [OUTTA]=/UW T AH/',
    ' [OURSELVES]=/AW ER S EH L V Z/',
    ' [OURS] =/AW ER Z/',
    ' [OUR] =/AW ER/',
    ' [ONTO]=/AA N T UW/',
    ' [OK] =/OW K EY/',
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
    // Custom: consonant+OWN → AW N (town, down, brown, gown — 80%+ AW)
    'T[OWN]=/AW N/',
    'D[OWN]=/AW N/',
    'R[OWN]=/AW N/',
    'G[OWN]=/AW N/',
    // Custom: OW → AW after certain consonants (pow, cow, vow, fowl)
    // Note: H[OW] can't be used because SH ends with H (breaks show, shower)
    'P[OW]=/AW/',
    'C[OW]=/AW/',
    'V[OW]=/AW/',
    'F[OW]L=/AW/',
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
    // Custom: cough → K AA F (cough, coughing, coughed)
    'C[OUGH]=/AA F/',
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
    // Custom: OAR → AO R (board, oar, soar, roar — OA before R is always AO)
    '[OAR]=/AO R/',
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
    '[O]LI=/OW/',
    '[O]H=/OW/',
    // Custom: OB- prefix (observe, obtain, object — +33 SL)
    ' [OB]^=/AH B/',
    // Custom: word-end -ons/-ol/-ot with schwa (persons, control, carrot)
    '#:[ONS] =/AH N Z/',
    '#:[OL] =/AO L/',
    '#:[OT] =/AH T/',
    '[O]=/AA/',
  ],
  P: [
    // Custom: common word fixes
    ' [POLICE]=/P AH L IY S/',
    ' [POSSIBLY]=/P AA S AH B L IY/',
    ' [POSITION]=/P AH Z IH SH AH N/',
    ' [PRESIDENT]=/P R EH Z AH D EH N T/',
    ' [PROBABLY]=/P R AA B AH B L IY/',
    ' [PROJECT]=/P R AA JH EH K T/',
    ' [PRINCESS]=/P R IH N S EH S/',
    ' [PLANET]=/P L AE N AH T/',
    ' [PRACTICE]=/P R AE K T AH S/',
    ' [PREPARED]=/P R IY P EH R D/',
    ' [PREPARE]=/P R IY P EH R/',
    ' [PERFECTLY]=/P ER F AH K T L IY/',
    ' [PAPA]=/P AA P AH/',
    ' [PHOEBE]=/F IY B IY/',
    ' [PERSONALLY]=/P ER S AH N AH L IY/',
    ' [POLITICS]=/P AA L AH T IH K S/',
    ' [PERSONNEL]=/P ER S AH N EH L/',
    ' [PRAYER]=/P R EH R/',
    ' [PROCEDURE]=/P R AH S IY JH ER/',
    ' [PIZZA]=/P IY T S AH/',
    ' [PROFESSIONAL]=/P R AH F EH SH AH N AH L/',
    ' [POSITIVE]=/P AA Z AH T IH V/',
    ' [PROPERTY]=/P R AA P ER T IY/',
    ' [PURPOSE]=/P ER P AH S/',
    ' [PLACES]=/P L EY S AH Z/',
    ' [PIECES]=/P IY S AH Z/',
    ' [PREFER]=/P R AH F ER/',
    ' [PROGRAM]=/P R OW G R AE M/',
    ' [PRIVATE]=/P R AY V AH T/',
    ' [PROTECTION]=/P R AH T EH K SH AH N/',
    ' [PROTECT]=/P R AH T EH K T/',
    ' [PROFESSOR]=/P R AH F EH S ER/',
    ' [PROVE] =/P R UW V/',
    ' [PRISON]=/P R IH Z AH N/',
    ' [PERSONAL]=/P ER S IH N AH L/',
    ' [PRESENT]=/P R EH Z AH N T/',
    ' [PILOT]=/P AY L AH T/',
    ' [PROCESS]=/P R AA S EH S/',
    ' [PARTICULARLY]=/P AA R T IH K Y AH L ER L IY/',
    ' [PARTICULAR]=/P ER T IH K Y AH L ER/',
    ' [PERIOD]=/P IH R IY AH D/',
    ' [POLICY]=/P AA L AH S IY/',
    ' [PERCENT]=/P ER S EH N T/',
    ' [PIERCE]=/P IH R S/',
    ' [PUSSY]=/P UH S IY/',
    ' [PROPER]=/P R AA P ER/',
    ' [POPULAR]=/P AA P Y AH L ER/',
    ' [PIANO]=/P IY AE N OW/',
    ' [POISON]=/P OY Z AH N/',
    ' [PITY]=/P IH T IY/',
    ' [PUTS] =/P UH T S/',
    ' [PRIEST]=/P R IY S T/',
    ' [POLITICAL]=/P AH L IH T AH K AH L/',
    ' [PLEASANT]=/P L EH Z AH N T/',
    ' [PRESENCE]=/P R EH Z AH N S/',
    ' [PROCEED]=/P R AH S IY D/',
    ' [PROGRESS]=/P R AA G R EH S/',
    ' [POTENTIAL]=/P AH T EH N SH AH L/',
    ' [PALACE]=/P AE L AH S/',
    ' [PREVIOUSLY]=/P R IY V IY AH S L IY/',
    ' [PUSH]=/P UH SH/',
    ' [PRETTY]=/P R IH T IY/',
    ' [PROBLEM]=/P R AA B L AH M/',
    ' [PROMISE]=/P R AA M AH S/',
    ' [PULL]=/P UH L/',
    ' [POOR] =/P UW R/',
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
    // Custom: silent p before t at word start (pterodactyl, ptarmigan, ptolemy)
    ' [PT]=/T/',
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
    ' [QUIET]=/K W AY AH T/',
    '[QUAR]=/K W AO R/',
    // Custom: QUA before L → K W AA L (qualify, quality, equal — broad A)
    '[QUA]L=/K W AA/',
    // Custom: QUE at word end → K (basque, mosque, torque, plaque — no W sound)
    '[QUE] =/K/',
    '[QU]=/K W/',
    '[Q]=/K/',
  ],
  R: [
    // Custom: common word fixes
    ' [REALLY]=/R IH L IY/',
    ' [READING]=/R IY D IH NG/',
    ' [REALIZE]=/R IY AH L AY Z/',
    ' [REASON]=/R IY Z AH N/',
    ' [RECORD]=/R AH K AO R D/',
    ' [RELAX]=/R IH L AE K S/',
    ' [RETURN]=/R IH T ER N/',
    ' [RESPECT]=/R IH S P EH K T/',
    ' [RESPONSIBLE]=/R IY S P AA N S AH B AH L/',
    ' [RESTAURANT]=/R EH S T ER AA N T/',
    ' [ROGER]=/R AA JH ER/',
    ' [RICHARD]=/R IH CH ER D/',
    ' [RIVER]=/R IH V ER/',
    ' [RESPONSIBILITY]=/R IY S P AA N S AH B IH L AH T IY/',
    ' [REALITY]=/R IY AE L AH T IY/',
    ' [RUSSIAN]=/R AH SH AH N/',
    ' [REPEAT]=/R IH P IY T/',
    ' [ROBERT]=/R AA B ER T/',
    ' [RECOGNIZE]=/R EH K AH G N AY Z/',
    ' [REGULAR]=/R EH G Y AH L ER/',
    ' [REMAIN]=/R IH M EY N/',
    ' [RELEASE]=/R IY L IY S/',
    ' [ROSS] =/R AA S/',
    ' [REGRET]=/R AH G R EH T/',
    ' [RECEIVED]=/R AH S IY V D/',
    ' [RECEIVE]=/R AH S IY V/',
    ' [RECENTLY]=/R IY S AH N T L IY/',
    ' [REPORTER]=/R IH P AO R T ER/',
    ' [REPORTS]=/R IH P AO R T S/',
    ' [REPORT]=/R IY P AO R T/',
    ' [REQUEST]=/R IH K W EH S T/',
    ' [RUINED]=/R UW AH N D/',
    ' [RESULTS]=/R IH Z AH L T S/',
    ' [RESULT]=/R IH Z AH L T/',
    ' [ROBIN]=/R AA B AH N/',
    ' [REVEREND]=/R EH V ER AH N D/',
    ' [REPUTATION]=/R EH P Y AH T EY SH AH N/',
    ' [ROUTINE]=/R UW T IY N/',
    ' [REWARD]=/R IH W AO R D/',
    ' [RUSSELL]=/R AH S AH L/',
    ' [RESPONSE]=/R IH S P AA N S/',
    ' [RUTH]=/R UW TH/',
    ' [ROUTE]=/R UW T/',
    ' [REFUSE]=/R AH F Y UW Z/',
    ' [RABBIT]=/R AE B AH T/',
    ' [RUIN]=/R UW AH N/',
    ' [RADAR]=/R EY D AA R/',
    ' [REMEMBER]=/R IH M EH M B ER/',
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
    // Custom: common word fixes
    ' [SECOND]=/S EH K AH N D/',
    ' [SPIRIT]=/S P IH R AH T/',
    ' [STUDY]=/S T AH D IY/',
    ' [SUGAR]=/SH UH G ER/',
    ' [SOLDIER]=/S OW L JH ER/',
    ' [SUGGEST]=/S AH JH EH S T/',
    ' [SEVERAL]=/S EH V R AH L/',
    ' [STRENGTH]=/S T R EH NG K TH/',
    ' [SATURDAY]=/S AE T ER D IY/',
    ' [SHOWER]=/SH AW ER/',
    ' [SERGEANT]=/S AA R JH AH N T/',
    ' [SWEETHEART]=/S W IY T HH AA R T/',
    ' [SOMETIMES]=/S AH M T AY M Z/',
    ' [SHALL] =/SH AE L/',
    ' [SECURITY]=/S IH K Y UH R AH T IY/',
    ' [SHERIFF]=/SH EH R AH F/',
    ' [STUPID]=/S T UW P AH D/',
    ' [SURPRISED]=/S ER P R AY Z D/',
    ' [SHOES] =/SH UW Z/',
    ' [SOUL] =/S OW L/',
    ' [SWEAR]=/S W EH R/',
    ' [SERVICES]=/S ER V AH S AH Z/',
    ' [SERVICE]=/S ER V AH S/',
    ' [SCREWED]=/S K R UW D/',
    ' [SCHEDULE]=/S K EH JH UH L/',
    ' [SHOE] =/SH UW/',
    ' [SOCIETY]=/S AH S AY AH T IY/',
    ' [SURGERY]=/S ER JH ER IY/',
    ' [SAFETY]=/S EY F T IY/',
    ' [SEASON]=/S IY Z AH N/',
    ' [SOFT] =/S AA F T/',
    ' [SQUARE]=/S K W EH R/',
    ' [STATEMENT]=/S T EY T M AH N T/',
    ' [SUBTITLES]=/S AH B T AY T AH L Z/',
    ' [SUCCESS]=/S AH K S EH S/',
    ' [SALLY]=/S AE L IY/',
    ' [SILENCE]=/S AY L AH N S/',
    ' [SENIOR]=/S IY N Y ER/',
    ' [SWORD]=/S AO R D/',
    ' [SIMON]=/S AY M AH N/',
    ' [SATIRE]=/S AE T AY ER/',
    ' [SIRE] =/S AY ER/',
    ' [SENSITIVE]=/S EH N S AH T IH V/',
    ' [SEPARATE]=/S EH P ER EY T/',
    ' [SQUAD]=/S K W AA D/',
    ' [SWEAT]=/S W EH T/',
    ' [SOLID]=/S AA L AH D/',
    ' [SERIES]=/S IH R IY Z/',
    ' [SUPPLY]=/S AH P L AY/',
    ' [SURVEILLANCE]=/S ER V EY L AH N S/',
    ' [SURFACE]=/S ER F AH S/',
    ' [SMOOTH]=/S M UW DH/',
    ' [STANDARD]=/S T AE N D ER D/',
    ' [SACRIFICE]=/S AE K R AH F AY S/',
    ' [SPECIFIC]=/S P AH S IH F IH K/',
    ' [SUITE] =/S W IY T/',
    ' [STEAK]=/S T EY K/',
    ' [SOLUTION]=/S AH L UW SH AH N/',
    ' [SATELLITE]=/S AE T AH L AY T/',
    ' [SECURE]=/S IH K Y UH R/',
    ' [SURELY]=/SH UH R L IY/',
    ' [SORRY]=/S AA R IY/',
    ' [SUDDENLY]=/S AH D AH N L IY/',
    ' [SUICIDE]=/S UW AH S AY D/',
    ' [SECRETARY]=/S EH K R AH T EH R IY/',
    ' [SENATOR]=/S EH N AH T ER/',
    ' [SEXUAL]=/S EH K SH UW AH L/',
    ' [STOMACH]=/S T AH M AH K/',
    ' [SURE] =/SH UH R/',
    ' [SAYS] =/S EH Z/',
    ' [SOMEONE]=/S AH M W AH N/',
    ' [SECRET]=/S IY K R AH T/',
    ' [SEVEN]=/S EH V AH N/',
    ' [SERIOUS]=/S IH R IY AH S/',
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
    // Custom: common word fixes
    ' [TRUTH] =/T R UW TH/',
    ' [TONY]=/T OW N IY/',
    ' [TRIAL]=/T R AY AH L/',
    ' [THEMSELVES]=/DH EH M S EH L V Z/',
    ' [TERRIFIC]=/T ER IH F IH K/',
    ' [TEACHER]=/T IY CH ER/',
    ' [TONGUE]=/T AH NG/',
    ' [TOUR] =/T UH R/',
    ' [THOMAS]=/T AA M AH S/',
    ' [TARGET]=/T AA R G AH T/',
    ' [TED] =/T EH D/',
    ' [TOWARDS]=/T AH W AO R D Z/',
    ' [TAXI]=/T AE K S IY/',
    ' [TALENT]=/T AE L AH N T/',
    ' [TEARS]=/T EH R Z/',
    ' [TEAR] =/T EH R/',
    ' [THERAPY]=/TH EH R AH P IY/',
    ' [TITLE]=/T AY T AH L/',
    ' [THIRTY]=/TH ER D IY/',
    ' [TERRIBLY]=/T EH R AH B L IY/',
    ' [TIRE] =/T AY ER/',
    ' [THEORY]=/TH IH R IY/',
    ' [TEXAS]=/T EH K S AH S/',
    ' [THROWN]=/TH R OW N/',
    ' [THREAT]=/TH R EH T/',
    ' [TOWARD] =/T AH W AO R D/',
    ' [TOWER]=/T AW ER/',
    ' [THOU] =/DH AW/',
    ' [THY] =/DH AY/',
    ' [THEATER]=/TH IY AH T ER/',
    ' [THEATRE]=/TH IY AH T ER/',
    ' [THURSDAY]=/TH ER Z D EY/',
    ' [TUESDAY]=/T UW Z D IY/',
    ' [THEE] =/DH IY/',
    ' [TRAVEL]=/T R AE V AH L/',
    ' [TODAY]=/T AH D EY/',
    ' [TOGETHER]=/T AH G EH DH ER/',
    ' [TOMORROW]=/T AH M AA R OW/',
    ' [TOUCH]=/T AH CH/',
    ' [TIRED]=/T AY ER D/',
    ' [THE] =/DH AX/',
    // Word-start space required: only match standalone "to", not word-ending -to
    ' [TO] =/T UW/',
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
    // Custom: doubled TT before -ed at word end → T IH D (batted, committed, abetted)
    // Must come before [TT] to avoid TT collapsing and losing the IH D allomorph
    '#:[TTED] =/T IH D/',
    // Custom: collapse doubled TT
    '[TT]=/T/',
    '[T]=/T/',
  ],
  U: [
    // Custom: common word fixes
    ' [UNDERSTAND]=/AH N D ER S T AE N D/',
    ' [UNFORTUNATELY]=/AH N F AO R CH AH N AH T L IY/',
    ' [UNITED]=/Y UW N AY T IH D/',
    ' [UNBELIEVABLE]=/AH N B AH L IY V AH B AH L/',
    ' [UNIT]=/Y UW N AH T/',
    ' [UNCLE]=/AH NG K AH L/',
    ' [UNLESS]=/AH N L EH S/',
    ' [UNIVERSITY]=/Y UW N AH V ER S AH T IY/',
    ' [UNIVERSE]=/Y UW N AH V ER S/',
    ' [UNIFORM]=/Y UW N AH F AO R M/',
    ' [UNION]=/Y UW N Y AH N/',
    ' [UNDERWEAR]=/AH N D ER W EH R/',
    ' [UN]I=/Y UW N/',
    ' [UN]=/AH N/',
    ' [UPSET]=/AH P S EH T/',
    ' [USUALLY]=/Y UW ZH AH W AH L IY/',
    ' [USUAL]=/Y UW ZH AH W AH L/',
    ' [USEFUL]=/Y UW S F AH L/',
    ' [USE] =/Y UW S/',
    ' [USELESS]=/Y UW S L AH S/',
    ' [UPON]=/AH P AA N/',
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
    ' [VICTIM]=/V IH K T AH M/',
    ' [VILLAGE]=/V IH L AH JH/',
    ' [VACATION]=/V EY K EY SH AH N/',
    ' [VALUE]=/V AE L Y UW/',
    ' [VEHICLE]=/V IY HH IH K AH L/',
    ' [VALLEY]=/V AE L IY/',
    ' [VEGAS]=/V EY G AH S/',
    ' [VERSION]=/V ER ZH AH N/',
    ' [VIETNAM]=/V IY EH T N AA M/',
    ' [VISIT]=/V IH Z IH T/',
    '[VIEW]=/V Y UW/',
    // Custom: VIOL root → V AY AH L (violence, violin, violate — Latin origin)
    '[VIOL]=/V AY AH L/',
    '[V]=/V/',
  ],
  W: [
    // Custom: common word fixes
    ' [WITH] =/W IH DH/',
    ' [WITHOUT]=/W IH TH AW T/',
    ' [WITHIN]=/W IH DH IH N/',
    ' [WATER]=/W AO T ER/',
    ' [WOMEN] =/W IH M AH N/',
    ' [WOMAN] =/W UH M AH N/',
    ' [WOW] =/W AW/',
    ' [WHOA] =/W OW/',
    ' [WANTED]=/W AO N T IH D/',
    ' [WASTED]=/W EY S T IH D/',
    ' [WASTE]=/W EY S T/',
    ' [WORRIED]=/W ER IY D/',
    ' [WORRY]=/W ER IY/',
    ' [WHEREVER]=/W EH R EH V ER/',
    ' [WHENEVER]=/W EH N EH V ER/',
    ' [WEATHER]=/W EH DH ER/',
    ' [WHOO] =/W UW/',
    ' [WILLIAM]=/W IH L Y AH M/',
    ' [WEIRD]=/W IH R D/',
    ' [WIRE]=/W AY ER/',
    ' [WINDS] =/W IH N D Z/',
    ' [WASTING]=/W EY S T IH NG/',
    ' [WHORE]=/HH AO R/',
    ' [WOLF]=/W UH L F/',
    ' [WOUNDED]=/W UW N D IH D/',
    ' [WARRANT]=/W AO R AH N T/',
    ' [WEDNESDAY]=/W EH N Z D IY/',
    ' [WADE]=/W EY D/',
    ' [WEAPON]=/W EH P AH N/',
    ' [WEAR]=/W EH R/',
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
    // Custom: "what" is /wʌt/ not /wɑt/ (what, whatever, somewhat — 8 words, freq 515K)
    '[WHAT]=/WH AH T/',
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
    // Custom: common word fixes
    ' [YOUR] =/Y AO R/',
    ' [YOURS] =/Y UH R Z/',
    ' [YOUNGER]=/Y AH NG G ER/',
    ' [YOURSELVES]=/Y UH R S EH L V Z/',
    ' [YOURSELF]=/Y ER S EH L F/',
    ' [YEAH] =/Y AE/',
    ' [YET] =/Y EH T/',
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
    ' [ZERO]=/Z IH R OW/',
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

  return { leftRe, rightRe, targetLen: target.length, phonemes, ruleStr };
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
    const parsed = text.substring(0, pos);
    const rest = text.substring(pos);
    const ch = text[pos]!;

    // Look up rules for this letter
    const rules = COMPILED_RULES[ch] as CompiledRule[] | undefined;
    if (rules !== undefined) {
      let matched = false;
      for (const rule of rules) {
        if (rule.leftRe.test(parsed) && rule.rightRe.test(rest)) {
          rawPhonemes.push(...rule.phonemes);
          rawSteps.push({
            letters: text.substring(pos, pos + rule.targetLen),
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
