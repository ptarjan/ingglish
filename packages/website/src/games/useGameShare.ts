import { useCallback, useEffect, useRef, useState } from 'react';
import { copyCanvasToClipboard, downloadCanvas } from './share-helpers';

/**
 * Shared hook for the copy-to-clipboard / save-image pattern used by all game result screens.
 * Manages copiedShare flash state, timer cleanup, and share/save callbacks.
 */
export function useGameShare(getScoreCanvas: () => HTMLCanvasElement, filename: string) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shareRef = useRef<HTMLButtonElement>(null);

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

  return { copied, handleSave, handleShare, shareRef, showCopied };
}
