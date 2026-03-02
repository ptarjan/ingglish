import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Count-UP timer hook for games (e.g. Speed Match).
 * Tracks elapsed time in seconds.
 */
export function useStopwatch(): {
  elapsed: number;
  isRunning: boolean;
  reset: () => void;
  start: () => void;
  stop: () => number;
} {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 200);
    return () => {
      clearInterval(id);
    };
  }, [isRunning]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setIsRunning(true);
  }, []);

  const stop = useCallback((): number => {
    setIsRunning(false);
    const finalElapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
    setElapsed(finalElapsed);
    return finalElapsed;
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    startTimeRef.current = 0;
  }, []);

  return { elapsed, isRunning, reset, start, stop };
}
