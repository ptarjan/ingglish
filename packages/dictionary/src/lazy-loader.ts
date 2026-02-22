/**
 * Generic lazy-loading utility with caching and retry support.
 *
 * Used by the dictionary, reverse dictionary, and frequency modules
 * to share the same load-once-and-cache pattern.
 */

export interface LazyLoader<T> {
  load(): Promise<T>;
  get(): T;
  isLoaded(): boolean;
  reset(): void;
}

export function createLazyLoader<T>(loadFn: () => Promise<T>, errorLabel: string): LazyLoader<T> {
  let data: T | null = null;
  let promise: Promise<T> | null = null;

  return {
    load(): Promise<T> {
      if (data !== null) {
        return Promise.resolve(data);
      }
      if (promise !== null) {
        return promise;
      }
      promise = loadFn()
        .then((result) => {
          data = result;
          return data;
        })
        .catch((error: unknown) => {
          promise = null;
          const message = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to load ${errorLabel}: ${message}`);
        });
      return promise;
    },

    get(): T {
      if (data === null) {
        throw new Error(`${errorLabel} not loaded. Call load() first.`);
      }
      return data;
    },

    isLoaded(): boolean {
      return data !== null;
    },

    reset(): void {
      data = null;
      promise = null;
    },
  };
}
