/**
 * Rating utility — Bayesian weighted average.
 *
 * A product's displayed rating should not be based on a single review.
 * We use a Bayesian average that pulls the raw average toward a prior mean
 * until enough votes have accumulated. With PRIOR_VOTES = 30, a product
 * needs ~30 real ratings before its raw average is fully reflected.
 *
 * Formula: (rawAvg * votes + priorMean * priorVotes) / (votes + priorVotes)
 *
 * Examples with PRIOR_VOTES = 30, PRIOR_MEAN = 3.5:
 *   1 vote at 5 stars   → (5*1 + 3.5*30) / 31 ≈ 3.55
 *   5 votes at 5 stars  → (5*5 + 3.5*30) / 35 ≈ 3.71
 *   30 votes at 5 stars → (5*30 + 3.5*30) / 60 = 4.25
 *   30 votes at 4 stars → (4*30 + 3.5*30) / 60 = 3.75
 *   100 votes at 5 stars → (5*100 + 3.5*30) / 130 ≈ 4.65
 */

export const PRIOR_VOTES = 30;
export const PRIOR_MEAN = 3.5;

export function weightedRating(rawAvg: number | undefined | null, votes: number | undefined | null): number {
  const v = Math.max(0, Math.floor(votes ?? 0));
  const r = Math.max(0, Math.min(5, rawAvg ?? 0));
  if (v <= 0) return 0;
  return (r * v + PRIOR_MEAN * PRIOR_VOTES) / (v + PRIOR_VOTES);
}
