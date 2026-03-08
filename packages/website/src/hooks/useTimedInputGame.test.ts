/**
 * @vitest-environment jsdom
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TimedInputGameConfig } from './useTimedInputGame';
import { useTimedInputGame } from './useTimedInputGame';

// --- Mocks ---

vi.mock('./useGameSpeech', () => ({
  useGameSpeech: () => ({
    handleMuteKey: vi.fn(() => false),
    muted: true,
    speak: vi.fn(),
    speaking: false,
    stop: vi.fn(),
    supported: false,
    toggleMute: vi.fn(),
  }),
}));

vi.mock('./useAutoFocus', () => ({
  useAutoFocus: vi.fn(),
}));

vi.mock('../games/useGameShare', () => ({
  useGameShare: () => ({
    copied: false,
    handleSave: vi.fn(),
    handleShare: vi.fn(),
    shareRef: { current: null },
    showCopied: vi.fn(),
  }),
}));

vi.mock('../challenge/render-score-card', () => ({
  renderScoreCard: () => document.createElement('canvas'),
}));

// Capture onExpire so tests can trigger timer expiry
let capturedOnExpire: (() => void) | undefined;
const mockReset = vi.fn();

vi.mock('../games/useCountdown', () => ({
  useCountdown: ({ onExpire }: { onExpire: () => void }) => {
    capturedOnExpire = onExpire;
    return { reset: mockReset, timeLeft: 10 };
  },
}));

// --- Test helpers ---

type TestFeedback = 'correct' | 'wrong';

interface TestItem {
  text: string;
  tier: 1 | 2 | 3;
}

const items: TestItem[] = [
  { text: 'apple', tier: 1 },
  { text: 'banana', tier: 2 },
  { text: 'cherry', tier: 3 },
];

function makeConfig(
  overrides?: Partial<TimedInputGameConfig<TestItem, TestFeedback>>
): TimedInputGameConfig<TestItem, TestFeedback> {
  return {
    getScoreValue: (f) => (f === 'correct' ? 1 : 0),
    getTier: (item) => item.tier,
    pickItems: () => [...items],
    scoreCard: { filename: 'test.png', footerUrl: 'test.com', gameTitle: 'TEST' },
    scoreInput: (input, item) => (input === item.text ? 'correct' : 'wrong'),
    scoreOnExpiry: () => 'wrong',
    tierTimeLimits: { 1: 30, 2: 20, 3: 10 },
    ...overrides,
  };
}

beforeAll(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
});

// --- Tests ---

describe('useTimedInputGame', () => {
  beforeEach(() => {
    capturedOnExpire = undefined;
    mockReset.mockClear();
    vi.useFakeTimers();
  });

  it('starts in intro phase with no items', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));
    expect(result.current.phase).toBe('intro');
    expect(result.current.items).toEqual([]);
    expect(result.current.round).toBe(0);
    expect(result.current.currentItem).toBeUndefined();
  });

  it('startGame transitions to playing phase', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(42);
    });

    expect(result.current.phase).toBe('playing');
    expect(result.current.items).toHaveLength(3);
    expect(result.current.currentItem).toEqual(items[0]);
    expect(result.current.seed).toBe(42);
    expect(mockReset).toHaveBeenCalledWith(30); // tier 1 time limit
  });

  it('handleSubmit scores input and sets feedback', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(1);
    });
    act(() => {
      result.current.setInput('apple');
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.currentFeedback).toBe('correct');
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]!.feedback).toBe('correct');
  });

  it('handleSubmit is a no-op with empty input', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(1);
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.currentFeedback).toBeNull();
    expect(result.current.results).toHaveLength(0);
  });

  it('handleNext advances to the next round', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(1);
    });
    act(() => {
      result.current.setInput('apple');
    });
    act(() => {
      result.current.handleSubmit();
    });
    act(() => {
      result.current.handleNext();
    });

    expect(result.current.round).toBe(1);
    expect(result.current.currentItem).toEqual(items[1]);
    expect(result.current.currentFeedback).toBeNull();
    expect(result.current.input).toBe('');
    expect(mockReset).toHaveBeenLastCalledWith(20); // tier 2 time limit
  });

  it('handleNext transitions to results on last round', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(1);
    });

    // Play through all 3 rounds
    for (const item of items) {
      act(() => {
        result.current.setInput(item.text);
      });
      act(() => {
        result.current.handleSubmit();
      });
      act(() => {
        result.current.handleNext();
      });
    }

    expect(result.current.phase).toBe('results');
    expect(result.current.results).toHaveLength(3);
  });

  it('calculates overallPct from results', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(1);
    });

    // Round 1: correct
    act(() => {
      result.current.setInput('apple');
    });
    act(() => {
      result.current.handleSubmit();
    });
    act(() => {
      result.current.handleNext();
    });

    // Round 2: wrong
    act(() => {
      result.current.setInput('wrong');
    });
    act(() => {
      result.current.handleSubmit();
    });
    act(() => {
      result.current.handleNext();
    });

    // Round 3: correct
    act(() => {
      result.current.setInput('cherry');
    });
    act(() => {
      result.current.handleSubmit();
    });

    // 2 correct out of 3 = 67%
    expect(result.current.overallPct).toBe(67);
  });

  it('timer expiry calls scoreOnExpiry', () => {
    const scoreOnExpiry = vi.fn(() => 'wrong' as const);
    const { result } = renderHook(() => useTimedInputGame(makeConfig({ scoreOnExpiry })));

    act(() => {
      result.current.startGame(1);
    });

    expect(capturedOnExpire).toBeDefined();
    act(() => {
      capturedOnExpire!();
    });

    expect(scoreOnExpiry).toHaveBeenCalledWith('', items[0]);
    expect(result.current.currentFeedback).toBe('wrong');
    expect(result.current.results).toHaveLength(1);
  });

  it('passes pickItems the seed', () => {
    const pickItems = vi.fn(() => [...items]);
    const { result } = renderHook(() => useTimedInputGame(makeConfig({ pickItems })));

    act(() => {
      result.current.startGame(123);
    });

    expect(pickItems).toHaveBeenCalledWith(123);
  });

  it('handleKeyDown Enter submits when no feedback', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(1);
    });
    act(() => {
      result.current.setInput('apple');
    });
    act(() => {
      result.current.handleKeyDown({ key: 'Enter' } as React.KeyboardEvent);
    });

    expect(result.current.currentFeedback).toBe('correct');
  });

  it('handleKeyDown Enter advances when feedback present', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    act(() => {
      result.current.startGame(1);
    });
    act(() => {
      result.current.setInput('apple');
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.round).toBe(0);

    act(() => {
      result.current.handleKeyDown({ key: 'Enter' } as React.KeyboardEvent);
    });

    expect(result.current.round).toBe(1);
  });

  it('resets state when startGame is called again', () => {
    const { result } = renderHook(() => useTimedInputGame(makeConfig()));

    // Play one round
    act(() => {
      result.current.startGame(1);
    });
    act(() => {
      result.current.setInput('apple');
    });
    act(() => {
      result.current.handleSubmit();
    });

    expect(result.current.results).toHaveLength(1);

    // Restart
    act(() => {
      result.current.startGame(2);
    });

    expect(result.current.phase).toBe('playing');
    expect(result.current.round).toBe(0);
    expect(result.current.results).toHaveLength(0);
    expect(result.current.currentFeedback).toBeNull();
    expect(result.current.input).toBe('');
  });
});
