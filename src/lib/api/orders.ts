import { supabase } from '../supabase';
import { getOrderTracking, type OrderTracking } from './tracking';

/**
 * Accès de l'acheteur (sans compte) à ses commandes.
 * Tout passe par des fonctions serveur (voir supabase/migrations/20261016000000_secure_orders.sql) :
 * la table `transactions` n'est plus lisible publiquement.
 *
 * Tant que cette migration n'est pas exécutée, les lectures retombent sur l'ancien accès direct
 * (qui fonctionne tant que l'ancienne règle publique existe). Ce repli disparaît de lui-même
 * une fois la base sécurisée, et peut être supprimé ensuite.
 */

export interface OrderSummary {
  id: string;
  status: string;
  amount: number;
  currency: string;
  created_at: string;
  product_name: string | null;
  product_image: string | null;
}

export interface OrderDetails {
  order: {
    id: string; status: string; amount: number; currency: string; quantity: number; payment_method: string;
    created_at: string; shipped_at: string | null; delivery_confirmed_at: string | null; delivery_address: string; buyer_name: string;
  };
  product: {
    id: string; name: string; description: string; image_url: string; images: string[];
    price: number; currency: string; location_address: string;
  } | null;
  seller: {
    username: string; shop_name: string; display_name: string; logo_url: string; avatar_url: string;
    whatsapp_number: string; plan_type: string;
  };
  tracking: OrderTracking | null;
}

/** La fonction serveur n'existe pas (migration pas encore exécutée). */
export function isMissingFunction(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  return !!e && (e.code === 'PGRST202' || e.code === '42883' || /could not find the function|does not exist/i.test(e.message ?? ''));
}

/* ── Détail d'une commande ── */

export async function getOrderDetails(orderId: string): Promise<OrderDetails | null> {
  try {
    const { data, error } = await supabase.rpc('get_order_details', { p_order_id: orderId });
    if (!error) {
      if (!data) return null;
      const d = data as OrderDetails;
      return { ...d, tracking: d.tracking ? normalizeTracking(d.tracking) : null };
    }
    if (!isMissingFunction(error)) return null;
  } catch { /* repli ci-dessous */ }
  return legacyOrderDetails(orderId);
}

function normalizeTracking(t: Partial<OrderTracking>): OrderTracking {
  return { plan_map: !!t.plan_map, origin: t.origin ?? null, destination: t.destination ?? null, events: Array.isArray(t.events) ? t.events : [] };
}

