#!/usr/bin/env npx vite-node
/**
 * Profile DOM translation operations using jsdom.
 * This measures the actual performance of DOM walking and translation.
 */

import { performance } from 'perf_hooks';
import { setupJSDOM, createTestDOM } from './harness';

const ITERATIONS = 50;

export async function main() {
  console.log('=== DOM Translation Profile ===\n');

  // Set up global document/window for the DOM package
  const smallDOM = createTestDOM(10);
  const mediumDOM = createTestDOM(50);
  const largeDOM = createTestDOM(200);

  setupJSDOM(smallDOM);

  // Import after setting up globals
  const { collectTextNodes } = await import('../src/traversal/text-nodes');
  const { shouldSkipElement, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES } =
    await import('../src/traversal/skip-rules');
  const { translate } = await import('ingglish');
  const { applyTranslationsMap } = await import('../src/translate/apply-map');
  const { extractWordsFromNodes } = await import('../src/traversal/extract');

  // Load dictionary by calling translate
  console.log('Loading dictionary...');
  await translate('hello');
  console.log('');

  // Profile collectTextNodes
  console.log('--- collectTextNodes Profile ---\n');

  function benchCollect(name: string, numParagraphs: number): void {
    const dom = createTestDOM(numParagraphs);
    setupJSDOM(dom);

    // Warmup
    for (let i = 0; i < 10; i++) {
      collectTextNodes(dom.window.document.body);
    }

    const times: number[] = [];
    let nodeCount = 0;
    for (let i = 0; i < ITERATIONS; i++) {
      // Re-create DOM to avoid cached state
      const freshDOM = createTestDOM(numParagraphs);
      setupJSDOM(freshDOM);

      const start = performance.now();
      const nodes = collectTextNodes(freshDOM.window.document.body);
      times.push(performance.now() - start);
      nodeCount = nodes.length;
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(
      `${name.padEnd(30)} avg: ${avg.toFixed(3)}ms  min: ${min.toFixed(3)}ms  max: ${max.toFixed(3)}ms  (${nodeCount} nodes)`
    );
  }

  benchCollect('collectTextNodes(small 10p)', 10);
  benchCollect('collectTextNodes(medium 50p)', 50);
  benchCollect('collectTextNodes(large 200p)', 200);

  // Profile shouldSkipElement
  console.log('\n--- shouldSkipElement Profile ---\n');

  setupJSDOM(mediumDOM);
  const elements = Array.from(mediumDOM.window.document.querySelectorAll('*'));
  console.log(`Testing with ${elements.length} elements`);

  // Warmup
  for (let i = 0; i < 100; i++) {
    for (const el of elements) {
      shouldSkipElement(el, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
    }
  }

  const skipTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    for (const el of elements) {
      shouldSkipElement(el, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
    }
    skipTimes.push(performance.now() - start);
  }

  const skipAvg = skipTimes.reduce((a, b) => a + b, 0) / skipTimes.length;
  console.log(
    `shouldSkipElement x${elements.length}   avg: ${skipAvg.toFixed(3)}ms  (${((skipAvg / elements.length) * 1000).toFixed(2)}µs per element)`
  );

  // Profile extractWordsFromNodes
  console.log('\n--- extractWordsFromNodes Profile ---\n');

  setupJSDOM(mediumDOM);

  const textNodes = collectTextNodes(mediumDOM.window.document.body);
  console.log(`Testing with ${textNodes.length} text nodes`);

  // Warmup
  for (let i = 0; i < 100; i++) {
    extractWordsFromNodes(textNodes);
  }

  const extractTimes: number[] = [];
  let wordCount = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    const words = extractWordsFromNodes(textNodes);
    extractTimes.push(performance.now() - start);
    wordCount = words.length;
  }

  const extractAvg = extractTimes.reduce((a, b) => a + b, 0) / extractTimes.length;
  console.log(
    `extractWordsFromNodes   avg: ${extractAvg.toFixed(3)}ms  (${wordCount} unique words)`
  );

  // Profile applyTranslationsMap
  console.log('\n--- applyTranslationsMap Profile ---\n');

  // Create a translation map
  const words = extractWordsFromNodes(textNodes);
  const translations: Record<string, string> = {};
  for (const word of words) {
    translations[word] = word + '-translated'; // Simulated translation
  }
  console.log(`Applying ${Object.keys(translations).length} translations`);

  const applyTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    // Re-create DOM for each iteration
    const freshDOM = createTestDOM(50);
    setupJSDOM(freshDOM);

    const start = performance.now();
    await applyTranslationsMap(freshDOM.window.document.body, translations, {
      showTooltips: false,
    });
    applyTimes.push(performance.now() - start);
  }

  const applyAvg = applyTimes.reduce((a, b) => a + b, 0) / applyTimes.length;
  const applyMin = Math.min(...applyTimes);
  const applyMax = Math.max(...applyTimes);
  console.log(
    `applyTranslationsMap(50p)   avg: ${applyAvg.toFixed(3)}ms  min: ${applyMin.toFixed(3)}ms  max: ${applyMax.toFixed(3)}ms`
  );

  // Summary
  console.log('\n=== Summary ===\n');
  console.log('Key metrics for optimization targeting:');
  console.log(`- shouldSkipElement per call: ${((skipAvg / elements.length) * 1000).toFixed(2)}µs`);
  console.log(`- extractWordsFromNodes: ${extractAvg.toFixed(3)}ms`);
  console.log(`- applyTranslationsMap: ${applyAvg.toFixed(3)}ms`);
}

if (process.argv[1]?.includes('profile-dom')) main().catch(console.error);
