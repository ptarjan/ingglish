/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountdown } from './useCountdown';

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with the given seconds', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ onExpire, paused: false, seconds: 30 }));
    expect(result.current.timeLeft).toBe(30);
  });

  it('ticks down every second when not paused', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ onExpire, paused: false, seconds: 10 }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeLeft).toBe(7);
  });

  it('does not tick when paused', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ onExpire, paused: true, seconds: 10 }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeLeft).toBe(10);
  });

  it('pauses and resumes correctly', () => {
    const onExpire = vi.fn();
    const { rerender, result } = renderHook(
      ({ paused }) => useCountdown({ onExpire, paused, seconds: 10 }),
      { initialProps: { paused: false } }
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.timeLeft).toBe(8);

    // Pause
    rerender({ paused: true });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timeLeft).toBe(8);

    // Resume
    rerender({ paused: false });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeLeft).toBe(5);
  });

  it('calls onExpire when reaching 0', () => {
    const onExpire = vi.fn();
    renderHook(() => useCountdown({ onExpire, paused: false, seconds: 3 }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('does not tick below 0', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ onExpire, paused: false, seconds: 2 }));

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timeLeft).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('reset() sets a new countdown value', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown({ onExpire, paused: false, seconds: 10 }));

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.timeLeft).toBe(7);

    act(() => {
      result.current.reset(20);
    });
    expect(result.current.timeLeft).toBe(20);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.timeLeft).toBe(15);
  });

  it('uses latest onExpire callback (no stale closure)', () => {
    const onExpire1 = vi.fn();
    const onExpire2 = vi.fn();

    const { rerender } = renderHook(
      ({ onExpire }) => useCountdown({ onExpire, paused: false, seconds: 3 }),
      { initialProps: { onExpire: onExpire1 } }
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Swap callback
    rerender({ onExpire: onExpire2 });

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onExpire1).not.toHaveBeenCalled();
    expect(onExpire2).toHaveBeenCalledTimes(1);
  });

  it('returns a stable reset function reference', () => {
    const onExpire = vi.fn();
    const { rerender, result } = renderHook(() =>
      useCountdown({ onExpire, paused: false, seconds: 10 })
    );
    const reset1 = result.current.reset;
    rerender();
    expect(result.current.reset).toBe(reset1);
  });
});
