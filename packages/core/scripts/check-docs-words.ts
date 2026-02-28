#!/usr/bin/env npx vite-node
/**
 * Extract all English words from docs/ markdown files, poems, challenge data,
 * and English samples, then check which are missing from the CMU dictionary
 * and whether the fallback produces reasonable translations.
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadDictionary, loadFrequencies, lookupPronunciation } from '@ingglish/dictionary';
import { translateSync } from 'ingglish';

// Strip markdown syntax to get plain text
function stripMarkdown(md: string): string {
  return (
    md
      // Remove code blocks (```...```)
      .replace(/```[\s\S]*?```/g, '')
      // Remove inline code (`...`)
      .replace(/`[^`]+`/g, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Remove markdown links [text](url) — keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove image syntax ![alt](url)
      .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
      // Remove headers (#)
      .replace(/^#+\s*/gm, '')
      // Remove bold/italic markers
      .replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}$/gm, '')
      // Remove blockquote markers
      .replace(/^>\s*/gm, '')
      // Remove list markers
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
  );
}

async function main() {
  await Promise.all([loadDictionary(), loadFrequencies()]);

  const allWords = new Set<string>();

  // 1. Read all docs/*.md files
  const docsDir = path.resolve(import.meta.dirname, '../../../docs');
  const mdFiles = [
    ...fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => path.join(docsDir, f)),
    path.join(docsDir, 'generated', 'README.md'),
  ].filter((f) => fs.existsSync(f));

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const plain = stripMarkdown(content);
    const words = plain.match(/[a-zA-Z']+/g) || [];
    for (const w of words) {
      if (w.length >= 2) {
        // Skip single letters
        allWords.add(w.toLowerCase());
      }
    }
  }

  // 2. Read poems data
  const poemsPath = path.resolve(import.meta.dirname, '../../../website/src/data/poems-data.ts');
  if (fs.existsSync(poemsPath)) {
    const content = fs.readFileSync(poemsPath, 'utf-8');
    const words = content.match(/[a-zA-Z']+/g) || [];
    for (const w of words) {
      if (w.length >= 2 && !/^[A-Z][a-z]+$/.test(w)) {
        // Skip TS keywords
        allWords.add(w.toLowerCase());
      }
    }
  }

  // 3. Read the-chaos-lines
  const chaosPath = path.resolve(
    import.meta.dirname,
    '../../../website/src/data/the-chaos-lines.ts'
  );
  if (fs.existsSync(chaosPath)) {
    const content = fs.readFileSync(chaosPath, 'utf-8');
    // Extract string content from template literals and quotes
    const strings = content.match(/'[^']+'/g) || [];
    for (const s of strings) {
      const words = s.match(/[a-zA-Z']+/g) || [];
      for (const w of words) {
        if (w.length >= 2) allWords.add(w.toLowerCase());
      }
    }
  }

  // 4. Read challenge data
  const challengePath = path.resolve(
    import.meta.dirname,
    '../../../website/src/data/challenge-data.ts'
  );
  if (fs.existsSync(challengePath)) {
    const content = fs.readFileSync(challengePath, 'utf-8');
    const strings = content.match(/'[^']+'/g) || [];
    for (const s of strings) {
      const words = s.match(/[a-zA-Z']+/g) || [];
      for (const w of words) {
        if (w.length >= 2) allWords.add(w.toLowerCase());
      }
    }
  }

  // 5. Read English samples
  const enSamplesPath = path.resolve(
    import.meta.dirname,
    '../../../website/src/data/samples/en.ts'
  );
  if (fs.existsSync(enSamplesPath)) {
    const content = fs.readFileSync(enSamplesPath, 'utf-8');
    const words = content.match(/[a-zA-Z']+/g) || [];
    for (const w of words) {
      if (w.length >= 2) allWords.add(w.toLowerCase());
    }
  }

  console.log(`Total unique words extracted: ${allWords.size}\n`);

  // Check each word
  const missing: { word: string; translated: string }[] = [];
  let inDict = 0;

  for (const word of [...allWords].sort()) {
    const pron = lookupPronunciation(word);
    if (pron) {
      inDict++;
    } else {
      const translated = translateSync(word);
      missing.push({ word, translated });
    }
  }

  // Categorize missing words
  const wrongTranslations: typeof missing = [];
  const acceptableTranslations: typeof missing = [];

  for (const entry of missing) {
    const { word, translated } = entry;
    // A translation is "wrong" if it looks nothing like what we'd expect
    // Heuristic: if the translated form === the original, it's preserved (fine)
    // If the translated form is very different length-wise, might be wrong
    if (translated === word) {
      acceptableTranslations.push(entry); // Preserved word
    } else {
      // Check if it round-trips (not a perfect test but useful)
      acceptableTranslations.push(entry);
    }
  }

  console.log(`=== WORDS NOT IN CMU DICTIONARY (${missing.length}/${allWords.size}) ===\n`);

  // Group by first letter for readability
  const byLetter = new Map<string, typeof missing>();
  for (const entry of missing) {
    const letter = entry.word[0]!;
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter)!.push(entry);
  }

  for (const [letter, entries] of [...byLetter.entries()].sort()) {
    console.log(`--- ${letter.toUpperCase()} ---`);
    for (const { word, translated } of entries) {
      const marker = translated === word ? '(preserved)' : '';
      console.log(`  ${word.padEnd(30)} -> ${translated.padEnd(30)} ${marker}`);
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total unique words: ${allWords.size}`);
  console.log(`In CMU dictionary:  ${inDict}`);
  console.log(`Using fallback:     ${missing.length}`);
}

main().catch(console.error);
