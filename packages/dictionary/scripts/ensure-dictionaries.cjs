#!/usr/bin/env node
/**
 * Fast wrapper to check if dictionaries exist before invoking tsx.
 * Avoids 4s tsx startup overhead when dictionaries are already built.
 */

const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

const cmudict = join(__dirname, '..', 'src', 'cmudict.js');
const reverseCmudict = join(__dirname, '..', 'src', 'reverse-cmudict.js');

const force = process.argv.includes('--force');

if (!force && existsSync(cmudict) && existsSync(reverseCmudict)) {
  console.log('Dictionaries exist, skipping (use --force to rebuild)');
  process.exit(0);
}

// Run the full build script
execSync('npx tsx scripts/build-dictionary.ts' + (force ? ' --force' : ''), {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
});
