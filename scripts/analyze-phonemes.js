import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const dictionary = require('cmu-pronouncing-dictionary');

// Current vowel mappings with their lengths
const VOWEL_MAP = {
  AA: 'o', // 1 char (father, hot, rock)
  AE: 'a', // 1 char
  AH: 'u', // 1 char
  AO: 'aw', // 2 chars (thought, law)
  EH: 'e', // 1 char
  ER: 'er', // 2 chars
  IH: 'i', // 1 char
  IY: 'ee', // 2 chars
  UH: 'uu', // 2 chars
  UW: 'oo', // 2 chars
  AW: 'ow', // 2 chars
  AY: 'ii', // 2 chars
  EY: 'ay', // 2 chars
  OW: 'oh', // 2 chars (go, show)
  OY: 'oi', // 2 chars
};

// Count phoneme occurrences
const counts = {};
for (const phoneme of Object.keys(VOWEL_MAP)) {
  counts[phoneme] = 0;
}

for (const pronunciation of Object.values(dictionary)) {
  const phonemes = pronunciation.split(' ');
  for (const p of phonemes) {
    // Strip stress markers
    const base = p.replace(/[012]$/, '');
    if (counts[base] !== undefined) {
      counts[base]++;
    }
  }
}

// Sort by frequency
const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

console.log('=== Vowel Phoneme Frequencies ===\n');
console.log('Phoneme | Count    | Current | Chars | Wasted Chars');
console.log('--------|----------|---------|-------|-------------');

let totalChars = 0;
for (const [phoneme, count] of sorted) {
  const spelling = VOWEL_MAP[phoneme];
  const chars = spelling.length;
  const wasted = (chars - 1) * count; // extra chars beyond 1
  totalChars += chars * count;
  console.log(
    `${phoneme.padEnd(7)} | ${count.toString().padStart(8)} | ${spelling.padEnd(7)} | ${chars}     | ${wasted.toLocaleString()}`
  );
}

console.log('\n=== Current Total Vowel Characters:', totalChars.toLocaleString(), '===\n');

// Now check if any swaps would help
// Single-char vowels: o (AA), a (AE), u (AH), e (EH), i (IH)
// Two-char vowels: aw (AO), er (ER), ee (IY), uu (UH), oo (UW), ow (AW), ii (AY), ay (EY), oh (OW), oi (OY)

const singleChar = ['AA', 'AE', 'AH', 'EH', 'IH'];
const twoChar = ['AO', 'ER', 'IY', 'UH', 'UW', 'AW', 'AY', 'EY', 'OW', 'OY'];

console.log('=== Potential Swaps Analysis ===\n');
console.log(
  'Swapping a 1-char vowel with a 2-char vowel saves chars if the 2-char is more frequent.\n'
);

const swaps = [];
for (const single of singleChar) {
  for (const two of twoChar) {
    const savings = counts[two] - counts[single];
    if (savings > 0) {
      swaps.push({ single, two, savings, singleCount: counts[single], twoCount: counts[two] });
    }
  }
}

swaps.sort((a, b) => b.savings - a.savings);

console.log('Beneficial swaps (if we swap spellings):');
console.log('Swap           | 1-char freq | 2-char freq | Savings');
console.log('---------------|-------------|-------------|--------');
for (const swap of swaps.slice(0, 10)) {
  console.log(
    `${swap.single} <-> ${swap.two}    | ${swap.singleCount.toString().padStart(11)} | ${swap.twoCount.toString().padStart(11)} | ${swap.savings.toLocaleString()}`
  );
}

if (swaps.length > 0) {
  const best = swaps[0];
  console.log(
    `\n=== Best swap: ${best.single} (${VOWEL_MAP[best.single]}) <-> ${best.two} (${VOWEL_MAP[best.two]}) ===`
  );
  console.log(`This would save ${best.savings.toLocaleString()} characters across all words.`);
}
