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

/** Creates a score label function with custom messages for each threshold. */
export function makeScoreLabel(labels: {
  good: string;
  great: string;
  low: string;
  ok: string;
}): (pct: number) => string {
  return (pct) => {
    if (pct >= 90) {
      return labels.great;
    }
    if (pct >= 70) {
      return labels.good;
    }
    if (pct >= 50) {
      return labels.ok;
    }
    return labels.low;
  };
}
