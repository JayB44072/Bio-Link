import { supabase } from '../supabase';
import type { GeoPoint } from './tracking';
import type { Product } from '../types';

/** Une commande vue sur la carte du vendeur : d'où elle part, par où elle est passée, où elle va. */
export interface OrderRoute {
  id: string;
  status: string;
  productName: string;
  productImage: string;
  buyerName: string;
  amount: number;
  currency: string;
  createdAt: string;
  address: string;
  origin: GeoPoint | null;
  destination: GeoPoint | null;
  /** Dernière position connue du colis (étapes de suivi). */
  current: GeoPoint | null;
  /** Départ puis positions successives, dans l'ordre. */
  travelled: GeoPoint[];
}

interface TxRow {
  id: string; status: string; product_id: string | null; buyer_name: string; amount: number; currency: string;
  created_at: string; delivery_address: string | null; delivery_lat: number | null; delivery_lng: number | null;
}
interface EventRow { transaction_id: string; lat: number | null; lng: number | null; place_label: string | null; created_at: string }

/** Assemble les trajets à partir des commandes, des produits et des étapes de suivi (fonction pure, testée). */
export function buildOrderRoutes(txs: TxRow[], products: Pick<Product, 'id' | 'name' | 'image_url' | 'location_lat' | 'location_lng' | 'location_address'>[], events: EventRow[]): OrderRoute[] {
  const byProduct = new Map(products.map(p => [p.id, p]));
  const byTx = new Map<string, EventRow[]>();
  events.forEach(e => { if (e.lat != null && e.lng != null) byTx.set(e.transaction_id, [...(byTx.get(e.transaction_id) ?? []), e]); });

  return txs.flatMap<OrderRoute>(t => {
    const p = t.product_id ? byProduct.get(t.product_id) : undefined;
    const origin: GeoPoint | null = p && p.location_lat != null && p.location_lng != null
      ? { lat: p.location_lat, lng: p.location_lng, label: p.location_address || p.name } : null;
    const destination: GeoPoint | null = t.delivery_lat != null && t.delivery_lng != null
      ? { lat: t.delivery_lat, lng: t.delivery_lng, label: t.delivery_address ?? '' } : null;
    if (!origin && !destination) return [];

    const evs = (byTx.get(t.id) ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
    const travelled: GeoPoint[] = [];
    const push = (pt: GeoPoint | null) => {
      if (!pt) return;
      const last = travelled[travelled.length - 1];
      if (!last || last.lat !== pt.lat || last.lng !== pt.lng) travelled.push(pt);
    };
    push(origin);
    evs.forEach(e => push({ lat: e.lat as number, lng: e.lng as number, label: e.place_label ?? '' }));
    const last = evs[evs.length - 1];
    return [{
      id: t.id, status: t.status, productName: p?.name ?? '', productImage: p?.image_url ?? '', buyerName: t.buyer_name,
      amount: t.amount, currency: t.currency, createdAt: t.created_at, address: t.delivery_address ?? '',
      origin, destination, current: last ? { lat: last.lat as number, lng: last.lng as number, label: last.place_label ?? '' } : null, travelled,
    }];
  });
}

/** Commandes du vendeur connecté avec leurs trajets (lecture protégée par RLS : il ne voit que les siennes). */
export async function listOrderRoutes(sellerId: string, products: Product[]): Promise<OrderRoute[]> {
  try {
    const { data: txs } = await supabase.from('transactions')
      .select('id, status, product_id, buyer_name, amount, currency, created_at, delivery_address, delivery_lat, delivery_lng')
      .eq('seller_id', sellerId).neq('status', 'cancelled').order('created_at', { ascending: false }).limit(200);
    const rows = (txs ?? []) as TxRow[];
    if (rows.length === 0) return [];
    const { data: evs } = await supabase.from('order_tracking_events')
      .select('transaction_id, lat, lng, place_label, created_at').in('transaction_id', rows.map(r => r.id));
    return buildOrderRoutes(rows, products, (evs ?? []) as EventRow[]);
  } catch {
    return [];
  }
}

interface ServerDelivery {
  id: string; status: string; amount: number; currency: string; created_at: string;
  delivery_address: string | null; delivery_lat: number | null; delivery_lng: number | null; buyer_name: string | null;
  product_id: string | null; product_name: string | null; product_image: string | null;
  product_lat: number | null; product_lng: number | null; product_address: string | null;
  events: Array<{ lat: number; lng: number; place_label: string | null; created_at: string }>;
}

/** Livraisons d'un abonné (fonction `subscriber_deliveries`), identifié par le jeton reçu dans les e-mails de la boutique. */
export async function getSubscriberDeliveries(token: string): Promise<OrderRoute[]> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return [];
  try {
    const { data, error } = await supabase.rpc('subscriber_deliveries', { p_token: token });
    if (error || !Array.isArray(data)) return [];
    const rows = data as ServerDelivery[];
    const products = rows.filter(r => r.product_id).map(r => ({
      id: r.product_id as string, name: r.product_name ?? '', image_url: r.product_image ?? '',
      location_lat: r.product_lat, location_lng: r.product_lng, location_address: r.product_address ?? '',
    }));
    const events = rows.flatMap(r => (r.events ?? []).map(e => ({ transaction_id: r.id, ...e })));
    return buildOrderRoutes(rows.map(r => ({
      id: r.id, status: r.status, product_id: r.product_id, buyer_name: r.buyer_name ?? '', amount: r.amount, currency: r.currency,
      created_at: r.created_at, delivery_address: r.delivery_address, delivery_lat: r.delivery_lat, delivery_lng: r.delivery_lng,
    })), products, events);
  } catch {
    return [];
  }
}

/** Trajet d'une commande ouverte par l'acheteur (détail de commande) pour l'afficher sur la carte. */
export function routeFromDetails(d: { order: { id: string; status: string; amount: number; currency: string; created_at: string; delivery_address: string; buyer_name: string };
  product: { name: string; image_url: string } | null; tracking: { origin: GeoPoint | null; destination: GeoPoint | null; events: Array<{ lat: number | null; lng: number | null; place_label: string; created_at: string }> } | null }): OrderRoute | null {
  const t = d.tracking;
  if (!t || (!t.origin && !t.destination)) return null;
  const evs = t.events.filter(e => e.lat != null && e.lng != null);
  const travelled: GeoPoint[] = [];
  const push = (p: GeoPoint | null) => { if (p && !(travelled.length && travelled[travelled.length - 1].lat === p.lat && travelled[travelled.length - 1].lng === p.lng)) travelled.push(p); };
  push(t.origin);
  evs.forEach(e => push({ lat: e.lat as number, lng: e.lng as number, label: e.place_label }));
  const last = evs[evs.length - 1];
  return {
    id: d.order.id, status: d.order.status, productName: d.product?.name ?? '', productImage: d.product?.image_url ?? '', buyerName: d.order.buyer_name,
    amount: d.order.amount, currency: d.order.currency, createdAt: d.order.created_at, address: d.order.delivery_address,
    origin: t.origin, destination: t.destination, current: last ? { lat: last.lat as number, lng: last.lng as number, label: last.place_label } : null, travelled,
  };
}
