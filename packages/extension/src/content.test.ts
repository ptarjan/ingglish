import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { translateDOM, observeAndTranslate, restoreDOM } from '@ingglish/core';

// Suppress console.error and console.log during tests
vi.spyOn(console, 'error').mockImplementation(() => undefined);
vi.spyOn(console, 'log').mockImplementation(() => undefined);

// Mock @ingglish/core
vi.mock('@ingglish/core', () => ({
  translateDOM: vi.fn(),
  observeAndTranslate: vi.fn().mockReturnValue(vi.fn()),
  restoreDOM: vi.fn(),
}));

type FormatCallback = ((response: { format: string }) => void) | undefined;

// Mock chrome API
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    sendMessage: vi
      .fn<(message: object, callback: FormatCallback) => undefined>()
      .mockImplementation((_message: object, callback: FormatCallback) => {
        // Return format 'ingglish' for GET_FORMAT messages
        if (callback !== undefined) {
          callback({ format: 'ingglish' });
        }
        return undefined;
      }),
  },
};

vi.stubGlobal('chrome', mockChrome);

// Create a proper DOM mock
interface MockElement {
  id: string;
  textContent: string;
  style: { cssText: string; opacity: string };
  addEventListener: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
}

interface MockDocument {
  body: { appendChild: ReturnType<typeof vi.fn> };
  getElementById: Mock<(id: string) => unknown>;
  createElement: Mock<(tag: string) => MockElement>;
  _setElement: (id: string, el: unknown) => void;
}

function createMockDocument(): MockDocument {
  const elements: Record<string, unknown> = {};

  const createElement: Mock<(tag: string) => MockElement> = vi.fn((_tag: string) => {
    const el: MockElement = {
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

type MessageHandler = (
  message: { type: string },
  sender: unknown,
  sendResponse: (response: { success: boolean }) => void
) => boolean | undefined;

describe('content script (lazy loaded)', () => {
  let mockDocument: ReturnType<typeof createMockDocument>;
  let mockWindow: { __ingglishState?: IngglishState };
  let messageHandler: MessageHandler;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset mocks to successful behavior
    vi.mocked(translateDOM).mockImplementation(() => undefined);
    vi.mocked(observeAndTranslate).mockReturnValue(vi.fn());
    vi.mocked(restoreDOM).mockImplementation(() => undefined);

    // Set up document mock
    mockDocument = createMockDocument();
    vi.stubGlobal('document', mockDocument);

    // Set up window mock for state
    mockWindow = {};
    vi.stubGlobal('window', mockWindow);

    // Capture the message handler
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler: MessageHandler) => {
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
          expect.objectContaining({
            showTooltips: true,
            outputFormat: 'ingglish',
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            onProgress: expect.any(Function),
          })
        );
      });
    });

    it('calls observeAndTranslate after translation', async () => {
      await import('./content');

      await vi.waitFor(() => {
        expect(observeAndTranslate).toHaveBeenCalledWith(mockDocument.body, {
          showTooltips: true,
          outputFormat: 'ingglish',
        });
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
      let createdElement: MockElement | null = null;
      mockDocument.createElement.mockImplementation((_tag: string) => {
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
        if (createdElement !== null) {
          expect(createdElement.id).toBe('ingglish-badge');
          expect(createdElement.textContent).toBe('Ingglish');
          expect(createdElement.style.cssText).toContain('position: fixed');
          expect(createdElement.style.cssText).toContain('z-index: 999999');
        }
      });
    });
  });
});
