import { PlanType } from './types';

export interface PlanConfig {
  name: { fr: string; en: string };
  price_fcfa: number;
  price_usd: number;
  max_products: number | null;
  max_services: number | null;
  max_social_links: number | null;
  custom_themes: boolean;
  shop_logo: boolean;
  statistics_access: boolean;
  priority_withdrawal: boolean;
  map_access: boolean;
  commission_rate: number;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free: {
    name: { fr: 'Gratuit', en: 'Free' },
    price_fcfa: 0,
    price_usd: 0,
    max_products: 10,
    max_services: 5,
    max_social_links: 2,
    custom_themes: false,
    shop_logo: false,
    statistics_access: false,
    priority_withdrawal: false,
    map_access: false,
    commission_rate: 0.05,
  },
  starter: {
    name: { fr: 'Starter', en: 'Starter' },
    price_fcfa: 2000,
    price_usd: 3.50,
    max_products: 25,
    max_services: 15,
    max_social_links: null,
    custom_themes: true,
    shop_logo: true,
    statistics_access: false,
    priority_withdrawal: false,
    map_access: false,
    commission_rate: 0.04,
  },
  business: {
    name: { fr: 'Business', en: 'Business' },
    price_fcfa: 5000,
    price_usd: 8.50,
    max_products: 55,
    max_services: 30,
    max_social_links: null,
    custom_themes: true,
    shop_logo: true,
    statistics_access: true,
    priority_withdrawal: false,
    map_access: true,
    commission_rate: 0.03,
  },
  premium: {
    name: { fr: 'Premium', en: 'Premium' },
    price_fcfa: 10000,
    price_usd: 16.50,
    max_products: null,
    max_services: null,
    max_social_links: null,
    custom_themes: true,
    shop_logo: true,
    statistics_access: true,
    priority_withdrawal: true,
    map_access: true,
    commission_rate: 0.02,
  },
};

export function canAddProduct(plan: PlanType, currentCount: number): boolean {
  const limit = PLAN_CONFIGS[plan].max_products;
  if (limit === null) return true;
  return currentCount < limit;
}

export function canAddService(plan: PlanType, currentCount: number): boolean {
  const limit = PLAN_CONFIGS[plan].max_services;
  if (limit === null) return true;
  return currentCount < limit;
}

