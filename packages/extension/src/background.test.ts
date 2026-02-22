import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ingglish to avoid slow dictionary loading
vi.mock('ingglish', () => ({
  translate: vi.fn().mockResolvedValue('mocked'),
  translateSync: vi.fn((text: string, format: string) => {
    // Return format-specific translations so tests can verify format switching
    const prefix = format === 'ipa' ? 'ipa' : 'ing';
    return text
      .split(/\s+/)
      .map((w) => `${prefix}-${w}`)
      .join(' ');
  }),
}));

// Suppress console.error and console.log during tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

// Type definitions for chrome API mock
type QueryCallback = (tabs: { id?: number }[]) => void;
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
    get: vi.fn().mockResolvedValue({ url: 'https://example.com' }),
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
  permissions: {
    contains: vi.fn().mockResolvedValue(true),
    request: vi.fn().mockResolvedValue(true),
  },
  action: {
    setIcon: vi.fn().mockResolvedValue(),
  },
  scripting: {
    executeScript: vi.fn(),
    insertCSS: vi.fn(),
  },
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({ outputFormat: 'ingglish' }),
      set: vi.fn().mockResolvedValue(),
    },
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(),
    },
  },
  commands: {
    onCommand: {
      addListener: vi.fn(),
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
  let tabUpdatedHandler: (tabId: number, changeInfo: { status?: string; url?: string }) => void;
  let commandHandler: (command: string) => void;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockChrome.runtime.lastError = null;
    mockChrome.scripting.insertCSS.mockResolvedValue();
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
    mockChrome.commands.onCommand.addListener.mockImplementation(
      (handler: typeof commandHandler) => {
        commandHandler = handler;
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
          files: ['content-script.global.js'],
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
    it('re-injects script when enabled tab starts loading with new URL', async () => {
      // Enable translation for tab
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 333 }]);
      });

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Wait for initial injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(1);
      });

      // Simulate page navigation starting with URL change
      tabUpdatedHandler(333, { status: 'loading', url: 'https://example.com/new-page' });

      // Wait for re-injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(2);
      });
    });

    it('re-injects script when enabled tab is refreshed (no URL change)', async () => {
      // Enable translation for tab
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 555 }]);
      });

      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());

      // Wait for initial injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(1);
      });

      // Simulate page refresh (loading status without URL change)
      tabUpdatedHandler(555, { status: 'loading' });

      // Wait for re-injection
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(2);
      });
    });

    it('does not inject script for disabled tabs', async () => {
      // Simulate page load on a tab that was never enabled
      tabUpdatedHandler(444, { status: 'loading', url: 'https://example.com' });

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

  describe('translation caching', () => {
    it('exports cacheStats for monitoring', async () => {
      // Access cacheStats through the module
      const { cacheStats } = await import('./background');

      expect(cacheStats).toBeDefined();
      expect(typeof cacheStats.hits).toBe('number');
      expect(typeof cacheStats.misses).toBe('number');
      expect(typeof cacheStats.size).toBe('function');
      expect(typeof cacheStats.clear).toBe('function');
    });

    it('cache clear resets all stats', async () => {
      const { cacheStats } = await import('./background');

      // Set some values and clear
      cacheStats.clear();
      expect(cacheStats.hits).toBe(0);
      expect(cacheStats.misses).toBe(0);
      expect(cacheStats.size()).toBe(0);
    });
  });

  describe('TRANSLATE_WORDS message', () => {
    it('translates words and returns translations', async () => {
      const sendResponse = vi.fn();

      messageHandler(
        { type: 'TRANSLATE_WORDS', words: ['hello', 'world'], format: 'ingglish' } as {
          type: string;
        },
        {},
        sendResponse
      );

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalled();
        const response = sendResponse.mock.calls[0][0] as {
          translations: Record<string, string>;
        };
        expect(response.translations).toBeDefined();
        expect(response.translations.hello).toBeDefined();
        expect(response.translations.world).toBeDefined();
      });
    });

    it('returns same translations when switching format and back', async () => {
      // Translate words to Ingglish
      const ingglishResponse = vi.fn();
      messageHandler(
        { type: 'TRANSLATE_WORDS', words: ['hello', 'world', 'the'], format: 'ingglish' } as {
          type: string;
        },
        {},
        ingglishResponse
      );

      await vi.waitFor(() => {
        expect(ingglishResponse).toHaveBeenCalled();
      });

      const ingglishTranslations = (
        ingglishResponse.mock.calls[0][0] as { translations: Record<string, string> }
      ).translations;

      // Translate same words to IPA
      const ipaResponse = vi.fn();
      messageHandler(
        { type: 'TRANSLATE_WORDS', words: ['hello', 'world', 'the'], format: 'ipa' } as {
          type: string;
        },
        {},
        ipaResponse
      );

      await vi.waitFor(() => {
        expect(ipaResponse).toHaveBeenCalled();
      });

      const ipaTranslations = (
        ipaResponse.mock.calls[0][0] as { translations: Record<string, string> }
      ).translations;

      // IPA translations should be different from Ingglish
      expect(ipaTranslations.hello).not.toBe(ingglishTranslations.hello);

      // Translate back to Ingglish
      const ingglishResponse2 = vi.fn();
      messageHandler(
        { type: 'TRANSLATE_WORDS', words: ['hello', 'world', 'the'], format: 'ingglish' } as {
          type: string;
        },
        {},
        ingglishResponse2
      );

      await vi.waitFor(() => {
        expect(ingglishResponse2).toHaveBeenCalled();
      });

      const ingglishTranslations2 = (
        ingglishResponse2.mock.calls[0][0] as { translations: Record<string, string> }
      ).translations;

      // Ingglish translations should be the same as the first time
      expect(ingglishTranslations2.hello).toBe(ingglishTranslations.hello);
      expect(ingglishTranslations2.world).toBe(ingglishTranslations.world);
      expect(ingglishTranslations2.the).toBe(ingglishTranslations.the);
    });
  });

  describe('SET_FORMAT message', () => {
    it('saves the new format and responds with it', async () => {
      const sendResponse = vi.fn();

      messageHandler({ type: 'SET_FORMAT', format: 'ipa' } as { type: string }, {}, sendResponse);

      await vi.waitFor(() => {
        expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({ outputFormat: 'ipa' });
        expect(sendResponse).toHaveBeenCalledWith({ format: 'ipa' });
      });
    });

    it('sends RETRANSLATE to all translated tabs when format changes', async () => {
      // First enable translation for two tabs
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 501 }]);
      });
      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(1);
      });

      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: 502 }]);
      });
      messageHandler({ type: 'TOGGLE' }, {}, vi.fn());
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledTimes(2);
      });

      // Mock sendMessage to track calls
      mockChrome.tabs.sendMessage.mockClear();
      mockChrome.tabs.sendMessage.mockImplementation(
        (_tabId: number, _message: object, callback: SendMessageCallback) => {
          if (callback !== undefined) {
            callback({ success: true });
          }
        }
      );

      // Change format to IPA
      const sendResponse = vi.fn();
      messageHandler({ type: 'SET_FORMAT', format: 'ipa' } as { type: string }, {}, sendResponse);

      await vi.waitFor(() => {
        // Should send RETRANSLATE to both tabs
        expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
          501,
          { type: 'RETRANSLATE', format: 'ipa' },
          expect.any(Function)
        );
        expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
          502,
          { type: 'RETRANSLATE', format: 'ipa' },
          expect.any(Function)
        );
      });
    });

    it('does not send RETRANSLATE when no tabs are translated', async () => {
      mockChrome.tabs.sendMessage.mockClear();

      const sendResponse = vi.fn();
      messageHandler({ type: 'SET_FORMAT', format: 'ipa' } as { type: string }, {}, sendResponse);

      await vi.waitFor(() => {
        expect(sendResponse).toHaveBeenCalledWith({ format: 'ipa' });
      });

      // No tabs should receive RETRANSLATE
      expect(mockChrome.tabs.sendMessage).not.toHaveBeenCalledWith(
        expect.anything(),
        { type: 'RETRANSLATE', format: 'ipa' },
        expect.any(Function)
      );
    });
  });

  describe('keyboard shortcut (toggle-translation command)', () => {
    it('enables translation when triggered on untranslated tab', async () => {
      const tabId = 789;
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: tabId }]);
      });
      mockChrome.scripting.executeScript.mockResolvedValue([]);
      mockChrome.scripting.insertCSS.mockResolvedValue();

      // Trigger keyboard shortcut
      commandHandler('toggle-translation');

      // Should inject translator script
      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalledWith(
          expect.objectContaining({
            target: { tabId },
          })
        );
      });

      // Should update icon to enabled state
      await vi.waitFor(() => {
        expect(mockChrome.action.setIcon).toHaveBeenCalled();
        const iconCall = mockChrome.action.setIcon.mock.calls.find(
          (call) => (call[0] as { tabId: number }).tabId === tabId
        ) as [{ tabId: number; path: Record<number, string> }] | undefined;
        expect(iconCall).toBeDefined();
        expect(iconCall?.[0].path).toMatchObject({ 16: 'icons/icon16.png' });
      });
    });

    it('disables translation when triggered on translated tab', async () => {
      const tabId = 790;
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([{ id: tabId }]);
      });
      mockChrome.scripting.executeScript.mockResolvedValue([]);
      mockChrome.scripting.insertCSS.mockResolvedValue();

      // First enable translation via keyboard shortcut
      commandHandler('toggle-translation');

      await vi.waitFor(() => {
        expect(mockChrome.scripting.executeScript).toHaveBeenCalled();
      });

      // Clear mocks to track the disable action
      mockChrome.scripting.executeScript.mockClear();
      mockChrome.action.setIcon.mockClear();
      mockChrome.tabs.sendMessage.mockImplementation(
        (_tabId: number, _message: object, callback: SendMessageCallback) => {
          if (callback !== undefined) {
            callback({ success: true });
          }
        }
      );

      // Trigger keyboard shortcut again to disable
      commandHandler('toggle-translation');

      // Should send RESTORE message to disable translation
      await vi.waitFor(() => {
        expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
          tabId,
          { type: 'RESTORE' },
          expect.any(Function)
        );
      });

      // Should update icon to disabled state
      await vi.waitFor(() => {
        expect(mockChrome.action.setIcon).toHaveBeenCalled();
        const iconCall = mockChrome.action.setIcon.mock.calls.find(
          (call) => (call[0] as { tabId: number }).tabId === tabId
        ) as [{ tabId: number; path: Record<number, string> }] | undefined;
        expect(iconCall).toBeDefined();
        expect(iconCall?.[0].path).toMatchObject({ 16: 'icons/icon16-off.png' });
      });
    });

    it('ignores unrecognized commands', async () => {
      mockChrome.tabs.query.mockClear();
      mockChrome.scripting.executeScript.mockClear();

      // Trigger an unrecognized command
      commandHandler('some-other-command');

      // Give it a moment
      await new Promise((r) => setTimeout(r, 10));

      // Should not query tabs or inject scripts
      expect(mockChrome.tabs.query).not.toHaveBeenCalled();
      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    it('does nothing when no active tab', async () => {
      mockChrome.tabs.query.mockImplementation((_query: object, callback: QueryCallback) => {
        callback([]); // No tabs
      });
      mockChrome.scripting.executeScript.mockClear();

      commandHandler('toggle-translation');

      // Give it a moment
      await new Promise((r) => setTimeout(r, 10));

      // Should not inject scripts
      expect(mockChrome.scripting.executeScript).not.toHaveBeenCalled();
    });
  });
});
