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
    max_products: 20,
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
    max_products: 35,
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

  /* ── Elegance: white bg, clean minimal cards, 4-col, subtle shadows, serif feel ── */
  elegance: {
    pageBg: '#faf9f6', pageBgLight: null,
    cardBg: '#ffffff', cardBgLight: null,
    cardBorder: 'rgba(0,0,0,0.06)', cardBorderLight: null,
    textColor: '#1a1a1a', textColorLight: null,
    subtextColor: '#888888', subtextColorLight: null,
    priceColor: '#1a1a1a',
    buttonGradient: 'linear-gradient(135deg,#1a1a1a,#333333)',
    imageRadius: 'rounded-none', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-lg', cardShadow: '0 1px 8px rgba(0,0,0,0.06)',
    headerBg: 'rgba(250,249,246,0.95)', headerBgLight: null,
    inherentlyDark: false,
  },

  /* ── Modern: warm cream bg, large rounded cards, bold ── */
  modern: {
    pageBg: '#FFF8F0', pageBgLight: null,
    cardBg: '#ffffff', cardBgLight: null,
    cardBorder: 'rgba(0,0,0,0.05)', cardBorderLight: null,
    textColor: '#2d2d2d', textColorLight: null,
    subtextColor: '#999999', subtextColorLight: null,
    priceColor: '#e85d3a',
    buttonGradient: 'linear-gradient(135deg,#e85d3a,#ff8a5c)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cardRadius: 'rounded-3xl', cardShadow: '0 4px 20px rgba(0,0,0,0.06)',
    headerBg: 'rgba(255,248,240,0.95)', headerBgLight: null,
    inherentlyDark: false,
  },

  /* ── Luxury: black bg, gold accents, circular product images ── */
  luxury: {
    pageBg: '#0a0a0a', pageBgLight: null,
    cardBg: '#141414', cardBgLight: null,
    cardBorder: 'rgba(201,169,110,0.2)', cardBorderLight: null,
    textColor: '#f5f0e8', textColorLight: null,
    subtextColor: '#8a8070', subtextColorLight: null,
    priceColor: '#C9A96E',
    buttonGradient: 'linear-gradient(135deg,#C9A96E,#a8894e)',
    imageRadius: 'rounded-full', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-2xl', cardShadow: '0 4px 24px rgba(0,0,0,0.4)',
    headerBg: 'rgba(10,10,10,0.95)', headerBgLight: null,
    inherentlyDark: true,
  },

  /* ── Neon: dark bg with vibrant neon glow ── */
  neon: {
    pageBg: '#0d0d1a', pageBgLight: null,
    cardBg: '#13132a', cardBgLight: null,
    cardBorder: 'rgba(0,255,136,0.15)', cardBorderLight: null,
    textColor: '#e0ffe0', textColorLight: null,
    subtextColor: '#5a7a6a', subtextColorLight: null,
    priceColor: '#00ff88',
    buttonGradient: 'linear-gradient(135deg,#00ff88,#00ccff)',
    imageRadius: 'rounded-xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-2xl', cardShadow: '0 0 20px rgba(0,255,136,0.08)',
    headerBg: 'rgba(13,13,26,0.95)', headerBgLight: null,
    inherentlyDark: true,
  },

  /* ── Nature: earthy greens, organic feel ── */
  nature: {
    pageBg: '#f4f1eb', pageBgLight: null,
    cardBg: '#ffffff', cardBgLight: null,
    cardBorder: 'rgba(76,111,64,0.15)', cardBorderLight: null,
    textColor: '#2c3e2c', textColorLight: null,
    subtextColor: '#7a8a6e', subtextColorLight: null,
    priceColor: '#4c6f40',
    buttonGradient: 'linear-gradient(135deg,#4c6f40,#7ab362)',
    imageRadius: 'rounded-2xl', gridCols: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    cardRadius: 'rounded-2xl', cardShadow: '0 2px 12px rgba(0,0,0,0.05)',
    headerBg: 'rgba(244,241,235,0.95)', headerBgLight: null,
    inherentlyDark: false,
  },

  /* keep dark/minimalist/geometric/etc as their default shop look */
  dark: defaultShop,
  minimalist: defaultShop,
  geometric: defaultShop,
  pastel: defaultShop,
  cyberpunk: defaultShop,
  ocean: defaultShop,
  forest: defaultShop,
  sunset: defaultShop,
  rose: defaultShop,
  gold: defaultShop,
};