async function legacyOrderDetails(orderId: string): Promise<OrderDetails | null> {
  try {
    const { data: tx } = await supabase.from('transactions').select('*').eq('id', orderId).maybeSingle();
    if (!tx) return null;
    const [{ data: prod }, { data: prof }, tracking] = await Promise.all([
      tx.product_id
        ? supabase.from('products').select('id, name, description, image_url, images, price, currency, location_address').eq('id', tx.product_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase.from('profiles').select('username, shop_name, display_name, shop_logo_url, avatar_url, whatsapp_number, plan_type').eq('user_id', tx.seller_id).maybeSingle(),
      getOrderTracking(orderId),
    ]);
    return {
      order: {
        id: tx.id, status: tx.status, amount: tx.amount, currency: tx.currency, quantity: tx.quantity ?? 1, payment_method: tx.payment_method,
        created_at: tx.created_at, shipped_at: tx.shipped_at ?? null, delivery_confirmed_at: tx.delivery_confirmed_at ?? null,
        delivery_address: tx.delivery_address ?? '', buyer_name: tx.buyer_name,
      },
      product: prod ? { ...(prod as OrderDetails['product'] & object), images: (prod as { images?: string[] }).images ?? [] } as OrderDetails['product'] : null,
      seller: {
        username: prof?.username ?? '', shop_name: prof?.shop_name ?? '', display_name: prof?.display_name ?? '',
        logo_url: prof?.shop_logo_url ?? '', avatar_url: prof?.avatar_url ?? '', whatsapp_number: prof?.whatsapp_number ?? '', plan_type: prof?.plan_type ?? 'free',
      },
      tracking,
    };
  } catch {
    return null;
  }
}

/* ── Retrouver ses commandes ── */

interface LookupInput {
  /** Limiter à une boutique (onglet « Suivi » d'une page publique) ; absent = toutes les boutiques. */
  sellerId?: string | null;
  phone?: string;
  cardLast4?: string;
}

export async function lookupOrders({ sellerId = null, phone = '', cardLast4 = '' }: LookupInput): Promise<OrderSummary[]> {
  try {
    const { data, error } = await supabase.rpc('lookup_orders', { p_seller_id: sellerId, p_phone: phone || null, p_card_last4: cardLast4 || null });
    if (!error) return Array.isArray(data) ? (data as OrderSummary[]) : [];
    if (!isMissingFunction(error)) return [];
  } catch { /* repli ci-dessous */ }
  return legacyLookup({ sellerId, phone, cardLast4 });
}

async function legacyLookup({ sellerId, phone, cardLast4 }: LookupInput): Promise<OrderSummary[]> {
  try {
    let q = supabase.from('transactions').select('id, status, amount, currency, created_at, product_id').order('created_at', { ascending: false });
    if (sellerId) q = q.eq('seller_id', sellerId);
    if (cardLast4 && !phone) q = q.eq('payment_method', 'card').eq('buyer_phone', cardLast4);
    else q = q.eq('buyer_phone', (phone ?? '').trim());
    const { data } = await q;
    const rows = (data ?? []) as Array<OrderSummary & { product_id: string | null }>;
    const ids = [...new Set(rows.map(r => r.product_id).filter((x): x is string => !!x))];
    const byId = new Map<string, { name: string; image_url: string }>();
    if (ids.length) {
      const { data: prods } = await supabase.from('products').select('id, name, image_url').in('id', ids);
      (prods ?? []).forEach(p => byId.set(p.id, p));
    }
    return rows.map(r => ({ id: r.id, status: r.status, amount: r.amount, currency: r.currency, created_at: r.created_at,
      product_name: r.product_id ? byId.get(r.product_id)?.name ?? null : null, product_image: r.product_id ? byId.get(r.product_id)?.image_url ?? null : null }));
  } catch {
    return [];
  }
}

/* ── Confirmation de réception ── */

export type ConfirmDeliveryResult = { ok: true } | { ok: false; error: 'not_found' | 'not_shipped' | 'unavailable' };

/** Libère l'argent au vendeur — calcul et crédit faits côté serveur. */
export async function confirmDelivery(orderId: string): Promise<ConfirmDeliveryResult> {
  try {
    const { data, error } = await supabase.rpc('confirm_delivery', { p_order_id: orderId });
    if (error || !data) return { ok: false, error: 'unavailable' };
    const r = data as { ok?: boolean; error?: 'not_found' | 'not_shipped' };
    return r.ok ? { ok: true } : { ok: false, error: r.error ?? 'unavailable' };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

/* ── Données publiques d'un vendeur, sans données personnelles ── */

export interface SellerOrderStat { id: string; status: string; created_at: string; shipped_at: string | null }

export async function sellerRecentOrders(sellerId: string): Promise<SellerOrderStat[]> {
  try {
    const { data, error } = await supabase.rpc('seller_recent_orders', { p_seller_id: sellerId });
    if (!error) return Array.isArray(data) ? (data as SellerOrderStat[]) : [];
    if (!isMissingFunction(error)) return [];
    const { data: rows } = await supabase.from('transactions').select('id, status, created_at, shipped_at')
      .eq('seller_id', sellerId).order('created_at', { ascending: false }).limit(100);
    return (rows as SellerOrderStat[] | null) ?? [];
  } catch {
    return [];
  }
}

export interface PublicSale {
  id: string; buyer_name: string | null; delivery_address: string | null; amount: number; currency: string; created_at: string; product_name: string | null;
}

/** Dernières ventes pour la notification « vient d'acheter » : prénom + initiale et ville seulement. */
export async function recentPublicSales(sellerId: string): Promise<PublicSale[] | null> {
  try {
    const { data, error } = await supabase.rpc('recent_public_sales', { p_seller_id: sellerId });
    if (!error) return Array.isArray(data) ? (data as PublicSale[]) : [];
    return isMissingFunction(error) ? null : [];
  } catch {
    return [];
  }
}
