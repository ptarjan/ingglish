/**
 * Shared chunked processing utility for DOM operations.
 * Spreads work across animation frames for smooth rendering.
 */

/**
 * Processes an array of items in chunks using requestAnimationFrame.
 * For small arrays (≤ syncThreshold), processes synchronously to avoid RAF overhead.
 *
 * @param items The items to process
 * @param processFn Function to call for each item
 * @param chunkSize Number of items per animation frame
 * @param onProgress Optional progress callback (1-indexed: called with i+1, total)
 * @param syncThreshold Process synchronously if items.length ≤ this (0 = always chunk)
 */
export function processChunked<T>(
  items: T[],
  processFn: (item: T) => void,
  chunkSize: number,
  onProgress?: (processed: number, total: number) => void,
  syncThreshold = 0
): Promise<void> {
  const total = items.length;

  if (total === 0) {
    return Promise.resolve();
  }

  // For small sets, process synchronously to avoid RAF overhead
  if (total <= syncThreshold) {
    for (let i = 0; i < total; i++) {
      processFn(items[i]!);
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let index = 0;

    function processChunk(): void {
      const endIndex = Math.min(index + chunkSize, total);

      while (index < endIndex) {
        processFn(items[index]!);
        index++;

        if (onProgress) {
          onProgress(index, total);
        }
      }

      if (index < total) {
        requestAnimationFrame(processChunk);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(processChunk);
  });
}
