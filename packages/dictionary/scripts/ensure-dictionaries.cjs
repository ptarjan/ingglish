#!/usr/bin/env node
/**
 * Fast wrapper to check if dictionaries exist before invoking tsx.
 * Avoids 4s tsx startup overhead when dictionaries are already built.
 */

const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

const src = join(__dirname, '..', 'src');
const requiredFiles = [
  join(src, 'cmudict.js'),
  join(src, 'cmudict.json'),
  join(src, 'reverse-cmudict.js'),
  join(src, 'reverse-cmudict.json'),
  join(src, 'data', 'word-frequencies.js'),
  join(src, 'data', 'word-frequencies.json'),
];

const force = process.argv.includes('--force');

if (!force && requiredFiles.every(existsSync)) {
  console.log('Dictionaries exist, skipping (use --force to rebuild)');
  process.exit(0);
}

// Run the full build script
execSync('npx tsx --conditions=source scripts/build-dictionary.ts' + (force ? ' --force' : ''), {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
});
