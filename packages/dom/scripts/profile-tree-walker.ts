#!/usr/bin/env -S npx vite-node --script
/**
 * Profile TreeWalker alternatives for collectTextNodes.
 */

import { performance } from 'perf_hooks';
import { setupJSDOM, createRealisticDOM } from './harness';

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

export async function main() {
  console.log('=== TreeWalker Alternatives Profile ===\n');

  const dom = createRealisticDOM();
  setupJSDOM(dom);

  // Current implementation (from text-nodes.ts)
  function collectTextNodesCurrent(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
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
        textNodes.push(walker.currentNode as Text);
      }
    }
    return textNodes;
  }

  // Alternative 1: Only show text nodes, check parent in filter
  function collectTextNodesTextOnly(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node: Node): number {
        // Check parent chain for skip tags
        let parent = node.parentElement;
        while (parent) {
          if (SKIP_TAGS.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          parent = parent.parentElement;
        }
        const text = (node as Text).textContent?.trim() ?? '';
        return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    while (walker.nextNode()) {
      textNodes.push(walker.currentNode as Text);
    }
    return textNodes;
  }

  // Alternative 2: Recursive traversal (no TreeWalker)
  function collectTextNodesRecursive(root: Element | Document): Text[] {
    const textNodes: Text[] = [];

    function traverse(node: Node): void {
      if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TAGS.has((node as Element).tagName)) {
          return; // Skip entire subtree
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() ?? '';
        if (text.length > 0) {
          textNodes.push(node as Text);
        }
      }
    }

    if (root instanceof Document) {
      traverse(root.body);
    } else {
      traverse(root);
    }
    return textNodes;
  }

  // Alternative 3: Iterative stack-based (no TreeWalker, no recursion)
  function collectTextNodesStack(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
    const stack: Node[] = [root instanceof Document ? root.body : root];

    while (stack.length > 0) {
      const node = stack.pop()!;

      if (node.nodeType === Node.ELEMENT_NODE) {
        if (SKIP_TAGS.has((node as Element).tagName)) {
          continue;
        }
        // Push children in reverse order so we process left-to-right
        const children = node.childNodes;
        for (let i = children.length - 1; i >= 0; i--) {
          stack.push(children[i]);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() ?? '';
        if (text.length > 0) {
          textNodes.push(node as Text);
        }
      }
    }
    return textNodes;
  }

  // Alternative 4: Simple TreeWalker without filter callback
  function collectTextNodesSimpleWalker(root: Element | Document): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      null // No filter - check manually
    );

    while (walker.nextNode()) {
      const node = walker.currentNode as Text;
      const text = node.textContent?.trim() ?? '';
      if (text.length === 0) continue;

      // Check parent chain for skip tags
      let skip = false;
      let parent = node.parentElement;
      while (parent && !skip) {
        if (SKIP_TAGS.has(parent.tagName)) {
          skip = true;
        }
        parent = parent.parentElement;
      }
      if (!skip) {
        textNodes.push(node);
      }
    }
    return textNodes;
  }

  // Verify all produce same output
  const currentResult = collectTextNodesCurrent(dom.window.document.body);
  console.log(`Current implementation: ${currentResult.length} text nodes`);

  const textOnlyResult = collectTextNodesTextOnly(dom.window.document.body);
  console.log(
    `Text-only walker: ${textOnlyResult.length} text nodes (match: ${textOnlyResult.length === currentResult.length})`
  );

  const recursiveResult = collectTextNodesRecursive(dom.window.document.body);
  console.log(
    `Recursive: ${recursiveResult.length} text nodes (match: ${recursiveResult.length === currentResult.length})`
  );

  const stackResult = collectTextNodesStack(dom.window.document.body);
  console.log(
    `Stack-based: ${stackResult.length} text nodes (match: ${stackResult.length === currentResult.length})`
  );

  const simpleResult = collectTextNodesSimpleWalker(dom.window.document.body);
  console.log(
    `Simple walker: ${simpleResult.length} text nodes (match: ${simpleResult.length === currentResult.length})`
  );
  console.log('');

  // Benchmark each
  const ITERATIONS = 200;
  function bench(name: string, fn: () => Text[]): number {
    // Warmup
    for (let i = 0; i < 50; i++) {
      const freshDOM = createRealisticDOM();
      setupJSDOM(freshDOM);
      fn();
    }

    const times: number[] = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const freshDOM = createRealisticDOM();
      setupJSDOM(freshDOM);

      const start = performance.now();
      fn();
      times.push(performance.now() - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    console.log(
      `${name.padEnd(35)} avg: ${avg.toFixed(3)}ms  min: ${min.toFixed(3)}ms  max: ${max.toFixed(3)}ms`
    );
    return avg;
  }

  console.log('--- Benchmarks ---\n');

  const currentMs = bench('Current (SHOW_ELEMENT|SHOW_TEXT)', () =>
    collectTextNodesCurrent(document.body)
  );
  const textOnlyMs = bench('Text-only walker (parent check)', () =>
    collectTextNodesTextOnly(document.body)
  );
  const recursiveMs = bench('Recursive traversal', () => collectTextNodesRecursive(document.body));
  const stackMs = bench('Stack-based iterative', () => collectTextNodesStack(document.body));
  const simpleMs = bench('Simple walker (no filter)', () =>
    collectTextNodesSimpleWalker(document.body)
  );

  console.log('\n--- Comparison vs Current ---\n');
  console.log(
    `Text-only walker:    ${(((currentMs - textOnlyMs) / currentMs) * 100).toFixed(1)}% ${textOnlyMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Recursive:           ${(((currentMs - recursiveMs) / currentMs) * 100).toFixed(1)}% ${recursiveMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Stack-based:         ${(((currentMs - stackMs) / currentMs) * 100).toFixed(1)}% ${stackMs < currentMs ? 'faster' : 'slower'}`
  );
  console.log(
    `Simple walker:       ${(((currentMs - simpleMs) / currentMs) * 100).toFixed(1)}% ${simpleMs < currentMs ? 'faster' : 'slower'}`
  );
}

if (process.argv[1]?.includes('profile-tree-walker')) main().catch(console.error);
