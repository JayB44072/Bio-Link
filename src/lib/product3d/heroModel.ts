import * as THREE from 'three';
import { supabase } from '../supabase';
import type { Rgba } from '../photo/rgba';
import { buildModel, DEFAULT_MODEL_ID, getModel } from './catalog';
import { heroPhotoPath, isPhotoRelief, parseModelToken, type PhotoKind } from './modelToken';
import { buildPhotoRelief, PHOTO_META } from './photoModel';
import type { Label, Product3D } from './types';

const BUCKET = 'product-images';

/** Ce que les héros ont besoin de connaître du produit affiché. */
export interface HeroModelMeta {
  name: Label;
  parts: Record<string, Label>;
  /** Rotation (rad) selon la progression du défilement (0..1) ; par défaut un tour partiel. */
  yaw?: (progress: number) => number;
}

export interface HeroModel {
  product: Product3D;
  meta: HeroModelMeta;
}

/** Adresse publique d'une photo de héros enregistrée par le vendeur. */
export function heroPhotoUrl(ownerId: string, photoId: string, kind: PhotoKind): string {
  return supabase.storage.from(BUCKET).getPublicUrl(heroPhotoPath(ownerId, photoId, kind)).data.publicUrl;
}

/** Charge une image (CORS autorisé pour pouvoir lire ses pixels). */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image introuvable : ${url}`));
    img.src = url;
  });
}

/** Dessine une image dans un canvas (plus grand côté ≤ `maxSide`). */
export function imageToCanvas(img: CanvasImageSource & { width: number; height: number }, maxSide: number): HTMLCanvasElement {
  const k = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.width * k));
  canvas.height = Math.max(1, Math.round(img.height * k));
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function canvasToRgba(canvas: HTMLCanvasElement): Rgba {
  const d = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height);
  return { width: d.width, height: d.height, data: d.data };
}

/** Recouvre les zones « photo » d'un modèle du catalogue (imprimé, étiquette, écran) avec l'image du vendeur. */
export function applyPhoto(product: Product3D, source: HTMLCanvasElement): number {
  let applied = 0;
  const aspectTex = source.width / source.height;
  product.root.traverse(o => {
    const fit = o.userData.photoTarget as 'plane' | 'wrap' | undefined;
    const m = o as THREE.Mesh;
    if (!fit || !m.isMesh) return;
    const material = m.material as THREE.MeshStandardMaterial;
    const tex = new THREE.CanvasTexture(source);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    if (fit === 'plane') {
      // Recadrage « cover » : la photo remplit la zone sans être déformée
      m.geometry.computeBoundingBox();
      const bb = m.geometry.boundingBox!;
      const aspectTarget = (bb.max.x - bb.min.x) / Math.max(1e-6, bb.max.y - bb.min.y);
      if (aspectTarget > aspectTex) { tex.repeat.set(1, aspectTex / aspectTarget); tex.offset.set(0, (1 - tex.repeat.y) / 2); }
      else { tex.repeat.set(aspectTarget / aspectTex, 1); tex.offset.set((1 - tex.repeat.x) / 2, 0); }
    }
    material.map = tex;
    material.color.set('#ffffff');
    material.emissiveMap = tex; // écrans lumineux, et halo de mise en valeur qui garde les couleurs de la photo
    material.needsUpdate = true;
    applied++;
  });
  return applied;
}

/** Photo de héros → objet 3D en relief (photo détourée enregistrée par le vendeur). */
async function loadPhotoRelief(ownerId: string, photoId: string): Promise<HeroModel> {
  const img = await loadImage(heroPhotoUrl(ownerId, photoId, 'cutout'));
  const canvas = imageToCanvas(img, 1024);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 8;
  // La photo d'origine ne tourne jamais de profil : un objet plat vu de côté disparaîtrait
  const product = buildPhotoRelief(canvasToRgba(canvas), texture);
  return { product, meta: { ...PHOTO_META, yaw: p => -0.7 + 1.4 * p } };
}

/**
 * Construit le produit 3D d'un héros à partir de son identifiant (catalogue, catalogue + photo, ou photo en relief).
 * En cas d'échec de la photo (fichier absent, CORS), on retombe sur le modèle de base.
 */
export async function loadHeroModel(token: string | null, accent: string, ownerId?: string | null): Promise<HeroModel> {
  const t = parseModelToken(token);
  if (isPhotoRelief(t) && ownerId) {
    try { return await loadPhotoRelief(ownerId, t.photoId!); } catch { /* repli sur le catalogue */ }
  }
  const def = getModel(t.base) ?? getModel(DEFAULT_MODEL_ID)!;
  const product = buildModel(def, accent);
  if (t.photoId && def.photo && ownerId) {
    try {
      const img = await loadImage(heroPhotoUrl(ownerId, t.photoId, 'source'));
      applyPhoto(product, imageToCanvas(img, 1024));
    } catch { /* le modèle reste avec ses couleurs d'origine */ }
  }
  return { product, meta: { name: def.name, parts: def.parts } };
}

/** Noms des pièces connus avant le chargement (évite de vider les légendes pendant l'attente). */
export function initialHeroMeta(token: string | null): HeroModelMeta {
  const t = parseModelToken(token);
  if (isPhotoRelief(t)) return { ...PHOTO_META };
  const def = getModel(t.base) ?? getModel(DEFAULT_MODEL_ID)!;
  return { name: def.name, parts: def.parts };
}
