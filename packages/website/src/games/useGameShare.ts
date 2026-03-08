import { useCallback, useEffect, useRef, useState } from 'react';
import { copyCanvasToClipboard, downloadCanvas } from './share-helpers';

/**
 * Shared hook for the copy-to-clipboard / save-image pattern used by all game result screens.
 * Manages copiedShare flash state, timer cleanup, and share/save callbacks.
 */
export function useGameShare(getScoreCanvas: () => HTMLCanvasElement, filename: string) {
  const [copiedShare, setCopiedShare] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shareRef = useRef<HTMLButtonElement>(null);

  useEffect(
    () => () => {
      clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const showCopied = useCallback(() => {
    setCopiedShare(true);
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => {
      setCopiedShare(false);
    }, 1500);
  }, []);

  const handleShareResult = useCallback(() => {
    copyCanvasToClipboard(getScoreCanvas(), showCopied, filename);
  }, [getScoreCanvas, showCopied, filename]);

  const handleSaveImage = useCallback(() => {
    downloadCanvas(getScoreCanvas(), filename);
  }, [getScoreCanvas, filename]);

  return { copiedShare, handleSaveImage, handleShareResult, shareRef, showCopied };
}
