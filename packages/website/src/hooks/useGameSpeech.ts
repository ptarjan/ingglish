import { useCallback, useState } from 'react';
import { useSpeech } from './useSpeech';

const STORAGE_KEY = 'gameSpeechMuted';

/**
 * Wraps useSpeech with a mute toggle persisted to localStorage.
 * When muted, speak() is a no-op. Default: muted (off).
 */
export function useGameSpeech() {
  const [speaking, speakRaw, stop, supported] = useSpeech();
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== '0';
    } catch {
      return true;
    }
  });

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // localStorage unavailable
      }
      if (next) {
        stop();
      }
      return next;
    });
  }, [stop]);

  const speak = useCallback(
    (text: string) => {
      if (!muted) {
        speakRaw(text);
      }
    },
    [muted, speakRaw]
  );

  return { muted, speak, speaking, stop, supported, toggleMute };
}
