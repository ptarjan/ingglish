import { useCallback, useEffect, useRef, useState } from 'react';

const CHROME_WORKAROUND_INTERVAL_MS = 10_000;

/**
 * Hook for text-to-speech using the Web Speech API.
 * Returns [speaking, speak, stop, supported, wordCount, hasVoiceForLang, hasBoundaryForLang].
 *
 * Chrome has a known bug where speech stalls after ~15s of continuous playback.
 * This hook works around it by pausing/resuming every 10s.
 *
 * On mount, silently probes each language's preferred voice to detect whether
 * onboundary events fire (needed for word highlighting). Results are cached and
 * exposed via hasBoundaryForLang().
 */
export function useSpeech(): [
  boolean,
  (text: string, lang?: string) => void,
  () => void,
  boolean,
  null | number,
  (lang: string) => boolean,
  (lang: string) => boolean,
] {
  const supported = typeof speechSynthesis !== 'undefined';
  const [speaking, setSpeaking] = useState(false);
  const [wordCount, setWordCount] = useState<null | number>(null);
  const workaroundRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const [voiceLangs, setVoiceLangs] = useState<Set<string>>(new Set());
  const boundaryCacheRef = useRef(new Map<string, boolean>());
  const [boundaryLangs, setBoundaryLangs] = useState<Set<string>>(new Set());

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

  // Probe boundary support for each unique preferred voice
  useEffect(() => {
    if (!supported || voiceLangs.size === 0) {
      return;
    }

    // Collect unique preferred voices per language prefix
    const voiceForLang = new Map<string, SpeechSynthesisVoice>();
    for (const lang of voiceLangs) {
      if (lang.includes('-')) {
        continue; // skip full locale codes, just test prefixes
      }
      const voice = findPreferredVoice(lang);
      if (voice && !voiceForLang.has(voice.name)) {
        voiceForLang.set(voice.name, voice);
      }
    }

    // Also test the default voice (English)
    const defaultVoice = findPreferredVoice('en');
    if (defaultVoice && !voiceForLang.has(defaultVoice.name)) {
      voiceForLang.set(defaultVoice.name, defaultVoice);
    }

    const supportedVoiceNames = new Set<string>();
    let remaining = voiceForLang.size;
    if (remaining === 0) {
      return;
    }

    const finish = () => {
      // Map voice names back to language prefixes
      const langs = new Set<string>();
      for (const lang of voiceLangs) {
        if (lang.includes('-')) {
          continue;
        }
        const voice = findPreferredVoice(lang);
        if (voice && supportedVoiceNames.has(voice.name)) {
          langs.add(lang);
          boundaryCacheRef.current.set(lang, true);
        } else {
          boundaryCacheRef.current.set(lang, false);
        }
      }
      setBoundaryLangs(langs);
    };

    for (const [name, voice] of voiceForLang) {
      const utterance = new SpeechSynthesisUtterance('a b');
      utterance.voice = voice;
      utterance.volume = 0;
      utterance.rate = 5;

      let gotBoundary = false;
      utterance.onboundary = () => {
        gotBoundary = true;
      };
      utterance.onend = () => {
        if (gotBoundary) {
          supportedVoiceNames.add(name);
        }
        remaining--;
        if (remaining === 0) {
          finish();
        }
      };
      utterance.addEventListener('error', () => {
        remaining--;
        if (remaining === 0) {
          finish();
        }
      });

      speechSynthesis.speak(utterance);
    }
  }, [supported, voiceLangs]);

  const hasVoiceForLang = useCallback(
    (lang: string) => voiceLangs.has(lang.toLowerCase()),
    [voiceLangs]
  );

  const hasBoundaryForLang = useCallback(
    (lang: string) => boundaryLangs.has(lang.toLowerCase()),
    [boundaryLangs]
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

      // Single utterance with boundary events for word tracking
      const utterance = new SpeechSynthesisUtterance(text);
      if (lang) {
        utterance.lang = lang;
        // Only set an explicit voice if the boundary probe confirmed it works.
        // Otherwise let the browser choose — avoids broken/unavailable voices
        // on platforms where voices are listed but can't actually synthesize.
        if (boundaryCacheRef.current.get(lang.toLowerCase()) === true) {
          const voice = findPreferredVoice(lang);
          if (voice) {
            utterance.voice = voice;
          }
        }
      }

      // Precompute word start positions so we can map charIndex → word index.
      // The speech synthesizer may fire boundary events that don't map 1:1 to
      // whitespace-delimited words (e.g. punctuation, contractions, numbers),
      // so we use charIndex rather than a simple counter.
      // Only count segments containing letters or digits (matching OverlayTextarea's
      // word counting which skips punctuation-only tokens like em dashes).
      const WORD_RE = /[\p{L}\p{N}]/u;
      const wordStarts: number[] = [];
      const segments = text.split(/(\s+)/);
      let pos = 0;
      for (const seg of segments) {
        if (seg && !/^\s+$/.test(seg) && WORD_RE.test(seg)) {
          wordStarts.push(pos);
        }
        pos += seg.length;
      }

      // Some TTS voices (especially non-English on macOS) report charIndex=0
      // for every boundary event. Track a simple counter as fallback.
      let boundaryCounter = -1;
      let lastCharIndex = -1;
      let useCharIndex = true;

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          boundaryCounter++;

          // Detect broken charIndex: if it never advances past 0 after
          // the first event, fall back to the simple counter.
          if (boundaryCounter > 0 && event.charIndex === 0 && lastCharIndex === 0) {
            useCharIndex = false;
          }
          lastCharIndex = event.charIndex;

          if (useCharIndex) {
            // Map charIndex to visual word index
            let wordIndex = 0;
            for (let i = 1; i < wordStarts.length; i++) {
              if (wordStarts[i]! <= event.charIndex) {
                wordIndex = i;
              } else {
                break;
              }
            }
            setWordCount(wordIndex);
          } else {
            // Fallback: use boundary event counter, clamped to valid range
            setWordCount(Math.min(boundaryCounter, wordStarts.length - 1));
          }
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

  return [speaking, speak, stop, supported, wordCount, hasVoiceForLang, hasBoundaryForLang];
}

/**
 * Find the preferred voice for a language. Prefers non-Google voices because
 * Google TTS voices don't fire onboundary events (needed for word highlighting).
 */
function findPreferredVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  const matching = voices.filter(
    (v) => v.lang.startsWith(lang + '-') || v.lang.toLowerCase() === lang.toLowerCase()
  );
  return matching.find((v) => !v.name.startsWith('Google')) ?? matching[0];
}
