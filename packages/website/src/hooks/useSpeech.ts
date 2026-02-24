import { useCallback, useEffect, useRef, useState } from 'react';

const CHROME_WORKAROUND_INTERVAL_MS = 10_000;

/**
 * Hook for text-to-speech using the Web Speech API.
 * Returns [speaking, speak, stop, supported, wordCount, hasVoiceForLang].
 *
 * Chrome has a known bug where speech stalls after ~15s of continuous playback.
 * This hook works around it by pausing/resuming every 10s.
 */
export function useSpeech(): [
  boolean,
  (text: string, lang?: string) => void,
  () => void,
  boolean,
  null | number,
  (lang: string) => boolean,
] {
  const supported = typeof speechSynthesis !== 'undefined';
  const [speaking, setSpeaking] = useState(false);
  const [wordCount, setWordCount] = useState<null | number>(null);
  const workaroundRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [voiceLangs, setVoiceLangs] = useState<Set<string>>(new Set());

  // Track available voice languages (Chrome loads them async)
  useEffect(() => {
    if (!supported) {
      return;
    }
    const updateVoices = () => {
      const langs = new Set<string>();
      for (const voice of speechSynthesis.getVoices()) {
        // voice.lang is like "en-US", "fr-FR", "zh-CN" — store both full and prefix
        langs.add(voice.lang.toLowerCase());
        langs.add(voice.lang.split('-')[0]!.toLowerCase());
      }
      setVoiceLangs(langs);
    };
    updateVoices();
    speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, [supported]);

  const hasVoiceForLang = useCallback(
    (lang: string) => voiceLangs.has(lang.toLowerCase()),
    [voiceLangs]
  );

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
    setWordCount(null);
  }, [supported, clearWorkaround]);

  const speak = useCallback(
    (text: string, lang?: string) => {
      if (!supported) {
        return;
      }

      speechSynthesis.cancel();
      clearWorkaround();

      const utterance = new SpeechSynthesisUtterance(text);
      if (lang) {
        utterance.lang = lang;
      }
      let wordsSeen = 0;
      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          setWordCount(wordsSeen++);
        }
      };
      utterance.onend = () => {
        clearWorkaround();
        setSpeaking(false);
        setWordCount(null);
      };
      utterance.addEventListener('error', () => {
        clearWorkaround();
        setSpeaking(false);
        setWordCount(null);
      });

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

  // Cancel speech on unmount and page unload (refresh/navigate)
  useEffect(() => {
    if (!supported) {
      return;
    }
    const handleUnload = () => {
      speechSynthesis.cancel();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      speechSynthesis.cancel();
      clearWorkaround();
    };
  }, [supported, clearWorkaround]);

  return [speaking, speak, stop, supported, wordCount, hasVoiceForLang];
}
