import { useEffect, useState } from 'react';

declare const __BUILD_ID__: string;

const POLL_INTERVAL = 60_000; // Check every 60 seconds

export function useUpdateCheck(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Don't poll in dev mode
    if (import.meta.env.DEV) {
      return;
    }

    const check = async () => {
      try {
        const res = await fetch('/build-id.txt', { cache: 'no-store' });
        if (!res.ok) {
          return;
        }
        const resText = await res.text();
        const remoteBuildId = resText.trim();
        if (remoteBuildId.length > 0 && remoteBuildId !== __BUILD_ID__) {
          setUpdateAvailable(true);
        }
      } catch {
        // Network error — ignore
      }
    };

    const id = setInterval(() => void check(), POLL_INTERVAL);
    // First check after a short delay (don't block initial load)
    const timeout = setTimeout(() => void check(), 5000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, []);

  return updateAvailable;
}
