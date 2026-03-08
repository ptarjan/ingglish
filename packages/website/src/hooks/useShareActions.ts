import { useCallback } from 'react';
import { copyCanvasToClipboard, downloadCanvas } from '../games/share-helpers';
import { useCopiedState } from './useCopiedState';

/**
 * Provides share (copy to clipboard) and save (download) actions for a score card canvas.
 */
export function useShareActions(
  getCanvas: () => HTMLCanvasElement,
  filename: string
): { copied: boolean; handleSave: () => void; handleShare: () => void } {
  const [copied, showCopied] = useCopiedState();

  const handleShare = useCallback(() => {
    const canvas = getCanvas();
    copyCanvasToClipboard(canvas, showCopied, filename);
  }, [getCanvas, showCopied, filename]);

  const handleSave = useCallback(() => {
    const canvas = getCanvas();
    downloadCanvas(canvas, filename);
  }, [getCanvas, filename]);

  return { copied, handleSave, handleShare };
}
