/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { translateSyncWithMapping } from 'ingglish';
import { translateDOM, translateDOMSync, restoreDOM, applyTranslationsMap } from './translate';
import { skipElement, unskipElement } from './utils';
import { observeAndTranslate } from './observe';

describe('dom-translator', () => {
  // Track stop functions to ensure cleanup even if tests fail
  let activeObservers: (() => void)[] = [];

  beforeEach(() => {
    document.body.innerHTML = '';
    activeObservers = [];
  });

  afterEach(() => {
    // Clean up any active MutationObservers to prevent process hanging
    for (const stop of activeObservers) {
      try {
        stop();
      } catch {
        // Ignore errors if already stopped
      }
    }
    activeObservers = [];
  });

  // Wrapper to track observers for cleanup
  function createObserver(
    root: Element | Document,
    options?: Parameters<typeof observeAndTranslate>[1]
  ) {
    const stop = observeAndTranslate(root, options);
    activeObservers.push(stop);
    return stop;
  }

  describe('translateDOMSync', () => {
    it('should translate text content', () => {
      document.body.innerHTML = '<p>Hello world</p>';
      translateDOMSync(document.body);
      // Verify translation happened (content changed)
      expect(document.body.textContent).not.toBe('Hello world');
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    });

    it('should translate multiple text nodes', () => {
      document.body.innerHTML = '<div><p>Hello</p><p>World</p></div>';
      translateDOMSync(document.body);
      // Verify translation happened (content changed)
      const content = document.querySelector('div')?.textContent;
      expect(content).not.toBe('HelloWorld');
      expect(content?.length).toBeGreaterThan(0);
    });

    it.each([
      ['script', '<script>var hello = "world";</script>', '<script>var hello = "world";</script>'],
      ['code', '<code>console.log("hello")</code>', '<code>console.log("hello")</code>'],
      ['pre', '<pre>Hello World</pre>', '<pre>Hello World</pre>'],
      [
        'contenteditable',
        '<div contenteditable="true">Hello</div>',
        '<div contenteditable="true">Hello</div>',
      ],
      [
        'data-ingglish-skip',
        '<p data-ingglish-skip>Hello</p>',
        '<p data-ingglish-skip="">Hello</p>',
      ],
    ])('should skip %s elements by default', (_name, input, expected) => {
      document.body.innerHTML = input;
      translateDOMSync(document.body);
      expect(document.body.innerHTML).toBe(expected);
    });

    it('should skip custom classes', () => {
      document.body.innerHTML = '<p class="no-translate">Hello</p>';
      translateDOMSync(document.body, { skipClasses: ['no-translate'] });
      expect(document.body.innerHTML).toBe('<p class="no-translate">Hello</p>');
    });

    it('should translate attributes when enabled', () => {
      document.body.innerHTML = '<img alt="Hello world" title="Click here">';
      translateDOMSync(document.body, { translateAttributes: true });
      const img = document.querySelector('img');
      // Verify attributes were translated (changed from original)
      expect(img?.getAttribute('alt')).not.toBe('Hello world');
      expect(img?.getAttribute('title')).not.toBe('Click here');
    });

    it('should not translate attributes when disabled', () => {
      document.body.innerHTML = '<img alt="Hello world">';
      translateDOMSync(document.body, { translateAttributes: false });
      expect(document.querySelector('img')?.getAttribute('alt')).toBe('Hello world');
    });

    it('should call onProgress callback', () => {
      document.body.innerHTML = '<p>Hello</p><p>World</p>';
      const progressCalls: [number, number][] = [];
      translateDOMSync(document.body, {
        onProgress: (processed, total) => progressCalls.push([processed, total]),
      });
      expect(progressCalls.length).toBe(2);
      expect(progressCalls[0]).toEqual([1, 2]);
      expect(progressCalls[1]).toEqual([2, 2]);
    });

    it('should walk the DOM only once (performance optimization)', () => {
      document.body.innerHTML = '<p>Hello</p><p>World</p><p>Test</p>';

      // Spy on createTreeWalker to count DOM walks
      const createTreeWalkerSpy = vi.spyOn(document, 'createTreeWalker');

      translateDOMSync(document.body, {
        onProgress: () => {
          /* progress callback enabled */
        },
      });

      // Should only create one TreeWalker (single DOM walk)
      expect(createTreeWalkerSpy).toHaveBeenCalledTimes(1);

      createTreeWalkerSpy.mockRestore();
    });
  });

  describe('skipElement / unskipElement', () => {
    it('should add data-ingglish-skip attribute', () => {
      document.body.innerHTML = '<p>Hello</p>';
      const p = document.querySelector('p');
      expect(p).not.toBeNull();
      if (p !== null) {
        skipElement(p);
        expect(p.hasAttribute('data-ingglish-skip')).toBe(true);
      }
    });

    it('should remove data-ingglish-skip attribute', () => {
      document.body.innerHTML = '<p data-ingglish-skip>Hello</p>';
      const p = document.querySelector('p');
      expect(p).not.toBeNull();
      if (p !== null) {
        unskipElement(p);
        expect(p.hasAttribute('data-ingglish-skip')).toBe(false);
      }
    });

    it('should prevent translation after skipElement', () => {
      document.body.innerHTML = '<p>Hello</p>';
      const p = document.querySelector('p');
      expect(p).not.toBeNull();
      if (p !== null) {
        skipElement(p);
        translateDOMSync(document.body);
        expect(p.textContent).toBe('Hello');
      }
    });
  });

  describe('nested elements', () => {
    it('should translate nested text', () => {
      document.body.innerHTML = '<div><span>Hello</span> <strong>world</strong></div>';
      translateDOMSync(document.body);
      // Verify translation happened (content changed)
      expect(document.body.textContent).not.toBe('Hello world');
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    });

    it('should skip nested elements inside skipped parent', () => {
      document.body.innerHTML = '<pre><span>Hello</span></pre>';
      translateDOMSync(document.body);
      expect(document.querySelector('span')?.textContent).toBe('Hello');
    });
  });

  describe('observeAndTranslate', () => {
    it('should return a stop function', () => {
      const stop = createObserver(document.body);
      expect(typeof stop).toBe('function');
    });

    it('should translate newly added text nodes', async () => {
      createObserver(document.body);

      // Add a new element with text
      const p = document.createElement('p');
      p.textContent = 'World';
      document.body.appendChild(p);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify translation happened (content changed)
      expect(p.textContent).not.toBe('World');
      expect(p.textContent?.length).toBeGreaterThan(0);
    });

    it('should translate newly added element nodes', async () => {
      createObserver(document.body);

      // Add a new element with nested text
      const div = document.createElement('div');
      div.innerHTML = '<span>World</span>';
      document.body.appendChild(div);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify translation happened (content changed)
      expect(div.querySelector('span')?.textContent).not.toBe('World');
    });

    it('should skip elements inside skipped tags', async () => {
      createObserver(document.body);

      // Add a code element that should be skipped
      const code = document.createElement('code');
      code.textContent = 'Hello';
      document.body.appendChild(code);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(code.textContent).toBe('Hello');
    });

    it('should stop observing when stop function is called', async () => {
      const stop = createObserver(document.body);
      stop();

      // Add a new element after stopping
      const p = document.createElement('p');
      p.textContent = 'Hello';
      document.body.appendChild(p);

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Should not be translated since observer was stopped
      expect(p.textContent).toBe('Hello');
    });

    it('should translate character data changes', async () => {
      // First add an element
      const p = document.createElement('p');
      p.textContent = 'Test';
      document.body.appendChild(p);

      // Now start observing
      createObserver(document.body);

      // Change the text content
      p.textContent = 'World';

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Verify translation happened (content changed)
      expect(p.textContent).not.toBe('World');
      expect(p.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe('translateSyncWithMapping', () => {
    it('should return token mappings for words', () => {
      const tokens = translateSyncWithMapping('Hello world');
      expect(tokens).toHaveLength(3); // "Hello", " ", "world"

      // First token: word "Hello"
      expect(tokens[0].original).toBe('Hello');
      expect(tokens[0].isWord).toBe(true);
      expect(tokens[0].translated).not.toBe('Hello'); // Translated

      // Second token: space (unchanged)
      expect(tokens[1]).toMatchObject({
        original: ' ',
        translated: ' ',
        isWord: false,
      });

      // Third token: word "world"
      expect(tokens[2].original).toBe('world');
      expect(tokens[2].isWord).toBe(true);
      expect(tokens[2].translated).not.toBe('world'); // Translated
    });

    it('should handle punctuation', () => {
      const tokens = translateSyncWithMapping('Hello, world!');
      // "Hello", ", ", "world", "!"
      expect(tokens.filter((t) => t.isWord)).toHaveLength(2);
      expect(tokens.filter((t) => !t.isWord)).toHaveLength(2);
    });

    it('should handle contractions', () => {
      const tokens = translateSyncWithMapping("don't");
      expect(tokens).toHaveLength(1);
      expect(tokens[0].isWord).toBe(true);
      expect(tokens[0].original).toBe("don't");
      expect(tokens[0].translated).not.toBe("don't"); // Translated
    });
  });

  describe('showTooltips option', () => {
    it('should wrap translated words in spans with data-ingglish-orig attribute', () => {
      document.body.innerHTML = '<p>Hello world</p>';
      translateDOMSync(document.body, { showTooltips: true });

      const spans = document.querySelectorAll('.ingglish-word');
      expect(spans).toHaveLength(2);

      // First word: stores original, displays translated
      expect(spans[0].getAttribute('data-ingglish-orig')).toBe('Hello');
      expect(spans[0].textContent).not.toBe('Hello'); // Translated

      // Second word: stores original, displays translated
      expect(spans[1].getAttribute('data-ingglish-orig')).toBe('world');
      expect(spans[1].textContent).not.toBe('world'); // Translated
    });

    it('should not wrap unchanged words in spans', () => {
      document.body.innerHTML = '<p>123 hello</p>';
      translateDOMSync(document.body, { showTooltips: true });

      // Only "hello" should be wrapped (numbers stay as text)
      const spans = document.querySelectorAll('.ingglish-word');
      expect(spans).toHaveLength(1);
      expect(spans[0].getAttribute('data-ingglish-orig')).toBe('hello');
    });

    it('should inject tooltip CSS styles and preserve punctuation', () => {
      document.body.innerHTML = '<p>Hello, world!</p>';
      translateDOMSync(document.body, { showTooltips: true });

      // CSS styles injected
      const styleElement = document.getElementById('ingglish-tooltip-styles');
      expect(styleElement).not.toBeNull();
      expect(styleElement?.textContent).toContain('.ingglish-word');

      // Content translated, punctuation preserved
      const p = document.querySelector('p');
      expect(p?.textContent).toContain(',');
      expect(p?.textContent).toContain('!');
      expect(p?.textContent).not.toBe('Hello, world!');
      expect(p?.querySelectorAll('.ingglish-word')).toHaveLength(2);
    });

    it('should work with observer for dynamic content', async () => {
      createObserver(document.body, { showTooltips: true });

      const p = document.createElement('p');
      p.textContent = 'Hello';
      document.body.appendChild(p);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const span = p.querySelector('.ingglish-word');
      expect(span).not.toBeNull();
      expect(span?.getAttribute('data-ingglish-orig')).toBe('Hello');
      expect(span?.textContent).not.toBe('Hello'); // Translated
    });

    // Note: Tests for raw text nodes with showTooltips are complex due to
    // MutationObserver behavior - the existing test using element.textContent
    // is the recommended pattern

    // Note: iframe tests are skipped in jsdom due to limited contentDocument support
    // The fix for iframe style injection is tested manually in real browsers
    it.skip('should inject styles into iframe document, not parent document', () => {
      // Create an iframe
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument;
      expect(iframeDoc).not.toBeNull();
      if (iframeDoc === null) {
        return;
      }
      iframeDoc.body.innerHTML = '<p>Hello world</p>';

      // Translate the iframe's body
      translateDOMSync(iframeDoc.body, { showTooltips: true });

      // Styles should be injected into iframe's document
      const iframeStyle = iframeDoc.getElementById('ingglish-tooltip-styles');
      expect(iframeStyle).not.toBeNull();
      expect(iframeStyle?.textContent).toContain('.ingglish-word');

      // Verify spans were created in iframe
      const spans = iframeDoc.querySelectorAll('.ingglish-word');
      expect(spans).toHaveLength(2);
    });

    it.skip('should inject styles into multiple documents independently', () => {
      // First translate main document
      document.body.innerHTML = '<p>Hello</p>';
      translateDOMSync(document.body, { showTooltips: true });

      // Create an iframe and translate it
      const iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentDocument;
      expect(iframeDoc).not.toBeNull();
      if (iframeDoc === null) {
        return;
      }
      iframeDoc.body.innerHTML = '<p>World</p>';
      translateDOMSync(iframeDoc.body, { showTooltips: true });

      // Both documents should have styles
      expect(document.getElementById('ingglish-tooltip-styles')).not.toBeNull();
      expect(iframeDoc.getElementById('ingglish-tooltip-styles')).not.toBeNull();
    });
  });

  describe('chunked option', () => {
    it('should return a Promise when chunked=true', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      const result = translateDOM(document.body, { chunked: true });
      expect(result).toBeInstanceOf(Promise);
      await result;
      // Verify translation happened
      expect(document.body.textContent).not.toBe('Hello world');
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    });

    it('should translate all text nodes in chunks', async () => {
      // Create multiple text nodes
      document.body.innerHTML =
        '<div><p>Hello</p><p>World</p><p>Test</p><p>Case</p><p>Here</p></div>';
      await translateDOM(document.body, { chunked: true, chunkSize: 2 });
      // All should be translated (content changed)
      expect(document.body.textContent).not.toBe('HelloWorldTestCaseHere');
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    });

    it('should call onProgress for chunked translation', async () => {
      document.body.innerHTML = '<div><p>Hello</p><p>World</p></div>';
      const progressCalls: { processed: number; total: number }[] = [];

      await translateDOM(document.body, {
        chunked: true,
        chunkSize: 1,
        onProgress: (processed, total) => {
          progressCalls.push({ processed, total });
        },
      });

      expect(progressCalls.length).toBeGreaterThan(0);
      // Last call should show all processed
      const lastCall = progressCalls[progressCalls.length - 1];
      expect(lastCall.processed).toBe(lastCall.total);
    });

    it('should work with tooltips in chunked mode', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOM(document.body, { chunked: true, showTooltips: true });

      const spans = document.querySelectorAll('.ingglish-word');
      expect(spans).toHaveLength(2);
      expect(spans[0].getAttribute('data-ingglish-orig')).toBe('Hello');
    });

    it('should handle empty document in chunked mode', async () => {
      document.body.innerHTML = '';
      await translateDOM(document.body, { chunked: true });
      expect(document.body.textContent).toBe('');
    });
  });

  describe('restoreDOM', () => {
    it('should restore text content from word spans', () => {
      document.body.innerHTML =
        '<p><span class="ingglish-word" data-ingglish-orig="Hello">Huloh</span> <span class="ingglish-word" data-ingglish-orig="world">werld</span></p>';

      restoreDOM(document.body);

      expect(document.body.textContent).toBe('Hello world');
      expect(document.querySelector('.ingglish-word')).toBeNull();
    });

    it('should restore attributes from data-ingglish-original-* attributes', () => {
      document.body.innerHTML =
        '<img alt="Huloh" data-ingglish-original-alt="Hello" title="Klik" data-ingglish-original-title="Click">' +
        '<input placeholder="Tiep" data-ingglish-original-placeholder="Type">';

      restoreDOM(document.body);

      expect(document.querySelector('img')?.getAttribute('alt')).toBe('Hello');
      expect(document.querySelector('img')?.getAttribute('title')).toBe('Click');
      expect(document.querySelector('input')?.getAttribute('placeholder')).toBe('Type');
      expect(document.querySelector('img')?.hasAttribute('data-ingglish-original-alt')).toBe(false);
    });

    it('should handle elements with no original data attributes', () => {
      document.body.innerHTML = '<p>Already English</p>';
      restoreDOM(document.body);
      expect(document.body.textContent).toBe('Already English');
    });

    it('should preserve nested DOM structure when restoring', () => {
      document.body.innerHTML = `
        <p>
          <span class="ingglish-word" data-ingglish-orig="Hello">Huloh</span>
          <strong>important</strong>
          <span class="ingglish-word" data-ingglish-orig="world">werld</span>
        </p>
      `;

      restoreDOM(document.body);

      expect(document.body.textContent?.replace(/\s+/g, ' ').trim()).toBe('Hello important world');
      expect(document.querySelector('.ingglish-word')).toBeNull();
      expect(document.querySelector('strong')).not.toBeNull();
    });
  });

  describe('round-trip translation and restoration', () => {
    it('should correctly translate and then restore text and attributes', async () => {
      document.body.innerHTML = '<p>Hello world</p><img alt="Click here">';
      const originalText = 'Hello world';
      const originalAlt = 'Click here';

      // Translate with tooltips and attributes
      await translateDOM(document.body, { showTooltips: true, translateAttributes: true });
      expect(document.body.textContent).not.toBe(originalText);
      expect(document.querySelector('img')?.getAttribute('alt')).not.toBe(originalAlt);
      expect(document.querySelector('.ingglish-word')).not.toBeNull();

      // Restore
      restoreDOM(document.body);
      expect(document.body.textContent).toBe(originalText);
      expect(document.querySelector('img')?.getAttribute('alt')).toBe(originalAlt);
      expect(document.querySelector('.ingglish-word')).toBeNull();
    });

    it('should handle multiple translate-restore cycles', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      const originalText = 'Hello world';

      // First cycle
      await applyTranslationsMap(
        document.body,
        { hello: 'huloh', world: 'werld' },
        { showTooltips: true }
      );
      expect(document.body.textContent).not.toBe(originalText);
      restoreDOM(document.body);
      expect(document.body.textContent).toBe(originalText);

      // Second cycle with different translations (IPA)
      await applyTranslationsMap(
        document.body,
        { hello: 'həˈloʊ', world: 'wɜːld' },
        { showTooltips: true }
      );
      expect(document.body.textContent).not.toBe(originalText);
      restoreDOM(document.body);
      expect(document.body.textContent).toBe(originalText);
    });
  });

  /**
   * Performance regression tests for tooltip fragment creation
   * These tests verify that performance optimizations remain in place:
   * - Uses cloneNode instead of createElement for word spans (faster)
   * - Batches adjacent non-word tokens into single text nodes (fewer DOM nodes)
   */
  describe('tooltip fragment performance optimizations', () => {
    it('should use cloneNode for word spans instead of createElement', async () => {
      // Spy on document.createElement and Node.prototype.cloneNode
      const createElementSpy = vi.spyOn(document, 'createElement');
      const cloneNodeSpy = vi.spyOn(Node.prototype, 'cloneNode');

      document.body.innerHTML = '<p>Hello world test</p>';

      // Clear spies before translation
      createElementSpy.mockClear();
      cloneNodeSpy.mockClear();

      await applyTranslationsMap(
        document.body,
        { hello: 'huloh', world: 'werld', test: 'tust' },
        { showTooltips: true }
      );

      // Should use cloneNode for creating word spans (3 words = 3 cloneNode calls)
      expect(cloneNodeSpy.mock.calls.length).toBeGreaterThanOrEqual(3);

      // createElement should only be called once for the template span (or for fragment)
      // Not once per word - that would be the unoptimized path
      const spanCreateCalls = createElementSpy.mock.calls.filter((call) => call[0] === 'span');
      expect(spanCreateCalls.length).toBeLessThanOrEqual(1);

      createElementSpy.mockRestore();
      cloneNodeSpy.mockRestore();
    });

    it('should batch adjacent non-word tokens into single text nodes', async () => {
      // Text with punctuation: "Hello, world! How are you?"
      // Without batching: 10+ nodes (each punctuation/space separate)
      // With batching: fewer nodes (adjacent non-words combined)
      document.body.innerHTML = '<p>Hello, world! How are you?</p>';

      await applyTranslationsMap(
        document.body,
        { hello: 'huloh', world: 'werld', how: 'how', are: 'ar', you: 'yuu' },
        { showTooltips: true }
      );

      const p = document.querySelector('p');
      if (p === null) {
        throw new Error('Expected p element');
      }

      // Count child nodes in the paragraph
      // With batching: 5 word spans + text nodes for punctuation groups
      // ", " and "! " and "?" should be batched with adjacent whitespace
      const childCount = p.childNodes.length;

      // Without batching we'd have ~10+ nodes (each token separate)
      // With batching we should have fewer (spans + batched text nodes)
      // Expected: 5 spans + ~3 text nodes for ", ", "! ", " ", "?"
      expect(childCount).toBeLessThanOrEqual(9);

      // Verify the optimization by checking text node contents
      // Adjacent punctuation+space should be combined
      const textNodes = Array.from(p.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);

      // Check that some text nodes contain multiple characters (batched)
      const hasBatchedNodes = textNodes.some((node) => (node.textContent?.length ?? 0) > 1);
      expect(hasBatchedNodes).toBe(true);
    });

    it('should create minimal DOM nodes for text with many punctuation marks', async () => {
      // Worst case: many punctuation marks
      document.body.innerHTML = '<p>A... B!!! C??? D...</p>';

      await applyTranslationsMap(
        document.body,
        { a: 'aa', b: 'bb', c: 'cc', d: 'dd' },
        { showTooltips: true }
      );

      const p = document.querySelector('p');
      if (p === null) {
        throw new Error('Expected p element');
      }

      // 4 word spans + text nodes for punctuation groups
      // With batching: "... ", "!!! ", "??? ", "..." are combined
      const wordSpans = p.querySelectorAll('.ingglish-word');
      expect(wordSpans.length).toBe(4);

      // Total nodes should be much less than 16 (4 letters + 12 punctuation chars)
      expect(p.childNodes.length).toBeLessThanOrEqual(8);
    });

    it('should reuse template span across multiple translations', async () => {
      const createElementSpy = vi.spyOn(document, 'createElement');

      // First translation
      document.body.innerHTML = '<p>Hello world</p>';
      createElementSpy.mockClear();

      await applyTranslationsMap(
        document.body,
        { hello: 'huloh', world: 'werld' },
        { showTooltips: true }
      );

      // Second translation - template should be reused
      document.body.innerHTML = '<p>Test case here</p>';

      await applyTranslationsMap(
        document.body,
        { test: 'tust', case: 'kais', here: 'hir' },
        { showTooltips: true }
      );

      const totalSpanCalls = createElementSpy.mock.calls.filter(
        (call) => call[0] === 'span'
      ).length;

      // Template span should only be created once total (or zero if already cached)
      // Not once per word in each translation
      expect(totalSpanCalls).toBeLessThanOrEqual(1);

      createElementSpy.mockRestore();
    });
  });
});
