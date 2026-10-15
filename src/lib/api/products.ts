import { supabase } from '../supabase';
import type { Product } from '../types';

/** Champs d'un produit à enregistrer (création ou mise à jour). */
export type ProductPayload = Omit<Product, 'id' | 'created_at' | 'avg_rating' | 'ratings_count' | 'view_count'>;

export function listProducts(userId: string) {
  return supabase.from('products').select('*').eq('user_id', userId).order('created_at', { ascending: false });
}

export function createProduct(payload: Partial<ProductPayload>) {
  return supabase.from('products').insert(payload).select().maybeSingle();
}

export function updateProduct(id: string, payload: Partial<ProductPayload>) {
  return supabase.from('products').update(payload).eq('id', id).select().maybeSingle();
}

export function deleteProduct(id: string) {
  return supabase.from('products').delete().eq('id', id);
}

export function getProductQuantity(id: string) {
  return supabase.from('products').select('quantity').eq('id', id).maybeSingle();
}

export function setProductQuantity(id: string, quantity: number) {
  return supabase.from('products').update({ quantity }).eq('id', id);
}

/** Emplacement d'un produit (point de départ du suivi de livraison). */
export function getProductLocation(id: string) {
  return supabase.from('products').select('location_lat, location_lng, location_address').eq('id', id).maybeSingle();
}