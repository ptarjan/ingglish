import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown timer hook for timed game rounds.
 * Ticks every second, pauses when `paused` is true,
 * and calls `onExpire` when reaching 0.
 */
export function useCountdown(options: { onExpire: () => void; paused: boolean; seconds: number }): {
  reset: (seconds: number) => void;
  timeLeft: number;
} {
  const [timeLeft, setTimeLeft] = useState(options.seconds);
  const onExpireRef = useRef(options.onExpire);
  onExpireRef.current = options.onExpire;

  // Tick every second while not paused and time remains
  useEffect(() => {
    if (options.paused || timeLeft <= 0) {
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 0) {
          return 0;
        }
        const next = t - 1;
        if (next <= 0) {
          onExpireRef.current();
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [options.paused, timeLeft]);

  const reset = useCallback((seconds: number) => {
    setTimeLeft(seconds);
  }, []);

  return { reset, timeLeft };
}
