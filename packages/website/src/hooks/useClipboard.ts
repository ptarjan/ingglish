import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for copying text to clipboard with a temporary "copied" state.
 * Returns [copied, copy] where copy(text) writes to clipboard
 * and sets copied=true for 1.5s.
 */
export function useClipboard(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setCopied(false);
        }, 1500);
      },
      () => {
        // Clipboard can fail in non-secure contexts or if permission denied
      }
    );
  }, []);

  return [copied, copy];
}