export function getNextPlan(plan: PlanType): PlanType | null {
  const order: PlanType[] = ['free', 'starter', 'business', 'premium'];
  const idx = order.indexOf(plan);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export interface ShopThemeConfig {
  /** Page background (CSS value) */
  pageBg: string;
  /** Page background for light mode override — if null, pageBg is used regardless */
  pageBgLight: string | null;
  /** Card background */
  cardBg: string;
  cardBgLight: string | null;
  /** Card border color */
  cardBorder: string;
  cardBorderLight: string | null;
  /** Primary text */
  textColor: string;
  textColorLight: string | null;
  /** Secondary/muted text */
  subtextColor: string;
  subtextColorLight: string | null;
  /** Price color */
  priceColor: string;
  /** Button gradient */
  buttonGradient: string;
  /** Product image shape: 'square' | 'rounded-xl' | 'rounded-full' */
  imageRadius: string;
  /** Grid cols class */
  gridCols: string;
  /** Card border radius */
  cardRadius: string;
  /** Card shadow */
  cardShadow: string;
  /** Header bg */
  headerBg: string;
  headerBgLight: string | null;
  /** Whether this theme is inherently dark (disables light/dark toggle impact) */
  inherentlyDark: boolean;
  /** Decoration overlay behind the product image */
  hasCardDecoration?: 'curves' | 'pattern' | 'badge' | 'ribbon' | 'ring' | null;
  /** Style of the cart button on each product card */
  cartButtonStyle?: 'floating-circle' | 'inline' | 'below';
  /** Style of the shop header/hero */
  headerStyle?: 'default' | 'banner' | 'burgundy' | 'tech';
  /** Price rendering style */
  priceStyle?: 'inline' | 'top-left' | 'strikethrough-sale';
  /** Secondary accent color (used for banners, badges, decorations) */
  accentColor?: string;
  /** Si défini, la boutique affiche en tête un produit 3D qui se décompose en ses pièces. */
  hero3d?: Hero3DStyle;
  /** scroll : le défilement pilote l'animation 3D (hero « Cinéma »). Par défaut : boucle automatique. */
  heroMode?: 'loop' | 'scroll';
}

/** Habillage de la scène du héros 3D (les couleurs sont indépendantes du mode clair/sombre). */
export interface Hero3DStyle {
  /** Fond CSS de la scène */
  stage: string;
  /** Couleur d'accent des pièces et de la lueur */
  accent: string;
  /** Teinte de la lumière de contour */
  rim: string;
  /** Texte principal / secondaire sur la scène */
  ink: string;
  muted: string;
  /** Fond des pastilles et barres de progression */
  chip: string;
}

const defaultShop: ShopThemeConfig = {
  pageBg: '#0b0b1e', pageBgLight: '#fbfaff',
  cardBg: '#12122b', cardBgLight: '#ffffff',
  cardBorder: 'rgba(139,124,255,0.16)', cardBorderLight: 'rgba(229,231,235,0.8)',
  textColor: '#f2f1ff', textColorLight: '#111827',
  subtextColor: '#8c8ab0', subtextColorLight: '#6b7280',
  priceColor: '#34d399',
  buttonGradient: 'linear-gradient(135deg,#6C63FF,#00C2FF)',
  imageRadius: 'rounded-none', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  cardRadius: 'rounded-xl', cardShadow: '',
  headerBg: 'rgba(13,13,34,0.9)', headerBgLight: 'rgba(255,255,255,0.95)',
  inherentlyDark: false,
};

export const SHOP_THEMES: Record<string, ShopThemeConfig> = {
  default: defaultShop,

  /* ── Elegance (theme1): white bg, minimal cards, big product images, elegant look ── */
  elegance: {
    pageBg: '#141414', pageBgLight: '#f6f6f6',
    cardBg: '#1e1e1e', cardBgLight: '#ffffff',
    cardBorder: 'rgba(255,255,255,0.08)', cardBorderLight: 'rgba(0,0,0,0.06)',
    textColor: '#f5f5f5', textColorLight: '#111111',
    subtextColor: '#a0a0a0', subtextColorLight: '#8a8a8a',
    priceColor: '#f5f5f5',
    buttonGradient: 'linear-gradient(135deg,#f5f5f5,#dcdcdc)',
    imageRadius: 'rounded-none', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-none', cardShadow: '0 1px 4px rgba(0,0,0,0.04)',
    headerBg: 'rgba(20,20,20,0.98)', headerBgLight: 'rgba(255,255,255,0.98)',
    inherentlyDark: false,
    hasCardDecoration: null,
    cartButtonStyle: 'below',
    headerStyle: 'default',
    priceStyle: 'inline',
    accentColor: '#f5f5f5',
  },

  /* ── Modern (theme2): warm cream/beige bg with decorative curves ── */
  modern: {
    pageBg: '#231d13', pageBgLight: '#FBF3E6',
    cardBg: '#2f261a', cardBgLight: '#FFF3DC',
    cardBorder: 'rgba(212,165,116,0.25)', cardBorderLight: 'rgba(212,165,116,0.25)',
    textColor: '#f2e6d1', textColorLight: '#2d2418',
    subtextColor: '#c9ac82', subtextColorLight: '#a08b6b',
    priceColor: '#f0a860',
    buttonGradient: 'linear-gradient(135deg,#e07a2b,#f0a860)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 lg:grid-cols-3',
    cardRadius: 'rounded-3xl', cardShadow: '0 6px 24px rgba(0,0,0,0.35)',
    headerBg: 'rgba(35,29,19,0.96)', headerBgLight: 'rgba(251,243,230,0.96)',
    inherentlyDark: false,
    hasCardDecoration: 'curves',
    cartButtonStyle: 'below',
    headerStyle: 'default',
    priceStyle: 'inline',
    accentColor: '#e8c99b',
  },

  /* ── Luxury (theme3): deep black, circular product images with gold border ── */
  luxury: {
    pageBg: '#0a0a0a', pageBgLight: null,
    cardBg: '#111111', cardBgLight: null,
    cardBorder: 'rgba(201,169,110,0.28)', cardBorderLight: null,
    textColor: '#f5f0e8', textColorLight: null,
    subtextColor: '#9a8f78', subtextColorLight: null,
    priceColor: '#C9A96E',
    buttonGradient: 'linear-gradient(135deg,#C9A96E,#a8894e)',
    imageRadius: 'rounded-full', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-2xl', cardShadow: '0 4px 24px rgba(0,0,0,0.5)',
    headerBg: 'rgba(10,10,10,0.96)', headerBgLight: null,
    inherentlyDark: true,
    hasCardDecoration: 'ring',
    cartButtonStyle: 'below',
    headerStyle: 'default',
    priceStyle: 'inline',
    accentColor: '#C9A96E',
  },

  /* ── Coral (theme6): white bg with peach/coral banner, sale badge circles ── */
  coral: {
    pageBg: '#1a1414', pageBgLight: '#ffffff',
    cardBg: '#2a1e1e', cardBgLight: '#ffffff',
    cardBorder: 'rgba(255,122,92,0.15)', cardBorderLight: 'rgba(0,0,0,0.08)',
    textColor: '#f5e6df', textColorLight: '#2b2b2b',
    subtextColor: '#c9a89b', subtextColorLight: '#8b8b8b',
    priceColor: '#ff9a7a',
    buttonGradient: 'linear-gradient(135deg,#ff7a5c,#ff9a7a)',
    imageRadius: 'rounded-lg', gridCols: 'grid-cols-2 md:grid-cols-3',
    cardRadius: 'rounded-lg', cardShadow: '0 1px 4px rgba(0,0,0,0.3)',
    headerBg: 'rgba(26,20,20,0.98)', headerBgLight: 'rgba(255,255,255,0.98)',
    inherentlyDark: false,
    hasCardDecoration: 'badge',
    cartButtonStyle: 'inline',
    headerStyle: 'banner',
    priceStyle: 'strikethrough-sale',
    accentColor: '#f9c9b8',
  },

  /* ── Tech (theme7): blue+orange, prominent orange floating cart button ── */
  tech: {
    pageBg: '#0d1620', pageBgLight: '#ffffff',
    cardBg: '#152030', cardBgLight: '#ffffff',
    cardBorder: 'rgba(10,103,194,0.25)', cardBorderLight: 'rgba(0,102,204,0.12)',
    textColor: '#e6f0fa', textColorLight: '#1a1a1a',
    subtextColor: '#8fa5b8', subtextColorLight: '#666666',
    priceColor: '#f0f7ff',
    buttonGradient: 'linear-gradient(135deg,#e85a15,#ff7a3a)',
    imageRadius: 'rounded-xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-2xl', cardShadow: '0 2px 10px rgba(0,0,0,0.3)',
    headerBg: 'rgba(13,22,32,0.98)', headerBgLight: 'rgba(255,255,255,0.98)',
    inherentlyDark: false,
    hasCardDecoration: null,
    cartButtonStyle: 'floating-circle',
    headerStyle: 'tech',
    priceStyle: 'strikethrough-sale',
    accentColor: '#0a67c2',
  },

  /* ── Burgundy (theme8): dark burgundy header, white content ── */
  burgundy: {
    pageBg: '#1a0d10', pageBgLight: '#ffffff',
    cardBg: '#251418', cardBgLight: '#ffffff',
    cardBorder: 'rgba(165,53,72,0.2)', cardBorderLight: 'rgba(122,26,41,0.15)',
    textColor: '#f5e6ea', textColorLight: '#2b0d13',
    subtextColor: '#c9a5ad', subtextColorLight: '#8a5b64',
    priceColor: '#e08596',
    buttonGradient: 'linear-gradient(135deg,#7a1a29,#a53548)',
    imageRadius: 'rounded-md', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-lg', cardShadow: '0 2px 8px rgba(0,0,0,0.3)',
    headerBg: 'rgba(26,13,16,0.98)', headerBgLight: 'rgba(255,255,255,0.98)',
    inherentlyDark: false,
    hasCardDecoration: null,
    cartButtonStyle: 'below',
    headerStyle: 'burgundy',
    priceStyle: 'inline',
    accentColor: '#7a1a29',
  },

  /* ── Vintage (theme9): cream bg with subtle pattern, discount badges ── */
  vintage: {
    pageBg: '#1e1810', pageBgLight: '#f5efe4',
    cardBg: '#2a2218', cardBgLight: '#fbf7ee',
    cardBorder: 'rgba(183,133,72,0.2)', cardBorderLight: 'rgba(120,90,50,0.15)',
    textColor: '#f5e6cf', textColorLight: '#3d2b1a',
    subtextColor: '#c9ab82', subtextColorLight: '#8a7358',
    priceColor: '#d4a06a',
    buttonGradient: 'linear-gradient(135deg,#8b5a2b,#b78548)',
    imageRadius: 'rounded-md', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-lg', cardShadow: '0 2px 10px rgba(0,0,0,0.3)',
    headerBg: 'rgba(30,24,16,0.98)', headerBgLight: 'rgba(245,239,228,0.96)',
    inherentlyDark: false,
    hasCardDecoration: 'pattern',
    cartButtonStyle: 'below',
    headerStyle: 'default',
    priceStyle: 'strikethrough-sale',
    accentColor: '#8b5a2b',
  },

  /* ── Marketplace (theme10): gray/white, no borders, price top-left ── */
  marketplace: {
    pageBg: '#18191a', pageBgLight: '#f0f2f5',
    cardBg: '#242526', cardBgLight: '#ffffff',
    cardBorder: 'transparent', cardBorderLight: 'transparent',
    textColor: '#e4e6eb', textColorLight: '#050505',
    subtextColor: '#b0b3b8', subtextColorLight: '#65676b',
    priceColor: '#e4e6eb',
    buttonGradient: 'linear-gradient(135deg,#1877f2,#0866ff)',
    imageRadius: 'rounded-lg', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-lg', cardShadow: 'none',
    headerBg: 'rgba(24,25,26,0.98)', headerBgLight: 'rgba(255,255,255,0.98)',
    inherentlyDark: false,
    hasCardDecoration: null,
    cartButtonStyle: 'below',
    headerStyle: 'default',
    priceStyle: 'top-left',
    accentColor: '#1877f2',
  },

  /* ── Nature: earthy greens, organic feel ── */
  nature: {
    pageBg: '#141a12', pageBgLight: '#f4f1eb',
    cardBg: '#1c241a', cardBgLight: '#ffffff',
    cardBorder: 'rgba(122,179,98,0.2)', cardBorderLight: 'rgba(76,111,64,0.15)',
    textColor: '#e6f0dc', textColorLight: '#2c3e2c',
    subtextColor: '#a8c090', subtextColorLight: '#7a8a6e',
    priceColor: '#7ab362',
    buttonGradient: 'linear-gradient(135deg,#4c6f40,#7ab362)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-2xl', cardShadow: '0 2px 12px rgba(0,0,0,0.3)',
    headerBg: 'rgba(20,26,18,0.98)', headerBgLight: 'rgba(244,241,235,0.95)',
    inherentlyDark: false,
    hasCardDecoration: null,
    cartButtonStyle: 'below',
    headerStyle: 'default',
    priceStyle: 'inline',
    accentColor: '#4c6f40',
  },

  /* ── Thèmes « Showroom » : héros 3D (le produit se décompose en ses pièces) ── */

  /* Studio : fond clair de studio photo */
  studio: {
    pageBg: '#16171c', pageBgLight: '#f4f5f8',
    cardBg: '#1f2027', cardBgLight: '#ffffff',
    cardBorder: 'rgba(255,255,255,0.08)', cardBorderLight: 'rgba(15,23,42,0.07)',
    textColor: '#f3f4f8', textColorLight: '#0f172a',
    subtextColor: '#9ca0b3', subtextColorLight: '#64748b',
    priceColor: '#0f172a',
    buttonGradient: 'linear-gradient(135deg,#111827,#374151)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-3xl', cardShadow: '0 8px 28px rgba(15,23,42,0.08)',
    headerBg: 'rgba(22,23,28,0.95)', headerBgLight: 'rgba(244,245,248,0.95)',
    inherentlyDark: false,
    hasCardDecoration: null, cartButtonStyle: 'below', headerStyle: 'default', priceStyle: 'inline',
    accentColor: '#111827',
    hero3d: { stage: 'radial-gradient(120% 90% at 50% 0%,#ffffff 0%,#e9ebf2 60%,#dfe2ec 100%)', accent: '#4f46e5', rim: '#a5b4fc', ink: '#0f172a', muted: '#64748b', chip: 'rgba(15,23,42,0.08)' },
  },

  /* Néon : violet profond, lueur cyan */
  neon: {
    pageBg: '#08061a', pageBgLight: null,
    cardBg: '#120e2b', cardBgLight: null,
    cardBorder: 'rgba(124,92,255,0.3)', cardBorderLight: null,
    textColor: '#f1eeff', textColorLight: null,
    subtextColor: '#9a93cf', subtextColorLight: null,
    priceColor: '#22e4ff',
    buttonGradient: 'linear-gradient(135deg,#7c5cff,#22e4ff)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-3xl', cardShadow: '0 0 28px rgba(124,92,255,0.18)',
    headerBg: 'rgba(8,6,26,0.92)', headerBgLight: null,
    inherentlyDark: true,
    hasCardDecoration: null, cartButtonStyle: 'below', headerStyle: 'default', priceStyle: 'inline',
    accentColor: '#22e4ff',
    hero3d: { stage: 'radial-gradient(90% 70% at 50% 35%,#2a1b6e 0%,#120a38 55%,#07051a 100%)', accent: '#22e4ff', rim: '#8b6cff', ink: '#f1eeff', muted: '#a79fe0', chip: 'rgba(255,255,255,0.12)' },
  },

  /* Coucher de soleil : chaud, orange et rose */
  sunset: {
    pageBg: '#1d1210', pageBgLight: '#fff6f0',
    cardBg: '#2a1a16', cardBgLight: '#ffffff',
    cardBorder: 'rgba(255,138,92,0.22)', cardBorderLight: 'rgba(255,138,92,0.22)',
    textColor: '#ffeee4', textColorLight: '#3a1f14',
    subtextColor: '#d6a692', subtextColorLight: '#a07260',
    priceColor: '#ff7a45',
    buttonGradient: 'linear-gradient(135deg,#ff7a45,#ff4d7e)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-3xl', cardShadow: '0 8px 26px rgba(255,90,60,0.12)',
    headerBg: 'rgba(29,18,16,0.95)', headerBgLight: 'rgba(255,246,240,0.95)',
    inherentlyDark: false,
    hasCardDecoration: null, cartButtonStyle: 'below', headerStyle: 'default', priceStyle: 'inline',
    accentColor: '#ff7a45',
    hero3d: { stage: 'linear-gradient(160deg,#ffb36b 0%,#ff6f61 48%,#8e2c6d 100%)', accent: '#2b1b4a', rim: '#ffd1a1', ink: '#ffffff', muted: 'rgba(255,255,255,0.8)', chip: 'rgba(255,255,255,0.22)' },
  },

  /* Aurore : vert profond et turquoise */
  aurora: {
    pageBg: '#07151a', pageBgLight: null,
    cardBg: '#0d2128', cardBgLight: null,
    cardBorder: 'rgba(52,211,153,0.22)', cardBorderLight: null,
    textColor: '#e6fff6', textColorLight: null,
    subtextColor: '#82b5a6', subtextColorLight: null,
    priceColor: '#34d399',
    buttonGradient: 'linear-gradient(135deg,#10b981,#06b6d4)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-3xl', cardShadow: '0 8px 28px rgba(6,182,212,0.12)',
    headerBg: 'rgba(7,21,26,0.94)', headerBgLight: null,
    inherentlyDark: true,
    hasCardDecoration: null, cartButtonStyle: 'below', headerStyle: 'default', priceStyle: 'inline',
    accentColor: '#34d399',
    hero3d: { stage: 'radial-gradient(100% 80% at 30% 20%,#0f5c57 0%,#0a2f3a 55%,#061219 100%)', accent: '#5eead4', rim: '#34d399', ink: '#e6fff6', muted: '#8fc9b8', chip: 'rgba(255,255,255,0.12)' },
  },

  /* Onyx : noir et rouge, éditorial */
  onyx: {
    pageBg: '#0c0c0e', pageBgLight: null,
    cardBg: '#16161a', cardBgLight: null,
    cardBorder: 'rgba(255,255,255,0.09)', cardBorderLight: null,
    textColor: '#f5f5f7', textColorLight: null,
    subtextColor: '#9a9aa5', subtextColorLight: null,
    priceColor: '#ff4457',
    buttonGradient: 'linear-gradient(135deg,#e11d48,#ff4457)',
    imageRadius: 'rounded-xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-2xl', cardShadow: '0 10px 30px rgba(0,0,0,0.5)',
    headerBg: 'rgba(12,12,14,0.95)', headerBgLight: null,
    inherentlyDark: true,
    hasCardDecoration: null, cartButtonStyle: 'below', headerStyle: 'default', priceStyle: 'inline',
    accentColor: '#ff4457',
    hero3d: { stage: 'radial-gradient(90% 70% at 70% 30%,#3a1018 0%,#16090c 55%,#0a0a0c 100%)', accent: '#ff4457', rim: '#ff7a88', ink: '#f5f5f7', muted: '#a8a8b3', chip: 'rgba(255,255,255,0.1)' },
  },

  /* Lagon : bleu clair et frais */
  lagoon: {
    pageBg: '#0a1626', pageBgLight: '#eef7ff',
    cardBg: '#112239', cardBgLight: '#ffffff',
    cardBorder: 'rgba(56,189,248,0.22)', cardBorderLight: 'rgba(14,116,184,0.14)',
    textColor: '#e8f4ff', textColorLight: '#0b2540',
    subtextColor: '#8fb2d1', subtextColorLight: '#5b7a96',
    priceColor: '#0ea5e9',
    buttonGradient: 'linear-gradient(135deg,#0ea5e9,#6366f1)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-3xl', cardShadow: '0 8px 26px rgba(14,165,233,0.12)',
    headerBg: 'rgba(10,22,38,0.95)', headerBgLight: 'rgba(238,247,255,0.95)',
    inherentlyDark: false,
    hasCardDecoration: null, cartButtonStyle: 'below', headerStyle: 'default', priceStyle: 'inline',
    accentColor: '#0ea5e9',
    hero3d: { stage: 'linear-gradient(165deg,#bde6ff 0%,#6cc3ff 50%,#4f7cff 100%)', accent: '#1e3a8a', rim: '#ffffff', ink: '#06213f', muted: 'rgba(6,33,63,0.7)', chip: 'rgba(255,255,255,0.35)' },
  },

  /* Cinéma : scène plein cadre, le défilement pilote l'animation 3D (teal et orange, comme au cinéma) */
  cinema: {
    pageBg: '#06080c', pageBgLight: null,
    cardBg: '#0e1218', cardBgLight: null,
    cardBorder: 'rgba(255,255,255,0.08)', cardBorderLight: null,
    textColor: '#f4f7fa', textColorLight: null,
    subtextColor: '#8fa3b0', subtextColorLight: null,
    priceColor: '#ff9a5c',
    buttonGradient: 'linear-gradient(135deg,#ff7a3d,#ff3d77)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-3xl', cardShadow: '0 12px 36px rgba(0,0,0,0.55)',
    headerBg: 'rgba(6,8,12,0.88)', headerBgLight: null,
    inherentlyDark: true,
    hasCardDecoration: null, cartButtonStyle: 'below', headerStyle: 'default', priceStyle: 'inline',
    accentColor: '#ff7a3d',
    heroMode: 'scroll',
    hero3d: { stage: 'radial-gradient(90% 75% at 50% 35%,#103846 0%,#07131a 58%,#04070a 100%)', accent: '#ff7a3d', rim: '#3dd6ff', ink: '#f4f7fa', muted: '#8fa3b0', chip: 'rgba(255,255,255,0.14)' },
  },

};

export const THEMES = [
  { id: 'default',     label: { fr: 'Standard',    en: 'Standard' },    bg: 'bg-[#0b0b1e]',    text: 'text-white',           accent: 'bg-[#6C63FF]', free: true,  premium: false, hasBg: false },
  { id: 'elegance',    label: { fr: 'Élégance',    en: 'Elegance' },    bg: 'bg-[#f6f6f6]',    text: 'text-gray-900',        accent: 'bg-gray-900',  free: false, premium: false, hasBg: false },
  { id: 'modern',      label: { fr: 'Moderne',     en: 'Modern' },      bg: 'bg-[#FBF3E6]',    text: 'text-[#2d2418]',       accent: 'bg-[#e07a2b]', free: false, premium: false, hasBg: false },
  { id: 'luxury',      label: { fr: 'Luxe',        en: 'Luxury' },      bg: 'bg-[#0a0a0a]',    text: 'text-[#f5f0e8]',       accent: 'bg-[#C9A96E]', free: false, premium: false, hasBg: false },
  { id: 'coral',       label: { fr: 'Corail',      en: 'Coral' },       bg: 'bg-white',        text: 'text-gray-900',        accent: 'bg-[#ff7a5c]', free: false, premium: false, hasBg: false },
  { id: 'tech',        label: { fr: 'Tech',        en: 'Tech' },        bg: 'bg-white',        text: 'text-gray-900',        accent: 'bg-[#e85a15]', free: false, premium: false, hasBg: false },
  { id: 'burgundy',    label: { fr: 'Bordeaux',    en: 'Burgundy' },    bg: 'bg-[#7a1a29]',    text: 'text-white',           accent: 'bg-[#7a1a29]', free: false, premium: false, hasBg: false },
  { id: 'vintage',     label: { fr: 'Vintage',     en: 'Vintage' },     bg: 'bg-[#f5efe4]',    text: 'text-[#3d2b1a]',       accent: 'bg-[#8b5a2b]', free: false, premium: false, hasBg: false },
  { id: 'marketplace', label: { fr: 'Marketplace', en: 'Marketplace' }, bg: 'bg-[#f0f2f5]',    text: 'text-gray-900',        accent: 'bg-[#1877f2]', free: false, premium: false, hasBg: false },
  { id: 'nature',      label: { fr: 'Nature',      en: 'Nature' },      bg: 'bg-[#f4f1eb]',    text: 'text-[#2c3e2c]',       accent: 'bg-[#4c6f40]', free: false, premium: false, hasBg: false },
  { id: 'studio',      label: { fr: 'Studio',      en: 'Studio' },      bg: 'bg-[#e9ebf2]',    text: 'text-gray-900',        accent: 'bg-[#4f46e5]', free: false, premium: true, hasBg: false, hero3d: true },
  { id: 'neon',        label: { fr: 'Néon',        en: 'Neon' },        bg: 'bg-[#120a38]',    text: 'text-white',           accent: 'bg-[#22e4ff]', free: false, premium: true, hasBg: false, hero3d: true },
  { id: 'sunset',      label: { fr: 'Coucher de soleil', en: 'Sunset' }, bg: 'bg-[#ff6f61]',   text: 'text-white',           accent: 'bg-[#ffb36b]', free: false, premium: true, hasBg: false, hero3d: true },
  { id: 'aurora',      label: { fr: 'Aurore',      en: 'Aurora' },      bg: 'bg-[#0a2f3a]',    text: 'text-white',           accent: 'bg-[#34d399]', free: false, premium: true, hasBg: false, hero3d: true },
  { id: 'onyx',        label: { fr: 'Onyx',        en: 'Onyx' },        bg: 'bg-[#16090c]',    text: 'text-white',           accent: 'bg-[#ff4457]', free: false, premium: true, hasBg: false, hero3d: true },
  { id: 'lagoon',      label: { fr: 'Lagon',       en: 'Lagoon' },      bg: 'bg-[#6cc3ff]',    text: 'text-[#06213f]',       accent: 'bg-[#4f7cff]', free: false, premium: true, hasBg: false, hero3d: true },
  { id: 'cinema',      label: { fr: 'Cinéma',      en: 'Cinema' },      bg: 'bg-[#07131a]',    text: 'text-white',           accent: 'bg-[#ff7a3d]', free: false, premium: true,  hasBg: false, hero3d: true },
];

export const SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: 'Instagram' },
  { id: 'tiktok', label: 'TikTok', icon: 'Music' },
  { id: 'facebook', label: 'Facebook', icon: 'Facebook' },
  { id: 'twitter', label: 'X / Twitter', icon: 'Twitter' },
  { id: 'youtube', label: 'YouTube', icon: 'Youtube' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'Linkedin' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
  { id: 'telegram', label: 'Telegram', icon: 'Send' },
  { id: 'website', label: 'Site Web', icon: 'Globe' },
];
