/**
 * @vitest-environment jsdom
 */

import { renderHook, type RenderHookResult } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSpeech } from './useSpeech';

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

type Speech = ReturnType<typeof useSpeech>;
type SpeechHook = RenderHookResult<Speech, unknown>;

// Mock SpeechSynthesisUtterance
class MockUtterance {
  onboundary: ((event: { charIndex: number; name: string }) => void) | null = null;
  onend: (() => void) | null = null;
  text = '';
  private errorListeners: (() => void)[] = [];
  constructor(text: string) {
    this.text = text;
  }
  addEventListener(event: string, handler: () => void): void {
    if (event === 'error') {
      this.errorListeners.push(handler);
    }
  }
  triggerError(): void {
    for (const handler of this.errorListeners) {
      handler();
    }
  }
}

function createMockSynthesis() {
  return {
    addEventListener: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [{ lang: 'en-US', name: 'Microsoft David' }]),
    pause: vi.fn(),
    removeEventListener: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn((utterance: MockUtterance) => {
      // Auto-complete boundary probe utterances (volume=0)
      if ((utterance as unknown as { volume: number }).volume === 0) {
        utterance.onboundary?.({ charIndex: 0, name: 'word' });
        utterance.onend?.();
      }
    }),
    speaking: false,
  };
}

/** Get the real (non-probe) utterance from mock speak calls. */
function getRealUtterance(mockSpeak: ReturnType<typeof vi.fn>): MockUtterance {
  // Skip probe utterances (volume=0) — return the last call
  const calls = mockSpeak.mock.calls as [MockUtterance][];
  for (let i = calls.length - 1; i >= 0; i--) {
    if ((calls[i]![0] as unknown as { volume: number }).volume !== 0) {
      return calls[i]![0];
    }
  }
  return calls.at(-1)![0];
}

