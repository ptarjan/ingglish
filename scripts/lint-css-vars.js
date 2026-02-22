/**
 * Cross-file CSS custom property linter.
 *
 * Checks that every var(--xxx) reference across all CSS files resolves to a
 * custom property declared in :root or [data-theme] selectors.
 *
 * Usage: node scripts/lint-css-vars.js
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CSS_DIR = 'packages/website/src/styles';
const EXT_CSS = 'packages/extension/src/popup.css';

/** Recursively collect .css files */
function collectCss(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...collectCss(full));
    } else if (name.endsWith('.css')) {
      files.push(full);
    }
  }
  return files;
}

// Gather all CSS files
const cssFiles = [...collectCss(CSS_DIR), EXT_CSS];

// 1. Collect all defined custom properties (from :root, [data-theme], @property)
const defined = new Set();

for (const file of cssFiles) {
  const src = readFileSync(file, 'utf8');

  // Match declarations inside :root { } and [data-theme...] { }
  // Also matches @property --name
  for (const m of src.matchAll(/@property\s+(--[\w-]+)/g)) {
    defined.add(m[1]);
  }
  // Match custom property declarations anywhere (--name: value)
  for (const m of src.matchAll(/(--[\w-]+)\s*:/g)) {
    defined.add(m[1]);
  }
}

// 2. Check all var() references
let errors = 0;

for (const file of cssFiles) {
  const src = readFileSync(file, 'utf8');
  const lines = src.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match var(--xxx) — but skip var(--xxx, fallback) since those are safe
    for (const m of line.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
      const prop = m[1];

      if (!defined.has(prop)) {
        const rel = relative(process.cwd(), file);
        console.error(`${rel}:${i + 1}  Undefined CSS variable "${prop}"`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} undefined CSS variable(s) found.`);
  process.exit(1);
} else {
  console.log('All CSS variable references resolve to defined properties.');
}
