import type { RefObject } from 'react';
import { useEffect } from 'react';

/**
 * Auto-focuses the given ref element when the condition becomes true.
 * Uses setTimeout(0) to defer focus to the next tick, matching the pattern
 * used throughout the game components.
 */
export function useAutoFocus(ref: RefObject<HTMLElement | null>, condition: boolean): void {
  useEffect(() => {
    if (condition) {
      setTimeout(() => ref.current?.focus(), 0);
    }
  }, [condition, ref]);
}
