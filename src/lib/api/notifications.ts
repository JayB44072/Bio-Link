import { supabase } from '../supabase';

/** Les 20 dernières notifications d'un utilisateur. */
export function listNotifications(userId: string) {
  return supabase.from('notifications').select('*').eq('user_id', userId)
    .order('created_at', { ascending: false }).limit(20);
}

/** Marque des notifications comme lues. */
export function markNotificationsRead(ids: string[]) {
  return supabase.from('notifications').update({ is_read: true }).in('id', ids);
}
