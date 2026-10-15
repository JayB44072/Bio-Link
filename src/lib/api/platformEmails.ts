import { supabase } from '../supabase';

export interface AnnouncementDraft {
  title: string;
  body: string;
  cta_label: string;
  /** Chemin interne commençant par « / » (ex. `/`). */
  cta_path: string;
}

export interface SentAnnouncement { id: string; title: string; recipients: number; created_at: string }

export type AnnounceError = 'unavailable' | 'forbidden' | 'rate_limited' | 'no_recipients' | 'invalid' | 'failed';
export type AnnounceResult = { ok: true; sent: number } | { ok: false; error: AnnounceError };

/** Contrôle de saisie avant envoi (le serveur revalide). Renvoie le message d'erreur, ou null. */
export function validateAnnouncement(d: AnnouncementDraft): string | null {
  if (d.title.trim().length < 3) return 'Le titre est trop court.';
  if (d.title.length > 140) return 'Le titre dépasse 140 caractères.';
  if (d.body.length > 2000) return 'Le message dépasse 2000 caractères.';
  if (d.cta_label.trim() && !d.cta_path.trim()) return 'Indiquez le lien du bouton.';
  if (d.cta_path.trim() && (!d.cta_path.startsWith('/') || d.cta_path.startsWith('//'))) return 'Le lien du bouton doit commencer par « / » (ex. /).';
  if (d.cta_path.trim() && !d.cta_label.trim()) return 'Indiquez le texte du bouton.';
  return null;
}

/** Envoie une annonce à tous les vendeurs (ou un essai à soi-même). Réservé aux administrateurs (vérifié côté serveur). */
export async function sendAnnouncement(draft: AnnouncementDraft, test: boolean): Promise<AnnounceResult> {
  if (validateAnnouncement(draft)) return { ok: false, error: 'invalid' };
  try {
    const { data, error } = await supabase.functions.invoke('platform-emails', { body: { mode: 'announce', test, ...draft } });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      return { ok: false, error: status === 403 ? 'forbidden' : 'unavailable' };
    }
    const r = data as { sent?: number; error?: string } | null;
    if (r?.error === 'rate_limited') return { ok: false, error: 'rate_limited' };
    if (r?.error === 'no_recipients') return { ok: false, error: 'no_recipients' };
    if (r?.error) return { ok: false, error: 'failed' };
    return { ok: true, sent: r?.sent ?? 0 };
  } catch {
    return { ok: false, error: 'unavailable' };
  }
}

export async function listAnnouncements(): Promise<SentAnnouncement[]> {
  try {
    const { data, error } = await supabase.functions.invoke('platform-emails', { body: { mode: 'history' } });
    if (error) return [];
    return ((data as { announcements?: SentAnnouncement[] } | null)?.announcements) ?? [];
  } catch {
    return [];
  }
}

/** Désinscription des e-mails de la plateforme via le lien reçu. Vrai si elle a été enregistrée. */
export async function unsubscribePlatformEmails(token: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('platform_email_unsubscribe', { p_token: token });
    return !error && data === true;
  } catch {
    return false;
  }
}
