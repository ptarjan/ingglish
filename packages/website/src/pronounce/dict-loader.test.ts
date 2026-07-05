import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchWithRetry, retryAsync } from './dict-loader';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('fetchWithRetry', () => {
  it('returns immediately on success (no retry)', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await fetchWithRetry('/en.json', 4);
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a transient network error, then succeeds', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Load failed')) // Safari's fetch failure
      .mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const promise = fetchWithRetry('/en.json', 4);
    await vi.runAllTimersAsync();
    const res = await promise;
    expect(res.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries transient 5xx, then throws after exhausting attempts', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const caught = fetchWithRetry('/en.json', 3).catch((error: unknown) => error);
    await vi.runAllTimersAsync();
    expect(String(await caught)).toMatch(/503/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a permanent 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchWithRetry('/en.json', 4)).rejects.toThrow(/404/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('retryAsync', () => {
  it('retries a failing operation, then succeeds', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok');
    const promise = retryAsync(fn, 4);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws the last error after exhausting attempts', async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockRejectedValue(new Error('boom'));
    const caught = retryAsync(fn, 2).catch((error: unknown) => error);
    await vi.runAllTimersAsync();
    expect(String(await caught)).toMatch(/boom/);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
