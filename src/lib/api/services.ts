import { supabase } from '../supabase';
import type { Service } from '../types';

export type ServicePayload = Omit<Service, 'id' | 'created_at'>;

export function listServices(userId: string) {
  return supabase.from('services').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

export function createService(payload: Partial<ServicePayload>) {
  return supabase.from('services').insert(payload).select().maybeSingle();
}

export function updateService(id: string, payload: Partial<ServicePayload>) {
  return supabase.from('services').update(payload).eq('id', id).select().maybeSingle();
}

/** Active ou met en pause un service. */
export function setServiceActive(id: string, isActive: boolean) {
  return supabase.from('services')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id).select().maybeSingle();
}

export function deleteService(id: string) {
  return supabase.from('services').delete().eq('id', id);
}
