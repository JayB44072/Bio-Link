import { PlanType } from './types';

export interface PlanConfig {
  name: { fr: string; en: string };
  price_fcfa: number;
  price_usd: number;
  max_products: number | null;
  max_social_links: number | null;
  custom_themes: boolean;
  statistics_access: boolean;
  priority_withdrawal: boolean;
  white_label: boolean;
}

export const PLAN_CONFIGS: Record<PlanType, PlanConfig> = {
  free: {
    name: { fr: 'Gratuit', en: 'Free' },
    price_fcfa: 0,
    price_usd: 0,
    max_products: 10,
    max_social_links: 2,
    custom_themes: false,
    statistics_access: false,
    priority_withdrawal: false,
    white_label: false,
  },
  starter: {
    name: { fr: 'Starter', en: 'Starter' },
    price_fcfa: 2000,
    price_usd: 3.50,
    max_products: 20,
    max_social_links: null,
    custom_themes: true,
    statistics_access: false,
    priority_withdrawal: false,
    white_label: true,
  },
  business: {
    name: { fr: 'Business', en: 'Business' },
    price_fcfa: 5000,
    price_usd: 8.50,
    max_products: 35,
    max_social_links: null,
    custom_themes: true,
    statistics_access: true,
    priority_withdrawal: false,
    white_label: true,
  },
  premium: {
    name: { fr: 'Premium', en: 'Premium' },
    price_fcfa: 10000,
    price_usd: 16.50,
    max_products: null,
    max_social_links: null,
    custom_themes: true,
    statistics_access: true,
    priority_withdrawal: true,
    white_label: true,
  },
};

export function canAddProduct(plan: PlanType, currentCount: number): boolean {
  const limit = PLAN_CONFIGS[plan].max_products;
  if (limit === null) return true;
  return currentCount < limit;
}

export function getNextPlan(plan: PlanType): PlanType | null {
  const order: PlanType[] = ['free', 'starter', 'business', 'premium'];
  const idx = order.indexOf(plan);
  return idx < order.length - 1 ? order[idx + 1] : null;
}

export const THEMES = [
  { id: 'default', label: { fr: 'Blanc Standard', en: 'Standard White' }, bg: 'bg-white', text: 'text-gray-900', accent: 'bg-gray-900', free: true, premium: false, hasBg: false },
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

export const COMMISSION_RATE = 0.05;
