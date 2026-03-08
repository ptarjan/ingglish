/**
 * Shared utility functions for game components.
 */

/** Returns a human-readable label for a difficulty tier number. */
export function getTierLabel(tier: 1 | 2 | 3): string {
  if (tier === 1) {
    return 'Easy';
  }
  if (tier === 2) {
    return 'Medium';
  }
  return 'Hard';
}
