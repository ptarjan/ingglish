import { useCallback, useEffect, useRef, useState } from 'react';

const CHROME_WORKAROUND_INTERVAL_MS = 10_000;

/**
 * Hook for text-to-speech using the Web Speech API.
 * Returns [speaking, speak, stop, supported, spokenRange, hasVoiceForLang, hasBoundaryForLang].
 *
 * Chrome has a known bug where speech stalls after ~15s of continuous playback.
 * This hook works around it by pausing/resuming every 10s.
 *
 * On mount, silently probes each language's preferred voice to detect whether
 * onboundary events fire (needed for word highlighting). Results are cached and
 * exposed via hasBoundaryForLang().
 *
 * spokenRange is a [start, end] tuple covering the currently-spoken words. For
 * languages like Chinese where TTS groups multiple characters into one word, the
 * range expands to cover any skipped visual tokens so nothing is missed.
 */
export function useSpeech(): [
  boolean,
  (text: string, lang?: string) => void,
  () => void,
  boolean,
  [number, number] | null,
  (lang: string) => boolean,
  (lang: string) => boolean,
] {
  const supported = typeof speechSynthesis !== 'undefined';
  const [speaking, setSpeaking] = useState(false);
  const [spokenRange, setSpokenRange] = useState<[number, number] | null>(null);
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
    setSpokenRange(null);
  }, [supported, clearWorkaround]);

  const speak = useCallback(
    (text: string, lang?: string) => {
      if (!supported) {
        return;
      }

      speechSynthesis.cancel();
      clearWorkaround();

      // CJK TTS engines strip spaces internally, so charIndex values reference
      // a spaceless string. For CJK text, strip spaces and build per-character
      // word starts so charIndex maps correctly to overlay word indices.
      const CJK_RE = /[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
      const isCJK = CJK_RE.test(text);
      const ttsText: string = isCJK ? text.replaceAll(/\s+/g, '') : text;

      const utterance = new SpeechSynthesisUtterance(ttsText);
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
      if (isCJK) {
        // For CJK: each character in the stripped text is a word token
        let cjkIdx = 0;
        for (const ch of ttsText) {
          if (WORD_RE.test(ch)) {
            wordStarts.push(cjkIdx);
          }
          cjkIdx++;
        }
      } else {
        const segments = text.split(/(\s+)/);
        let pos = 0;
        for (const seg of segments) {
          if (seg && !/^\s+$/.test(seg) && WORD_RE.test(seg)) {
            wordStarts.push(pos);
          }
          pos += seg.length;
        }
      }

      // Some TTS voices (especially on Windows) report charIndex=0 for every
      // boundary event. Track a simple counter as fallback. We only switch to
      // fallback after seeing charIndex=0 enough times that it can't just be
      // sub-word splits of the first word (common in agglutinative languages).
      let boundaryCounter = -1;
      let charIndexEverAdvanced = false;
      let prevWordIndex = -1;

      utterance.onboundary = (event) => {
        if (event.name === 'word') {
          boundaryCounter++;
          if (event.charIndex > 0) {
            charIndexEverAdvanced = true;
          }

          // Use charIndex mapping when it works, fall back to counter otherwise.
          // Wait until 4+ events before concluding charIndex is broken, since
          // agglutinative languages may fire multiple boundaries for word 1.
          const useFallback = !charIndexEverAdvanced && boundaryCounter >= 3;

          let wordIndex: number;
          if (useFallback) {
            wordIndex = Math.min(boundaryCounter, wordStarts.length - 1);
          } else {
            wordIndex = 0;
            for (let i = 1; i < wordStarts.length; i++) {
              if (wordStarts[i]! <= event.charIndex) {
                wordIndex = i;
              } else {
                break;
              }
            }
          }

          // Use charLength (when available) to find the end of the current
          // TTS word — this covers multi-character CJK compounds correctly.
          let wordEnd = wordIndex;
          const charLen = (event as { charLength?: number }).charLength;
          if (charLen !== undefined && charLen > 1 && !useFallback) {
            const charEnd = event.charIndex + charLen - 1;
            for (let i = wordIndex + 1; i < wordStarts.length; i++) {
              if (wordStarts[i]! <= charEnd) {
                wordEnd = i;
              } else {
                break;
              }
            }
          }

          // Also expand backward to catch any skipped tokens from the previous
          // boundary event (fallback for when charLength is unavailable).
          const rangeStart = Math.min(wordIndex, prevWordIndex + 1);
          prevWordIndex = wordEnd;
          setSpokenRange([rangeStart, wordEnd]);
        }
      };
      utterance.onend = () => {
        clearWorkaround();
        setSpeaking(false);
        setSpokenRange(null);
      };
      utterance.addEventListener('error', () => {
        clearWorkaround();
        setSpeaking(false);
        setSpokenRange(null);
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

  return [speaking, speak, stop, supported, spokenRange, hasVoiceForLang, hasBoundaryForLang];
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
