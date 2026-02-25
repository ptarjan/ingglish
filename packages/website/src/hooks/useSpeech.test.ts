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
    getVoices: vi.fn(() => [{ lang: 'en-US' }]),
    pause: vi.fn(),
    removeEventListener: vi.fn(),
    resume: vi.fn(),
    speak: vi.fn(),
    speaking: false,
  };
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
    const utterance = mockSynthesis.speak.mock.calls[0]![0] as MockUtterance;
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
    const utterance = mockSynthesis.speak.mock.calls[0]![0] as MockUtterance;
    act(() => {
      utterance.onend?.();
    });
    expect(result.current[0]).toBe(false);
  });

  it('resets speaking=false on utterance error', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('test');
    });

    const utterance = mockSynthesis.speak.mock.calls[0]![0] as MockUtterance;
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

  it('returns wordCount=null initially', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    expect(result.current[4]).toBeNull();
  });

  it('advances wordCount sequentially on boundary events', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });
    // wordCount is null until first boundary event
    expect(result.current[4]).toBeNull();

    const utterance = mockSynthesis.speak.mock.calls[0]![0] as MockUtterance;
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toBe(0);

    act(() => {
      utterance.onboundary?.({ charIndex: 6, name: 'word' });
    });
    expect(result.current[4]).toBe(1);
  });

  it('resets wordCount on stop', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });

    const utterance = mockSynthesis.speak.mock.calls[0]![0] as MockUtterance;
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    act(() => {
      utterance.onboundary?.({ charIndex: 6, name: 'word' });
    });
    expect(result.current[4]).toBe(1);

    act(() => {
      result.current[2](); // stop
    });
    expect(result.current[4]).toBeNull();
  });

  it('resets wordCount on utterance end', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });

    const utterance = mockSynthesis.speak.mock.calls[0]![0] as MockUtterance;
    act(() => {
      utterance.onboundary?.({ charIndex: 0, name: 'word' });
    });
    expect(result.current[4]).toBe(0);

    act(() => {
      utterance.onend?.();
    });
    expect(result.current[4]).toBeNull();
  });
});
