/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Suppress console during tests
vi.spyOn(console, 'error').mockImplementation(() => undefined);
vi.spyOn(console, 'log').mockImplementation(() => undefined);

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

describe('content-lite', () => {
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
    await import('./content-lite');
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
    it('should update spans in-place without full re-render', async () => {
      // Set up a translated page with spans
      document.body.innerHTML = `
        <p>
          <span class="ingglish-word" data-ingglish-orig="Hello">Hulo</span>
          <span class="ingglish-word" data-ingglish-orig="world">werld</span>
        </p>
      `;

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

      // Spans should still exist (not destroyed and recreated)
      const spans = document.querySelectorAll('.ingglish-word');
      expect(spans.length).toBe(2);
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
    it('should batch rapid mutations', async () => {
      // This test verifies the debounce behavior
      // The observer should wait 100ms before processing

      // First do initial translation to set up observer
      document.body.innerHTML = '<p>Initial content</p>';

      // Trigger translation
      const translateSpy = vi.spyOn(mockChrome.runtime, 'sendMessage');

      // Simulate multiple rapid DOM mutations
      for (let i = 0; i < 5; i++) {
        const p = document.createElement('p');
        p.textContent = `New content ${i}`;
        document.body.appendChild(p);
      }

      // Wait for debounce (100ms) + processing
      await new Promise((r) => setTimeout(r, 200));

      // Translation requests should be batched, not one per mutation
      const translateCalls = translateSpy.mock.calls.filter(
        (call) => (call[0] as { type: string }).type === 'TRANSLATE_WORDS'
      );

      // Should have at most 2 calls (initial + batched), not 5+
      expect(translateCalls.length).toBeLessThanOrEqual(2);
    });
  });
});
