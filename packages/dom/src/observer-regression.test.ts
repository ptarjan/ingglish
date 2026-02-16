/**
 * @vitest-environment jsdom
 *
 * Regression test for observer double-translation bug.
 * This test verifies that translateSync is called exactly once per text node,
 * not multiple times due to characterData mutations re-triggering the observer.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import type { OutputFormat } from 'ingglish';
import type * as CoreModule from 'ingglish';

// Use vi.hoisted to create state accessible in the hoisted mock factory
const { mockState } = vi.hoisted(() => ({
  mockState: {
    count: 0,
    originalTranslateSync: null as ((text: string, format?: OutputFormat) => string) | null,
  },
}));

vi.mock('ingglish', async (importOriginal) => {
  const mod = await importOriginal<typeof CoreModule>();
  mockState.originalTranslateSync = mod.translateSync;
  return {
    ...mod,
    translateSync: (text: string, format?: OutputFormat): string => {
      mockState.count++;
      if (!mockState.originalTranslateSync) {
        throw new Error('Mock not initialized');
      }
      return mockState.originalTranslateSync(text, format);
    },
  };
});

// Import after mock is set up
import { observeAndTranslate } from './observe';

describe('observer regression: double-translation', () => {
  // Dictionary is pre-loaded in vitest.setup.ts

  afterEach(() => {
    document.body.innerHTML = '';
    mockState.count = 0;
  });

  it('should call translateSync exactly once per text node, not multiple times', async () => {
    const stop = observeAndTranslate(document.body);

    const p = document.createElement('p');
    p.textContent = 'Hello';
    document.body.appendChild(p);

    // Wait long enough for any potential double-translation
    await new Promise((resolve) => setTimeout(resolve, 50));

    stop();

    // Should be called exactly once for this text node
    // Before the fix, it was called twice due to characterData mutation re-triggering
    expect(mockState.count).toBe(1);
  });

  it('should call translateSync once per text node when adding multiple nodes', async () => {
    const stop = observeAndTranslate(document.body);

    const p1 = document.createElement('p');
    p1.textContent = 'Hello';
    document.body.appendChild(p1);

    const p2 = document.createElement('p');
    p2.textContent = 'World';
    document.body.appendChild(p2);

    // Wait long enough for any potential double-translation
    await new Promise((resolve) => setTimeout(resolve, 50));

    stop();

    // Should be called exactly twice - once for each text node
    expect(mockState.count).toBe(2);
  });
});