export const THEMES = [
  { id: 'default', label: { fr: 'Blanc Standard', en: 'Standard White' }, bg: 'bg-white', text: 'text-gray-900', accent: 'bg-gray-900', free: true, premium: false, hasBg: false },
  { id: 'elegance', label: { fr: 'Élégance', en: 'Elegance' }, bg: 'bg-[#faf9f6]', text: 'text-gray-900', accent: 'bg-gray-900', free: false, premium: false, hasBg: false },
  { id: 'modern', label: { fr: 'Moderne', en: 'Modern' }, bg: 'bg-[#FFF8F0]', text: 'text-gray-900', accent: 'bg-orange-500', free: false, premium: false, hasBg: false },
  { id: 'luxury', label: { fr: 'Luxe', en: 'Luxury' }, bg: 'bg-[#0a0a0a]', text: 'text-[#f5f0e8]', accent: 'bg-[#C9A96E]', free: false, premium: false, hasBg: false },
  { id: 'neon', label: { fr: 'Néon', en: 'Neon' }, bg: 'bg-[#0d0d1a]', text: 'text-[#e0ffe0]', accent: 'bg-[#00ff88]', free: false, premium: false, hasBg: false },
  { id: 'nature', label: { fr: 'Nature', en: 'Nature' }, bg: 'bg-[#f4f1eb]', text: 'text-[#2c3e2c]', accent: 'bg-[#4c6f40]', free: false, premium: false, hasBg: false },
  { id: 'dark', label: { fr: 'Sombre Élégant', en: 'Elegant Dark' }, bg: 'bg-gray-900', text: 'text-white', accent: 'bg-white', free: false, premium: false, hasBg: false },
  { id: 'minimalist', label: { fr: 'Minimaliste', en: 'Minimalist' }, bg: 'bg-gradient-to-br from-white to-gray-50', text: 'text-gray-900', accent: 'bg-gray-800', free: false, premium: false, hasBg: true },
  { id: 'geometric', label: { fr: 'Géométrique', en: 'Geometric' }, bg: 'bg-gradient-to-br from-slate-950 to-slate-900', text: 'text-white', accent: 'bg-cyan-400', free: false, premium: false, hasBg: true },
  { id: 'pastel', label: { fr: 'Pastel', en: 'Pastel' }, bg: 'bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200', text: 'text-gray-800', accent: 'bg-white', free: false, premium: false, hasBg: true },
  { id: 'cyberpunk', label: { fr: 'Cyberpunk', en: 'Cyberpunk' }, bg: 'bg-gradient-to-br from-purple-950 to-black', text: 'text-pink-200', accent: 'bg-cyan-500', free: false, premium: false, hasBg: true },
  { id: 'ocean', label: { fr: 'Océan Bleu', en: 'Blue Ocean' }, bg: 'bg-blue-950', text: 'text-blue-50', accent: 'bg-cyan-400', free: false, premium: false, hasBg: false },
  { id: 'forest', label: { fr: 'Forêt Verte', en: 'Green Forest' }, bg: 'bg-emerald-950', text: 'text-emerald-50', accent: 'bg-emerald-400', free: false, premium: false, hasBg: false },
  { id: 'sunset', label: { fr: 'Coucher de Soleil', en: 'Sunset' }, bg: 'bg-orange-950', text: 'text-orange-50', accent: 'bg-amber-400', free: false, premium: false, hasBg: false },
  { id: 'rose', label: { fr: 'Rose Doux', en: 'Soft Rose' }, bg: 'bg-rose-950', text: 'text-rose-50', accent: 'bg-rose-400', free: false, premium: false, hasBg: false },
  { id: 'gold', label: { fr: 'Or Métallisé', en: 'Metallic Gold' }, bg: 'bg-gradient-to-br from-yellow-600 via-yellow-500 to-amber-600', text: 'text-yellow-50', accent: 'bg-yellow-300', free: false, premium: true, hasBg: true },
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
