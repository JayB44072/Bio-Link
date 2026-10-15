import type { CategoryId, Label, ModelDef, Product3D } from './types';
import { groundAndCenter, normalize } from './kit';
import { FOOTWEAR_MODELS } from './models/footwear';
import { CLOTHING_MODELS } from './models/clothing';
import { DRINK_MODELS } from './models/drinks';
import { TECH_MODELS } from './models/tech';
import { ACCESSORY_MODELS } from './models/accessories';

/** Tous les produits 3D disponibles. */
export const MODELS: ModelDef[] = [
  ...FOOTWEAR_MODELS,
  ...CLOTHING_MODELS,
  ...DRINK_MODELS,
  ...TECH_MODELS,
  ...ACCESSORY_MODELS,
];

export const CATEGORIES: Array<{ id: CategoryId; name: Label }> = [
  { id: 'footwear', name: { fr: 'Chaussures', en: 'Footwear' } },
  { id: 'clothing', name: { fr: 'Habits et sacs', en: 'Clothing and bags' } },
  { id: 'drinks', name: { fr: 'Boissons', en: 'Drinks' } },
  { id: 'tech', name: { fr: 'Téléphones et ordinateurs', en: 'Phones and computers' } },
  { id: 'accessories', name: { fr: 'Accessoires', en: 'Accessories' } },
];

/** Produit par défaut quand aucun n'est choisi ni deviné. */
export const DEFAULT_MODEL_ID = 'sneaker';

const BY_ID = new Map(MODELS.map(m => [m.id, m]));

export const getModel = (id: string | null | undefined): ModelDef | undefined => (id ? BY_ID.get(id) : undefined);

export const modelsByCategory = (category: CategoryId) => MODELS.filter(m => m.category === category);

/** Minuscules, sans accents ni ponctuation superflue. */
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Devine le modèle 3D qui correspond le mieux à un texte libre (nom de produit, catégorie…).
 * Les mots-clés les plus longs l'emportent (« basket-ball » avant « basket »).
 */
export function guessModelId(...texts: Array<string | null | undefined>): string | null {
  const hay = ` ${norm(texts.filter(Boolean).join(' '))} `;
  if (hay.trim() === '') return null;
  let best: { id: string; len: number } | null = null;
  for (const m of MODELS) {
    for (const k of m.keywords) {
      const key = norm(k);
      if (key && hay.includes(` ${key} `) || (key && key.length > 4 && hay.includes(key))) {
        if (!best || key.length > best.len) best = { id: m.id, len: key.length };
      }
    }
  }
  return best?.id ?? null;
}

/** Construit un produit prêt à être animé : posé sur y = 0, centré et à l'échelle commune. */
export function buildModel(def: ModelDef, accent?: string): Product3D {
  const product = def.build(accent);
  groundAndCenter(product.root);
  normalize(product.root, 3);
  return product;
}
