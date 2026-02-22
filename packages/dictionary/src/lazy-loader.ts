/**
 * Generic lazy-loading utility with caching and retry support.
 *
 * Used by the dictionary, reverse dictionary, and frequency modules
 * to share the same load-once-and-cache pattern.
 */

export interface LazyLoader<T> {
  get(): T;
  isLoaded(): boolean;
  load(): Promise<T>;
  reset(): void;
}

export function createLazyLoader<T>(loadFn: () => Promise<T>, errorLabel: string): LazyLoader<T> {
  let data: null | T = null;
  let promise: null | Promise<T> = null;

  return {
    get(): T {
      if (data === null) {
        throw new Error(`${errorLabel} not loaded. Call load() first.`);
      }
      return data;
    },

    isLoaded(): boolean {
      return data !== null;
    },

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

    reset(): void {
      data = null;
      promise = null;
    },
  };
}