describe('useSpeech', () => {
  let mockSynthesis: ReturnType<typeof createMockSynthesis>;

  beforeEach(() => {
    mockSynthesis = createMockSynthesis();
    vi.stubGlobal('speechSynthesis', mockSynthesis);
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns supported=true when speechSynthesis is available', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    const supported = result.current[3];
    expect(supported).toBe(true);
  });

  it('returns supported=false when speechSynthesis is unavailable', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    const supported = result.current[3];
    expect(supported).toBe(false);
  });

  it('speak() cancels current speech and starts new utterance', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    act(() => {
      result.current[1]('hello world');
    });

    expect(mockSynthesis.cancel).toHaveBeenCalled();
    expect(mockSynthesis.speak).toHaveBeenCalledWith(expect.any(MockUtterance));
    const utterance = getRealUtterance(mockSynthesis.speak);
    expect(utterance.text).toBe('hello world');
  });

  it('sets speaking=true when speak is called', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    expect(result.current[0]).toBe(false);

    act(() => {
      result.current[1]('test');
    });
    expect(result.current[0]).toBe(true);
  });

  it('resets speaking=false on utterance end', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });
    expect(result.current[0]).toBe(true);

    // Simulate the utterance ending
    const utterance = getRealUtterance(mockSynthesis.speak);
    act(() => {
      utterance.onend?.();
      vi.advanceTimersByTime(50);
    });
    expect(result.current[0]).toBe(false);
  });

  it('resets speaking=false on utterance error', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    act(() => {
      utterance.triggerError();
    });
    expect(result.current[0]).toBe(false);
  });

  it('stop() cancels speech and resets speaking', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });
    expect(result.current[0]).toBe(true);

    act(() => {
      result.current[2](); // stop()
    });
    expect(mockSynthesis.cancel).toHaveBeenCalledTimes(2); // once from speak, once from stop
    expect(result.current[0]).toBe(false);
  });

  it('cancels speech on unmount', () => {
    const { result, unmount } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });

    mockSynthesis.cancel.mockClear();
    unmount();
    expect(mockSynthesis.cancel).toHaveBeenCalled();
  });

  it('speak is a no-op when unsupported', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });
    expect(result.current[0]).toBe(false);
  });

  it('stop is a no-op when unsupported', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    // Should not throw
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe(false);
  });

  it('sets up Chrome workaround interval while speaking', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });

    // Advance 10s — should trigger pause/resume
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(mockSynthesis.pause).toHaveBeenCalled();
    expect(mockSynthesis.resume).toHaveBeenCalled();
  });

  it('clears Chrome workaround interval on stop', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });

    mockSynthesis.pause.mockClear();
    mockSynthesis.resume.mockClear();

    act(() => {
      result.current[2](); // stop
    });

    // Advance past interval — should NOT trigger pause/resume
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(mockSynthesis.pause).not.toHaveBeenCalled();
    expect(mockSynthesis.resume).not.toHaveBeenCalled();
  });

  it('returns stable function references across renders', () => {
    const { rerender, result } = renderHook(() => useSpeech()) as SpeechHook;
    const [, speak1, stop1] = result.current;
    rerender();
    const [, speak2, stop2] = result.current;
    expect(speak1).toBe(speak2);
    expect(stop1).toBe(stop2);
  });

  it('returns spokenRange=null initially', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    expect(result.current[4]).toBeNull();
  });

  it('advances spokenRange cumulatively on boundary events', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });
    expect(result.current[4]).toBeNull();

    const utterance = getRealUtterance(mockSynthesis.speak);
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    act(() => {
      utterance.onboundary?.({ charIndex: 6, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);
  });

  it('skips punctuation-only segments when computing word index', () => {
    // "well — actually" has an em dash that is a separate non-whitespace segment
    // but should NOT count as a word (no letters), matching OverlayTextarea behavior
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('well \u2014 actually');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // "well" at charIndex 0 → word 0
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // "actually" at charIndex 7 → word 1 (not 2, because "—" was skipped)
    act(() => {
      utterance.onboundary?.({ charIndex: 7, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);
  });

  it('resets spokenRange on stop', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    act(() => {
      utterance.onboundary?.({ charIndex: 6, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);

    act(() => {
      result.current[2](); // stop
    });
    expect(result.current[4]).toBeNull();
  });

  it('maps charIndex to correct word when synthesizer splits contractions', () => {
    // "don't stop" — synthesizer may fire boundaries for "don", "'t", "stop"
    // but visually there are only 2 words: "don't" (index 0) and "stop" (index 1)
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]("don't stop");
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // First boundary: "don" at charIndex 0 → word 0
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // Second boundary: "'t" at charIndex 3 → still word 0 (same whitespace token)
    act(() => {
      utterance.onboundary?.({ charIndex: 3, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // Third boundary: "stop" at charIndex 6 → word 1
    act(() => {
      utterance.onboundary?.({ charIndex: 6, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);
  });

  it('falls back to counter when charIndex is always 0 (Windows TTS)', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('one two three four five');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // First 3 events: charIndex=0 — still uses charIndex (could be sub-word splits)
    for (let i = 0; i < 3; i++) {
      act(() => {
        utterance.onboundary?.({ charIndex: 0, name: 'word' });
      });
      expect(result.current[4]).toEqual([0, 0]);
    }

    // 4th event: charIndex=0 still — fallback kicks in, counter=3
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 3]);

    // 5th event: stays in fallback mode, counter=4
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 4]);
  });

  it('does not fall back when charIndex advances after initial zeros', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('compound word test');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // Two boundaries at charIndex=0 (sub-word split of first word)
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    // Not enough events to trigger fallback yet (need 4+), charIndex=0 → word 0
    expect(result.current[4]).toEqual([0, 0]);

    // Third boundary advances — charIndex works, no fallback
    act(() => {
      utterance.onboundary?.({ charIndex: 9, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);
  });

  it('counts numbers as words for highlighting', () => {
    // "I have 42 cats" — "42" should be word index 2, "cats" should be 3
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('I have 42 cats');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // "I" at charIndex 0 → word 0
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // "have" at charIndex 2 → word 1
    act(() => {
      utterance.onboundary?.({ charIndex: 2, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);

    // "42" at charIndex 7 → word 2
    act(() => {
      utterance.onboundary?.({ charIndex: 7, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 2]);

    // "cats" at charIndex 10 → word 3
    act(() => {
      utterance.onboundary?.({ charIndex: 10, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 3]);
  });

  it('highlights all words on end then clears after delay', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // Only first word got a boundary event
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // On end, all words are highlighted immediately
    act(() => {
      utterance.onend?.();
    });
    expect(result.current[4]).toEqual([0, 1]);
    expect(result.current[0]).toBe(true); // still speaking briefly

    // After 50ms delay, everything clears
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current[4]).toBeNull();
    expect(result.current[0]).toBe(false);
  });

  it('maps CJK charIndex correctly with spaced text', () => {
    // "满 纸 荒 唐 言" — TTS receives original text (with spaces)
    // wordStarts: [0, 2, 4, 6, 8] (position of each character in spaced text)
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('满 纸 荒 唐 言');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    expect(utterance.text).toBe('满 纸 荒 唐 言');

    // "满" at charIndex 0 → word 0
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // "纸" at charIndex 2 → word 1
    act(() => {
      utterance.onboundary?.({ charIndex: 2, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);

    // "荒唐" compound at charIndex 4 → word 2
    act(() => {
      utterance.onboundary?.({ charIndex: 4, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 2]);

    // "言" at charIndex 8 → word 4 (cumulative from 0)
    act(() => {
      utterance.onboundary?.({ charIndex: 8, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 4]);
  });

  it('uses charLength to expand range for compound words', () => {
    // When charLength is available, the range covers the full compound.
    // charLength counts non-whitespace chars — for spaced CJK like "荒 唐",
    // cl=2 means 2 characters spanning positions 4-6 (skipping the space).
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('满 纸 荒 唐 言');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    act(() => {
      utterance.onboundary?.({ charIndex: 2, name: 'word' });
    });
    // "荒唐" compound with charLength=2 at charIndex 4
    act(() => {
      utterance.onboundary?.({ charIndex: 4, charLength: 2, name: 'word' } as unknown as {
        charIndex: number;
        name: string;
      });
    });
    // cl=2 → walks text: pos 4 (荒), skip space at 5, pos 6 (唐) → words 2-3
    expect(result.current[4]).toEqual([0, 3]);

    // "言" at charIndex 8 → cumulative [0, 4]
    act(() => {
      utterance.onboundary?.({ charIndex: 8, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 4]);
  });

  it('detects spaceless CJK mapping via unique charIndex match', () => {
    // Japanese: "国境 の 長い トンネル を 抜ける"
    // spacedWordStarts: [0, 3, 5, 8, 13, 15]
    // spacelessWordStarts: [0, 2, 3, 5, 9, 10]
    // charIndex=2 is in spaceless set but NOT spaced set → locks spaceless
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('国境 の 長い トンネル を 抜ける');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // charIndex=0: both agree on word 0
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // charIndex=2: unique to spaceless set → detect spaceless, word 1
    act(() => {
      utterance.onboundary?.({ charIndex: 2, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);

    // charIndex=3: spaceless word 2 (長い)
    act(() => {
      utterance.onboundary?.({ charIndex: 3, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 2]);

    // charIndex=5: spaceless word 3 (トンネル)
    act(() => {
      utterance.onboundary?.({ charIndex: 5, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 3]);

    // charIndex=9: spaceless word 4 (を)
    act(() => {
      utterance.onboundary?.({ charIndex: 9, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 4]);

    // charIndex=10: spaceless word 5 (抜ける)
    act(() => {
      utterance.onboundary?.({ charIndex: 10, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 5]);
  });

  it('uses spaced default before detection for CJK with shared positions', () => {
    // Japanese: "国境 の 長い"
    // spacedWordStarts: [0, 3, 5], spacelessWordStarts: [0, 2, 3]
    // charIndex=1 (sub-word split) is in neither set → no detection
    // charIndex=2 is unique to spaceless → detection triggers
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('国境 の 長い');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // charIndex=1: not in either set (sub-word split) → no detection, spaced default
    act(() => {
      utterance.onboundary?.({ charIndex: 1, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]); // still word 0 in spaced

    // charIndex=2: unique to spaceless → detect, word 1
    act(() => {
      utterance.onboundary?.({ charIndex: 2, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);

    // charIndex=3: spaceless word 2
    act(() => {
      utterance.onboundary?.({ charIndex: 3, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 2]);
  });

  it('uses spaced mapping for CJK when TTS preserves spaces', () => {
    // Chinese: "满 纸 荒 唐 言"
    // spacedWordStarts: [0, 2, 4, 6, 8]
    // spacelessWordStarts: [0, 1, 2, 3, 4]
    // charIndex=2: in spaced (yes, word 纸) and spaceless (yes, word 荒) → no detection
    // charIndex=4: in spaced (yes) and spaceless (yes) → no detection
    // Without detection, spaced default gives correct results
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('满 纸 荒 唐 言');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 0]);

    // charIndex=2: spaced default → word 1
    act(() => {
      utterance.onboundary?.({ charIndex: 2, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 1]);

    // charIndex=4: spaced default → word 2
    act(() => {
      utterance.onboundary?.({ charIndex: 4, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 2]);

    // charIndex=8: spaced default → word 4 (cumulative from 0)
    act(() => {
      utterance.onboundary?.({ charIndex: 8, name: 'word' });
    });
    expect(result.current[4]).toEqual([0, 4]);
  });

  it('does not set explicit voice for languages without confirmed boundary support', () => {
    // Add French voice but boundary probe will fail (no onboundary in mock for fr)
    mockSynthesis.getVoices.mockReturnValue([
      { lang: 'en-US', name: 'Microsoft David' },
      { lang: 'fr-FR', name: 'Microsoft Hortense' },
    ]);
    // Probes: en fires boundary+end (mock auto-completes), fr also auto-completes
    // but since both fire boundary, both get marked as supported in this mock.
    // Override: make fr probe NOT fire boundary by customizing speak behavior.
    const originalSpeak = mockSynthesis.speak.getMockImplementation()!;
    mockSynthesis.speak.mockImplementation((utterance: MockUtterance) => {
      const u = utterance as unknown as {
        lang: string;
        voice: null | { name: string };
        volume: number;
      };
      if (u.volume === 0 && u.voice?.name === 'Microsoft Hortense') {
        // French probe: fire onend without onboundary (simulating no boundary support)
        utterance.onend?.();
        return;
      }
      originalSpeak(utterance);
    });

    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    // Trigger voiceschanged to re-probe
    const voicesChangedHandler = mockSynthesis.addEventListener.mock.calls.find(
      (c: unknown[]) => c[0] === 'voiceschanged'
    )?.[1] as (() => void) | undefined;
    if (voicesChangedHandler) {
      act(() => {
        voicesChangedHandler();
      });
    }

    // Speak French text
    act(() => {
      result.current[1]('bonjour le monde', 'fr');
    });

    const utterance = getRealUtterance(mockSynthesis.speak);
    // lang should be set but voice should NOT be explicitly set
    expect((utterance as unknown as { lang: string }).lang).toBe('fr');
    expect((utterance as unknown as { voice: unknown }).voice).toBeUndefined();
  });
});
