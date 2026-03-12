/**
 * @vitest-environment jsdom
 */
import { translateSyncWithMapping } from 'ingglish';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { processChunked } from './translate/chunked';
import { extractWords, extractWordsFromNodes } from './traversal/extract';
import {
  shouldSkipTextNode,
  skipElement,
  unskipElement,
  shouldSkipElement,
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
} from './traversal/skip-rules';
import { applyTranslationsMap, restoreDOM, translateDOM } from './index';

/** Helper to create a simple mapping fn that uppercases words */
function uppercaseMappingFn(text: string) {
  return text
    .split(/(\s+)/)
    .filter(Boolean)
    .map((seg) => {
      const isWord = !/^\s+$/.test(seg);
      return { isWord, matched: true, original: seg, translated: isWord ? seg.toUpperCase() : seg };
    });
}

describe('dom-translator', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('translateDOM', () => {
    it('should translate text content', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOM(document.body);
      // Verify translation happened (content changed)
      expect(document.body.textContent).not.toBe('Hello world');
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    });

    it('should translate multiple text nodes', async () => {
      document.body.innerHTML = '<div><p>Hello</p><p>World</p></div>';
      await translateDOM(document.body);
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
    ])('should skip %s elements by default', async (_name, input, expected) => {
      document.body.innerHTML = input;
      await translateDOM(document.body);
      expect(document.body.innerHTML).toBe(expected);
    });

    it('should skip custom classes', async () => {
      document.body.innerHTML = '<p class="no-translate">Hello</p>';
      await translateDOM(document.body, { skipClasses: ['no-translate'] });
      expect(document.body.innerHTML).toBe('<p class="no-translate">Hello</p>');
    });

    it('should translate attributes when enabled', async () => {
      document.body.innerHTML = '<img alt="Hello world" title="Click here">';
      await translateDOM(document.body, { translateAttributes: true });
      const img = document.querySelector('img');
      // Verify attributes were translated (changed from original)
      expect(img?.getAttribute('alt')).not.toBe('Hello world');
      expect(img?.getAttribute('title')).not.toBe('Click here');
    });

    it('should not translate attributes when disabled', async () => {
      document.body.innerHTML = '<img alt="Hello world">';
      await translateDOM(document.body, { translateAttributes: false });
      expect(document.querySelector('img')?.getAttribute('alt')).toBe('Hello world');
    });

    it('should call onProgress callback', async () => {
      document.body.innerHTML = '<p>Hello</p><p>World</p>';
      const progressCalls: [number, number][] = [];
      await translateDOM(document.body, {
        onProgress: (processed, total) => progressCalls.push([processed, total]),
      });
      expect(progressCalls.length).toBe(2);
      expect(progressCalls[0]).toEqual([1, 2]);
      expect(progressCalls[1]).toEqual([2, 2]);
    });

    it('should walk the DOM only once (performance optimization)', async () => {
      document.body.innerHTML = '<p>Hello</p><p>World</p><p>Test</p>';

      // Spy on createTreeWalker to count DOM walks
      const createTreeWalkerSpy = vi.spyOn(document, 'createTreeWalker');

      await translateDOM(document.body, {
        onProgress: () => {
          /* progress callback enabled */
        },
      });

      // Should only create one TreeWalker (single DOM walk)
      expect(createTreeWalkerSpy).toHaveBeenCalledTimes(1);

      createTreeWalkerSpy.mockRestore();
    });
  });

  describe('data-ingglish-skip attribute', () => {
    it('should add data-ingglish-skip attribute directly', () => {
      document.body.innerHTML = '<p>Hello</p>';
      const p = document.querySelector('p');
      expect(p).not.toBeNull();
      if (p !== null) {
        p.dataset.ingglishSkip = '';
        expect(Object.hasOwn(p.dataset, 'ingglishSkip')).toBe(true);
      }
    });

    it('should remove data-ingglish-skip attribute directly', () => {
      document.body.innerHTML = '<p data-ingglish-skip>Hello</p>';
      const p = document.querySelector('p');
      expect(p).not.toBeNull();
      if (p !== null) {
        delete p.dataset.ingglishSkip;
        expect(Object.hasOwn(p.dataset, 'ingglishSkip')).toBe(false);
      }
    });

    it('should prevent translation after setting data-ingglish-skip', async () => {
      document.body.innerHTML = '<p>Hello</p>';
      const p = document.querySelector('p');
      expect(p).not.toBeNull();
      if (p !== null) {
        p.dataset.ingglishSkip = '';
        await translateDOM(document.body);
        expect(p.textContent).toBe('Hello');
      }
    });
  });

  describe('nested elements', () => {
    it('should translate nested text', async () => {
      document.body.innerHTML = '<div><span>Hello</span> <strong>world</strong></div>';
      await translateDOM(document.body);
      // Verify translation happened (content changed)
      expect(document.body.textContent).not.toBe('Hello world');
      expect(document.body.textContent?.length).toBeGreaterThan(0);
    });

    it('should skip nested elements inside skipped parent', async () => {
      document.body.innerHTML = '<pre><span>Hello</span></pre>';
      await translateDOM(document.body);
      expect(document.querySelector('span')?.textContent).toBe('Hello');
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
        isWord: false,
        original: ' ',
        translated: ' ',
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
    it('should wrap translated words in spans with data-ingglish-orig attribute', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOM(document.body, { showTooltips: true });

      const spans = document.querySelectorAll<HTMLElement>('.ingglish-word');
      expect(spans).toHaveLength(2);

      // First word: stores original, displays translated
      expect(spans[0].dataset.ingglishOrig).toBe('Hello');
      expect(spans[0].textContent).not.toBe('Hello'); // Translated

      // Second word: stores original, displays translated
      expect(spans[1].dataset.ingglishOrig).toBe('world');
      expect(spans[1].textContent).not.toBe('world'); // Translated
    });

    it('should not wrap unchanged words in spans', async () => {
      document.body.innerHTML = '<p>123 hello</p>';
      await translateDOM(document.body, { showTooltips: true });

      // Only "hello" should be wrapped (numbers stay as text)
      const spans = document.querySelectorAll<HTMLElement>('.ingglish-word');
      expect(spans).toHaveLength(1);
      expect(spans[0].dataset.ingglishOrig).toBe('hello');
    });

    it('should inject tooltip CSS styles and preserve punctuation', async () => {
      document.body.innerHTML = '<p>Hello, world!</p>';
      await translateDOM(document.body, { showTooltips: true });

      // CSS styles injected
      const styleElement = document.querySelector('#ingglish-tooltip-styles');
      expect(styleElement).not.toBeNull();
      expect(styleElement?.textContent).toContain('.ingglish-word');

      // Content translated, punctuation preserved
      const p = document.querySelector('p');
      expect(p?.textContent).toContain(',');
      expect(p?.textContent).toContain('!');
      expect(p?.textContent).not.toBe('Hello, world!');
      expect(p?.querySelectorAll('.ingglish-word')).toHaveLength(2);
    });

    // Note: Tests for raw text nodes with showTooltips are complex due to
    // MutationObserver behavior - the existing test using element.textContent
    // is the recommended pattern

    // Note: iframe tests are skipped in jsdom due to limited contentDocument support
    // The fix for iframe style injection is tested manually in real browsers
    // iframe contentDocument is not supported in jsdom - tested manually in real browsers
    it.todo('should inject styles into iframe document, not parent document');

    // iframe contentDocument is not supported in jsdom - tested manually in real browsers
    it.todo('should inject styles into multiple documents independently');
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
      const lastCall = progressCalls.at(-1);
      expect(lastCall.processed).toBe(lastCall.total);
    });

    it('should work with tooltips in chunked mode', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOM(document.body, { chunked: true, showTooltips: true });

      const spans = document.querySelectorAll<HTMLElement>('.ingglish-word');
      expect(spans).toHaveLength(2);
      expect(spans[0].dataset.ingglishOrig).toBe('Hello');
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
        '<p><span class="ingglish-word" data-ingglish-orig="Hello">Haloh</span> <span class="ingglish-word" data-ingglish-orig="world">werld</span></p>';

      restoreDOM(document.body);

      expect(document.body.textContent).toBe('Hello world');
      expect(document.querySelector('.ingglish-word')).toBeNull();
    });

    it('should restore attributes from data-ingglish-original-* attributes', () => {
      document.body.innerHTML =
        '<img alt="Haloh" data-ingglish-original-alt="Hello" title="Klik" data-ingglish-original-title="Click">' +
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
          <span class="ingglish-word" data-ingglish-orig="Hello">Haloh</span>
          <strong>important</strong>
          <span class="ingglish-word" data-ingglish-orig="world">werld</span>
        </p>
      `;

      restoreDOM(document.body);

      expect(document.body.textContent?.replaceAll(/\s+/g, ' ').trim()).toBe(
        'Hello important world'
      );
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
        { hello: 'haloh', world: 'werld' },
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

  describe('translateWithMappingFn option', () => {
    it('should use custom mapping fn for text nodes', async () => {
      document.body.innerHTML = '<p>Bonjour monde</p>';
      const customFn = vi.fn(uppercaseMappingFn);
      await translateDOM(document.body, { translateWithMappingFn: customFn });
      expect(document.body.textContent).toBe('BONJOUR MONDE');
      expect(customFn).toHaveBeenCalledWith('Bonjour monde', 'ingglish');
    });

    it('should use custom mapping fn for attributes (via token join)', async () => {
      document.body.innerHTML = '<img alt="Bonjour" title="Cliquez ici">';
      const customFn = vi.fn(uppercaseMappingFn);
      await translateDOM(document.body, {
        translateAttributes: true,
        translateWithMappingFn: customFn,
      });
      const img = document.querySelector('img');
      expect(img?.getAttribute('alt')).toBe('BONJOUR');
      expect(img?.getAttribute('title')).toBe('CLIQUEZ ICI');
    });

    it('should show tooltips with original text when mapping fn + showTooltips', async () => {
      document.body.innerHTML = '<p>Bonjour monde</p>';
      const customFn = vi.fn(uppercaseMappingFn);
      await translateDOM(document.body, { showTooltips: true, translateWithMappingFn: customFn });
      // Each word should be wrapped in a tooltip span showing the original
      const spans = document.querySelectorAll<HTMLElement>('.ingglish-word');
      expect(spans).toHaveLength(2);
      expect(spans[0].textContent).toBe('BONJOUR');
      expect(spans[0].dataset.ingglishOrig).toBe('Bonjour');
      expect(spans[1].textContent).toBe('MONDE');
      expect(spans[1].dataset.ingglishOrig).toBe('monde');
    });

    it('should work in chunked mode', async () => {
      document.body.innerHTML = '<p>Bonjour</p><p>monde</p>';
      const customFn = vi.fn(uppercaseMappingFn);
      await translateDOM(document.body, { chunked: true, translateWithMappingFn: customFn });
      expect(document.body.textContent).toBe('BONJOURMONDE');
    });

    it('should skip English dictionary preload when mapping fn is set', async () => {
      document.body.innerHTML = '<p>Test</p>';
      const customFn = vi.fn((text: string) => [
        { isWord: true, matched: true, original: text, translated: `[${text}]` },
      ]);
      await translateDOM(document.body, { translateWithMappingFn: customFn });
      expect(document.body.textContent).toBe('[Test]');
      expect(customFn).toHaveBeenCalled();
    });

    it('should respect outputFormat with custom mapping fn', async () => {
      document.body.innerHTML = '<p>Test</p>';
      const customFn = vi.fn(uppercaseMappingFn);
      await translateDOM(document.body, { outputFormat: 'ipa', translateWithMappingFn: customFn });
      expect(customFn).toHaveBeenCalledWith('Test', 'ipa');
    });
  });

  describe('not-found word styling', () => {
    it('should add ingglish-not-found class for G2P fallback words (English)', async () => {
      // "xyzzyplugh" is not in the dictionary, so G2P fallback is used (matched: false)
      document.body.innerHTML = '<p>Hello xyzzyplugh world</p>';
      await translateDOM(document.body, { showTooltips: true });

      const spans = document.querySelectorAll<HTMLElement>('.ingglish-word');
      expect(spans.length).toBeGreaterThanOrEqual(3);

      // Dictionary words should NOT have not-found class
      const helloSpan = Array.from(spans).find((s) => s.dataset.ingglishOrig === 'Hello');
      expect(helloSpan).not.toBeNull();
      expect(helloSpan?.classList.contains('ingglish-not-found')).toBe(false);

      // G2P fallback word should have not-found class
      const unknownSpan = Array.from(spans).find((s) => s.dataset.ingglishOrig === 'xyzzyplugh');
      expect(unknownSpan).not.toBeNull();
      expect(unknownSpan?.classList.contains('ingglish-not-found')).toBe(true);
    });

    it('should add ingglish-not-found class for unmatched tokens (foreign mapping fn)', async () => {
      document.body.innerHTML = '<p>Bonjour xyzzy monde</p>';
      // Simulate foreign mapping fn with matched/unmatched tokens
      const customFn = vi.fn((text: string) =>
        text
          .split(/(\s+)/)
          .filter(Boolean)
          .map((seg) => {
            if (/^\s+$/.test(seg)) {
              return { isWord: false, matched: true, original: seg, translated: seg };
            }
            if (seg.toLowerCase() === 'xyzzy') {
              return { isWord: true, matched: false, original: seg, translated: seg };
            }
            return { isWord: true, matched: true, original: seg, translated: seg.toUpperCase() };
          })
      );
      await translateDOM(document.body, { showTooltips: true, translateWithMappingFn: customFn });

      const spans = document.querySelectorAll<HTMLElement>('.ingglish-word');
      expect(spans.length).toBeGreaterThanOrEqual(2);

      // Found word should NOT have not-found class
      const bonjourSpan = Array.from(spans).find((s) => s.dataset.ingglishOrig === 'Bonjour');
      expect(bonjourSpan).not.toBeNull();
      expect(bonjourSpan?.classList.contains('ingglish-not-found')).toBe(false);

      // Not-found word should have not-found class
      const xyzzySpan = Array.from(spans).find((s) => s.dataset.ingglishOrig === 'xyzzy');
      expect(xyzzySpan).not.toBeNull();
      expect(xyzzySpan?.classList.contains('ingglish-not-found')).toBe(true);
    });

    it('should create tooltip span for not-found words even when text is unchanged', async () => {
      document.body.innerHTML = '<p>alpha beta</p>';
      // Mapping fn returns unmatched tokens (translated === original)
      const customFn = vi.fn((text: string) =>
        text
          .split(/(\s+)/)
          .filter(Boolean)
          .map((seg) => {
            if (/^\s+$/.test(seg)) {
              return { isWord: false, matched: true, original: seg, translated: seg };
            }
            return { isWord: true, matched: false, original: seg, translated: seg };
          })
      );
      await translateDOM(document.body, { showTooltips: true, translateWithMappingFn: customFn });

      // Even though text didn't change, spans should be created because matched=false
      const spans = document.querySelectorAll<HTMLElement>('.ingglish-word');
      expect(spans).toHaveLength(2);
      expect(spans[0].classList.contains('ingglish-not-found')).toBe(true);
      expect(spans[1].classList.contains('ingglish-not-found')).toBe(true);
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
        { hello: 'haloh', test: 'tust', world: 'werld' },
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
        { are: 'ar', hello: 'haloh', how: 'how', world: 'werld', you: 'yoo' },
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
        { hello: 'haloh', world: 'werld' },
        { showTooltips: true }
      );

      // Second translation - template should be reused
      document.body.innerHTML = '<p>Test case here</p>';

      await applyTranslationsMap(
        document.body,
        { case: 'kais', here: 'hir', test: 'tust' },
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

  describe('applyTranslationsMap without tooltips', () => {
    it.each([
      ['<p>Hello world</p>', { hello: 'haloh', world: 'werld' }, 'Haloh werld'],
      ['<p>HELLO World hello</p>', { hello: 'haloh', world: 'werld' }, 'HALOH Werld haloh'],
      ['<p>Hello, world!</p>', { hello: 'haloh', world: 'werld' }, 'Haloh, werld!'],
      ['<p>Hello beautiful world</p>', { hello: 'haloh', world: 'werld' }, 'Haloh beautiful werld'],
      ['<p>123 456</p>', { hello: 'haloh' }, '123 456'],
    ])('%s → %s', async (html, map, expected) => {
      document.body.innerHTML = html;
      await applyTranslationsMap(document.body, map);
      expect(document.querySelector('p')?.textContent).toBe(expected);
    });

    it('should store original content on parent element', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await applyTranslationsMap(document.body, { hello: 'haloh' });
      expect(document.querySelector('p')?.dataset.ingglishOriginal).toBe('Hello world');
    });
  });

  describe('extractWords', () => {
    it.each([
      ['Hello World hello', ['hello', 'world'], 'unique lowercase words'],
      ['', [], 'empty text'],
      ['Hello 123 world!', ['hello', 'world'], 'skips numbers/non-words'],
      ['don\u2019t won\u2019t', ["don't", "won't"], 'normalizes apostrophes'],
    ] as const)('extractWords(%s) → %j (%s)', (input, expected, _desc) => {
      expect(extractWords(input)).toEqual([...expected]);
    });
  });

  describe('extractWordsFromNodes', () => {
    it.each([
      [['Hello world', 'Hello test'], ['hello', 'world', 'test'], 'multiple text nodes'],
      [[], [], 'empty array'],
      [[''], [], 'nodes with empty text content'],
    ] as const)('should extract words from %j (%s)', (textContents, expected, _desc) => {
      const nodes = textContents.map((t) => document.createTextNode(t));
      expect(extractWordsFromNodes(nodes)).toEqual([...expected]);
    });
  });

  describe('processChunked', () => {
    it('should call onProgress in sync path', async () => {
      const items = [1, 2, 3];
      const processed: number[] = [];
      const progressCalls: [number, number][] = [];

      await processChunked(
        items,
        (item) => processed.push(item),
        10,
        (p, t) => progressCalls.push([p, t]),
        10 // syncThreshold > items.length, so sync path
      );

      expect(processed).toEqual([1, 2, 3]);
      expect(progressCalls).toEqual([
        [1, 3],
        [2, 3],
        [3, 3],
      ]);
    });

    it('should handle empty items', async () => {
      const result = processChunked([], () => {}, 10);
      expect(result).toBeInstanceOf(Promise);
      await result;
    });
  });

  describe('shouldSkipTextNode', () => {
    it.each([
      ['<code>hello</code>', 'code', true, 'parent is skip tag'],
      ['<pre><span>hello</span></pre>', 'span', true, 'ancestor is skip tag'],
      ['<p>hello</p>', 'p', false, 'normal text node'],
    ] as const)('%s (%s)', (html, selector, expected, _desc) => {
      document.body.innerHTML = html;
      const textNode = document.querySelector(selector)!.firstChild as Text;
      expect(shouldSkipTextNode(textNode, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES)).toBe(expected);
    });
  });

  describe('skipElement / unskipElement', () => {
    it('should mark and unmark elements for skipping', () => {
      document.body.innerHTML = '<p>hello</p>';
      const p = document.querySelector('p')!;

      skipElement(p);
      expect(shouldSkipElement(p, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES)).toBe(true);

      unskipElement(p);
      expect(shouldSkipElement(p, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES)).toBe(false);
    });
  });

  describe('shouldSkipElement with custom skip lists', () => {
    it('should use cached sets for repeated custom arrays', () => {
      document.body.innerHTML = '<p>hello</p>';
      const p = document.querySelector('p')!;
      const customTags = ['P'];
      const customClasses = ['skip-me'];

      // First call creates the set
      expect(shouldSkipElement(p, customTags, customClasses)).toBe(true);
      // Second call should use cached set (same array reference)
      expect(shouldSkipElement(p, customTags, customClasses)).toBe(true);
    });

    it('should skip elements with ATTR_ORIGINAL_WORD', () => {
      document.body.innerHTML = '<span data-ingglish-orig="Hello">Haloh</span>';
      const span = document.querySelector('span')!;
      expect(shouldSkipElement(span, DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES)).toBe(true);
    });
  });

  describe('translateDOM with empty text nodes', () => {
    it('should handle text nodes with empty content', async () => {
      // Create an element with an empty text node
      const p = document.createElement('p');
      const emptyText = document.createTextNode('');
      const realText = document.createTextNode('Hello');
      p.append(emptyText, realText);
      document.body.append(p);
      // Empty text nodes are filtered by collectTextNodes (whitespace check)
      await translateDOM(document.body);
      // Should not crash; only the real text node should be translated
      expect(p.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe('translateDOM with skipped attribute elements', () => {
    it('should not translate attributes on skipped elements', async () => {
      document.body.innerHTML = '<code title="Hello">code</code>';
      await translateDOM(document.body, { translateAttributes: true });
      // CODE is in DEFAULT_SKIP_TAGS, so its title should not be translated
      expect(document.querySelector('code')?.getAttribute('title')).toBe('Hello');
    });
  });

  describe('tooltip fragment isDiff class', () => {
    it('should add ingglish-format-diff class for IPA format differences', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOM(document.body, { outputFormat: 'ipa', showTooltips: true });

      const diffSpans = document.querySelectorAll('.ingglish-format-diff');
      // At least some words should have format-diff class when showing IPA
      // (IPA differs from standard Ingglish for most words)
      expect(diffSpans.length).toBeGreaterThan(0);
    });
  });
});
