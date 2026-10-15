import { SHOP_THEMES, ShopThemeConfig, Hero3DStyle } from './planLimits';

/**
 * La valeur stockée dans `profiles.theme` est de la forme "<themeId>[:<modelId>[:3d]]" :
 *  - "luxury"            thème simple, hero photo
 *  - "neon:laptop"       thème Showroom (3D d'office) avec le produit choisi
 *  - "luxury:sneaker:3d" héros 3D activé (option Premium) sur un thème classique
 *  - "luxury::3d"        idem, produit deviné automatiquement
 *  - "neon:laptop:scroll" héros 3D piloté par le défilement (au lieu de la boucle automatique)
 * Aucune migration n'est nécessaire.
 */
export interface ThemeValue {
  themeId: string;
  modelId: string | null;
  /** Héros 3D demandé explicitement (les thèmes Showroom l'ont d'office). */
  use3d: boolean;
  /** Animation pilotée par le défilement (sinon boucle automatique). */
  scroll: boolean;
}

export function parseThemeValue(value: string | null | undefined): ThemeValue {
  const raw = (value ?? '').trim();
  if (!raw) return { themeId: 'default', modelId: null, use3d: false, scroll: false };
  const [themeId, modelId, flag] = raw.split(':');
  return { themeId: themeId || 'default', modelId: modelId || null, use3d: flag === '3d' || flag === 'scroll', scroll: flag === 'scroll' };
}

export function formatThemeValue(themeId: string, modelId?: string | null, use3d = false, scroll = false): string {
  if (scroll) return `${themeId}:${modelId ?? ''}:scroll`;
  if (use3d) return `${themeId}:${modelId ?? ''}:3d`;
  return modelId ? `${themeId}:${modelId}` : themeId;
}

/** Thème de boutique effectif (retombe sur `default` si l'identifiant est inconnu). */
export function resolveShopTheme(value: string | null | undefined): { themeId: string; modelId: string | null; use3d: boolean; scroll: boolean; config: ShopThemeConfig } {
  const { themeId, modelId, use3d, scroll } = parseThemeValue(value);
  const known = themeId in SHOP_THEMES;
  return { themeId: known ? themeId : 'default', modelId, use3d, scroll, config: SHOP_THEMES[known ? themeId : 'default'] };
}

/** Habillage 3D d'un thème classique : scène sombre teintée par la couleur d'accent du thème. */
export function deriveHero3DStyle(config: ShopThemeConfig): Hero3DStyle {
  const accent = config.accentColor ?? '#6C63FF';
  return {
    stage: `radial-gradient(100% 80% at 50% 20%,color-mix(in srgb,${accent} 38%,#0b0b12) 0%,#0b0b12 75%)`,
    accent,
    rim: accent,
    ink: '#f5f5f7',
    muted: '#a8a8b3',
    chip: 'rgba(255,255,255,0.12)',
  };
}

/**
 * Quel hero afficher ? Le héros 3D est une option Premium : activé d'office sur les thèmes Showroom,
 * sur demande pour les autres. Hors Premium, on retombe sur le hero photo.
 */
export function resolveHero(value: string | null | undefined, plan: string | null | undefined) {
  const r = resolveShopTheme(value);
  const wants3d = r.use3d || !!r.config.hero3d;
  return {
    ...r,
    mode: wants3d && plan === 'premium' ? ('3d' as const) : ('photo' as const),
    /** Animation pilotée par le défilement (thème Cinéma) plutôt que boucle automatique. */
    scroll: r.config.heroMode === 'scroll' || r.scroll,
    style3d: r.config.hero3d ?? deriveHero3DStyle(r.config),
  };
}
