#!/usr/bin/env npx vite-node
/**
 * Cross-reference the top most common CMU dictionary words to find potential errors.
 *
 * Builds an ARPABET -> IPA converter and looks for PATTERNS that suggest errors:
 *   A) Schwa in stressed syllables (AH1, AH2)
 *   B) Duplicate consecutive consonant phonemes
 *   C) Unusual phoneme sequences (vowel-vowel, stop-stop, etc.)
 *   D) Vowel+R consistency (EH R vs ER)
 *   E) Manual function-word verification list
 *
 * Usage: cd packages/core && npx vite-node scripts/cross-reference-top-words.ts
 */

import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
  CUSTOM_PRONUNCIATIONS,
} from '@ingglish/dictionary';

export async function main() {
  await loadDictionary();
  await loadFrequencies();
  const cmudict = getDictionary();

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const alreadyFixed = new Set(Object.keys(CUSTOM_PRONUNCIATIONS));

  function stripStress(p: string): string {
    return p.replace(/[0-2]$/, '');
  }

  function getStress(p: string): number | null {
    const m = p.match(/([0-2])$/);
    return m ? Number(m[1]) : null;
  }

  // ARPABET vowels (stress-stripped)
  const VOWELS = new Set([
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

  // ARPABET consonants (stress-stripped)
  const CONSONANTS = new Set([
    'B',
    'CH',
    'D',
    'DH',
    'F',
    'G',
    'HH',
    'JH',
    'K',
    'L',
    'M',
    'N',
    'NG',
    'P',
    'R',
    'S',
    'SH',
    'T',
    'TH',
    'V',
    'W',
    'Y',
    'Z',
    'ZH',
  ]);

  // Stops (plosives)
  const STOPS = new Set(['P', 'B', 'T', 'D', 'K', 'G']);

  function isVowel(p: string): boolean {
    return VOWELS.has(stripStress(p));
  }

  function isConsonant(p: string): boolean {
    return CONSONANTS.has(stripStress(p));
  }

  function isStop(p: string): boolean {
    return STOPS.has(stripStress(p));
  }

  // ---------------------------------------------------------------------------
  // ARPABET -> IPA mapping
  // ---------------------------------------------------------------------------

  const ARPABET_TO_IPA: Record<string, string> = {
    AA: '\u0251', // ɑ
    AE: '\u00e6', // æ
    AH: '\u0259', // ə (or ʌ when stressed)
    AO: '\u0254', // ɔ
    AW: 'a\u028a', // aʊ
    AY: 'a\u026a', // aɪ
    EH: '\u025b', // ɛ
    ER: '\u025d', // ɝ
    EY: 'e\u026a', // eɪ
    IH: '\u026a', // ɪ
    IY: 'i', // i
    OW: 'o\u028a', // oʊ
    OY: '\u0254\u026a', // ɔɪ
    UH: '\u028a', // ʊ
    UW: 'u', // u
    B: 'b',
    CH: 't\u0283', // tʃ
    D: 'd',
    DH: '\u00f0', // ð
    F: 'f',
    G: '\u0261', // ɡ
    HH: 'h',
    JH: 'd\u0292', // dʒ
    K: 'k',
    L: 'l',
    M: 'm',
    N: 'n',
    NG: '\u014b', // ŋ
    P: 'p',
    R: '\u0279', // ɹ
    S: 's',
    SH: '\u0283', // ʃ
    T: 't',
    TH: '\u03b8', // θ
    V: 'v',
    W: 'w',
    Y: 'j',
    Z: 'z',
    ZH: '\u0292', // ʒ
  };

  function arpabetToIPA(phonemes: string[]): string {
    return phonemes
      .map((p) => {
        const bare = stripStress(p);
        const stress = getStress(p);
        let ipa = ARPABET_TO_IPA[bare] ?? `?${bare}?`;
        // AH with stress 1 or 2 -> ʌ (not schwa)
        if (bare === 'AH' && stress !== null && stress > 0) {
          ipa = '\u028c'; // ʌ
        }
        if (stress === 1) return '\u02c8' + ipa; // ˈ primary stress
        if (stress === 2) return '\u02cc' + ipa; // ˌ secondary stress
        return ipa;
      })
      .join('');
  }

  // ---------------------------------------------------------------------------
  // Get top 500 words by frequency, excluding custom pronunciations and proper nouns
  // ---------------------------------------------------------------------------

  // CMU dict lowercases everything but the raw file has uppercase keys for proper nouns.
  // Since getDictionary() returns lowercase keys, we detect proper nouns as words
  // that have no frequency data AND look like names, or we just skip that filter
  // and rely on frequency (common words are almost never proper nouns).

  const allWords = Object.keys(cmudict).filter((w) => {
    if (!cmudict[w] || cmudict[w].length === 0) return false;
    if (w.includes('(')) return false; // skip variant entries like "read(2)"
    if (alreadyFixed.has(w)) return false; // skip already-fixed words
    // Heuristic: skip likely proper nouns — words that appear with uppercase first
    // letter in the original dict. Since the dict is lowercased, we can't check directly.
    // Instead, skip single-letter words (except "a" and "i") and words with apostrophes.
    if (w.length === 1 && w !== 'a' && w !== 'i') return false;
    return true;
  });

  // Sort by frequency, highest first
  const sorted = allWords
    .map((w) => ({ word: w, freq: getWordFrequency(w) ?? 0 }))
    .sort((a, b) => b.freq - a.freq);

  const top500 = sorted.slice(0, 500);

  // ---------------------------------------------------------------------------
  // Findings
  // ---------------------------------------------------------------------------

  interface Finding {
    word: string;
    frequency: number;
    phonemes: string[];
    ipa: string;
    category: string;
    detail: string;
  }

  const findings: Finding[] = [];

  function addFinding(
    word: string,
    freq: number,
    phonemes: string[],
    category: string,
    detail: string
  ) {
    findings.push({
      word,
      frequency: freq,
      phonemes,
      ipa: arpabetToIPA(phonemes),
      category,
      detail,
    });
  }

  // ---------------------------------------------------------------------------
  // A) Schwa in stressed syllables: AH1 or AH2
  //    AH0 = schwa (correct for unstressed), AH1/AH2 = ʌ (stressed, but sometimes
  //    CMU puts AH1 where another vowel might be expected)
  //    This is actually CORRECT for "strut" vowel /ʌ/ — so we note them for review
  //    but flag specifically if the word spelling suggests a different vowel.
  // ---------------------------------------------------------------------------

  for (const { word, freq } of top500) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;

    for (let i = 0; i < phonemes.length; i++) {
      const p = phonemes[i];
      if (p === 'AH1' || p === 'AH2') {
        // AH1/AH2 = /ʌ/ which is correct for words like "but", "run", "come"
        // Flag words where the spelling suggests a different vowel:
        // - "o" spelling with /ʌ/ is legitimate (come, some, done, love, etc.)
        // - "u" spelling with /ʌ/ is legitimate (but, cut, run, etc.)
        // Flag if the word has unusual spelling for /ʌ/:
        // e.g., words spelled with "a", "e", "i" that have AH stressed
        const stressLevel = p === 'AH1' ? 'primary' : 'secondary';
        addFinding(
          word,
          freq,
          phonemes,
          'stressed-schwa',
          `AH with ${stressLevel} stress at position ${i} (= /ʌ/)`
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // B) Double consonants: same consonant phoneme twice in a row
  // ---------------------------------------------------------------------------

  for (const { word, freq } of top500) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;
    const bare = phonemes.map(stripStress);

    for (let i = 0; i < bare.length - 1; i++) {
      if (bare[i] === bare[i + 1] && isConsonant(bare[i])) {
        addFinding(
          word,
          freq,
          phonemes,
          'double-consonant',
          `${bare[i]} ${bare[i]} at positions ${i}-${i + 1}`
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // C) Unusual phoneme sequences
  // ---------------------------------------------------------------------------

  for (const { word, freq } of top500) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;
    const bare = phonemes.map(stripStress);

    // C1: Two vowels in a row (no consonant between)
    for (let i = 0; i < bare.length - 1; i++) {
      if (isVowel(phonemes[i]) && isVowel(phonemes[i + 1])) {
        // Some legitimate cases: diphthong-like sequences
        addFinding(
          word,
          freq,
          phonemes,
          'vowel-vowel',
          `${bare[i]} ${bare[i + 1]} at positions ${i}-${i + 1} (two vowels in a row)`
        );
      }
    }

    // C2: Stop + stop without vowel between (some valid like "act" K T)
    // Valid stop clusters at syllable boundaries: KT, PT, BD, GD, KS, etc.
    const validStopClusters = new Set([
      'K-T',
      'P-T',
      'K-S', // word-final clusters
    ]);
    for (let i = 0; i < bare.length - 1; i++) {
      if (isStop(bare[i]) && isStop(bare[i + 1])) {
        const cluster = `${bare[i]}-${bare[i + 1]}`;
        if (!validStopClusters.has(cluster)) {
          addFinding(
            word,
            freq,
            phonemes,
            'stop-stop',
            `${bare[i]} ${bare[i + 1]} at positions ${i}-${i + 1} (unusual stop cluster)`
          );
        }
      }
    }

    // C3: Three consonants in a row — check for unusual clusters
    for (let i = 0; i < bare.length - 2; i++) {
      if (isConsonant(bare[i]) && isConsonant(bare[i + 1]) && isConsonant(bare[i + 2])) {
        // Many 3-consonant clusters are valid (e.g., "strength" S T R, "sixths" K S TH S)
        // Flag for review
        addFinding(
          word,
          freq,
          phonemes,
          'triple-consonant',
          `${bare[i]} ${bare[i + 1]} ${bare[i + 2]} at positions ${i}-${i + 2}`
        );
      }
    }
  }

  // ---------------------------------------------------------------------------
  // D) Vowel+R consistency: EH R vs ER
  //    In American English, ER (stressed) is the "nurse" vowel /ɝ/
  //    EH R sequence would be /ɛɹ/ (like "care")
  //    Check if any words have EH R where ER would be more expected, or vice versa
  // ---------------------------------------------------------------------------

  for (const { word, freq } of top500) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;
    const bare = phonemes.map(stripStress);

    for (let i = 0; i < bare.length - 1; i++) {
      // EH followed by R — this is /ɛɹ/ which is valid for "air/care/there"
      // but suspicious for "er/ir/ur" spellings
      if (bare[i] === 'EH' && bare[i + 1] === 'R') {
        // Check if the word spelling suggests /ɝ/ (er, ir, ur patterns)
        const erSpellings = ['er', 'ir', 'ur', 'yr', 'ear'];
        const hasErSpelling = erSpellings.some((sp) => word.includes(sp));
        if (hasErSpelling) {
          addFinding(
            word,
            freq,
            phonemes,
            'vowel-r-check',
            `EH R at positions ${i}-${i + 1} but word has er/ir/ur spelling — should this be ER?`
          );
        }
      }

      // ER where EH R might be expected (less common error direction)
      if (bare[i] === 'ER') {
        // Words with "air", "are", "ear" (as in bear) spellings
        const ehRSpellings = ['air', 'are', 'ear', 'eir', 'ere'];
        const hasEhRSpelling = ehRSpellings.some((sp) => word.includes(sp));
        if (hasEhRSpelling) {
          addFinding(
            word,
            freq,
            phonemes,
            'vowel-r-check',
            `ER at position ${i} but word has air/are/ear spelling — should this be EH R?`
          );
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // E) Function words check — list the top ~100 function words with pronunciation
  //    for manual review
  // ---------------------------------------------------------------------------

  const functionWords = [
    'the',
    'of',
    'and',
    'to',
    'a',
    'in',
    'is',
    'it',
    'you',
    'that',
    'he',
    'was',
    'for',
    'on',
    'are',
    'with',
    'his',
    'they',
    'at',
    'be',
    'this',
    'from',
    'have',
    'or',
    'an',
    'had',
    'by',
    'not',
    'but',
    'what',
    'all',
    'were',
    'when',
    'we',
    'there',
    'can',
    'said',
    'each',
    'which',
    'she',
    'do',
    'how',
    'their',
    'if',
    'will',
    'up',
    'other',
    'about',
    'out',
    'them',
    'then',
    'her',
    'would',
    'make',
    'like',
    'time',
    'just',
    'know',
    'take',
    'people',
    'into',
    'year',
    'your',
    'good',
    'some',
    'could',
    'over',
    'after',
    'also',
    'back',
    'many',
    'these',
    'very',
    'well',
    'only',
    'way',
    'down',
    'should',
    'because',
    'long',
    'own',
    'than',
    'first',
    'been',
    'who',
    'its',
    'now',
    'did',
    'get',
    'come',
    'has',
    'him',
    'his',
    'her',
    'our',
    'most',
    'may',
    'more',
    'new',
    'still',
    'between',
    'such',
    'both',
    'life',
    'being',
  ];

  // ---------------------------------------------------------------------------
  // Output results
  // ---------------------------------------------------------------------------

  console.log('='.repeat(90));
  console.log('CROSS-REFERENCE: Top 500 Most Common Words — CMU Dictionary Error Scan');
  console.log('='.repeat(90));
  console.log(`Examined: ${top500.length} words (excluding custom pronunciations)`);
  console.log(`Total findings: ${findings.length}`);
  console.log();

  // Group by category
  const byCategory = new Map<string, Finding[]>();
  for (const f of findings) {
    if (!byCategory.has(f.category)) byCategory.set(f.category, []);
    byCategory.get(f.category)!.push(f);
  }

  // Print summary
  console.log('SUMMARY BY CATEGORY:');
  for (const [cat, items] of [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${cat.padEnd(25)} ${items.length} findings`);
  }

  // ---------------------------------------------------------------------------
  // Category A: Stressed schwa
  // ---------------------------------------------------------------------------

  const stressedSchwa = byCategory.get('stressed-schwa') ?? [];
  console.log(`\n${'='.repeat(90)}`);
  console.log(
    `A) STRESSED SCHWA — AH1/AH2 (= /ʌ/) in top 500 words (${stressedSchwa.length} findings)`
  );
  console.log('='.repeat(90));
  console.log(
    'These are words where CMU uses AH with primary/secondary stress (representing /ʌ/).'
  );
  console.log('Most are correct (but, come, some, etc.) — review for spelling mismatches.\n');

  // Sort by frequency
  const ssorted = stressedSchwa.sort((a, b) => b.frequency - a.frequency);
  for (const f of ssorted.slice(0, 80)) {
    console.log(
      `  ${f.word.padEnd(18)} freq=${String(f.frequency).padEnd(9)} ` +
        `${f.phonemes.join(' ').padEnd(35)} /${f.ipa}/` +
        `   ${f.detail}`
    );
  }
  if (ssorted.length > 80) {
    console.log(`  ... and ${ssorted.length - 80} more`);
  }

  // ---------------------------------------------------------------------------
  // Category B: Double consonants
  // ---------------------------------------------------------------------------

  const doubleConsonants = byCategory.get('double-consonant') ?? [];
  console.log(`\n${'='.repeat(90)}`);
  console.log(`B) DOUBLE CONSONANTS (${doubleConsonants.length} findings)`);
  console.log('='.repeat(90));
  console.log('Same consonant phoneme twice in a row — often a transcription error.\n');

  for (const f of doubleConsonants.sort((a, b) => b.frequency - a.frequency)) {
    console.log(
      `  ${f.word.padEnd(18)} freq=${String(f.frequency).padEnd(9)} ` +
        `${f.phonemes.join(' ').padEnd(35)} /${f.ipa}/` +
        `   ${f.detail}`
    );
  }

  // ---------------------------------------------------------------------------
  // Category C1: Vowel-vowel
  // ---------------------------------------------------------------------------

  const vowelVowel = byCategory.get('vowel-vowel') ?? [];
  console.log(`\n${'='.repeat(90)}`);
  console.log(`C1) VOWEL-VOWEL SEQUENCES (${vowelVowel.length} findings)`);
  console.log('='.repeat(90));
  console.log('Two vowel phonemes in a row without a consonant. Some are legitimate (hiatus).\n');

  for (const f of vowelVowel.sort((a, b) => b.frequency - a.frequency)) {
    console.log(
      `  ${f.word.padEnd(18)} freq=${String(f.frequency).padEnd(9)} ` +
        `${f.phonemes.join(' ').padEnd(35)} /${f.ipa}/` +
        `   ${f.detail}`
    );
  }

  // ---------------------------------------------------------------------------
  // Category C2: Stop-stop
  // ---------------------------------------------------------------------------

  const stopStop = byCategory.get('stop-stop') ?? [];
  console.log(`\n${'='.repeat(90)}`);
  console.log(`C2) STOP-STOP CLUSTERS (${stopStop.length} findings)`);
  console.log('='.repeat(90));
  console.log('Two stop consonants in a row (excluding common KT, PT clusters).\n');

  for (const f of stopStop.sort((a, b) => b.frequency - a.frequency)) {
    console.log(
      `  ${f.word.padEnd(18)} freq=${String(f.frequency).padEnd(9)} ` +
        `${f.phonemes.join(' ').padEnd(35)} /${f.ipa}/` +
        `   ${f.detail}`
    );
  }

  // ---------------------------------------------------------------------------
  // Category C3: Triple consonants
  // ---------------------------------------------------------------------------

  const tripleConsonants = byCategory.get('triple-consonant') ?? [];
  console.log(`\n${'='.repeat(90)}`);
  console.log(`C3) TRIPLE CONSONANT CLUSTERS (${tripleConsonants.length} findings)`);
  console.log('='.repeat(90));
  console.log(
    'Three consonants in a row — many are valid, but some may indicate missing vowels.\n'
  );

  for (const f of tripleConsonants.sort((a, b) => b.frequency - a.frequency)) {
    console.log(
      `  ${f.word.padEnd(18)} freq=${String(f.frequency).padEnd(9)} ` +
        `${f.phonemes.join(' ').padEnd(35)} /${f.ipa}/` +
        `   ${f.detail}`
    );
  }

  // ---------------------------------------------------------------------------
  // Category D: Vowel+R consistency
  // ---------------------------------------------------------------------------

  const vowelR = byCategory.get('vowel-r-check') ?? [];
  console.log(`\n${'='.repeat(90)}`);
  console.log(`D) VOWEL+R CONSISTENCY CHECKS (${vowelR.length} findings)`);
  console.log('='.repeat(90));
  console.log('Words where ER vs EH R may be inconsistent with spelling.\n');

  for (const f of vowelR.sort((a, b) => b.frequency - a.frequency)) {
    console.log(
      `  ${f.word.padEnd(18)} freq=${String(f.frequency).padEnd(9)} ` +
        `${f.phonemes.join(' ').padEnd(35)} /${f.ipa}/` +
        `   ${f.detail}`
    );
  }

  // ---------------------------------------------------------------------------
  // Category E: Function words — full listing for manual review
  // ---------------------------------------------------------------------------

  console.log(`\n${'='.repeat(90)}`);
  console.log('E) FUNCTION WORDS — Full Pronunciation Listing for Manual Review');
  console.log('='.repeat(90));
  console.log(
    'These are the ~100 most common English function words with their CMU pronunciations.'
  );
  console.log('Words marked [CUSTOM] are already overridden in custom-words.ts.');
  console.log('Words marked [MISSING] are not in the CMU dictionary.\n');

  for (const w of functionWords) {
    const isCustom = alreadyFixed.has(w);
    const phonemes = cmudict[w];
    if (!phonemes || phonemes.length === 0) {
      console.log(`  ${w.padEnd(18)} [MISSING]`);
      continue;
    }
    const ipa = arpabetToIPA(phonemes);
    const tag = isCustom ? ' [CUSTOM]' : '';
    const freq = getWordFrequency(w) ?? 0;
    console.log(
      `  ${w.padEnd(18)} freq=${String(freq).padEnd(9)} ` +
        `${phonemes.join(' ').padEnd(35)} /${ipa}/${tag}`
    );
  }

  // ---------------------------------------------------------------------------
  // Full dump: Top 200 words with ARPABET and IPA for reference
  // ---------------------------------------------------------------------------

  console.log(`\n${'='.repeat(90)}`);
  console.log('REFERENCE: Top 200 Words — ARPABET and IPA');
  console.log('='.repeat(90));
  console.log('Complete pronunciation listing for the top 200 most frequent words.\n');

  for (const { word, freq } of top500.slice(0, 200)) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;
    const ipa = arpabetToIPA(phonemes);
    const isCustom = alreadyFixed.has(word);
    const tag = isCustom ? ' [CUSTOM]' : '';
    console.log(
      `  ${word.padEnd(18)} freq=${String(freq).padEnd(9)} ` +
        `${phonemes.join(' ').padEnd(35)} /${ipa}/${tag}`
    );
  }
}

if (process.argv[1]?.includes('cross-reference-top-words')) main().catch(console.error);
