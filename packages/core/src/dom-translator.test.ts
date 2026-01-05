/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { loadDictionary } from './translator';
import {
  translateDOM,
  translateDOMAsync,
  skipElement,
  unskipElement,
} from './dom-translator';

describe('dom-translator', () => {
  beforeAll(async () => {
    await loadDictionary();
  });

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('translateDOM', () => {
    it('should translate text content', () => {
      document.body.innerHTML = '<p>Hello world</p>';
      translateDOM(document.body);
      expect(document.body.innerHTML).toBe('<p>Hulo werld</p>');
    });

    it('should translate multiple text nodes', () => {
      document.body.innerHTML = '<div><p>Hello</p><p>World</p></div>';
      translateDOM(document.body);
      expect(document.querySelector('div')?.innerHTML).toBe('<p>Hulo</p><p>Werld</p>');
    });

    it('should skip script tags by default', () => {
      document.body.innerHTML = '<script>var hello = "world";</script>';
      translateDOM(document.body);
      expect(document.body.innerHTML).toBe('<script>var hello = "world";</script>');
    });

    it('should skip code tags by default', () => {
      document.body.innerHTML = '<code>console.log("hello")</code>';
      translateDOM(document.body);
      expect(document.body.innerHTML).toBe('<code>console.log("hello")</code>');
    });

    it('should skip pre tags by default', () => {
      document.body.innerHTML = '<pre>Hello World</pre>';
      translateDOM(document.body);
      expect(document.body.innerHTML).toBe('<pre>Hello World</pre>');
    });

    it('should skip custom classes', () => {
      document.body.innerHTML = '<p class="no-translate">Hello</p>';
      translateDOM(document.body, { skipClasses: ['no-translate'] });
      expect(document.body.innerHTML).toBe('<p class="no-translate">Hello</p>');
    });

    it('should skip contenteditable elements', () => {
      document.body.innerHTML = '<div contenteditable="true">Hello</div>';
      translateDOM(document.body);
      expect(document.body.innerHTML).toBe('<div contenteditable="true">Hello</div>');
    });

    it('should skip elements with data-ingglish-skip', () => {
      document.body.innerHTML = '<p data-ingglish-skip>Hello</p>';
      translateDOM(document.body);
      expect(document.body.innerHTML).toBe('<p data-ingglish-skip="">Hello</p>');
    });

    it('should translate attributes when enabled', () => {
      document.body.innerHTML = '<img alt="Hello world" title="Click here">';
      translateDOM(document.body, { translateAttributes: true });
      const img = document.querySelector('img');
      expect(img?.getAttribute('alt')).toBe('Hulo werld');
      expect(img?.getAttribute('title')).toBe('Klik heer');
    });

    it('should not translate attributes when disabled', () => {
      document.body.innerHTML = '<img alt="Hello world">';
      translateDOM(document.body, { translateAttributes: false });
      expect(document.querySelector('img')?.getAttribute('alt')).toBe('Hello world');
    });

    it('should call onProgress callback', () => {
      document.body.innerHTML = '<p>Hello</p><p>World</p>';
      const progressCalls: [number, number][] = [];
      translateDOM(document.body, {
        onProgress: (processed, total) => progressCalls.push([processed, total]),
      });
      expect(progressCalls.length).toBe(2);
      expect(progressCalls[0]).toEqual([1, 2]);
      expect(progressCalls[1]).toEqual([2, 2]);
    });
  });

  describe('translateDOMAsync', () => {
    it('should translate text content asynchronously', async () => {
      document.body.innerHTML = '<p>Hello world</p>';
      await translateDOMAsync(document.body);
      expect(document.body.innerHTML).toBe('<p>Hulo werld</p>');
    });
  });

  describe('skipElement / unskipElement', () => {
    it('should add data-ingglish-skip attribute', () => {
      document.body.innerHTML = '<p>Hello</p>';
      const p = document.querySelector('p')!;
      skipElement(p);
      expect(p.hasAttribute('data-ingglish-skip')).toBe(true);
    });

    it('should remove data-ingglish-skip attribute', () => {
      document.body.innerHTML = '<p data-ingglish-skip>Hello</p>';
      const p = document.querySelector('p')!;
      unskipElement(p);
      expect(p.hasAttribute('data-ingglish-skip')).toBe(false);
    });

    it('should prevent translation after skipElement', () => {
      document.body.innerHTML = '<p>Hello</p>';
      const p = document.querySelector('p')!;
      skipElement(p);
      translateDOM(document.body);
      expect(p.textContent).toBe('Hello');
    });
  });

  describe('nested elements', () => {
    it('should translate nested text', () => {
      document.body.innerHTML = '<div><span>Hello</span> <strong>world</strong></div>';
      translateDOM(document.body);
      expect(document.body.textContent).toBe('Hulo werld');
    });

    it('should skip nested elements inside skipped parent', () => {
      document.body.innerHTML = '<pre><span>Hello</span></pre>';
      translateDOM(document.body);
      expect(document.querySelector('span')?.textContent).toBe('Hello');
    });
  });
});
