/**
 * Shared G2P evaluation engine for optimization scripts.
 *
 * Provides:
 * - parseNRLRules(): extract pattern rules from g2p-rules.ts source
 * - compileRules(): compile rules into regex matchers
 * - evaluateWord(): run G2P on a single word (returns stressless phonemes)
 * - evaluateWordTraced(): run G2P with rule tracing
 * - measureAccuracy(): measure full dictionary accuracy
 *
 * This duplicates the compilation/evaluation logic from g2p-rules.ts so
 * optimization scripts can test rule modifications without touching the
 * production code.
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadDictionary, loadFrequencies, getWordFrequency } from '@ingglish/dictionary';
import { stripStress } from '@ingglish/phonemes';
import { applyStressPrediction } from '../../../g2p/src/stress';

// ---------------------------------------------------------------------------
// Rule parsing
// ---------------------------------------------------------------------------

const RULES_FILE = path.resolve(import.meta.dirname, '../../../g2p/src/g2p-rules.ts');

/**
 * Parse NRL_RULES from the g2p-rules.ts source file.
 * Returns a map of letter -> rule strings (pattern rules only, no word rules).
 */
export function parseNRLRules(filePath: string = RULES_FILE): Record<string, string[]> {
  const source = fs.readFileSync(filePath, 'utf-8');
  const rules: Record<string, string[]> = {};

  // Find the start of NRL_RULES object
  const startIdx = source.indexOf('const NRL_RULES');
  if (startIdx === -1) throw new Error('NRL_RULES not found in ' + filePath);

  // Find the closing `};` of NRL_RULES
  const afterStart = source.substring(startIdx);
  let depth = 0;
  let endIdx = 0;
  for (let i = afterStart.indexOf('{'); i < afterStart.length; i++) {
    if (afterStart[i] === '{') depth++;
    else if (afterStart[i] === '}') {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  const block = afterStart.substring(0, endIdx + 1);

  // Parse letter sections
  let currentLetter: string | null = null;
  for (const line of block.split('\n')) {
    // Match letter section start: `  A: [`
    const letterMatch = /^\s+([A-Z]):\s*\[/.exec(line);
    if (letterMatch) {
      currentLetter = letterMatch[1]!;
      rules[currentLetter] = [];
    }

    // Match rule string: `'leftCtx[TARGET]rightCtx=/PHONEMES/'`
    if (currentLetter !== null) {
      const ruleMatch = /'([^']*\[[^\]]+\][^']*=\/[^']*\/)'\s*,?\s*$/.exec(line);
      if (ruleMatch) {
        rules[currentLetter]!.push(ruleMatch[1]!);
      }
    }

    // Detect closing of a letter section
    if (currentLetter !== null && /^\s+\],?\s*$/.test(line)) {
      currentLetter = null;
    }
  }

  return rules;
}

// ---------------------------------------------------------------------------
// Rule compilation (mirrors g2p-rules.ts logic)
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
  if (phoneme === 'AX') return 'AH0';
  if (phoneme === 'NX') return 'NG';
  if (phoneme === 'WH') return 'W';
  if (NRL_VOWELS.has(phoneme)) return phoneme + '1';
  return phoneme;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

export interface CompiledRule {
  leftRe: RegExp;
  rightRe: RegExp;
  targetLen: number;
  phonemes: string[];
  ruleStr: string;
}

export interface TraceStep {
  letters: string;
  rule: string;
  phonemes: string[]; // after stress prediction
}

export interface TraceResult {
  phonemes: string[];
  steps: TraceStep[];
}

function compileRule(ruleStr: string): CompiledRule | null {
  const m = /^([^[]*)\[([^\]]+)\]([^=]*)=\/(.*)\/$/.exec(ruleStr);
  if (m === null) return null;

  const leftCtx = m[1]!;
  const target = m[2]!;
  const rightCtx = m[3]!;
  const phonemeStr = m[4]!;

  const leftRe = new RegExp(expandContext(leftCtx) + '$');
  const rightRe = new RegExp('^' + escapeRegex(target) + expandContext(rightCtx));

  const phonemes = phonemeStr
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 0)
    .map(nrlToArpabet);

  return { leftRe, rightRe, targetLen: target.length, phonemes, ruleStr };
}

export type CompiledRuleSet = Record<string, CompiledRule[]>;

/**
 * Compile NRL rules into regex matchers, ready for evaluation.
 */
