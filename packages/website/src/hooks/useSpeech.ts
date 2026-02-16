import { useState, useCallback, useRef, useEffect } from 'react';

const CHROME_WORKAROUND_INTERVAL_MS = 10_000;

/**
 * Hook for text-to-speech using the Web Speech API.
 * Returns [speaking, speak, stop, supported].
 *
 * Chrome has a known bug where speech stalls after ~15s of continuous playback.
 * This hook works around it by pausing/resuming every 10s.
 */
export function useSpeech(): [boolean, (text: string) => void, () => void, boolean] {
  const supported = typeof speechSynthesis !== 'undefined';
  const [speaking, setSpeaking] = useState(false);
  const workaroundRef = useRef<ReturnType<typeof setInterval>>();

  const clearWorkaround = useCallback(() => {
    if (workaroundRef.current !== undefined) {
      clearInterval(workaroundRef.current);
      workaroundRef.current = undefined;
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) {
      return;
    }
    speechSynthesis.cancel();
    clearWorkaround();
    setSpeaking(false);
  }, [supported, clearWorkaround]);

  const speak = useCallback(
    (text: string) => {
      if (!supported) {
        return;
      }

      speechSynthesis.cancel();
      clearWorkaround();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => {
        clearWorkaround();
        setSpeaking(false);
      };
      utterance.onerror = () => {
        clearWorkaround();
        setSpeaking(false);
      };

      speechSynthesis.speak(utterance);
      setSpeaking(true);

      // Chrome workaround: pause/resume every 10s to prevent 15s stall
      workaroundRef.current = setInterval(() => {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }, CHROME_WORKAROUND_INTERVAL_MS);
    },
    [supported, clearWorkaround]
  );

  // Cancel speech on unmount
  useEffect(() => {
    return () => {
      if (supported) {
        speechSynthesis.cancel();
        clearWorkaround();
      }
    };
  }, [supported, clearWorkaround]);

  return [speaking, speak, stop, supported];
}
