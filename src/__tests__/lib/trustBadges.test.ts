import { describe, it, expect, beforeEach } from 'vitest';
import { computeSellerStats, computeSellerBadges } from '../../lib/trustBadges';
import { mockProfile, mockFreeProfil, makeTransaction, makeCompletedTxns } from '../fixtures';

// ── computeSellerStats ────────────────────────────────────────────────────────

describe('computeSellerStats', () => {
  it('sans transactions → tout à 0/null', () => {
    const stats = computeSellerStats(mockProfile, []);
    expect(stats.totalCompleted).toBe(0);
    expect(stats.medianShipHours).toBeNull();
    expect(stats.cancelledRatio).toBe(0);
  });

  it('compte correctement les commandes livrées', () => {
    const txns = [
      makeTransaction({ status: 'completed' }),
      makeTransaction({ status: 'completed' }),
      makeTransaction({ status: 'cancelled' }),
      makeTransaction({ status: 'pending' }),
    ];
    const stats = computeSellerStats(mockProfile, txns);
    expect(stats.totalCompleted).toBe(2);
  });

  it('ratio d\'annulation correct', () => {
    const txns = [
      ...makeCompletedTxns(8),
      makeTransaction({ status: 'cancelled' }),
      makeTransaction({ status: 'cancelled' }),
    ];
    const stats = computeSellerStats(mockProfile, txns);
    expect(stats.cancelledRatio).toBeCloseTo(0.2, 5); // 2/10
  });

  it('médiane de livraison — un seul envoi de 12h', () => {
    const created = new Date(Date.now() - 24 * 3_600_000).toISOString();
    const shipped = new Date(new Date(created).getTime() + 12 * 3_600_000).toISOString();
    const txns = [makeTransaction({ created_at: created, shipped_at: shipped })];
    const stats = computeSellerStats(mockProfile, txns);
    expect(stats.medianShipHours).toBeCloseTo(12, 0);
  });

  it('médiane de livraison — trois envois [8h, 16h, 30h] → médiane = 16h', () => {
    const txns = [8, 16, 30].map(h => {
      const created = new Date(Date.now() - 48 * 3_600_000).toISOString();
      const shipped = new Date(new Date(created).getTime() + h * 3_600_000).toISOString();
      return makeTransaction({ created_at: created, shipped_at: shipped });
    });
    const stats = computeSellerStats(mockProfile, txns);
    expect(stats.medianShipHours).toBeCloseTo(16, 0);
  });

  it('ignores les délais négatifs ou > 30 jours', () => {
    const created = new Date().toISOString();
    // shipped before created (négatif)
    const badTxn = makeTransaction({
      created_at: new Date(Date.now()).toISOString(),
      shipped_at: new Date(Date.now() - 3_600_000).toISOString(),
    });
    const stats = computeSellerStats(mockProfile, [badTxn]);
    expect(stats.medianShipHours).toBeNull(); // filtré
  });

  it('lastActiveDaysAgo calculé depuis updated_at', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86_400_000).toISOString();
    const profile = { ...mockProfile, updated_at: threeDaysAgo };
    const stats = computeSellerStats(profile, []);
    expect(stats.lastActiveDaysAgo).toBeCloseTo(3, 0);
  });
});

// ── computeSellerBadges ───────────────────────────────────────────────────────

describe('computeSellerBadges — badge "Vendeur vérifié" (shield)', () => {
  it('forfait payant + 0 commandes → obtient le badge', () => {
    const badges = computeSellerBadges(mockProfile, []); // mockProfile est premium
    expect(badges.some(b => b.icon === 'shield')).toBe(true);
  });

  it('free + 4 commandes livrées → PAS de badge', () => {
    const txns = makeCompletedTxns(4);
    const badges = computeSellerBadges(mockFreeProfil, txns);
    expect(badges.some(b => b.icon === 'shield')).toBe(false);
  });

  it('free + 5 commandes livrées → obtient le badge', () => {
    const txns = makeCompletedTxns(5);
    const badges = computeSellerBadges(mockFreeProfil, txns);
    expect(badges.some(b => b.icon === 'shield')).toBe(true);
  });
});

