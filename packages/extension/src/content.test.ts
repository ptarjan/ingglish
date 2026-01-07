import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateDOM, observeAndTranslate, restoreDOM } from '@ingglish/core';

// Suppress console.error and console.log during tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock @ingglish/core
vi.mock('@ingglish/core', () => ({
  translateDOM: vi.fn().mockResolvedValue(undefined),
  observeAndTranslate: vi.fn().mockResolvedValue(vi.fn()),
  restoreDOM: vi.fn(),
}));

// Mock chrome API
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
};

vi.stubGlobal('chrome', mockChrome);

// Create a proper DOM mock
function createMockDocument() {
  const elements: Record<string, unknown> = {};

  const createElement = vi.fn((_tag: string) => {
    const el = {
      id: '',
      textContent: '',
      style: { cssText: '', opacity: '' },
      addEventListener: vi.fn(),
      remove: vi.fn(),
    };
    return el;
  });

  return {
    body: {
      appendChild: vi.fn(),
    },
    getElementById: vi.fn((id: string) => elements[id] ?? null),
    createElement,
    _setElement: (id: string, el: unknown) => {
      elements[id] = el;
    },
  };
}

interface IngglishState {
  injected: boolean;
  translated: boolean;
  stopObserver: (() => void) | null;
}

describe('content script (lazy loaded)', () => {
  let mockDocument: ReturnType<typeof createMockDocument>;
  let mockWindow: { __ingglishState?: IngglishState };
  let messageHandler: (
    message: { type: string },
    sender: unknown,
    sendResponse: (response: { success: boolean }) => void
  ) => boolean | undefined;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset mocks to successful behavior
    vi.mocked(translateDOM).mockResolvedValue(undefined);
    vi.mocked(observeAndTranslate).mockResolvedValue(vi.fn());
    vi.mocked(restoreDOM).mockImplementation(() => {});

    // Set up document mock
    mockDocument = createMockDocument();
    vi.stubGlobal('document', mockDocument);

    // Set up window mock for state
    mockWindow = {};
    vi.stubGlobal('window', mockWindow);

    // Capture the message handler
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('automatic translation on load', () => {
    it('translates page immediately when injected', async () => {
      await import('./content');

      await vi.waitFor(() => {
        expect(translateDOM).toHaveBeenCalledWith(
          mockDocument.body,
          expect.objectContaining({ onProgress: expect.any(Function) })
        );
      });
    });

    it('calls observeAndTranslate after translation', async () => {
      await import('./content');

      await vi.waitFor(() => {
        expect(observeAndTranslate).toHaveBeenCalledWith(mockDocument.body);
      });
    });

    it('sets state to track injection and translation', async () => {
      await import('./content');

      // Wait for translation to complete
      await vi.waitFor(() => {
        expect(translateDOM).toHaveBeenCalled();
      });

      expect(mockWindow.__ingglishState?.injected).toBe(true);
      expect(mockWindow.__ingglishState?.translated).toBe(true);
    });

    it('skips translation if already translated', async () => {
      // Set state to already translated
      mockWindow.__ingglishState = {
        injected: true,
        translated: true,
        stopObserver: null,
      };

      await import('./content');

      // Small delay
      await new Promise((r) => setTimeout(r, 50));

      // translateDOM should not be called
      expect(translateDOM).not.toHaveBeenCalled();
    });

    it('handles translation errors gracefully', async () => {
      vi.mocked(translateDOM).mockRejectedValueOnce(new Error('Translation failed'));

      await import('./content');

      // Wait a bit for the error to be caught
      await new Promise((r) => setTimeout(r, 50));

      // Should not throw, error is logged
      expect(translateDOM).toHaveBeenCalled();
    });
  });

  describe('RESTORE message', () => {
    it('restores original text when RESTORE message is received', async () => {
      await import('./content');

      // Wait for initial translation
      await vi.waitFor(() => {
        expect(translateDOM).toHaveBeenCalled();
      });

      // Simulate RESTORE message
      const sendResponse = vi.fn();
      messageHandler({ type: 'RESTORE' }, {}, sendResponse);

      expect(restoreDOM).toHaveBeenCalledWith(mockDocument.body);
      expect(sendResponse).toHaveBeenCalledWith({ success: true });
    });

    it('stops observer when restoring', async () => {
      const mockStopObserver = vi.fn();
      vi.mocked(observeAndTranslate).mockResolvedValue(mockStopObserver);

      await import('./content');

      // Wait for initial translation
      await vi.waitFor(() => {
        expect(observeAndTranslate).toHaveBeenCalled();
      });

      // Simulate RESTORE message
      messageHandler({ type: 'RESTORE' }, {}, vi.fn());

      expect(mockStopObserver).toHaveBeenCalled();
    });

    it('resets translated state after restore', async () => {
      await import('./content');

      // Wait for initial translation
      await vi.waitFor(() => {
        expect(translateDOM).toHaveBeenCalled();
      });

      expect(mockWindow.__ingglishState?.translated).toBe(true);

      // Simulate RESTORE message
      messageHandler({ type: 'RESTORE' }, {}, vi.fn());

      expect(mockWindow.__ingglishState?.translated).toBe(false);
    });
  });

  describe('translation badge', () => {
    it('creates badge element after translation', async () => {
      await import('./content');

      await vi.waitFor(() => {
        expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      });
    });

    it('appends badge to body', async () => {
      await import('./content');

      await vi.waitFor(() => {
        expect(mockDocument.body.appendChild).toHaveBeenCalled();
      });
    });

    it('does not create duplicate badge', async () => {
      // Simulate existing badge
      mockDocument._setElement('ingglish-badge', { id: 'ingglish-badge' });

      await import('./content');

      // Wait for translation to complete
      await vi.waitFor(() => {
        expect(translateDOM).toHaveBeenCalled();
      });

      // Wait a bit more for badge creation
      await new Promise((r) => setTimeout(r, 50));

      // createElement should not be called because badge exists
      expect(mockDocument.createElement).not.toHaveBeenCalled();
    });

    it('sets badge properties correctly', async () => {
      let createdElement: { id: string; textContent: string; style: { cssText: string } } | null =
        null;
      mockDocument.createElement.mockImplementation(() => {
        createdElement = {
          id: '',
          textContent: '',
          style: { cssText: '', opacity: '' },
          addEventListener: vi.fn(),
          remove: vi.fn(),
        };
        return createdElement;
      });

      await import('./content');

      await vi.waitFor(() => {
        expect(createdElement).not.toBeNull();
        expect(createdElement!.id).toBe('ingglish-badge');
        expect(createdElement!.textContent).toBe('Ingglish');
        expect(createdElement!.style.cssText).toContain('position: fixed');
        expect(createdElement!.style.cssText).toContain('z-index: 999999');
      });
    });
  });
});
