import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { translateDOM, observeAndTranslate } from '@ingglish/core';

// Mock @ingglish/core
vi.mock('@ingglish/core', () => ({
  translateDOM: vi.fn().mockResolvedValue(undefined),
  observeAndTranslate: vi.fn().mockResolvedValue(undefined),
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

describe('content script', () => {
  let messageHandler: (
    message: { type: string },
    sender: unknown,
    sendResponse: (response: { success: boolean; error?: string }) => void
  ) => boolean | undefined;
  let mockDocument: ReturnType<typeof createMockDocument>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset mocks to successful behavior
    vi.mocked(translateDOM).mockResolvedValue(undefined);
    vi.mocked(observeAndTranslate).mockResolvedValue(undefined);

    // Set up document mock
    mockDocument = createMockDocument();
    vi.stubGlobal('document', mockDocument);

    // Capture the message handler
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });

    // Import the module
    await import('./content');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('TRANSLATE message', () => {
    it('responds with success after translation', async () => {
      const sendResponse = vi.fn();

      const result = messageHandler({ type: 'TRANSLATE' }, {}, sendResponse);

      expect(result).toBe(true); // async response

      // Wait for async translation to complete
      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({ success: true });
      });
    });

    it('calls translateDOM with document.body', async () => {
      messageHandler({ type: 'TRANSLATE' }, {}, vi.fn());

      await vi.waitFor(() => {
        expect(translateDOM).toHaveBeenCalledWith(
          mockDocument.body,
          expect.objectContaining({ onProgress: expect.any(Function) })
        );
      });
    });

    it('calls observeAndTranslate after translation', async () => {
      messageHandler({ type: 'TRANSLATE' }, {}, vi.fn());

      await vi.waitFor(() => {
        expect(observeAndTranslate).toHaveBeenCalledWith(mockDocument.body);
      });
    });

    it('responds with error on translation failure', async () => {
      // Make translateDOM fail for this test
      vi.mocked(translateDOM).mockRejectedValueOnce(new Error('Translation failed'));

      const sendResponse = vi.fn();
      messageHandler({ type: 'TRANSLATE' }, {}, sendResponse);

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({
          success: false,
          error: 'Translation failed',
        });
      });
    });
  });

  describe('unknown message types', () => {
    it('returns false for unknown message types', () => {
      const sendResponse = vi.fn();
      const result = messageHandler({ type: 'UNKNOWN' }, {}, sendResponse);

      expect(result).toBe(false);
    });
  });

  describe('translation badge', () => {
    it('creates badge element after translation', async () => {
      messageHandler({ type: 'TRANSLATE' }, {}, vi.fn());

      await vi.waitFor(() => {
        expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      });
    });

    it('appends badge to body', async () => {
      messageHandler({ type: 'TRANSLATE' }, {}, vi.fn());

      await vi.waitFor(() => {
        expect(mockDocument.body.appendChild).toHaveBeenCalled();
      });
    });

    it('does not create duplicate badge', async () => {
      // Simulate existing badge
      mockDocument._setElement('ingglish-badge', { id: 'ingglish-badge' });

      messageHandler({ type: 'TRANSLATE' }, {}, vi.fn());

      // Wait a bit for translation to complete
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

      messageHandler({ type: 'TRANSLATE' }, {}, vi.fn());

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
