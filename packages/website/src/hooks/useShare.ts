import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hook for sharing URLs via the Web Share API (mobile) with clipboard fallback (desktop).
 * Returns [shared, share] where share(url, title?, text?) triggers the share action
 * and sets shared=true for 1.5s on clipboard fallback.
 */
export function useShare(): [boolean, (url: string, title?: string, text?: string) => void] {
  const [shared, setShared] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  const showCopied = useCallback(() => {
    setShared(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShared(false);
    }, 1500);
  }, []);

  const share = useCallback(
    (url: string, title?: string, text?: string) => {
      // Build clipboard text: use text + url when text is provided, otherwise just url.
      // Avoid duplicating the URL if text already contains it.
      const clipboardText = text ? (text.includes(url) ? text : `${text}\n\n${url}`) : url;

      if (typeof navigator.share === 'function') {
        navigator.share({ text, title, url }).catch(() => {
          // User cancelled or share failed — fall back to clipboard
          void navigator.clipboard.writeText(clipboardText).then(showCopied);
        });
      } else {
        void navigator.clipboard.writeText(clipboardText).then(showCopied);
      }
    },
    [showCopied]
  );

  return [shared, share];
}
