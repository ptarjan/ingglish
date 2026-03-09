import { describe, expect, it } from 'vitest';
import { createLazyLoader } from './lazy-loader';

describe('createLazyLoader', () => {
  it('get() throws when not loaded', () => {
    const loader = createLazyLoader(() => Promise.resolve(42), 'test data');
    expect(() => loader.get()).toThrow('test data not loaded. Call load() first.');
  });

  it('isLoaded() returns false before load', () => {
    const loader = createLazyLoader(() => Promise.resolve(42), 'test data');
    expect(loader.isLoaded()).toBe(false);
  });

  it('load() resolves and caches data', async () => {
    let callCount = 0;
    const loader = createLazyLoader(() => {
      callCount++;
      return Promise.resolve('result');
    }, 'test data');

    const result = await loader.load();
    expect(result).toBe('result');
    expect(loader.isLoaded()).toBe(true);
    expect(loader.get()).toBe('result');

    // Second load returns cached value without calling loadFn again
    const result2 = await loader.load();
    expect(result2).toBe('result');
    expect(callCount).toBe(1);
  });

  it('concurrent load() calls deduplicate', async () => {
    let callCount = 0;
    const loader = createLazyLoader(() => {
      callCount++;
      return Promise.resolve('result');
    }, 'test data');

    const [r1, r2] = await Promise.all([loader.load(), loader.load()]);
    expect(r1).toBe('result');
    expect(r2).toBe('result');
    expect(callCount).toBe(1);
  });

  it('load() wraps errors with label', async () => {
    const loader = createLazyLoader(
      () => Promise.reject(new Error('network timeout')),
      'frequency data'
    );

    await expect(loader.load()).rejects.toThrow('Failed to load frequency data: network timeout');
  });

  it('load() wraps non-Error throws with label', async () => {
    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
    const loader = createLazyLoader(() => Promise.reject('string error'), 'frequency data');

    await expect(loader.load()).rejects.toThrow('Failed to load frequency data: string error');
  });

  it('load() retries after failure (promise is cleared)', async () => {
    let attempt = 0;
    const loader = createLazyLoader(() => {
      attempt++;
      if (attempt === 1) {
        return Promise.reject(new Error('transient'));
      }
      return Promise.resolve('success');
    }, 'retry test');

    await expect(loader.load()).rejects.toThrow('Failed to load retry test: transient');
    // After failure, promise should be cleared so we can retry
    const result = await loader.load();
    expect(result).toBe('success');
  });

  it('reset() clears cached data', async () => {
    const loader = createLazyLoader(() => Promise.resolve('data'), 'test');
    await loader.load();
    expect(loader.isLoaded()).toBe(true);

    loader.reset();
    expect(loader.isLoaded()).toBe(false);
    expect(() => loader.get()).toThrow('test not loaded. Call load() first.');
  });
});
