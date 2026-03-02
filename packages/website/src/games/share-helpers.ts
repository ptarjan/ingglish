/**
 * Shared helpers for copying/downloading score card canvases.
 */

export function copyCanvasToClipboard(
  canvas: HTMLCanvasElement,
  onCopied: () => void,
  filename?: string
): void {
  canvas.toBlob((blob) => {
    if (!blob) {
      return;
    }
    navigator.clipboard
      .write([new ClipboardItem({ 'image/png': blob })])
      .then(onCopied)
      .catch(() => {
        downloadCanvas(canvas, filename);
      });
  }, 'image/png');
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename = 'ingglish-score.png'): void {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
