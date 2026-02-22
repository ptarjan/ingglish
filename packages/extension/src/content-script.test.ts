/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Suppress console during tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock chrome API
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi.fn(),
    lastError: null as chrome.runtime.LastError | null,
  },
};

vi.stubGlobal('chrome', mockChrome);

// Mock requestAnimationFrame
vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
  return setTimeout(() => {
    cb(performance.now());
  }, 0);
});

describe('content-script', () => {
  let messageHandler: (
    message: { type: string; format?: string },
    sender: unknown,
    sendResponse: (response: { success: boolean }) => void
  ) => boolean | undefined;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;

    // Reset DOM
    document.body.innerHTML = '';
    document.body.className = '';

    // Mock sendMessage for translation requests
    mockChrome.runtime.sendMessage.mockImplementation(
      (
        message: { type: string; words?: string[]; format?: string },
        callback?: (response: unknown) => void
      ) => {
        if (message.type === 'GET_FORMAT') {
          callback?.({ format: 'ingglish' });
        } else if (message.type === 'TRANSLATE_WORDS') {
          // Return mock translations
          const translations: Record<string, string> = {};
          for (const word of message.words ?? []) {
            translations[word.toLowerCase()] = `translated-${word}`;
          }
          callback?.({ translations });
        }
      }
    );

    // Capture the message handler when module loads
    mockChrome.runtime.onMessage.addListener.mockImplementation(
      (handler: typeof messageHandler) => {
        messageHandler = handler;
      }
    );

    // Import module to trigger handler registration
    await import('./content-script');
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('RESTORE message', () => {
    it('should keep ingglish-ready class so page stays visible', async () => {
      // Set up a translated page
      document.body.innerHTML = `
        <p data-ingglish-original="Hello world">
          <span class="ingglish-word" data-ingglish-orig="Hello">Hulo</span>
          <span class="ingglish-word" data-ingglish-orig="world">werld</span>
        </p>
      `;
      document.body.classList.add('ingglish-ready');

      // Create badge
      const badge = document.createElement('div');
      badge.id = 'ingglish-badge';
      document.body.appendChild(badge);

      // Send RESTORE message
      const sendResponse = vi.fn();
      messageHandler({ type: 'RESTORE' }, {}, sendResponse);

      // Wait for processing
      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({ success: true });
      });

      // Page should stay visible (ingglish-ready class should NOT be removed)
      expect(document.body.classList.contains('ingglish-ready')).toBe(true);

      // Badge should be removed
      expect(document.getElementById('ingglish-badge')).toBeNull();
    });
  });

  describe('RETRANSLATE message', () => {
    it('should preserve same DOM elements (in-place update, not recreate)', async () => {
      // Set up a translated page with spans (realistic structure with data-ingglish-original)
      document.body.innerHTML = `
        <p data-ingglish-original="Hello world">
          <span class="ingglish-word" data-ingglish-orig="Hello">Hulo</span>
          <span class="ingglish-word" data-ingglish-orig="world">werld</span>
        </p>
      `;

      // Capture references to the actual DOM elements
      const originalSpans = document.querySelectorAll('.ingglish-word');
      const span1 = originalSpans[0];
      const span2 = originalSpans[1];

      // Mark as translated
      const win = window as { __ingglishStateLite?: { translated: boolean } };
      if (win.__ingglishStateLite) {
        win.__ingglishStateLite.translated = true;
      }

      // Send RETRANSLATE message
      const sendResponse = vi.fn();
      messageHandler({ type: 'RETRANSLATE', format: 'ipa' }, {}, sendResponse);

      // Wait for async processing
      await vi.waitFor(
        () => {
          expect(sendResponse).toHaveBeenCalled();
        },
        { timeout: 2000 }
      );

      // The SAME span elements should still be in the document
      // (old implementation would destroy them and create new ones)
      expect(span1.isConnected).toBe(true);
      expect(span2.isConnected).toBe(true);

      // And they should still be the ones in the DOM
      const currentSpans = document.querySelectorAll('.ingglish-word');
      expect(currentSpans[0]).toBe(span1);
      expect(currentSpans[1]).toBe(span2);
    });

    it('should not freeze when processing many spans', async () => {
      // Create many spans
      const spans: string[] = [];
      for (let i = 0; i < 500; i++) {
        spans.push(
          `<span class="ingglish-word" data-ingglish-orig="word${i}">translated${i}</span>`
        );
      }
      document.body.innerHTML = `<p>${spans.join(' ')}</p>`;

      const win = window as { __ingglishStateLite?: { translated: boolean } };
      if (win.__ingglishStateLite) {
        win.__ingglishStateLite.translated = true;
      }

      const startTime = performance.now();
      const sendResponse = vi.fn();

      messageHandler({ type: 'RETRANSLATE', format: 'ipa' }, {}, sendResponse);

      // Should return quickly (not block)
      const initialResponseTime = performance.now() - startTime;
      expect(initialResponseTime).toBeLessThan(100); // Should not block for long

      // Wait for completion
      await vi.waitFor(
        () => {
          expect(sendResponse).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    });
  });

  describe('MutationObserver debouncing', () => {
    it('should wait 100ms before processing mutations', async () => {
      // This test verifies the debounce timer behavior
      // Without debounce, mutations would process immediately
      // With 100ms debounce, we should see a delay before processing

      // First do initial translation to set up observer
      document.body.innerHTML = '<p>Initial</p>';

      // Wait longer for initial translation and observer setup to complete
      await new Promise((r) => setTimeout(r, 200));

      // Clear all previous calls
      mockChrome.runtime.sendMessage.mockClear();

      // Add a mutation with a unique word
      const p = document.createElement('p');
      p.textContent = 'Xylophone'; // Unique word not in initial translation
      document.body.appendChild(p);

      // Check immediately (before 100ms debounce)
      await new Promise((r) => setTimeout(r, 20));
      const callsBeforeDebounce = mockChrome.runtime.sendMessage.mock.calls.filter((call) => {
        const msg = call[0] as { type: string; words?: string[] };
        return msg.type === 'TRANSLATE_WORDS' && msg.words?.includes('xylophone') === true;
      });

      // With debouncing, no translate call for the new word should have happened yet
      expect(callsBeforeDebounce.length).toBe(0);

      // Wait for debounce to complete (100ms from mutation + buffer)
      await new Promise((r) => setTimeout(r, 150));

      // Now it should have been processed
      const callsAfterDebounce = mockChrome.runtime.sendMessage.mock.calls.filter((call) => {
        const msg = call[0] as { type: string; words?: string[] };
        return msg.type === 'TRANSLATE_WORDS' && msg.words?.includes('xylophone') === true;
      });
      expect(callsAfterDebounce.length).toBeGreaterThanOrEqual(1);
    });

    it('should batch mutations that occur within debounce window', async () => {
      // Test that multiple mutations within 100ms get batched together

      document.body.innerHTML = '<p>Initial</p>';
      await new Promise((r) => setTimeout(r, 50));

      mockChrome.runtime.sendMessage.mockClear();
      const translateSpy = vi.spyOn(mockChrome.runtime, 'sendMessage');

      // Add first mutation with unique words
      const p1 = document.createElement('p');
      p1.textContent = 'Alpha bravo';
      document.body.appendChild(p1);

      // Wait 30ms (still within debounce window)
      await new Promise((r) => setTimeout(r, 30));

      // Add second mutation
      const p2 = document.createElement('p');
      p2.textContent = 'Charlie delta';
      document.body.appendChild(p2);

      // Wait 30ms more (still within debounce window from second mutation)
      await new Promise((r) => setTimeout(r, 30));

      // Add third mutation
      const p3 = document.createElement('p');
      p3.textContent = 'Echo foxtrot';
      document.body.appendChild(p3);

      // Wait for debounce to complete (100ms from last mutation + buffer)
      await new Promise((r) => setTimeout(r, 150));

      // All mutations should be batched into a single translate call
      const translateCalls = translateSpy.mock.calls.filter(
        (call) => (call[0] as { type: string }).type === 'TRANSLATE_WORDS'
      );

      // Should have only 1 batched call, not 3 separate calls
      expect(translateCalls.length).toBe(1);

      // And the call should contain words from all mutations
      const words = (translateCalls[0][0] as { words: string[] }).words;
      expect(words).toContain('alpha');
      expect(words).toContain('bravo');
      expect(words).toContain('charlie');
      expect(words).toContain('delta');
      expect(words).toContain('echo');
      expect(words).toContain('foxtrot');
    });
  });
});
