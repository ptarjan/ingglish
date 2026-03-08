import { useCallback, useState } from 'react';

/**
 * localStorage-backed game progress hook.
 * Each game uses its own key (e.g. 'ingglish-games-reading').
 */
export function useGameProgress<T>(
  storageKey: string,
  defaultValue: T
): {
  progress: T;
  update: (updater: (prev: T) => T) => void;
} {
  const [progress, setProgress] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // ignore corrupt data
    }
    return defaultValue;
  });

  const update = useCallback(
    (updater: (prev: T) => T) => {
      setProgress((prev) => {
        const next = updater(prev);
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // storage full — ignore
        }
        return next;
      });
    },
    [storageKey]
  );

  return { progress, update };
}
