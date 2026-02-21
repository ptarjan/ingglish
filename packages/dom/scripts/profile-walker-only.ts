#!/usr/bin/env npx vite-node
/**
 * Profile just TreeWalker on pre-parsed Wikipedia DOM.
 */

import { performance } from 'perf_hooks';
import { setupJSDOM, loadWikipediaDOM } from './harness';

const ITERATIONS = 100;

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
  console.log('=== TreeWalker Profile (Pre-parsed DOM) ===\n');

  // Parse DOM once
  const dom = loadWikipediaDOM();
  setupJSDOM(dom);

  const body = dom.window.document.body;
  const allElements = Array.from(dom.window.document.querySelectorAll('*'));
  console.log(`Elements: ${allElements.length}`);

  // Current implementation
  function collectCurrent(): Text[] {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
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

  // Stack-based
  function collectStack(): Text[] {
    const nodes: Text[] = [];
    const stack: Node[] = [body];
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

  // Simple walker (no filter)
  function collectSimple(): Text[] {
    const nodes: Text[] = [];
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
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
  const nodes = collectCurrent();
  console.log(`Text nodes: ${nodes.length}`);
  console.log(`Stack match: ${collectStack().length === nodes.length}`);
  console.log(`Simple match: ${collectSimple().length === nodes.length}\n`);

  // Benchmark on SAME DOM (no creation overhead)
  function bench(name: string, fn: () => Text[]): number {
    // Warmup
    for (let i = 0; i < 100; i++) fn();

    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    console.log(`${name.padEnd(35)} avg: ${avg.toFixed(3)}ms  min: ${min.toFixed(3)}ms`);
    return avg;
  }

  console.log('--- Same-DOM Benchmarks ---\n');
  const currentMs = bench('Current (filter callback)', collectCurrent);
  const stackMs = bench('Stack-based', collectStack);
  const simpleMs = bench('Simple (no filter)', collectSimple);

  console.log('');
  console.log(
    `Stack vs Current: ${(((currentMs - stackMs) / currentMs) * 100).toFixed(1)}% ${stackMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Simple vs Current: ${(((currentMs - simpleMs) / currentMs) * 100).toFixed(1)}% ${simpleMs < currentMs ? 'faster' : 'slower'}`
  );

  // Profile shouldSkipElement specifically
  console.log('\n--- shouldSkipElement Profile ---\n');

  const { shouldSkipElement, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES } =
    await import('../src/utils/skip-rules');

  // Warmup
  for (let i = 0; i < 100; i++) {
    for (const el of allElements) {
      shouldSkipElement(el, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
    }
  }

  const skipTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    for (const el of allElements) {
      shouldSkipElement(el, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
    }
    skipTimes.push(performance.now() - start);
  }

  const skipAvg = skipTimes.reduce((a, b) => a + b, 0) / skipTimes.length;
  console.log(
    `shouldSkipElement x${allElements.length}: ${skipAvg.toFixed(3)}ms (${((skipAvg / allElements.length) * 1000).toFixed(2)}µs per el)`
  );

  // Breakdown: how much is Set lookup vs classList check?
  console.log('\n--- shouldSkipElement Breakdown ---\n');

  const SKIP_TAGS_SET = new Set(DEFAULT_SKIP_TAGS);
  const SKIP_CLASSES_SET = new Set(DEFAULT_SKIP_CLASSES);

  // Just tag check
  function checkTagOnly(el: Element): boolean {
    return SKIP_TAGS_SET.has(el.tagName);
  }

  // Tag + classList
  function checkTagAndClass(el: Element): boolean {
    if (SKIP_TAGS_SET.has(el.tagName)) return true;
    const classes = el.classList;
    for (let i = 0; i < classes.length; i++) {
      if (SKIP_CLASSES_SET.has(classes[i])) return true;
    }
    return false;
  }

  // Full check (tag + class + contenteditable + attributes)
  function checkFull(el: Element): boolean {
    if (SKIP_TAGS_SET.has(el.tagName)) return true;
    const classes = el.classList;
    for (let i = 0; i < classes.length; i++) {
      if (SKIP_CLASSES_SET.has(classes[i])) return true;
    }
    if (el.getAttribute('contenteditable') === 'true') return true;
    if (el.hasAttribute('data-ingglish-skip')) return true;
    if (el.hasAttribute('data-ingglish-original')) return true;
    return false;
  }

  // Warmup
  for (let i = 0; i < 100; i++) {
    for (const el of allElements) {
      checkTagOnly(el);
      checkTagAndClass(el);
      checkFull(el);
    }
  }

  const tagOnlyTimes: number[] = [];
  const tagClassTimes: number[] = [];
  const fullTimes: number[] = [];

  for (let i = 0; i < ITERATIONS; i++) {
    let start = performance.now();
    for (const el of allElements) checkTagOnly(el);
    tagOnlyTimes.push(performance.now() - start);

    start = performance.now();
    for (const el of allElements) checkTagAndClass(el);
    tagClassTimes.push(performance.now() - start);

    start = performance.now();
    for (const el of allElements) checkFull(el);
    fullTimes.push(performance.now() - start);
  }

  const tagOnlyAvg = tagOnlyTimes.reduce((a, b) => a + b, 0) / tagOnlyTimes.length;
  const tagClassAvg = tagClassTimes.reduce((a, b) => a + b, 0) / tagClassTimes.length;
  const fullAvg = fullTimes.reduce((a, b) => a + b, 0) / fullTimes.length;

  console.log(`Tag only:          ${tagOnlyAvg.toFixed(3)}ms`);
  console.log(`Tag + classList:   ${tagClassAvg.toFixed(3)}ms`);
  console.log(`Full check:        ${fullAvg.toFixed(3)}ms`);
  console.log(`Current impl:      ${skipAvg.toFixed(3)}ms`);

  // What's the current impl overhead?
  console.log(`\nClassList iteration adds: ${(tagClassAvg - tagOnlyAvg).toFixed(3)}ms`);
  console.log(`Attribute checks add:     ${(fullAvg - tagClassAvg).toFixed(3)}ms`);
}

main().catch(console.error);
