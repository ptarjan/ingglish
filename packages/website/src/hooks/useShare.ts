import { useState, useCallback, useRef } from 'react';

/**
 * Hook for sharing URLs via the Web Share API (mobile) with clipboard fallback (desktop).
 * Returns [shared, share] where share(url, title?, text?) triggers the share action
 * and sets shared=true for 1.5s on clipboard fallback.
 */
export function useShare(): [boolean, (url: string, title?: string, text?: string) => void] {
  const [shared, setShared] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showCopied = useCallback(() => {
    setShared(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShared(false);
    }, 1500);
  }, []);

  const share = useCallback(
    (url: string, title?: string, text?: string) => {
      if (typeof navigator.share === 'function') {
        navigator.share({ title, text, url }).catch(() => {
          // User cancelled or share failed — fall back to clipboard
          void navigator.clipboard.writeText(url).then(showCopied);
        });
      } else {
        void navigator.clipboard.writeText(url).then(showCopied);
      }
    },
    [showCopied]
  );

  return [shared, share];
}
