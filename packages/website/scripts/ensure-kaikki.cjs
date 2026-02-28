#!/usr/bin/env node
/**
 * Fast wrapper to check if kaikki IPA data exists before invoking tsx.
 * Avoids tsx startup overhead when data is already extracted.
 */

const { existsSync } = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

const kaikkiDir = join(__dirname, '..', 'data', 'kaikki');

// Check for at least one extracted file
const sampleFile = join(kaikkiDir, 'fi.tsv');

const force = process.argv.includes('--force');

if (!force && existsSync(sampleFile)) {
  console.log('Kaikki IPA data exists, skipping (use --force to rebuild)');
  process.exit(0);
}

execSync('npx tsx scripts/extract-kaikki-ipa.ts', {
  stdio: 'inherit',
  cwd: join(__dirname, '..'),
});
