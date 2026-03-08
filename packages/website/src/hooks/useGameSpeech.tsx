import type React from 'react';
import { useCallback, useState } from 'react';
import { SpeakerIcon, SpeakerMutedIcon } from '../components/Icons';
import { useSpeech } from './useSpeech';

const STORAGE_KEY = 'gameSpeechMuted';

/** Mute/unmute toggle button for game progress bars. */
export function GameSoundToggle({
  muted,
  supported,
  toggleMute,
}: {
  muted: boolean;
  supported: boolean;
  toggleMute: () => void;
}) {
  if (!supported) {
    return null;
  }
  return (
    <button
      aria-label={muted ? 'Unmute' : 'Mute'}
      className="btn-reset game-sound-toggle"
      onClick={toggleMute}
      title={muted ? 'Sound on (m)' : 'Sound off (m)'}
    >
      {muted ? <SpeakerMutedIcon /> : <SpeakerIcon />}
    </button>
  );
}

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

  /** Call from handleKeyDown to handle 'm' mute toggle. Returns true if handled. */
  const handleMuteKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
        return true;
      }
      return false;
    },
    [toggleMute]
  );

  return { handleMuteKey, muted, speak, speaking, stop, supported, toggleMute };
}
