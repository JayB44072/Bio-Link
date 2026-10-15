import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));

vi.mock('../../lib/supabase', () => ({ supabase: { rpc, from } }));

import { fetchPublicStats, parsePublicStats } from '../../lib/publicStats';

describe('parsePublicStats', () => {
  it('lit les totaux renvoyés par la fonction public_stats', () => {
    expect(parsePublicStats({ shops: 42, sales: 130, reviews: 12, rating: 4.7 }))
      .toEqual({ shops: 42, sales: 130, reviews: 12, rating: 4.7 });
  });

  it('accepte les nombres sous forme de texte (numeric Postgres)', () => {
    expect(parsePublicStats({ shops: '7', sales: '0', reviews: '3', rating: '4.5' }))
      .toEqual({ shops: 7, sales: 0, reviews: 3, rating: 4.5 });
  });

  it('ne donne pas de note quand il n\'y a aucun avis', () => {
    expect(parsePublicStats({ shops: 5, sales: 2, reviews: 0, rating: null }).rating).toBeNull();
    expect(parsePublicStats({ shops: 5, sales: 2, reviews: 0, rating: 5 }).rating).toBeNull();
  });

  it('renvoie des valeurs nulles pour une réponse invalide', () => {
    const empty = { shops: null, sales: null, rating: null, reviews: null };
    expect(parsePublicStats(null)).toEqual(empty);
    expect(parsePublicStats('nope')).toEqual(empty);
    expect(parsePublicStats({ shops: 'abc' }).shops).toBeNull();
  });
});

describe('fetchPublicStats', () => {
  beforeEach(() => {
    rpc.mockReset();
    from.mockReset();
  });

  it('utilise la fonction public_stats quand elle existe', async () => {
    rpc.mockResolvedValue({ data: { shops: 10, sales: 25, reviews: 4, rating: 4.8 }, error: null });
    const stats = await fetchPublicStats();
    expect(stats).toEqual({ shops: 10, sales: 25, reviews: 4, rating: 4.8 });
    expect(from).not.toHaveBeenCalled();
  });

  it('se replie sur les tables publiques (sans ventes) si la fonction est absente', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'function public_stats() does not exist' } });
    from.mockImplementation((table: string) => {
      if (table === 'profiles') return { select: () => Promise.resolve({ count: 9, error: null }) };
      return { select: () => ({ limit: () => Promise.resolve({ data: [{ rating: 5 }, { rating: 4 }], error: null }) }) };
    });
    const stats = await fetchPublicStats();
    expect(stats.shops).toBe(9);
    expect(stats.sales).toBeNull();
    expect(stats.reviews).toBe(2);
    expect(stats.rating).toBe(4.5);
  });

  it('renvoie des valeurs nulles si tout échoue', async () => {
    rpc.mockRejectedValue(new Error('network'));
    from.mockImplementation(() => { throw new Error('network'); });
    expect(await fetchPublicStats()).toEqual({ shops: null, sales: null, rating: null, reviews: null });
  });
});
