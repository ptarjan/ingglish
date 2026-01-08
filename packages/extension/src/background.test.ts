import { describe, it, expect, vi, beforeEach } from 'vitest';

// Suppress console.error and console.log during tests
vi.spyOn(console, 'error').mockImplementation(() => undefined);
vi.spyOn(console, 'log').mockImplementation(() => undefined);

// Type definitions for chrome API mock
type QueryCallback = (tabs: { id?: number }[]) => void;
type StorageGetCallback = (data: { format?: string }) => void;
type StorageSetCallback = (() => void) | undefined;
type SendMessageCallback = ((response: object) => void) | undefined;

// Mock chrome API
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    lastError: null as chrome.runtime.LastError | null,
  },
  tabs: {
    query: vi.fn<(query: object, callback: QueryCallback) => undefined>(),
    reload: vi.fn(),
    sendMessage:
      vi.fn<(tabId: number, message: object, callback: SendMessageCallback) => undefined>(),
    onRemoved: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },
  action: {
    setIcon: vi.fn().mockResolvedValue(undefined),
  },
  scripting: {
    executeScript: vi.fn(),
  },
  storage: {
    sync: {
      get: vi
        .fn<(keys: string[], callback: StorageGetCallback) => undefined>()
        .mockImplementation((_keys: string[], callback: StorageGetCallback) => {
          callback({ format: 'ingglish' });
          return undefined;
        }),
      set: vi
        .fn<(data: object, callback: StorageSetCallback) => undefined>()
        .mockImplementation((_data: object, callback: StorageSetCallback) => {
          if (callback !== undefined) {
            callback();
          }
          return undefined;
        }),
    },
  },
};

// Set up global chrome mock
vi.stubGlobal('chrome', mockChrome);

describe('background script', () => {
  let messageHandler: (
    message: { type: string },
    sender: { tab?: { id?: number } },
    sendResponse: (response: unknown) => void
  ) => boolean | undefined;
  let tabRemovedHandler: (tabId: number) => void;
  let tabUpdatedHandler: (tabId: number, changeInfo: { status?: string }) => void;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
    mockChrome.scripting.executeScript.mockResolvedValue([]);

    // Capture the handlers when the module loads
    mockChrome.runtime.onMessage.addListener.mockImplementation(
      (handler: typeof messageHandler) => {
        messageHandler = handler;
      }
    );
    mockChrome.tabs.onRemoved.addListener.mockImplementation(
      (handler: typeof tabRemovedHandler) => {
        tabRemovedHandler = handler;
      }
    );
    mockChrome.tabs.onUpdated.addListener.mockImplementation(
      (handler: typeof tabUpdatedHandler) => {
        tabUpdatedHandler = handler;
      }
    );

    // Import the module to trigger handler registration
    await import('./background');
  });

  describe('GET_STATE message', () => {
    it('responds with enabled: false when tab is not translated', async () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 123 }]);
      });

      const result = messageHandler({ type: 'GET_STATE' }, {}, sendResponse);

      expect(result).toBe(true); // async response

      // Wait for async format retrieval
      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({ enabled: false, format: 'ingglish' });
      });
    });

    it('responds with enabled: false when no active tab', async () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{}]); // tab without id
      });

      messageHandler({ type: 'GET_STATE' }, {}, sendResponse);

      // Wait for async format retrieval
      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({ enabled: false, format: 'ingglish' });
      });
    });
  });

  describe('TOGGLE message - enable translation', () => {
    it('adds tab to translatedTabs and injects script', async () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 456 }]);
      });

      messageHandler({ type: 'TOGGLE' }, {}, sendResponse);

      // Wait for async operations
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith({
          target: { tabId: 456 },
          files: ['content.global.js'],
        });
      });

      expect(sendResponse).toHaveBeenCalledWith({ success: true, enabled: true });
    });

    it('reverts state when script injection fails', async () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 789 }]);
      });

      mockChrome.scripting.executeScript.mockRejectedValueOnce(new Error('Injection failed'));

      messageHandler({ type: 'TOGGLE' }, {}, sendResponse);

      // Response is sent immediately with success (optimistic)
      expect(sendResponse).toHaveBeenCalledWith({ success: true, enabled: true });

      // Wait for async injection to fail
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
      });

      // Small delay for the .then() handler to run
      await new Promise((r) => setTimeout(r, 10));

      // State should be reverted after injection fails
      const stateResponse = vi.fn();
      messageHandler({ type: 'GET_STATE' }, {}, stateResponse);
      await vi.waitFor(() => {
        expect(stateResponse).toHaveBeenCalledWith({ enabled: false, format: 'ingglish' });
      });
    });

    it('responds with error when no active tab', () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{}]); // tab without id
      });

      messageHandler({ type: 'TOGGLE' }, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'No active tab',
      });
    });
  });

  describe('TOGGLE message - disable translation', () => {
    it('removes tab from translatedTabs and sends RESTORE message', async () => {
      const sendResponse = vi.fn();

      // First enable translation for tab 111
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 111 }]);
      });

      // Mock sendMessage to call the callback
      mockChrome.tabs.sendMessage.mockImplementation(
        (_tabId: number, _message: object, callback: SendMessageCallback) => {
          if (callback !== undefined) {
            callback({});
          }
        }
      );

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Wait for injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
      });

      // Now toggle again to disable
      messageHandler({ type: 'TOGGLE' }, {}, sendResponse);

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        111,
        { type: 'RESTORE' },
        expect.any(Function)
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true, enabled: false });
    });
  });

  describe('tab cleanup', () => {
    it('removes tab from translatedTabs when tab is closed', async () => {
      // Enable translation for tab
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 222 }]);
      });

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Wait for injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
      });

      // Verify tab is tracked
      const stateResponse = vi.fn();
      messageHandler({ type: 'GET_STATE' }, {}, stateResponse);
      await vi.waitFor(() => {
        expect(stateResponse).toHaveBeenCalledWith({ enabled: true, format: 'ingglish' });
      });

      // Simulate tab close
      tabRemovedHandler(222);

      // Verify tab is no longer tracked
      const stateResponse2 = vi.fn();
      messageHandler({ type: 'GET_STATE' }, {}, stateResponse2);
      await vi.waitFor(() => {
        expect(stateResponse2).toHaveBeenCalledWith({ enabled: false, format: 'ingglish' });
      });
    });
  });

  describe('tab navigation', () => {
    it('re-injects script when enabled tab completes loading', async () => {
      // Enable translation for tab
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 333 }]);
      });

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Wait for initial injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(1);
      });

      // Simulate page navigation completing
      tabUpdatedHandler(333, { status: 'complete' });

      // Wait for re-injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(2);
      });
    });

    it('does not inject script for disabled tabs', async () => {
      // Simulate page load on a tab that was never enabled
      tabUpdatedHandler(444, { status: 'complete' });

      // Small delay
      await new Promise((r) => setTimeout(r, 10));

      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
    });
  });

  describe('unknown message types', () => {
    it('returns false for unknown message types', () => {
      const sendResponse = vi.fn();
      const result = messageHandler({ type: 'UNKNOWN' }, {}, sendResponse);

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });
  });
});
