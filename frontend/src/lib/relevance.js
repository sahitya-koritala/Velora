/**
 * Convert backend relevance (0–1) to display percentage (0–100).
 */
export function toRelevancePercent(score) {
  if (score == null || Number.isNaN(Number(score))) return 0;
  let s = Number(score);
  if (s > 1 && s <= 100) s = s / 100;
  if (s > 1) s = 1;
  return Math.min(100, Math.max(0, Math.round(s * 100)));
}

export function relevanceColors(percent) {
  if (percent >= 70) {
    return { text: 'text-emerald-700', bar: 'bg-emerald-500' };
  }
  if (percent >= 40) {
    return { text: 'text-amber-600', bar: 'bg-amber-500' };
  }
  return { text: 'text-slate-600', bar: 'bg-slate-400' };
}
