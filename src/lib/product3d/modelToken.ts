/**
 * Identifiant du produit 3D d'un héros, stocké dans `profiles.theme` :
 *   "sneaker"        modèle du catalogue
 *   "tshirt~k3x9"    modèle du catalogue recouvert de la photo « k3x9 » du vendeur (imprimé, étiquette, écran…)
 *   "photo~k3x9"     la photo « k3x9 » du vendeur, détourée et mise en relief
 */
export const PHOTO_BASE = 'photo';

export interface ModelToken {
  base: string | null;
  photoId: string | null;
}

export function parseModelToken(token: string | null | undefined): ModelToken {
  if (!token) return { base: null, photoId: null };
  const [base, photoId] = token.split('~');
  return { base: base || null, photoId: photoId && /^[a-z0-9]{3,16}$/i.test(photoId) ? photoId : null };
}

export function formatModelToken(base: string, photoId?: string | null): string {
  return photoId ? `${base}~${photoId}` : base;
}

export const isPhotoRelief = (t: ModelToken) => t.base === PHOTO_BASE && !!t.photoId;

/** Identifiant court et aléatoire pour une nouvelle photo. */
export function newPhotoId(): string {
  return Math.random().toString(36).slice(2, 10).padEnd(6, '0');
}

export type PhotoKind = 'cutout' | 'source';

/** Chemin de stockage des fichiers d'une photo de héros (dossier du vendeur). */
export function heroPhotoPath(ownerId: string, photoId: string, kind: PhotoKind): string {
  return `${ownerId}/hero/${photoId}${kind === 'cutout' ? '.png' : '-src.jpg'}`;
}
