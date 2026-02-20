import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Triggers a one-shot reveal when an element scrolls into view.
 * Respects prefers-reduced-motion by revealing immediately.
 */
export function useScrollReveal<T extends HTMLElement>(
  threshold = 0.15
): { ref: React.RefCallback<T>; visible: boolean } {
  const elRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [visible, setVisible] = useState(false);

  const ref = useCallback(
    (node: T | null) => {
      // Clean up previous observer
      if (observerRef.current !== null) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      elRef.current = node;

      if (node === null || visible) {
        return;
      }

      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry!.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        },
        { threshold }
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [threshold, visible]
  );

  return { ref, visible };
}

/**
 * Reveals items one at a time on a timer, starting when `visible` becomes true.
 * Respects prefers-reduced-motion by revealing all items immediately.
 */
export function useStaggeredReveal(count: number, visible: boolean, delayMs = 200): number {
  const [revealedCount, setRevealedCount] = useState(0);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!visible || doneRef.current) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRevealedCount(count);
      doneRef.current = true;
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setRevealedCount(i);
      if (i >= count) {
        clearInterval(interval);
        doneRef.current = true;
      }
    }, delayMs);
    return () => {
      clearInterval(interval);
    };
  }, [visible, count, delayMs]);

  return revealedCount;
}

/**
 * Calls onComplete once revealedCount reaches total,
 * after a delay for the last item's animation to finish.
 */
export function useStaggerComplete(revealedCount: number, total: number, onComplete: () => void) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (revealedCount >= total) {
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 1000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [revealedCount, total]);
}

/**
 * Once active becomes true, it stays true (prevents animation replay).
 * Activates when both `visible` and `previousDone` are true.
 */
export function useStickyActive(visible: boolean, previousDone: boolean): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (visible && previousDone && !active) {
      setActive(true);
    }
  }, [visible, previousDone, active]);
  return active;
}
