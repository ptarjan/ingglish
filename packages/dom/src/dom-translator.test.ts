/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { translateSyncWithMapping } from '@ingglish/core';
import { translateDOM, translateDOMSync, restoreDOM, applyTranslationsMap } from './translate';
import { skipElement, unskipElement } from './utils';
import { observeAndTranslate } from './observe';
import { setupDictionary } from './test-setup';

describe('dom-translator', () => {
  setupDictionary();

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
      // Check text content (ignoring data attributes)
      expect(document.body.textContent).toBe('Hulo werld');
    });

    it('should translate multiple text nodes', () => {
      document.body.innerHTML = '<div><p>Hello</p><p>World</p></div>';
      translateDOMSync(document.body);
      // Check text content (ignoring data attributes)
      expect(document.querySelector('div')?.textContent).toBe('HuloWerld');
    });

    it('should skip script tags by default', () => {
      document.body.innerHTML = '<script>var hello = "world";</script>';
      translateDOMSync(document.body);
      expect(document.body.innerHTML).toBe('<script>var hello = "world";</script>');
    });

    it('should skip code tags by default', () => {
      document.body.innerHTML = '<code>console.log("hello")</code>';
      translateDOMSync(document.body);
      expect(document.body.innerHTML).toBe('<code>console.log("hello")</code>');
    });

    it('should skip pre tags by default', () => {
      document.body.innerHTML = '<pre>Hello World</pre>';
      translateDOMSync(document.body);
      expect(document.body.innerHTML).toBe('<pre>Hello World</pre>');
    });

    it('should skip custom classes', () => {
      document.body.innerHTML = '<p class="no-translate">Hello</p>';
      translateDOMSync(document.body, { skipClasses: ['no-translate'] });
      expect(document.body.innerHTML).toBe('<p class="no-translate">Hello</p>');
    });

    it('should skip contenteditable elements', () => {
      document.body.innerHTML = '<div contenteditable="true">Hello</div>';
      translateDOMSync(document.body);
      expect(document.body.innerHTML).toBe('<div contenteditable="true">Hello</div>');
    });

    it('should skip elements with data-ingglish-skip', () => {
      document.body.innerHTML = '<p data-ingglish-skip>Hello</p>';
      translateDOMSync(document.body);
      expect(document.body.innerHTML).toBe('<p data-ingglish-skip="">Hello</p>');
    });

    it('should translate attributes when enabled', () => {
      document.body.innerHTML = '<img alt="Hello world" title="Click here">';
      translateDOMSync(document.body, { translateAttributes: true });
      const img = document.querySelector('img');
      expect(img?.getAttribute('alt')).toBe('Hulo werld');
      expect(img?.getAttribute('title')).toBe('Klik heer');
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

  describe('translateDOM', () => {
    it('should translate text content asynchronously', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOM(document.body);
      // Check text content (ignoring data attributes)
      expect(document.body.textContent).toBe('Hulo werld');
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
      expect(document.body.textContent).toBe('Hulo werld');
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

      expect(p.textContent).toBe('Werld');
    });

    it('should translate newly added element nodes', async () => {
      createObserver(document.body);

      // Add a new element with nested text
      const div = document.createElement('div');
      div.innerHTML = '<span>World</span>';
      document.body.appendChild(div);

      // Wait for MutationObserver to process
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(div.querySelector('span')?.textContent).toBe('Werld');
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

      expect(p.textContent).toBe('Werld');
    });
  });

  describe('translateSyncWithMapping', () => {
    it('should return token mappings for words', () => {
      const tokens = translateSyncWithMapping('Hello world');
      expect(tokens).toHaveLength(3); // "Hello", " ", "world"

      expect(tokens[0]).toEqual({
        original: 'Hello',
        translated: 'Hulo',
        isWord: true,
      });
      expect(tokens[1]).toEqual({
        original: ' ',
        translated: ' ',
        isWord: false,
      });
      expect(tokens[2]).toEqual({
        original: 'world',
        translated: 'werld',
        isWord: true,
      });
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
      expect(tokens[0].translated).toBe('dont');
    });
  });

  describe('showTooltips option', () => {
    it('should wrap translated words in spans with data-ingglish-orig attribute', () => {
      document.body.innerHTML = '<p>Hello world</p>';
      translateDOMSync(document.body, { showTooltips: true });

      const spans = document.querySelectorAll('.ingglish-word');
      expect(spans).toHaveLength(2);

      expect(spans[0].getAttribute('data-ingglish-orig')).toBe('Hello');
      expect(spans[0].textContent).toBe('Hulo');

      expect(spans[1].getAttribute('data-ingglish-orig')).toBe('world');
      expect(spans[1].textContent).toBe('werld');
    });

    it('should not wrap unchanged words in spans', () => {
      document.body.innerHTML = '<p>123 hello</p>';
      translateDOMSync(document.body, { showTooltips: true });

      // Only "hello" should be wrapped (numbers stay as text)
      const spans = document.querySelectorAll('.ingglish-word');
      expect(spans).toHaveLength(1);
      expect(spans[0].getAttribute('data-ingglish-orig')).toBe('hello');
    });

    it('should inject tooltip CSS styles', () => {
      document.body.innerHTML = '<p>Hello</p>';
      translateDOMSync(document.body, { showTooltips: true });

      const styleElement = document.getElementById('ingglish-tooltip-styles');
      expect(styleElement).not.toBeNull();
      expect(styleElement?.textContent).toContain('.ingglish-word');
      expect(styleElement?.textContent).toContain('data-ingglish-orig');
    });

    it('should preserve text content when using tooltips', () => {
      document.body.innerHTML = '<p>Hello world</p>';
      translateDOMSync(document.body, { showTooltips: true });

      // Text content should still be the translated text
      expect(document.body.textContent).toBe('Hulo werld');
    });

    it('should handle punctuation correctly with tooltips', () => {
      document.body.innerHTML = '<p>Hello, world!</p>';
      translateDOMSync(document.body, { showTooltips: true });

      // Should have spans for words, text nodes for punctuation
      const p = document.querySelector('p');
      expect(p).not.toBeNull();
      if (p !== null) {
        expect(p.textContent).toBe('Hulo, werld!');

        const spans = p.querySelectorAll('.ingglish-word');
        expect(spans).toHaveLength(2);
      }
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
      expect(span?.textContent).toBe('Hulo');
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
      expect(document.body.textContent).toBe('Hulo werld');
    });

    it('should translate all text nodes in chunks', async () => {
      // Create multiple text nodes
      document.body.innerHTML =
        '<div><p>Hello</p><p>World</p><p>Test</p><p>Case</p><p>Here</p></div>';
      await translateDOM(document.body, { chunked: true, chunkSize: 2 });
      // All should be translated
      expect(document.body.textContent).toBe('HuloWerldTestKaysHeer');
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

    it('translateDOM should await chunked result', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOM(document.body, { chunked: true });
      expect(document.body.textContent).toBe('Hulo werld');
    });
  });

  describe('restoreDOM', () => {
    it('should restore text content from data-ingglish-original attribute', () => {
      // Set up DOM with translation markers
      document.body.innerHTML =
        '<p><span data-ingglish-original="Hello">Hulo</span> <span data-ingglish-original="world">werld</span></p>';

      restoreDOM(document.body);

      // Should restore original text
      expect(document.body.textContent).toBe('Hello world');
      // Should remove the data attributes
      expect(document.querySelector('[data-ingglish-original]')).toBeNull();
    });

    it('should restore attributes from data-ingglish-original-* attributes', () => {
      document.body.innerHTML =
        '<img alt="Hulo werld" data-ingglish-original-alt="Hello world" title="Klik heer" data-ingglish-original-title="Click here">';

      restoreDOM(document.body);

      const img = document.querySelector('img');
      expect(img?.getAttribute('alt')).toBe('Hello world');
      expect(img?.getAttribute('title')).toBe('Click here');
      // Original data attributes should be removed
      expect(img?.hasAttribute('data-ingglish-original-alt')).toBe(false);
      expect(img?.hasAttribute('data-ingglish-original-title')).toBe(false);
    });

    it('should handle elements with no original data attributes', () => {
      document.body.innerHTML = '<p>Already English</p>';

      restoreDOM(document.body);

      expect(document.body.textContent).toBe('Already English');
    });

    it('should restore placeholder attributes', () => {
      document.body.innerHTML =
        '<input placeholder="Tiep heer" data-ingglish-original-placeholder="Type here">';

      restoreDOM(document.body);

      const input = document.querySelector('input');
      expect(input?.getAttribute('placeholder')).toBe('Type here');
    });

    it('should restore multiple text nodes in same element', () => {
      document.body.innerHTML = '<div data-ingglish-original="Hello world">Hulo werld</div>';

      restoreDOM(document.body);

      expect(document.body.textContent).toBe('Hello world');
    });

    it('should restore when tooltips created spans and text nodes', () => {
      // This simulates what applyTranslationsMap creates with tooltips:
      // - Parent has data-ingglish-original with full original text
      // - Children are a mix of tooltip spans and text nodes
      document.body.innerHTML = `
        <p data-ingglish-original="Hello world">
          <span class="ingglish-word" data-ingglish-orig="Hello">Hulo</span>
          <span class="ingglish-word" data-ingglish-orig="world">werld</span>
        </p>
      `;

      restoreDOM(document.body);

      // Should clear all children and restore original text
      expect(document.body.textContent?.trim()).toBe('Hello world');
      // Spans should be removed
      expect(document.querySelector('.ingglish-word')).toBeNull();
      expect(document.querySelector('[data-ingglish-orig]')).toBeNull();
    });
  });

  describe('round-trip translation and restoration', () => {
    it('should correctly translate and then restore', () => {
      document.body.innerHTML = '<p>Hello world</p>';

      // Translate
      translateDOMSync(document.body, { translateAttributes: true });
      expect(document.body.textContent).toBe('Hulo werld');

      // Restore
      restoreDOM(document.body);
      expect(document.body.textContent).toBe('Hello world');
    });

    it('should correctly translate and restore attributes', () => {
      document.body.innerHTML = '<img alt="Hello world">';

      translateDOMSync(document.body, { translateAttributes: true });
      expect(document.querySelector('img')?.getAttribute('alt')).toBe('Hulo werld');

      restoreDOM(document.body);
      expect(document.querySelector('img')?.getAttribute('alt')).toBe('Hello world');
    });

    it('should correctly translate with tooltips and restore', async () => {
      document.body.innerHTML = '<p>Hello world</p>';

      // Apply translations with tooltips (like the extension does)
      await applyTranslationsMap(
        document.body,
        { hello: 'hulo', world: 'werld' },
        { showTooltips: true }
      );

      // Should have translated text with tooltip spans
      expect(document.body.textContent).toBe('Hulo werld');
      expect(document.querySelector('.ingglish-word')).not.toBeNull();

      // Restore
      restoreDOM(document.body);

      // Should restore original text and remove all tooltip spans
      expect(document.body.textContent).toBe('Hello world');
      expect(document.querySelector('.ingglish-word')).toBeNull();
    });

    it('should handle multiple translate-restore cycles with tooltips', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      const originalText = 'Hello world';

      // First cycle: translate to "ingglish"
      await applyTranslationsMap(
        document.body,
        { hello: 'hulo', world: 'werld' },
        { showTooltips: true }
      );
      expect(document.body.textContent).toBe('Hulo werld');

      // Restore
      restoreDOM(document.body);
      expect(document.body.textContent).toBe(originalText);

      // Second cycle: translate to "IPA" (different translations)
      await applyTranslationsMap(
        document.body,
        { hello: 'həˈloʊ', world: 'wɜːld' },
        { showTooltips: true }
      );
      expect(document.body.textContent).toBe('Həˈloʊ wɜːld');

      // Restore again
      restoreDOM(document.body);
      expect(document.body.textContent).toBe(originalText);

      // Third cycle: back to "ingglish"
      await applyTranslationsMap(
        document.body,
        { hello: 'hulo', world: 'werld' },
        { showTooltips: true }
      );
      expect(document.body.textContent).toBe('Hulo werld');

      // Final restore
      restoreDOM(document.body);
      expect(document.body.textContent).toBe(originalText);
    });
  });
});
