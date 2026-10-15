import { supabase } from '../supabase';

/** Étapes de la livraison, dans l'ordre. */
export const TRACKING_STAGES = ['preparing', 'shipped', 'in_transit', 'out_for_delivery', 'arrived'] as const;
export type TrackingStage = typeof TRACKING_STAGES[number];

export interface GeoPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface TrackingEvent {
  id: string;
  stage: TrackingStage;
  lat: number | null;
  lng: number | null;
  place_label: string;
  note: string;
  created_at: string;
}

export interface OrderTracking {
  /** Le vendeur a un forfait avec carte (Business / Premium) : positions disponibles. */
  plan_map: boolean;
  /** Emplacement du produit au départ (si le vendeur l'a renseigné). */
  origin: GeoPoint | null;
  /** Adresse de livraison choisie par l'acheteur (si renseignée). */
  destination: GeoPoint | null;
  events: TrackingEvent[];
}

const LABELS: Record<TrackingStage, { fr: string; en: string }> = {
  preparing: { fr: 'Commande en préparation', en: 'Order being prepared' },
  shipped: { fr: 'Colis expédié', en: 'Parcel shipped' },
  in_transit: { fr: 'En route', en: 'In transit' },
  out_for_delivery: { fr: 'En cours de livraison', en: 'Out for delivery' },
  arrived: { fr: 'Arrivé à destination', en: 'Arrived at destination' },
};

export const stageLabel = (stage: TrackingStage, lang: string) => LABELS[stage][lang === 'fr' ? 'fr' : 'en'];

/** Rang de la dernière étape atteinte (-1 si aucune). */
export function currentStageIndex(events: Pick<TrackingEvent, 'stage'>[]): number {
  return events.reduce((max, e) => Math.max(max, TRACKING_STAGES.indexOf(e.stage)), -1);
}

/** Dernière position connue du colis. */
export function latestPosition(events: TrackingEvent[]): (GeoPoint & { at: string }) | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.lat != null && e.lng != null) return { lat: e.lat, lng: e.lng, label: e.place_label, at: e.created_at };
  }
  return null;
}

/** Trajet parcouru : départ, positions successives, puis position actuelle (sans doublons consécutifs). */
export function routePoints(tracking: Pick<OrderTracking, 'origin' | 'events'>): GeoPoint[] {
  const pts: GeoPoint[] = [];
  const push = (p: GeoPoint | null) => {
    if (!p) return;
    const last = pts[pts.length - 1];
    if (!last || last.lat !== p.lat || last.lng !== p.lng) pts.push(p);
  };
  push(tracking.origin);
  tracking.events.forEach(e => { if (e.lat != null && e.lng != null) push({ lat: e.lat, lng: e.lng, label: e.place_label }); });
  return pts;
}

/** Suivi lisible par l'acheteur (fonction `get_order_tracking`) ; `null` si la commande est introuvable ou la fonction absente. */
export async function getOrderTracking(orderId: string): Promise<OrderTracking | null> {
  try {
    const { data, error } = await supabase.rpc('get_order_tracking', { p_order_id: orderId });
    if (error || !data) return null;
    const d = data as Partial<OrderTracking>;
    return { plan_map: !!d.plan_map, origin: d.origin ?? null, destination: d.destination ?? null, events: Array.isArray(d.events) ? d.events : [] };
  } catch {
    return null;
  }
}

export type AddTrackingError = 'plan_required' | 'forbidden' | 'order_closed' | 'invalid' | 'unknown';

interface AddTrackingInput {
  transactionId: string;
  stage: TrackingStage;
  lat?: number | null;
  lng?: number | null;
  place?: string;
  note?: string;
}

/** Ajoute une étape de suivi (vendeur). Les positions sur carte exigent un forfait Business ou Premium. */
export async function addTrackingEvent(input: AddTrackingInput): Promise<{ ok: true } | { ok: false; error: AddTrackingError }> {
  try {
    const { error } = await supabase.rpc('add_tracking_event', {
      p_transaction_id: input.transactionId,
      p_stage: input.stage,
      p_lat: input.lat ?? null,
      p_lng: input.lng ?? null,
      p_place: input.place ?? '',
      p_note: input.note ?? '',
    });
    if (!error) return { ok: true };
    const msg = (error as { message?: string }).message ?? '';
    if (msg.includes('plan_required')) return { ok: false, error: 'plan_required' };
    if (msg.includes('forbidden') || msg.includes('not_authenticated')) return { ok: false, error: 'forbidden' };
    if (msg.includes('order_closed')) return { ok: false, error: 'order_closed' };
    if (msg.includes('invalid_coordinates') || msg.includes('violates check')) return { ok: false, error: 'invalid' };
    return { ok: false, error: 'unknown' };
  } catch {
    return { ok: false, error: 'unknown' };
  }
}

/** Étapes du vendeur sur une commande (lecture directe, protégée par RLS). */
export async function listTrackingEvents(transactionId: string): Promise<TrackingEvent[]> {
  const { data } = await supabase.from('order_tracking_events').select('id, stage, lat, lng, place_label, note, created_at')
    .eq('transaction_id', transactionId).order('created_at', { ascending: true });
  return (data as TrackingEvent[] | null) ?? [];
}