export function compileRules(rules: Record<string, string[]>): CompiledRuleSet {
  const compiled: CompiledRuleSet = {};
  for (const [letter, ruleStrs] of Object.entries(rules)) {
    compiled[letter] = [];
    for (const ruleStr of ruleStrs) {
      const c = compileRule(ruleStr);
      if (c !== null) compiled[letter]!.push(c);
    }
  }
  return compiled;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

/**
 * Run G2P on a word with tracing, using the given compiled rules.
 * Returns phonemes after stress prediction and trace of which rules fired.
 */
export function evaluateWordTraced(compiledRules: CompiledRuleSet, word: string): TraceResult {
  const text = ' ' + word.toUpperCase() + ' ';
  const rawPhonemes: string[] = [];
  const rawSteps: { letters: string; ruleStr: string; count: number }[] = [];
  let pos = 1;

  while (pos < text.length - 1) {
    const parsed = text.substring(0, pos);
    const rest = text.substring(pos);
    const ch = text[pos]!;

    const rules = compiledRules[ch] as CompiledRule[] | undefined;
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
      if (!matched) pos++;
    } else {
      pos++;
    }
  }

  const phonemes = applyStressPrediction(word, rawPhonemes);

  const steps: TraceStep[] = [];
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
 * Run G2P on a word and return stressless phoneme string.
 */
export function evaluateWord(compiledRules: CompiledRuleSet, word: string): string {
  const result = evaluateWordTraced(compiledRules, word);
  return result.phonemes.map(stripStress).join(' ');
}

// ---------------------------------------------------------------------------
// Dictionary loading & accuracy measurement
// ---------------------------------------------------------------------------

export interface TestData {
  dict: Record<string, string[]>;
  words: string[];
}

/**
 * Load dictionary and frequencies. Returns filtered word list (alpha-only, len >= 3).
 */
export async function loadTestData(): Promise<TestData> {
  const dict = await loadDictionary();
  await loadFrequencies();

  const words: string[] = [];
  for (const word of Object.keys(dict)) {
    if (/[^a-z]/i.test(word) || word.length < 3) continue;
    words.push(word);
  }

  return { dict, words };
}

export interface AccuracyResult {
  total: number;
  correct: number;
  freqTotal: number;
  freqCorrect: number;
  unweightedPct: number;
  freqWeightedPct: number;
}

/**
 * Measure accuracy of compiled rules against the full dictionary.
 */
export function measureAccuracy(
  compiledRules: CompiledRuleSet,
  testData: TestData
): AccuracyResult {
  let total = 0;
  let correct = 0;
  let freqTotal = 0;
  let freqCorrect = 0;

  for (const word of testData.words) {
    total++;
    const freq = getWordFrequency(word) ?? 0;
    freqTotal += freq;

    const g2p = evaluateWord(compiledRules, word);
    const cmu = testData.dict[word]!.map(stripStress).join(' ');
    if (g2p === cmu) {
      correct++;
      freqCorrect += freq;
    }
  }

  return {
    total,
    correct,
    freqTotal,
    freqCorrect,
    unweightedPct: (correct / total) * 100,
    freqWeightedPct: freqTotal > 0 ? (freqCorrect / freqTotal) * 100 : 0,
  };
}

/**
 * Build a map of ruleStr -> affected words (words where that rule fired).
 * Also returns the baseline set of correct words.
 */
export function traceAllWords(
  compiledRules: CompiledRuleSet,
  testData: TestData
): {
  ruleWords: Record<string, string[]>;
  baselineCorrect: Set<string>;
  baselineCorrectCount: number;
  baselineFreqCorrect: number;
} {
  const ruleWords: Record<string, string[]> = {};
  const baselineCorrect = new Set<string>();
  let baselineCorrectCount = 0;
  let baselineFreqCorrect = 0;

  for (const word of testData.words) {
    const trace = evaluateWordTraced(compiledRules, word);
    const g2p = trace.phonemes.map(stripStress).join(' ');
    const cmu = testData.dict[word]!.map(stripStress).join(' ');
    const freq = getWordFrequency(word) ?? 0;
    const isCorrect = g2p === cmu;

    if (isCorrect) {
      baselineCorrect.add(word);
      baselineCorrectCount++;
      baselineFreqCorrect += freq;
    }

    for (const step of trace.steps) {
      (ruleWords[step.rule] ??= []).push(word);
    }
  }

  return { ruleWords, baselineCorrect, baselineCorrectCount, baselineFreqCorrect };
}

export { getWordFrequency, stripStress };
