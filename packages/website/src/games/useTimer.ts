import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Countdown timer hook for games.
 * Returns [timeLeft, startTimer, pauseTimer, isRunning].
 */
export function useTimer(onExpire?: () => void): {
  isRunning: boolean;
  pause: () => void;
  start: (seconds: number) => void;
  timeLeft: number;
} {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) {
      return;
    }
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [isRunning, timeLeft]);

  const start = useCallback((seconds: number) => {
    setTimeLeft(seconds);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  return { isRunning, pause, start, timeLeft };
}
