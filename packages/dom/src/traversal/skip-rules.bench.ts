import { bench, describe } from 'vitest';
import {
  DEFAULT_SKIP_CLASSES,
  DEFAULT_SKIP_TAGS,
  shouldSkipElement,
  shouldSkipTextNode,
} from './skip-rules';

// Build a realistic DOM subtree for benchmarking
function buildTestDOM(): { elements: Element[]; textNodes: Text[] } {
  const container = document.createElement('div');
  container.innerHTML = `
    <article>
      <h1>Test Article</h1>
      <p>First paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      <p class="notranslate">Skip this paragraph.</p>
      <div>
        <span>Nested span text</span>
        <a href="#">Link text</a>
        <code>const x = 1;</code>
      </div>
      <ul>
        <li>Item one</li>
        <li>Item two</li>
        <li>Item three</li>
      </ul>
      <p>Another paragraph with more words to translate here.</p>
      <script>console.log('skip me');</script>
      <pre>preformatted text</pre>
      <div contenteditable="true">Editable content</div>
    </article>
  `;

  const elements: Element[] = [];
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT
  );
  while (walker.nextNode()) {
    if (walker.currentNode.nodeType === Node.ELEMENT_NODE) {
      elements.push(walker.currentNode as Element);
    } else if (walker.currentNode.nodeType === Node.TEXT_NODE) {
      textNodes.push(walker.currentNode as Text);
    }
  }

  return { elements, textNodes };
}

const { elements, textNodes } = buildTestDOM();

// --- shouldSkipElement ---

describe('shouldSkipElement', () => {
  bench(`default skip lists (${elements.length} elements)`, () => {
    for (const el of elements) {
      shouldSkipElement(el, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
    }
  });

  const customTags = [...DEFAULT_SKIP_TAGS, 'ASIDE', 'NAV', 'FOOTER'];
  const customClasses = [...DEFAULT_SKIP_CLASSES, 'skip-me', 'hidden'];

  bench(`custom skip lists (${elements.length} elements)`, () => {
    for (const el of elements) {
      shouldSkipElement(el, customTags, customClasses);
    }
  });
});

// --- shouldSkipTextNode ---

describe('shouldSkipTextNode', () => {
  bench(`default skip lists (${textNodes.length} text nodes)`, () => {
    for (const tn of textNodes) {
      shouldSkipTextNode(tn, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES);
    }
  });
});
