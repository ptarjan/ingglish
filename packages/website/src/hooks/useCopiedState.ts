import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Manages a "copied!" flash state with auto-reset after a given duration.
 * Returns [isCopied, showCopied] — call showCopied() to trigger the flash.
 */
export function useCopiedState(duration = 1500): [boolean, () => void] {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    []
  );

  const showCopied = useCallback(() => {
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopied(false);
    }, duration);
  }, [duration]);

  return [copied, showCopied];
}
