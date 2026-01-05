import { describe, it, expect, vi, beforeEach } from 'vitest';

// Suppress console.error and console.log during tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

// Mock chrome API
const mockChrome = {
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
    lastError: null as chrome.runtime.LastError | null,
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    reload: vi.fn(),
    onRemoved: {
      addListener: vi.fn(),
    },
    onUpdated: {
      addListener: vi.fn(),
    },
  },
};

// Set up global chrome mock
vi.stubGlobal('chrome', mockChrome);

describe('background script', () => {
  let messageHandler: (
    message: { type: string },
    sender: unknown,
    sendResponse: (response: unknown) => void
  ) => boolean | undefined;
  let tabRemovedHandler: (tabId: number) => void;
  let tabUpdatedHandler: (tabId: number, changeInfo: { status?: string }) => void;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Capture the handlers when the module loads
    mockChrome.runtime.onMessage.addListener.mockImplementation((handler) => {
      messageHandler = handler;
    });
    mockChrome.tabs.onRemoved.addListener.mockImplementation((handler) => {
      tabRemovedHandler = handler;
    });
    mockChrome.tabs.onUpdated.addListener.mockImplementation((handler) => {
      tabUpdatedHandler = handler;
    });

    // Import the module to trigger handler registration
    await import('./background');
  });

  describe('GET_STATE message', () => {
    it('responds with enabled: false when tab is not translated', () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([{ id: 123 }]);
      });

      const result = messageHandler({ type: 'GET_STATE' }, {}, sendResponse);

      expect(result).toBe(true); // async response
      expect(sendResponse).toHaveBeenCalledWith({ enabled: false });
    });

    it('responds with enabled: false when no active tab', () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([{}]); // tab without id
      });

      messageHandler({ type: 'GET_STATE' }, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ enabled: false });
    });
  });

  describe('TOGGLE message - enable translation', () => {
    it('adds tab to translatedTabs and sends TRANSLATE message', () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([{ id: 456 }]);
      });

      mockChrome.tabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
        mockChrome.runtime.lastError = null;
        callback({});
      });

      messageHandler({ type: 'TOGGLE' }, {}, sendResponse);

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        456,
        { type: 'TRANSLATE' },
        expect.any(Function)
      );
      expect(sendResponse).toHaveBeenCalledWith({ success: true, enabled: true });
    });

    it('handles error when content script not available', () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([{ id: 789 }]);
      });

      mockChrome.tabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
        mockChrome.runtime.lastError = { message: 'Could not establish connection' };
        callback(undefined);
      });

      messageHandler({ type: 'TOGGLE' }, {}, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'Could not communicate with page',
      });
    });

    it('responds with error when no active tab', () => {
      const sendResponse = vi.fn();

      mockChrome.tabs.query.mockImplementation((_query, callback) => {
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
    it('removes tab from translatedTabs and reloads page', async () => {
      const sendResponse = vi.fn();

      // First enable translation for tab 111
      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([{ id: 111 }]);
      });
      mockChrome.tabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
        mockChrome.runtime.lastError = null;
        callback({});
      });

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Now toggle again to disable
      messageHandler({ type: 'TOGGLE' }, {}, sendResponse);

      expect(mockChrome.tabs.reload).toHaveBeenCalledWith(111);
      expect(sendResponse).toHaveBeenCalledWith({ success: true, enabled: false });
    });
  });

  describe('tab cleanup', () => {
    it('removes tab from translatedTabs when tab is closed', async () => {
      // Enable translation for tab
      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([{ id: 222 }]);
      });
      mockChrome.tabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
        mockChrome.runtime.lastError = null;
        callback({});
      });

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Verify tab is tracked
      const stateResponse = vi.fn();
      messageHandler({ type: 'GET_STATE' }, {}, stateResponse);
      expect(stateResponse).toHaveBeenCalledWith({ enabled: true });

      // Simulate tab close
      tabRemovedHandler(222);

      // Verify tab is no longer tracked
      const stateResponse2 = vi.fn();
      messageHandler({ type: 'GET_STATE' }, {}, stateResponse2);
      expect(stateResponse2).toHaveBeenCalledWith({ enabled: false });
    });

    it('removes tab from translatedTabs when tab navigates', async () => {
      // Enable translation for tab
      mockChrome.tabs.query.mockImplementation((_query, callback) => {
        callback([{ id: 333 }]);
      });
      mockChrome.tabs.sendMessage.mockImplementation((_tabId, _message, callback) => {
        mockChrome.runtime.lastError = null;
        callback({});
      });

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Simulate navigation
      tabUpdatedHandler(333, { status: 'loading' });

      // Verify tab is no longer tracked
      const stateResponse = vi.fn();
      messageHandler({ type: 'GET_STATE' }, {}, stateResponse);
      expect(stateResponse).toHaveBeenCalledWith({ enabled: false });
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
