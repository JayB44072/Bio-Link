import { supabase } from '../supabase';

export type NotifyKind = 'product' | 'service' | 'announcement' | 'custom';

export interface NotifyPayload {
  kind: NotifyKind;
  title: string;
  /** Texte court du message. */
  body?: string;
  /** Lien vers l'élément concerné (par défaut : la page publique du vendeur). */
  path?: string;
}

export type NotifyResult =
  | { ok: true; sent: number }
  | { ok: false; error: 'unavailable' | 'rate_limited' | 'no_subscribers' | 'failed' };

/**
 * Demande l'envoi d'un e-mail aux abonnés actifs de la page du vendeur connecté.
 * Passe par la fonction Edge `notify-subscribers` (les clés d'envoi restent côté serveur).
 * Ne lève jamais d'erreur : l'interface continue de fonctionner si la fonction n'est pas déployée.
 */
export async function notifySubscribers(payload: NotifyPayload): Promise<NotifyResult> {
  try {
    const { data, error } = await supabase.functions.invoke('notify-subscribers', { body: payload });
    if (error) return { ok: false, error: 'unavailable' };
    const r = data as { sent?: number; error?: string } | null;
    if (r?.error === 'rate_limited') return { ok: false, error: 'rate_limited' };
    if (r?.error === 'no_subscribers') return { ok: false, error: 'no_subscribers' };
    if (r?.error) return { ok: false, error: 'failed' };
    return { ok: true, sent: r?.sent ?? 0 };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}
