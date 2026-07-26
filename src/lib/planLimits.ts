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
