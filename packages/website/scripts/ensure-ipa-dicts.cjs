#!/usr/bin/env node
/**
 * Fast wrapper to check if IPA dictionaries exist before invoking tsx.
 * Avoids tsx startup overhead when dictionaries are already built.
 */

const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

const dictsDir = join(__dirname, '..', 'public', 'ipa-dicts');

// Check for at least one dictionary file
const sampleFile = join(dictsDir, 'fr.json');

const force = process.argv.includes('--force');

if (!force && existsSync(sampleFile)) {
  console.log('IPA dictionaries exist, skipping (use --force to rebuild)');
  process.exit(0);
}

execSync('npx tsx --conditions=source scripts/build-ipa-dicts.ts' + (force ? '' : ''), {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
});
