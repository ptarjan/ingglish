#!/usr/bin/env -S npx vite-node --script
/**
 * Profile DOM translation with tooltips enabled vs disabled.
 */

import { performance } from 'perf_hooks';
import { setupJSDOM, loadWikipediaDOM } from './harness';

const ITERATIONS = 10;

export async function main() {
  console.log('=== Tooltip Performance Profile ===\n');

  const dom = loadWikipediaDOM();
  setupJSDOM(dom);

  const { translate } = await import('ingglish');
  const { applyTranslationsMap } = await import('../src/translate/apply-map');
  const { collectTextNodes } = await import('../src/traversal/text-nodes');
  const { extractWordsFromNodes } = await import('../src/traversal/extract');

  console.log('Loading dictionary...');
  await translate('hello');

  // Get text nodes and build translations
  const textNodes = collectTextNodes(dom.window.document.body);
  const words = extractWordsFromNodes(textNodes);

  const translations: Record<string, string> = {};
  for (const word of words) {
    translations[word] = word + '-translated';
  }

  console.log('Text nodes: ' + textNodes.length);
  console.log('Unique words: ' + words.length + '\n');

  // Profile WITHOUT tooltips
  console.log('--- Without Tooltips (simple textContent) ---');
  const noTooltipTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const freshDOM = loadWikipediaDOM();
    setupJSDOM(freshDOM);

    const start = performance.now();
    await applyTranslationsMap(freshDOM.window.document.body, translations, {
      showTooltips: false,
    });
    noTooltipTimes.push(performance.now() - start);
  }
  const noTooltipAvg = noTooltipTimes.reduce((a, b) => a + b, 0) / noTooltipTimes.length;
  console.log('Average: ' + noTooltipAvg.toFixed(2) + 'ms');

  // Profile WITH tooltips
  console.log('\n--- With Tooltips (span creation) ---');
  const tooltipTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const freshDOM = loadWikipediaDOM();
    setupJSDOM(freshDOM);

    const start = performance.now();
    await applyTranslationsMap(freshDOM.window.document.body, translations, {
      showTooltips: true,
    });
    tooltipTimes.push(performance.now() - start);
  }
  const tooltipAvg = tooltipTimes.reduce((a, b) => a + b, 0) / tooltipTimes.length;
  console.log('Average: ' + tooltipAvg.toFixed(2) + 'ms');

  const overhead = ((tooltipAvg - noTooltipAvg) / noTooltipAvg) * 100;
  const perNodeDiff = ((tooltipAvg - noTooltipAvg) / textNodes.length) * 1000;

  console.log('\n--- Comparison ---');
  console.log('Tooltip overhead: ' + overhead.toFixed(1) + '% slower');
  console.log('Per-node difference: ' + perNodeDiff.toFixed(2) + 'µs');
}

if (process.argv[1]?.includes('profile-tooltips')) main().catch(console.error);
