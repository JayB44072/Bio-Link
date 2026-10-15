import { supabase } from '../supabase';
import type { Profile } from '../types';

/** Met à jour des champs du profil d'un utilisateur (hors données financières). */
export function updateProfile(userId: string, patch: Record<string, unknown> | Partial<Profile>) {
  return supabase.from('profiles').update(patch).eq('user_id', userId);
}
