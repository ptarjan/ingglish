import { useCallback, useEffect, useRef, useState } from 'react';
import { copyCanvasToClipboard, downloadCanvas } from '../games/share-helpers';

/**
 * Shared hook for the copy-to-clipboard / save-image pattern used by game result screens.
 * Returns { copied, handleShare, handleSave } — a simpler alternative to useGameShare
 * for components that manage their own shareRef.
 */
export function useShareActions(getScoreCanvas: () => HTMLCanvasElement, filename: string) {
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
    }, 1500);
  }, []);

  const handleShare = useCallback(() => {
    copyCanvasToClipboard(getScoreCanvas(), showCopied, filename);
  }, [getScoreCanvas, showCopied, filename]);

  const handleSave = useCallback(() => {
    downloadCanvas(getScoreCanvas(), filename);
  }, [getScoreCanvas, filename]);

  return { copied, handleSave, handleShare };
}
