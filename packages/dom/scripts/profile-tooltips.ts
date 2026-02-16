/**
 * Profile DOM translation with tooltips enabled vs disabled.
 */

import { performance } from 'perf_hooks';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';

const ITERATIONS = 10;

const wikipediaHtml = readFileSync(join(__dirname, 'wikipedia.html'), 'utf-8');

function createDOM(): JSDOM {
  const dom = new JSDOM(wikipediaHtml);
  // @ts-expect-error - mock
  dom.window.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0);
  return dom;
}

async function main() {
  console.log('=== Tooltip Performance Profile ===\n');

  const dom = createDOM();
  // @ts-expect-error - global
  global.document = dom.window.document;
  // @ts-expect-error - global
  global.Document = dom.window.Document;
  // @ts-expect-error - global
  global.window = dom.window;
  // @ts-expect-error - global
  global.Node = dom.window.Node;
  // @ts-expect-error - global
  global.NodeFilter = dom.window.NodeFilter;
  // @ts-expect-error - global
  global.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0);

  const { translate } = await import('ingglish');
  const { applyTranslationsMap } = await import('../src/translate/apply-map');
  const { collectTextNodes } = await import('../src/utils/text-nodes');
  const { extractWordsFromNodes } = await import('../src/utils/extract');

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
    const freshDOM = createDOM();
    // @ts-expect-error - global
    global.document = freshDOM.window.document;
    // @ts-expect-error - global
    global.Document = freshDOM.window.Document;
    // @ts-expect-error - global
    global.Node = freshDOM.window.Node;
    // @ts-expect-error - global
    global.NodeFilter = freshDOM.window.NodeFilter;

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
    const freshDOM = createDOM();
    // @ts-expect-error - global
    global.document = freshDOM.window.document;
    // @ts-expect-error - global
    global.Document = freshDOM.window.Document;
    // @ts-expect-error - global
    global.Node = freshDOM.window.Node;
    // @ts-expect-error - global
    global.NodeFilter = freshDOM.window.NodeFilter;

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

main().catch(console.error);
