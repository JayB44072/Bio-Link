import { supabase } from './supabase';

/** Chiffres réels affichés sur la landing. Un champ à `null` = donnée indisponible (on ne l'affiche pas). */
export interface PublicStats {
  shops: number | null;
  sales: number | null;
  rating: number | null;
  reviews: number | null;
}

const EMPTY: PublicStats = { shops: null, sales: null, rating: null, reviews: null };

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
};

/** Normalise la réponse de la fonction `public_stats` (ou d'un équivalent). */
export function parsePublicStats(raw: unknown): PublicStats {
  if (!raw || typeof raw !== 'object') return EMPTY;
  const r = raw as Record<string, unknown>;
  const reviews = num(r.reviews);
  return {
    shops: num(r.shops),
    sales: num(r.sales),
    reviews,
    // Une note moyenne n'a de sens que s'il existe au moins un avis.
    rating: reviews && reviews > 0 ? num(r.rating) : null,
  };
}

/**
 * Récupère les chiffres publics.
 * 1) fonction `public_stats` (totaux agrégés, voir supabase/migrations) ;
 * 2) sinon, repli sur les tables lisibles publiquement (profils, avis) ;
 *    les ventes ne sont alors pas affichées.
 */
export async function fetchPublicStats(): Promise<PublicStats> {
  try {
    const { data, error } = await supabase.rpc('public_stats');
    if (!error && data) return parsePublicStats(data);
  } catch { /* repli ci-dessous */ }

  try {
    const [profiles, reviews] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('reviews').select('rating').limit(1000),
    ]);
    const ratings = (reviews.data ?? []).map(r => Number((r as { rating: number }).rating)).filter(Number.isFinite);
    return parsePublicStats({
      shops: profiles.count,
      sales: null,
      reviews: ratings.length,
      rating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    });
  } catch {
    return EMPTY;
  }
}
