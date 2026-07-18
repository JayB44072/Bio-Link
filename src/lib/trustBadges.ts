import { Profile, Transaction } from './types';

/**
 * Trust badges are computed from real seller metrics, NOT self-declared.
 * A seller can't tick "Fast shipping" — they earn it based on their actual data.
 */

export interface ComputedBadge {
  icon: 'shield' | 'truck' | 'award' | 'refresh' | 'sparkles' | 'zap' | 'star';
  labelFr: string;
  labelEn: string;
}

interface SellerStats {
  totalCompleted: number;
  medianShipHours: number | null;
  avgRatingAllProducts: number;
  totalRatings: number;
  lastActiveDaysAgo: number;
  cancelledRatio: number;
}

export function computeSellerStats(profile: Profile, transactions: Transaction[]): SellerStats {
  const completed = transactions.filter(t => t.status === 'completed');
  const cancelled = transactions.filter(t => t.status === 'cancelled');
  const total = transactions.length;

  // Median time from created_at → shipped_at (in hours)
  const shipTimes: number[] = [];
  for (const t of transactions) {
    if (t.shipped_at && t.created_at) {
      const dt = (new Date(t.shipped_at).getTime() - new Date(t.created_at).getTime()) / 3_600_000;
      if (dt >= 0 && dt < 30 * 24) shipTimes.push(dt);
    }
  }
  shipTimes.sort((a, b) => a - b);
  const medianShipHours = shipTimes.length
    ? shipTimes[Math.floor(shipTimes.length / 2)]
    : null;

  const lastActive = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;
  const lastActiveDaysAgo = lastActive ? (Date.now() - lastActive) / 86_400_000 : Infinity;

  return {
    totalCompleted: completed.length,
    medianShipHours,
    avgRatingAllProducts: 0,
    totalRatings: 0,
    lastActiveDaysAgo,
    cancelledRatio: total > 0 ? cancelled.length / total : 0,
  };
}

export function computeSellerBadges(profile: Profile, transactions: Transaction[]): ComputedBadge[] {
  const stats = computeSellerStats(profile, transactions);
  const badges: ComputedBadge[] = [];

  // Verified seller: paid plan OR 5+ completed orders (proves real activity)
  if (profile.plan_type !== 'free' || stats.totalCompleted >= 5) {
    badges.push({
      icon: 'shield',
      labelFr: 'Vendeur vérifié',
      labelEn: 'Verified seller',
    });
  }

  // Fast shipping: median ship time < 24h AND at least 5 shipped orders
  if (stats.medianShipHours !== null && stats.medianShipHours < 24 && stats.totalCompleted >= 5) {
    badges.push({
      icon: 'truck',
      labelFr: 'Expédition rapide',
      labelEn: 'Fast shipping',
    });
  }

  // Top seller: 20+ completed orders
  if (stats.totalCompleted >= 20) {
    badges.push({
      icon: 'award',
      labelFr: 'Top vendeur',
      labelEn: 'Top seller',
    });
  }

  // Reactive: active in last 7 days
  if (stats.lastActiveDaysAgo <= 7) {
    badges.push({
      icon: 'zap',
      labelFr: 'Réactif',
      labelEn: 'Active seller',
    });
  }

  // Reliable: cancellation ratio under 5% with at least 10 orders
  if (transactions.length >= 10 && stats.cancelledRatio < 0.05) {
    badges.push({
      icon: 'refresh',
      labelFr: 'Fiable',
      labelEn: 'Reliable',
    });
  }

  return badges;
}
