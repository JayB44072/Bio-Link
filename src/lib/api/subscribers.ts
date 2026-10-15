import { supabase } from '../supabase';

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
  unsubscribed_at: string | null;
}

/** Vérification simple côté interface (le serveur revalide). */
export function isValidEmail(email: string): boolean {
  const e = email.trim();
  return e.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
}

export type SubscribeError = 'invalid_email' | 'not_found' | 'limit_reached' | 'unavailable';

/** Abonne un visiteur à la page publique d'un vendeur (fonction `subscribe_to_page`, accessible sans compte). */
export async function subscribeToPage(username: string, email: string): Promise<{ ok: true } | { ok: false; error: SubscribeError }> {
  if (!isValidEmail(email)) return { ok: false, error: 'invalid_email' };
  try {
    const { data, error } = await supabase.rpc('subscribe_to_page', { p_username: username, p_email: email.trim() });
    if (error || !data) return { ok: false, error: 'unavailable' };
    const r = data as { ok?: boolean; error?: SubscribeError };
    if (!r.ok) return { ok: false, error: r.error ?? 'unavailable' };
    // E-mail de bienvenue avec le lien privé « Voir mes livraisons » : ne bloque jamais l'abonnement
    Promise.resolve(supabase.functions.invoke('welcome-subscriber', { body: { username, email: email.trim() } })).catch(() => {});
    return { ok: true };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

/** Désabonnement par le lien reçu dans un e-mail. Renvoie vrai si un abonnement actif a été arrêté. */
export async function unsubscribeFromPage(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('unsubscribe_from_page', { p_token: token });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Abonnés du vendeur connecté (lecture protégée par RLS), du plus récent au plus ancien. */
export async function listSubscribers(): Promise<Subscriber[]> {
  const { data } = await supabase.from('page_subscribers').select('id, email, created_at, unsubscribed_at')
    .order('created_at', { ascending: false });
  return (data as Subscriber[] | null) ?? [];
}

/** Nombre d'abonnés actifs du vendeur connecté. */
export async function countActiveSubscribers(): Promise<number> {
  const { count } = await supabase.from('page_subscribers').select('id', { count: 'exact', head: true }).is('unsubscribed_at', null);
  return count ?? 0;
}

export function deleteSubscriber(id: string) {
  return supabase.from('page_subscribers').delete().eq('id', id);
}

/** Export CSV des abonnés actifs (échappe les guillemets ; en-tête inclus). */
export function subscribersToCsv(subs: Subscriber[]): string {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = subs.filter(s => !s.unsubscribed_at).map(s => `${esc(s.email)},${esc(s.created_at)}`);
  return ['email,subscribed_at', ...rows].join('\n');
}
