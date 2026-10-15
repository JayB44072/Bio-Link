import type * as THREE from 'three';

/** Une pièce (ou un groupe de pièces) qui se déplace en vue éclatée. */
export interface ProductItem {
  group: string;
  object: THREE.Object3D;
  /** Déplacement en vue éclatée. */
  explode: THREE.Vector3;
  materials: THREE.MeshStandardMaterial[];
}

/** Produit 3D prêt à être animé : pièces assemblées autour de l'origine, posées sur y = 0. */
export interface Product3D {
  root: THREE.Group;
  items: ProductItem[];
  /** Ordre de présentation des groupes de pièces. */
  groups: string[];
  dispose: () => void;
}

export interface Label { fr: string; en: string }

export type CategoryId = 'footwear' | 'clothing' | 'drinks' | 'tech' | 'accessories';

/** Fiche d'un produit du catalogue. */
export interface ModelDef {
  id: string;
  category: CategoryId;
  name: Label;
  /** Pièces dans l'ordre de présentation : clé → nom affiché. */
  parts: Record<string, Label>;
  /** Mots (minuscules, sans accents) qui rattachent un produit réel à ce modèle. */
  keywords: string[];
  /** Le produit possède une zone (imprimé, étiquette, écran) qui peut recevoir la photo du vendeur. */
  photo?: boolean;
  /** Construit le produit ; `accent` colore la pièce signature. */
  build: (accent?: string) => Product3D;
}

/** Cadrage de la caméra, en unités de la scène (après mise à l'échelle). */
export interface Framing {
  scale: number;
  lookIdle: number;
  lookExploded: number;
  /** Hauteur visible (moitié) selon la phase. */
  halfHIdle: number;
  halfHExploded: number;
  halfHFocus: number;
  /** Largeur visible (moitié) selon la phase. */
  halfWIdle: number;
  halfWExploded: number;
  halfWFocus: number;
  /** Hauteur sur laquelle la caméra se centre pour présenter un groupe. */
  focusY: (group: string) => number;
  /** Dimensions du sol sous le produit. */
  shadow: { w: number; d: number };
}
