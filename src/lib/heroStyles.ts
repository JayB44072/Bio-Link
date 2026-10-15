import { SHOP_THEMES } from './planLimits';

export type HeroLayout = 'split' | 'editorial' | 'circle' | 'carousel' | 'polaroid' | 'market' | 'duo';

interface Label { fr: string; en: string; pt?: string; de?: string }

/** Habillage du hero photo d'un thème (couleurs fixes, indépendantes du mode clair/sombre). */
export interface HeroStyle {
  layout: HeroLayout;
  bg: string;
  ink: string;
  muted: string;
  accent: string;
  button: string;
  buttonInk: string;
  /** Rayon de la carte du hero (CSS) */
  radius: string;
  /** Forme des photos (CSS border-radius), sinon arrondi standard */
  photoShape?: string;
  eyebrow: Label;
}

const HERO_STYLES: Record<string, HeroStyle> = {
  default: {
    layout: 'split', radius: '24px',
    bg: 'linear-gradient(135deg,#6C63FF 0%,#8b5cf6 55%,#00C2FF 130%)',
    ink: '#ffffff', muted: 'rgba(255,255,255,0.82)', accent: '#ffffff', button: '#ffffff', buttonInk: '#4338ca',
    eyebrow: { fr: 'Bienvenue', en: 'Welcome', pt: 'Bem-vindo', de: 'Willkommen' },
  },
  elegance: {
    layout: 'editorial', radius: '4px',
    bg: '#ececec', ink: '#111111', muted: '#6b6b6b', accent: '#111111', button: '#111111', buttonInk: '#ffffff',
    eyebrow: { fr: 'Collection', en: 'Collection', pt: 'Coleção', de: 'Kollektion' },
  },
  modern: {
    layout: 'split', radius: '28px',
    bg: 'linear-gradient(135deg,#d4a574,#e8c99b,#f0dcc0)',
    ink: '#3a2812', muted: 'rgba(58,40,18,0.78)', accent: '#e07a2b', button: '#e07a2b', buttonInk: '#ffffff',
    eyebrow: { fr: 'Découvrez notre sélection', en: 'Discover our selection', pt: 'Descubra a seleção', de: 'Unsere Auswahl' },
  },
  luxury: {
    layout: 'circle', radius: '24px',
    bg: 'radial-gradient(100% 90% at 50% 0%,#2a2113 0%,#0a0a0a 70%)',
    ink: '#f5f0e8', muted: '#a99a78', accent: '#C9A96E', button: 'linear-gradient(135deg,#C9A96E,#a8894e)', buttonInk: '#1a1405',
    eyebrow: { fr: 'La collection', en: 'The collection', pt: 'A coleção', de: 'Die Kollektion' },
  },
  coral: {
    layout: 'duo', radius: '8px',
    bg: '#f0f0f0', ink: '#2b2b2b', muted: '#8b8b8b', accent: '#f9c9b8', button: '#ff7a5c', buttonInk: '#ffffff',
    eyebrow: { fr: 'Tous les produits', en: 'All products', pt: 'Todos os produtos', de: 'Alle Produkte' },
  },
  tech: {
    layout: 'carousel', radius: '24px',
    bg: '#f0f7ff', ink: '#0a67c2', muted: '#3b7fc4', accent: '#0a67c2', button: '#e85a15', buttonInk: '#ffffff',
    eyebrow: { fr: 'Offres du moment', en: "Today's offers", pt: 'Ofertas do momento', de: 'Aktuelle Angebote' },
  },
  burgundy: {
    layout: 'carousel', radius: '8px',
    bg: 'linear-gradient(135deg,#7a1a29,#5a1220)',
    ink: '#ffffff', muted: 'rgba(255,255,255,0.8)', accent: '#f3c4cb', button: '#ffffff', buttonInk: '#7a1a29',
    eyebrow: { fr: 'Collection exclusive', en: 'Exclusive collection', pt: 'Coleção exclusiva', de: 'Exklusive Kollektion' },
  },
  vintage: {
    layout: 'polaroid', radius: '12px',
    bg: '#efe4d0', ink: '#3d2b1a', muted: '#7a5d3e', accent: '#8b5a2b', button: '#8b5a2b', buttonInk: '#fff7e8',
    eyebrow: { fr: 'Sélection artisanale', en: 'Handpicked selection', pt: 'Seleção artesanal', de: 'Handverlesen' },
  },
  marketplace: {
    layout: 'market', radius: '12px',
    bg: 'linear-gradient(135deg,#1877f2,#0a52c4)',
    ink: '#ffffff', muted: 'rgba(255,255,255,0.85)', accent: '#ffffff', button: '#ffffff', buttonInk: '#1877f2',
    eyebrow: { fr: 'Boutique', en: 'Marketplace', pt: 'Loja', de: 'Marktplatz' },
  },
  nature: {
    layout: 'split', radius: '32px', photoShape: '42% 58% 55% 45% / 52% 42% 58% 48%',
    bg: 'linear-gradient(135deg,#e3eed6,#bcd6a4)',
    ink: '#27402a', muted: '#4f6b4c', accent: '#4c6f40', button: '#4c6f40', buttonInk: '#ffffff',
    eyebrow: { fr: 'Produits naturels', en: 'Natural products', pt: 'Produtos naturais', de: 'Naturprodukte' },
  },
};

/** Noir ou blanc, selon ce qui se lit le mieux sur une couleur hexadécimale (noir par défaut si inconnue). */
export function readableOn(color: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return '#111111';
  const n = parseInt(m[1], 16);
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.6 ? '#111111' : '#ffffff';
}

/** Style du hero photo d'un thème. Les thèmes Showroom reprennent la scène de leur héros 3D. */
export function heroStyleFor(themeId: string): HeroStyle {
  const known = HERO_STYLES[themeId];
  if (known) return known;
  const h = SHOP_THEMES[themeId]?.hero3d;
  if (h) {
    return {
      layout: 'split', radius: '28px', bg: h.stage, ink: h.ink, muted: h.muted, accent: h.accent,
      button: h.ink, buttonInk: readableOn(h.ink),
      eyebrow: { fr: 'Nouveautés', en: 'New in', pt: 'Novidades', de: 'Neuheiten' },
    };
  }
  return HERO_STYLES.default;
}

export const HERO_THEME_IDS = Object.keys(HERO_STYLES);
