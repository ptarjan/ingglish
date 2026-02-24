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
  const fallbackRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const fallbackIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const gotBoundaryRef = useRef(false);
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

  const clearFallback = useCallback(() => {
    if (fallbackRef.current !== undefined) {
      clearTimeout(fallbackRef.current);
      fallbackRef.current = undefined;
    }
    if (fallbackIntervalRef.current !== undefined) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = undefined;
    }
  }, []);

  const stop = useCallback(() => {
    if (!supported) {
      return;
    }
    speechSynthesis.cancel();
    clearWorkaround();
    clearFallback();
    setSpeaking(false);
    setWordCount(null);
  }, [supported, clearWorkaround, clearFallback]);

  const speak = useCallback(
    (text: string, lang?: string) => {
      if (!supported) {
        return;
      }

      speechSynthesis.cancel();
      clearWorkaround();
      clearFallback();
      gotBoundaryRef.current = false;

      const utterance = new SpeechSynthesisUtterance(text);
      if (lang) {
        utterance.lang = lang;
        // Explicitly pick a voice matching the language — setting lang alone
        // isn't always enough (some browsers fall back to the default voice).
        const voices = speechSynthesis.getVoices();
        const voice =
          voices.find((v) => v.lang.startsWith(lang + '-')) ??
          voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
        if (voice) {
          utterance.voice = voice;
        }
      }
      // Precompute character offset → word index mapping so we can use
      // charIndex from boundary events (more reliable across languages
      // than counting sequential 'word' events).
      const wordStarts: number[] = [];
      const re = /\S+/g;
      let match;
      while ((match = re.exec(text)) !== null) {
        wordStarts.push(match.index);
      }

      utterance.onboundary = (event) => {
        // TODO: remove after debugging TTS highlighting
        // eslint-disable-next-line no-console
        console.log('[TTS boundary]', event.name, 'charIndex:', event.charIndex);
        if (event.name === 'word' || event.name === 'sentence') {
          gotBoundaryRef.current = true;
          clearFallback(); // Cancel timer fallback — real events are available
          // Find which word the charIndex falls in
          let idx = 0;
          for (let i = wordStarts.length - 1; i >= 0; i--) {
            if (event.charIndex >= wordStarts[i]!) {
              idx = i;
              break;
            }
          }
          setWordCount(idx);
        }
      };
      utterance.onend = () => {
        clearWorkaround();
        clearFallback();
        setSpeaking(false);
        setWordCount(null);
      };
      utterance.addEventListener('error', () => {
        clearWorkaround();
        clearFallback();
        setSpeaking(false);
        setWordCount(null);
      });

      speechSynthesis.speak(utterance);
      setSpeaking(true);

      // Fallback: if no boundary events fire within 500ms (common for
      // non-English voices), estimate word timing at ~160 wpm.
      const wordCount = wordStarts.length;
      if (wordCount > 0) {
        fallbackRef.current = setTimeout(() => {
          if (gotBoundaryRef.current) {
            return; // Real events arrived, no fallback needed
          }
          let currentWord = 0;
          setWordCount(currentWord);
          fallbackIntervalRef.current = setInterval(() => {
            currentWord++;
            if (currentWord >= wordCount) {
              clearInterval(fallbackIntervalRef.current);
              fallbackIntervalRef.current = undefined;
            } else {
              setWordCount(currentWord);
            }
          }, 375); // ~160 words per minute
        }, 500);
      }

      // Chrome workaround: pause/resume every 10s to prevent 15s stall
      workaroundRef.current = setInterval(() => {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }, CHROME_WORKAROUND_INTERVAL_MS);
    },
    [supported, clearWorkaround, clearFallback]
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
      clearFallback();
    };
  }, [supported, clearWorkaround, clearFallback]);

  return [speaking, speak, stop, supported, wordCount, hasVoiceForLang];
}
