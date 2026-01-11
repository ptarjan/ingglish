/**
 * Profile DOM translation with real Wikipedia HTML.
 */

import { performance } from 'perf_hooks';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { join } from 'path';

const ITERATIONS = 20;

// Load real Wikipedia HTML
const wikipediaHtml = readFileSync(join(__dirname, 'wikipedia.html'), 'utf-8');

function createWikipediaDOM(): JSDOM {
  const dom = new JSDOM(wikipediaHtml);
  // Mock requestAnimationFrame for Node.js
  // @ts-expect-error - mock
  dom.window.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0);
  return dom;
}

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'KBD',
  'SAMP',
  'VAR',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'SVG',
  'MATH',
  'CANVAS',
]);

async function main() {
  console.log('=== Wikipedia DOM Profile ===\n');
  console.log(`HTML size: ${(wikipediaHtml.length / 1024).toFixed(1)} KB\n`);

  const dom = createWikipediaDOM();
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

  const { collectTextNodes } = await import('../src/utils/text-nodes');
  const { shouldSkipElement, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES } =
    await import('../src/utils/skip-rules');
  const { translate } = await import('@ingglish/core');
  const { applyTranslationsMap } = await import('../src/translate/apply-map');
  const { extractWordsFromNodes } = await import('../src/utils/extract');

  // Load dictionary
  console.log('Loading dictionary...');
  await translate('hello');

  // Analyze the DOM
  const textNodes = collectTextNodes(dom.window.document.body);
  const elements = Array.from(dom.window.document.querySelectorAll('*'));
  const words = extractWordsFromNodes(textNodes);

  // Count total words
  let totalWords = 0;
  let totalChars = 0;
  for (const node of textNodes) {
    const text = node.textContent ?? '';
    totalWords += text.split(/\s+/).filter((w) => w.length > 0).length;
    totalChars += text.length;
  }

  console.log('');
  console.log('--- DOM Statistics ---');
  console.log(`Total elements: ${elements.length}`);
  console.log(`Text nodes: ${textNodes.length}`);
  console.log(`Total characters: ${totalChars}`);
  console.log(`Total word occurrences: ${totalWords}`);
  console.log(`Unique words: ${words.length}`);
  console.log('');

  // Profile collectTextNodes
  console.log('--- Profile: collectTextNodes ---\n');

  // Warmup
  for (let i = 0; i < 5; i++) {
    const freshDOM = createWikipediaDOM();
    // @ts-expect-error - global
    global.document = freshDOM.window.document;
    // @ts-expect-error - global
    global.Node = freshDOM.window.Node;
    // @ts-expect-error - global
    global.NodeFilter = freshDOM.window.NodeFilter;
    collectTextNodes(freshDOM.window.document.body);
  }

  const collectTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const freshDOM = createWikipediaDOM();
    // @ts-expect-error - global
    global.document = freshDOM.window.document;
    // @ts-expect-error - global
    global.Node = freshDOM.window.Node;
    // @ts-expect-error - global
    global.NodeFilter = freshDOM.window.NodeFilter;

    const start = performance.now();
    collectTextNodes(freshDOM.window.document.body);
    collectTimes.push(performance.now() - start);
  }

  const collectAvg = collectTimes.reduce((a, b) => a + b, 0) / collectTimes.length;
  console.log(
    `collectTextNodes:  avg: ${collectAvg.toFixed(2)}ms  (${((collectAvg / textNodes.length) * 1000).toFixed(2)}µs per node)`
  );

  // Profile extractWordsFromNodes
  console.log('\n--- Profile: extractWordsFromNodes ---\n');

  // @ts-expect-error - global
  global.document = dom.window.document;
  // @ts-expect-error - global
  global.Node = dom.window.Node;
  // @ts-expect-error - global
  global.NodeFilter = dom.window.NodeFilter;

  const extractTimes: number[] = [];
  for (let i = 0; i < ITERATIONS * 5; i++) {
    const start = performance.now();
    extractWordsFromNodes(textNodes);
    extractTimes.push(performance.now() - start);
  }

  const extractAvg = extractTimes.reduce((a, b) => a + b, 0) / extractTimes.length;
  console.log(
    `extractWordsFromNodes:  avg: ${extractAvg.toFixed(2)}ms  (${words.length} unique words)`
  );

  // Build translations map
  const translations: Record<string, string> = {};
  for (const word of words) {
    translations[word] = word + '-tr';
  }

  // Profile applyTranslationsMap
  console.log('\n--- Profile: applyTranslationsMap ---\n');

  const applyTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const freshDOM = createWikipediaDOM();
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
    applyTimes.push(performance.now() - start);
  }

  const applyAvg = applyTimes.reduce((a, b) => a + b, 0) / applyTimes.length;
  const applyMin = Math.min(...applyTimes);
  const applyMax = Math.max(...applyTimes);
  console.log(
    `applyTranslationsMap:  avg: ${applyAvg.toFixed(2)}ms  min: ${applyMin.toFixed(2)}ms  max: ${applyMax.toFixed(2)}ms`
  );
  console.log(`Per text node: ${((applyAvg / textNodes.length) * 1000).toFixed(2)}µs`);
  console.log(`Per word: ${((applyAvg / totalWords) * 1000).toFixed(2)}µs`);

  // Pure text processing time (without DOM overhead)
  console.log('\n--- Profile: Text processing only ---\n');

  const { normalizeApostrophes, detectCasePattern, applyCasePattern } =
    await import('@ingglish/core/internal');
  const WORD_REGEX = /[a-zA-Z']+/g;

  const processTimes: number[] = [];
  for (let i = 0; i < ITERATIONS * 5; i++) {
    let totalProcessTime = 0;
    for (const textNode of textNodes) {
      const text = textNode.textContent ?? '';
      if (text.length === 0) continue;

      const start = performance.now();
      const normalized = normalizeApostrophes(text);
      let result = '';
      let lastIndex = 0;
      let match;
      WORD_REGEX.lastIndex = 0;

      while ((match = WORD_REGEX.exec(normalized)) !== null) {
        result += normalized.slice(lastIndex, match.index);
        lastIndex = match.index + match[0].length;
        const word = match[0];
        const translated = translations[word.toLowerCase()];
        if (translated) {
          const pattern = detectCasePattern(word);
          result += applyCasePattern(translated, pattern, word);
        } else {
          result += word;
        }
      }
      result += normalized.slice(lastIndex);
      totalProcessTime += performance.now() - start;
    }
    processTimes.push(totalProcessTime);
  }

  const processAvg = processTimes.reduce((a, b) => a + b, 0) / processTimes.length;
  console.log(
    `Pure text processing:  avg: ${processAvg.toFixed(2)}ms  (${((processAvg / textNodes.length) * 1000).toFixed(2)}µs per node)`
  );

  // Test TreeWalker alternatives
  console.log('\n--- TreeWalker Alternatives ---\n');

  // Current implementation
  function collectCurrent(root: Element): Text[] {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node: Node): number {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return SKIP_TAGS.has((node as Element).tagName)
            ? NodeFilter.FILTER_REJECT
            : NodeFilter.FILTER_SKIP;
        }
        const text = (node as Text).textContent?.trim() ?? '';
        return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    while (walker.nextNode()) {
      if (walker.currentNode.nodeType === Node.TEXT_NODE) {
        nodes.push(walker.currentNode as Text);
      }
    }
    return nodes;
  }

  // Alternative: Stack-based (no TreeWalker)
  function collectStack(root: Element): Text[] {
    const nodes: Text[] = [];
    const stack: Node[] = [root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TAGS.has((node as Element).tagName)) continue;
        const children = node.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push(children[i]);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() ?? '';
        if (text.length > 0) {
          nodes.push(node as Text);
        }
      }
    }
    return nodes;
  }

  // Alternative: Simple walker without filter
  function collectSimple(root: Element): Text[] {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const text = node.textContent?.trim() ?? '';
      if (text.length === 0) continue;
      let skip = false;
      let parent = node.parentElement;
      while (parent && !skip) {
        if (SKIP_TAGS.has(parent.tagName)) skip = true;
        parent = parent.parentElement;
      }
      if (!skip) nodes.push(node);
    }
    return nodes;
  }

  // Verify same results
  // @ts-expect-error - global
  global.document = dom.window.document;
  const currentNodes = collectCurrent(dom.window.document.body);
  const stackNodes = collectStack(dom.window.document.body);
  const simpleNodes = collectSimple(dom.window.document.body);

  console.log(`Current:      ${currentNodes.length} nodes`);
  console.log(
    `Stack-based:  ${stackNodes.length} nodes (match: ${stackNodes.length === currentNodes.length})`
  );
  console.log(
    `Simple:       ${simpleNodes.length} nodes (match: ${simpleNodes.length === currentNodes.length})`
  );
  console.log('');

  // Benchmark alternatives
  function bench(name: string, fn: () => Text[]): number {
    // Warmup
    for (let i = 0; i < 5; i++) {
      const freshDOM = createWikipediaDOM();
      // @ts-expect-error - global
      global.document = freshDOM.window.document;
      // @ts-expect-error - global
      global.Node = freshDOM.window.Node;
      // @ts-expect-error - global
      global.NodeFilter = freshDOM.window.NodeFilter;
      fn();
    }

    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const freshDOM = createWikipediaDOM();
      // @ts-expect-error - global
      global.document = freshDOM.window.document;
      // @ts-expect-error - global
      global.Node = freshDOM.window.Node;
      // @ts-expect-error - global
      global.NodeFilter = freshDOM.window.NodeFilter;

      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    console.log(`${name.padEnd(30)} avg: ${avg.toFixed(2)}ms`);
    return avg;
  }

  const currentMs = bench('Current (filter callback)', () => collectCurrent(document.body));
  const stackMs = bench('Stack-based (no TreeWalker)', () => collectStack(document.body));
  const simpleMs = bench('Simple (no filter callback)', () => collectSimple(document.body));

  console.log('');
  console.log(
    `Stack vs Current: ${(((currentMs - stackMs) / currentMs) * 100).toFixed(1)}% ${stackMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Simple vs Current: ${(((currentMs - simpleMs) / currentMs) * 100).toFixed(1)}% ${simpleMs < currentMs ? 'faster' : 'slower'}`
  );

  // Summary
  console.log('\n=== Summary ===\n');
  console.log(
    `Total translation time: ${applyAvg.toFixed(2)}ms for ${textNodes.length} text nodes (${totalWords} words)`
  );
  console.log(`Breakdown:`);
  console.log(
    `  - collectTextNodes: ${collectAvg.toFixed(2)}ms (${((collectAvg / applyAvg) * 100).toFixed(1)}%)`
  );
  console.log(
    `  - Text processing:  ${processAvg.toFixed(2)}ms (${((processAvg / applyAvg) * 100).toFixed(1)}%)`
  );
  const domUpdateTime = applyAvg - processAvg - collectAvg;
  console.log(
    `  - DOM updates:      ${domUpdateTime.toFixed(2)}ms (${((domUpdateTime / applyAvg) * 100).toFixed(1)}%)`
  );
}

main().catch(console.error);
