/**
 * Daily Challenge data helpers.
 *
 * Provides a deterministic seed from today's date so every user
 * gets the same 5-round challenge each day.
 */

import type { ChallengeSentence } from './challenge-data';
import { pickChallenge } from './challenge-data';

/** Simple hash of a YYYY-MM-DD string to a stable integer seed. */
export function getDailySeed(dateKey: string): number {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = Math.imul(31, hash) + dateKey.codePointAt(i)!;
    hash = Math.trunc(hash); // int32
  }
  return Math.abs(hash);
}

/** Map a score (0–1) to a square color for the Wordle-style grid. */
export function getSquareColor(score: number): 'green' | 'red' | 'yellow' {
  if (score >= 0.8) {
    return 'green';
  }
  if (score >= 0.5) {
    return 'yellow';
  }
  return 'red';
}

/** Map a score to an emoji square. */
export function getSquareEmoji(score: number): string {
  if (score >= 0.8) {
    return '🟩';
  }
  if (score >= 0.5) {
    return '🟨';
  }
  return '🟥';
}

/** Today's date key in YYYY-MM-DD (UTC). */
export function getTodayKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** Milliseconds until next UTC midnight. */
export function msUntilNextChallenge(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.getTime() - now.getTime();
}

/** Pick 5 challenge sentences seeded by today's date. */
export function pickDailyChallenge(): ChallengeSentence[] {
  const seed = getDailySeed(getTodayKey());
  return pickChallenge(seed, 5);
}
