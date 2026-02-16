/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { renderHook, type RenderHookResult } from '@testing-library/react';
import { useSpeech } from './useSpeech';

type Speech = ReturnType<typeof useSpeech>;
type SpeechHook = RenderHookResult<Speech, unknown>;

// Mock SpeechSynthesisUtterance
class MockUtterance {
  text = '';
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onboundary: ((event: { name: string; charIndex: number }) => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

function createMockSynthesis() {
  return {
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
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
    const [, , , supported] = result.current;
    expect(supported).toBe(true);
  });

  it('returns supported=false when speechSynthesis is unavailable', () => {
    vi.stubGlobal('speechSynthesis', undefined);
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    const [, , , supported] = result.current;
    expect(supported).toBe(false);
  });

  it('speak() cancels current speech and starts new utterance', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;
    act(() => {
      result.current[1]('hello world');
    });

    expect(mockSynthesis.cancel).toHaveBeenCalled();
    expect(mockSynthesis.speak).toHaveBeenCalledWith(expect.any(MockUtterance));
    const utterance = mockSynthesis.speak.mock.calls[0][0] as MockUtterance;
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
    const utterance = mockSynthesis.speak.mock.calls[0][0] as MockUtterance;
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

    const utterance = mockSynthesis.speak.mock.calls[0][0] as MockUtterance;
    act(() => {
      utterance.onerror?.();
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
    const { result, rerender } = renderHook(() => useSpeech()) as SpeechHook;
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

  it('counts word boundaries sequentially', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });

    const utterance = mockSynthesis.speak.mock.calls[0][0] as MockUtterance;
    act(() => {
      utterance.onboundary?.({ name: 'word', charIndex: 0 });
    });
    expect(result.current[4]).toBe(0);

    act(() => {
      utterance.onboundary?.({ name: 'word', charIndex: 6 });
    });
    expect(result.current[4]).toBe(1);
  });

  it('resets wordCount on stop', () => {
    const { result } = renderHook(() => useSpeech()) as SpeechHook;

    act(() => {
      result.current[1]('hello world');
    });

    const utterance = mockSynthesis.speak.mock.calls[0][0] as MockUtterance;
    act(() => {
      utterance.onboundary?.({ name: 'word', charIndex: 6 });
    });
    expect(result.current[4]).toBe(0);

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

    const utterance = mockSynthesis.speak.mock.calls[0][0] as MockUtterance;
    act(() => {
      utterance.onboundary?.({ name: 'word', charIndex: 0 });
    });
    expect(result.current[4]).toBe(0);

    act(() => {
      utterance.onend?.();
    });
    expect(result.current[4]).toBeNull();
  });
});
