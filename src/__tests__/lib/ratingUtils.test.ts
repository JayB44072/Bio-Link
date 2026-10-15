import { describe, it, expect } from 'vitest';
import { weightedRating, PRIOR_VOTES, PRIOR_MEAN } from '../../lib/ratingUtils';

// ── Constantes ────────────────────────────────────────────────────────────────

describe('constantes', () => {
  it('PRIOR_VOTES = 30', () => expect(PRIOR_VOTES).toBe(30));
  it('PRIOR_MEAN  = 3.5',() => expect(PRIOR_MEAN).toBe(3.5));
});

// ── Cas nominaux (exemples du commentaire JSDoc) ──────────────────────────────

describe('weightedRating — cas nominaux', () => {
  it('0 vote → retourne 0 (pas assez de données)', () => {
    expect(weightedRating(4.5, 0)).toBe(0);
  });

  it('1 vote à 5 étoiles → ≈ 3.55', () => {
    const r = weightedRating(5, 1);
    expect(r).toBeCloseTo(3.548, 2);
  });

  it('5 votes à 5 étoiles → ≈ 3.71', () => {
    const r = weightedRating(5, 5);
    expect(r).toBeCloseTo(3.714, 2);
  });

  it('30 votes à 5 étoiles → 4.25 (exact)', () => {
    // (5*30 + 3.5*30) / (30+30) = (150+105)/60 = 4.25
    expect(weightedRating(5, 30)).toBeCloseTo(4.25, 5);
  });

  it('30 votes à 4 étoiles → 3.75 (exact)', () => {
    // (4*30 + 3.5*30) / 60 = (120+105)/60 = 3.75
    expect(weightedRating(4, 30)).toBeCloseTo(3.75, 5);
  });

  it('100 votes à 5 étoiles → ≈ 4.65', () => {
    const r = weightedRating(5, 100);
    expect(r).toBeCloseTo(4.654, 2);
  });
});

// ── Bornes et valeurs extrêmes ────────────────────────────────────────────────

describe('weightedRating — bornes', () => {
  it('votes négatifs traités comme 0 → retourne 0', () => {
    expect(weightedRating(5, -3)).toBe(0);
  });

  it('rawAvg > 5 clampé à 5', () => {
    const withClamped = weightedRating(5, 10);
    const withOverflow = weightedRating(999, 10);
    expect(withOverflow).toBeCloseTo(withClamped, 5);
  });

  it('rawAvg < 0 clampé à 0', () => {
    const withZero = weightedRating(0, 10);
    const withNeg  = weightedRating(-5, 10);
    // Both: (0*10 + 3.5*30) / 40 = 105/40 = 2.625
    expect(withNeg).toBeCloseTo(withZero, 5);
  });

  it('rawAvg undefined → traité comme 0', () => {
    expect(weightedRating(undefined, 10)).toBeGreaterThanOrEqual(0);
    expect(weightedRating(undefined, 10)).toBeCloseTo(weightedRating(0, 10), 5);
  });

  it('votes undefined → retourne 0', () => {
    expect(weightedRating(5, undefined)).toBe(0);
  });

  it('rawAvg null → traité comme 0', () => {
    expect(weightedRating(null, 10)).toBeCloseTo(weightedRating(0, 10), 5);
  });

  it('votes null → retourne 0', () => {
    expect(weightedRating(5, null)).toBe(0);
  });

  it('votes décimaux → tronqués (floor)', () => {
    // floor(4.9) = 4 votes
    const withFloor = weightedRating(5, 4);
    const withDecim = weightedRating(5, 4.9);
    expect(withDecim).toBeCloseTo(withFloor, 5);
  });
});

// ── Propriétés de la formule ──────────────────────────────────────────────────

describe('weightedRating — propriétés de la formule bayésienne', () => {
  it('plus de votes → la note se rapproche de la vraie moyenne', () => {
    const few  = weightedRating(5, 5);
    const more = weightedRating(5, 50);
    const many = weightedRating(5, 500);
    expect(few < more).toBe(true);
    expect(more < many).toBe(true);
    expect(many).toBeLessThan(5); // jamais exactement 5 (prior tire vers 3.5)
  });

  it('note parfaite (5★) > note médiocre (2★) pour le même nombre de votes', () => {
    expect(weightedRating(5, 20)).toBeGreaterThan(weightedRating(2, 20));
  });

  it('résultat toujours dans l\'intervalle [0, 5]', () => {
    const cases: [number | null | undefined, number | null | undefined][] = [
      [0, 1], [5, 1], [3.5, 100], [null, 50], [5, undefined],
    ];
    for (const [avg, votes] of cases) {
      const r = weightedRating(avg, votes);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(5);
    }
  });
});
