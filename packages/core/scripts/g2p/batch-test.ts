#!/usr/bin/env npx vite-node
/**
 * G2P batch experiment tester.
 *
 * Tests multiple G2P rule/stress changes against the CMU dictionary,
 * reporting which experiments improve accuracy and automatically
 * combining winners.
 *
 * Usage:
 *   npx tsx scripts/g2p-batch-test.ts <experiment-file>
 *
 * Experiment file format (TypeScript):
 *   export const experiments = [
 *     {
 *       name: "description",
 *       file: "rules" | "stress",   // which file to modify
 *       anchor: "text to find",     // unique string in the file
 *       replacement: "new text",    // string to replace anchor with
 *     },
 *   ];
 *
 * The script:
 * 1. Records baseline accuracy
 * 2. For each experiment: applies change, builds, tests, records, restores
 * 3. Reports deltas sorted by impact
 * 4. Combines all experiments with SL>3 and S>=0, tests combined
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(__dirname, '../../..');
const RULES = resolve(ROOT, 'packages/g2p/src/g2p-rules.ts');
const STRESS = resolve(ROOT, 'packages/g2p/src/stress.ts');
const G2P_DIR = resolve(ROOT, 'packages/g2p');
const CORE_DIR = resolve(ROOT, 'packages/core');
const RULES_BK = '/tmp/g2p-rules-batchtest.ts';
const STRESS_BK = '/tmp/g2p-stress-batchtest.ts';

// Save backups
copyFileSync(RULES, RULES_BK);
copyFileSync(STRESS, STRESS_BK);

function runTest(name: string): { sl: number; s: number } {
  try {
    execSync('npx tsup src/index.ts --format cjs,esm', { cwd: G2P_DIR, stdio: 'pipe' });
    const result = execSync(
      'npx vite-node scripts/g2p/backtest.ts 2>/dev/null | grep -E "(ignoring stress|with stress)"',
      { cwd: CORE_DIR, encoding: 'utf8', timeout: 60000 }
    );
    const slMatch = result.match(/ignoring stress.*?(\d+)/);
    const sMatch = result.match(/with stress.*?(\d+)/);
    const sl = parseInt(slMatch?.[1] || '0');
    const s = parseInt(sMatch?.[1] || '0');
    console.log(`${name.padEnd(55)} SL:${sl} S:${s}`);
    return { sl, s };
  } catch {
    console.log(`${name.padEnd(55)} FAIL`);
    return { sl: -1, s: -1 };
  } finally {
    copyFileSync(RULES_BK, RULES);
    copyFileSync(STRESS_BK, STRESS);
  }
}

interface Experiment {
  name: string;
  file: 'rules' | 'stress';
  anchor: string;
  replacement: string;
}

async function main() {
  const expFile = process.argv[2];
  if (!expFile) {
    // If no experiment file, just run as inline with empty experiments
    console.log('Usage: npx tsx scripts/g2p-batch-test.ts <experiment-file.ts>');
    console.log('Or import and call runBatchTest(experiments) programmatically.');
    process.exit(1);
  }

  const mod = await import(resolve(process.cwd(), expFile));
  const experiments: Experiment[] = mod.experiments;
  await runBatchTest(experiments);
}

export async function runBatchTest(experiments: Experiment[]) {
  console.log(`=== G2P Batch Test (${experiments.length} experiments) ===\n`);
  const baseline = runTest('BASELINE');
  console.log('---');

  const results: { name: string; slDelta: number; sDelta: number }[] = [];
  for (const exp of experiments) {
    if (exp.anchor === exp.replacement) continue;
    const filePath = exp.file === 'rules' ? RULES : STRESS;
    const content = readFileSync(filePath, 'utf8');
    if (!content.includes(exp.anchor)) {
      console.log(`${exp.name.padEnd(55)} ANCHOR NOT FOUND`);
      continue;
    }
    const modified = content.replace(exp.anchor, exp.replacement);
    writeFileSync(filePath, modified);
    const result = runTest(exp.name);
    if (result.sl > 0) {
      results.push({
        name: exp.name,
        slDelta: result.sl - baseline.sl,
        sDelta: result.s - baseline.s,
      });
    }
  }

  console.log('\n=== RESULTS (sorted by combined delta) ===');
  results.sort((a, b) => b.slDelta + b.sDelta - (a.slDelta + a.sDelta));
  for (const r of results) {
    const slSign = r.slDelta >= 0 ? '+' : '';
    const sSign = r.sDelta >= 0 ? '+' : '';
    console.log(`${r.name.padEnd(55)} SL:${slSign}${r.slDelta} S:${sSign}${r.sDelta}`);
  }

  const positives = results.filter((r) => r.slDelta > 3 && r.sDelta >= 0);
  if (positives.length > 0) {
    console.log('\n=== POSITIVES COMBINED (SL>3, S>=0) ===');
    let rContent = readFileSync(RULES, 'utf8');
    let sContent = readFileSync(STRESS, 'utf8');
    for (const p of positives) {
      const exp = experiments.find((e) => e.name === p.name)!;
      const filePath = exp.file === 'rules' ? RULES : STRESS;
      const content = exp.file === 'rules' ? rContent : sContent;
      if (content.includes(exp.anchor)) {
        const modified = content.replace(exp.anchor, exp.replacement);
        if (exp.file === 'rules') rContent = modified;
        else sContent = modified;
      }
    }
    writeFileSync(RULES, rContent);
    writeFileSync(STRESS, sContent);
    const combined = runTest('COMBINED');
    console.log(`Combined SL delta: ${combined.sl > 0 ? '+' : ''}${combined.sl - baseline.sl}`);
    console.log(`Combined S delta: ${combined.s > 0 ? '+' : ''}${combined.s - baseline.s}`);
  } else {
    console.log('\nNo experiments met the threshold (SL>3, S>=0).');
  }
}

main().catch(console.error);
