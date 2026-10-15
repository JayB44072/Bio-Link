import { supabase } from '../supabase';

/** Ventes d'un vendeur, de la plus récente à la plus ancienne. */
export function listSellerTransactions(sellerId: string, limit?: number) {
  const query = supabase.from('transactions').select('*').eq('seller_id', sellerId)
    .order('created_at', { ascending: false });
  return limit ? query.limit(limit) : query;
}

/** Marque une commande comme expédiée. */
export function markTransactionShipped(id: string) {
  return supabase.from('transactions')
    .update({ status: 'shipped', shipped_at: new Date().toISOString() })
    .eq('id', id);
}

/** Annule une commande (le stock est restauré par l'appelant). */
export function cancelTransaction(id: string) {
  return supabase.from('transactions').update({ status: 'cancelled' }).eq('id', id);
}