describe('computeSellerBadges — badge "Expédition rapide" (truck)', () => {
  it('5 commandes + médiane < 24h → badge obtenu', () => {
    const txns = makeCompletedTxns(5, 12); // expédié en 12h
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'truck')).toBe(true);
  });

  it('5 commandes + médiane > 24h → PAS de badge', () => {
    const txns = makeCompletedTxns(5, 30); // expédié en 30h
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'truck')).toBe(false);
  });

  it('3 commandes + médiane < 24h → PAS de badge (besoin de 5+)', () => {
    const txns = makeCompletedTxns(3, 6);
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'truck')).toBe(false);
  });

  it('sans aucun shipped_at → PAS de badge', () => {
    const txns = makeCompletedTxns(10); // makeCompletedTxns sans shipHours → shipped_at=null
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'truck')).toBe(false);
  });
});

describe('computeSellerBadges — badge "Top vendeur" (award)', () => {
  it('19 commandes → PAS de badge',  () => {
    const badges = computeSellerBadges(mockProfile, makeCompletedTxns(19));
    expect(badges.some(b => b.icon === 'award')).toBe(false);
  });

  it('20 commandes → badge obtenu', () => {
    const badges = computeSellerBadges(mockProfile, makeCompletedTxns(20));
    expect(badges.some(b => b.icon === 'award')).toBe(true);
  });

  it('50 commandes → badge obtenu', () => {
    const badges = computeSellerBadges(mockProfile, makeCompletedTxns(50));
    expect(badges.some(b => b.icon === 'award')).toBe(true);
  });
});

describe('computeSellerBadges — badge "Réactif" (zap)', () => {
  it('actif il y a 3 jours → badge obtenu', () => {
    const profile = { ...mockProfile, updated_at: new Date(Date.now() - 3 * 86_400_000).toISOString() };
    const badges = computeSellerBadges(profile, []);
    expect(badges.some(b => b.icon === 'zap')).toBe(true);
  });

  it('actif exactement il y a 7 jours → badge obtenu', () => {
    const profile = { ...mockProfile, updated_at: new Date(Date.now() - 7 * 86_400_000).toISOString() };
    const badges = computeSellerBadges(profile, []);
    expect(badges.some(b => b.icon === 'zap')).toBe(true);
  });

  it('actif il y a 8 jours → PAS de badge', () => {
    const profile = { ...mockProfile, updated_at: new Date(Date.now() - 8 * 86_400_000).toISOString() };
    const badges = computeSellerBadges(profile, []);
    expect(badges.some(b => b.icon === 'zap')).toBe(false);
  });
});

describe('computeSellerBadges — badge "Fiable" (refresh)', () => {
  it('10 commandes, 0 annulée → badge obtenu', () => {
    const txns = makeCompletedTxns(10);
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'refresh')).toBe(true);
  });

  it('10 commandes, 1 annulée (10%) → PAS de badge', () => {
    const txns = [
      ...makeCompletedTxns(9),
      makeTransaction({ status: 'cancelled' }),
    ];
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'refresh')).toBe(false);
  });

  it('9 commandes, 0 annulée → PAS de badge (besoin de 10+)', () => {
    const txns = makeCompletedTxns(9);
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'refresh')).toBe(false);
  });

  it('20 commandes, 1 annulée (5%) → exactement à la limite → PAS de badge (< 5%)', () => {
    // 1/20 = 0.05 → condition est < 0.05 donc 5% exactement ne passe PAS
    const txns = [
      ...makeCompletedTxns(19),
      makeTransaction({ status: 'cancelled' }),
    ];
    const badges = computeSellerBadges(mockProfile, txns);
    expect(badges.some(b => b.icon === 'refresh')).toBe(false);
  });
});

// ── Labels bilingues ──────────────────────────────────────────────────────────

describe('computeSellerBadges — labels bilingues', () => {
  it('chaque badge a labelFr et labelEn non vides', () => {
    const allTxns = makeCompletedTxns(30, 12);
    const activePro = {
      ...mockProfile,
      updated_at: new Date().toISOString(),
    };
    const badges = computeSellerBadges(activePro, allTxns);
    for (const b of badges) {
      expect(b.labelFr, `labelFr manquant pour ${b.icon}`).toBeTruthy();
      expect(b.labelEn, `labelEn manquant pour ${b.icon}`).toBeTruthy();
    }
  });
});
