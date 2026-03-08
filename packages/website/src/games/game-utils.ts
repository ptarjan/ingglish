/** Returns a human-readable label for a difficulty tier number. */
export function getTierLabel(tier: number): string {
  if (tier === 1) {
    return 'Easy';
  }
  if (tier === 2) {
    return 'Medium';
  }
  return 'Hard';
}
