#!/usr/bin/env node
/**
 * Pre-commit checks:
 * 1. Prevent large files from being committed (like generated dictionaries)
 * 2. Lint .gitignore files for common issues
 */

import { execSync } from 'child_process';
import { readFileSync, statSync } from 'fs';

// Maximum file size in bytes (500KB)
const MAX_FILE_SIZE = 500 * 1024;

// Files that are allowed to be large (e.g., images, assets)
const LARGE_FILE_ALLOWLIST = [
  /\.png$/i,
  /\.jpg$/i,
  /\.jpeg$/i,
  /\.gif$/i,
  /\.ico$/i,
  /\.woff2?$/i,
  /\.ttf$/i,
  /\.eot$/i,
];

/**
 * Get list of staged files
 */
function getStagedFiles() {
  try {
    const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf8',
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Check for large files in staged changes
 */
function checkLargeFiles(files) {
  const errors = [];

  for (const file of files) {
    // Skip allowlisted file types
    if (LARGE_FILE_ALLOWLIST.some((pattern) => pattern.test(file))) {
      continue;
    }

    try {
      const stats = statSync(file);
      if (stats.size > MAX_FILE_SIZE) {
        const sizeKB = (stats.size / 1024).toFixed(1);
        const maxKB = (MAX_FILE_SIZE / 1024).toFixed(0);
        errors.push(`${file}: ${sizeKB}KB exceeds ${maxKB}KB limit`);
      }
    } catch {
      // File might have been deleted or moved, skip
    }
  }

  return errors;
}

/**
 * Lint a .gitignore file for common issues
 */
function lintGitignore(filepath) {
  const errors = [];
  let content;

  try {
    content = readFileSync(filepath, 'utf8');
  } catch {
    return errors;
  }

  const lines = content.split('\n');

  // Track patterns for duplicate detection
  const patterns = new Map();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Check for trailing whitespace (common mistake)
    if (line !== line.trimEnd()) {
      errors.push(`${filepath}:${lineNum}: trailing whitespace`);
    }

    // Check for duplicate patterns
    const pattern = line.trim();
    if (patterns.has(pattern)) {
      errors.push(
        `${filepath}:${lineNum}: duplicate pattern "${pattern}" (first seen at line ${patterns.get(pattern)})`
      );
    } else {
      patterns.set(pattern, lineNum);
    }

    // Check for patterns that should probably use /
    if (pattern.startsWith(' ')) {
      errors.push(`${filepath}:${lineNum}: leading whitespace (probably unintended)`);
    }

    // Check for Windows-style paths
    if (pattern.includes('\\') && !pattern.includes('\\\\')) {
      errors.push(`${filepath}:${lineNum}: use forward slashes, not backslashes`);
    }
  }

  return errors;
}

/**
 * Check all staged .gitignore files
 */
function checkGitignores(files) {
  const errors = [];

  for (const file of files) {
    if (file.endsWith('.gitignore') || file === '.gitignore') {
      errors.push(...lintGitignore(file));
    }
  }

  return errors;
}

function main() {
  const stagedFiles = getStagedFiles();

  if (stagedFiles.length === 0) {
    process.exit(0);
  }

  let hasErrors = false;

  // Check for large files
  const largeFileErrors = checkLargeFiles(stagedFiles);
  if (largeFileErrors.length > 0) {
    console.error('\n❌ Large files detected (max ' + MAX_FILE_SIZE / 1024 + 'KB):');
    for (const error of largeFileErrors) {
      console.error('  ' + error);
    }
    console.error('\nIf this file should be generated at build time, add it to .gitignore.');
    console.error(
      'If it must be committed, add its pattern to LARGE_FILE_ALLOWLIST in scripts/pre-commit-checks.js\n'
    );
    hasErrors = true;
  }

  // Lint .gitignore files
  const gitignoreErrors = checkGitignores(stagedFiles);
  if (gitignoreErrors.length > 0) {
    console.error('\n❌ .gitignore issues:');
    for (const error of gitignoreErrors) {
      console.error('  ' + error);
    }
    console.error('');
    hasErrors = true;
  }

  if (hasErrors) {
    process.exit(1);
  }
}

main();
