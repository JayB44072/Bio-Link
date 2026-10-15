import { PLAN_CONFIGS, THEMES } from './planLimits';
import type { PlanType } from './types';
import { FREE_AI_QUOTA } from './aiProductGenerator';

/**
 * Fonctionnalités affichées sur la page des forfaits, calculées à partir de la configuration réelle
 * (limites, thèmes, commissions) : le texte annoncé ne peut plus s'écarter de ce que le code applique.
 */
export interface FeatureRow {
  id: string;
  text: string;
  /** Vrai : inclus dans le forfait. Faux : limite ou fonctionnalité absente (affichée avec un cadenas). */
  included: boolean;
}

/** Fonctionnalités réservées au forfait Premium (le code les vérifie par `plan_type === 'premium'`). */
export const PREMIUM_ONLY = ['qrcode', 'whatsapp_orders', 'hero3d'] as const;
export type PremiumFeature = typeof PREMIUM_ONLY[number];

export const hasPremiumFeature = (plan: PlanType, feature: PremiumFeature) => PREMIUM_ONLY.includes(feature) && plan === 'premium';

export function planFeatureRows(plan: PlanType, lang: string): FeatureRow[] {
  const fr = lang === 'fr';
  const c = PLAN_CONFIGS[plan];
  const premium = plan === 'premium';

  const limit = (n: number | null, label: string, unlimited: string) => (n === null ? unlimited : `${n} ${label}`);

  // Thèmes : le gratuit n'a que le thème de base ; les forfaits payants ont les thèmes classiques ; Premium a aussi les Showroom et Cinéma
  const free = THEMES.filter(t => t.free).length;
  const classic = THEMES.filter(t => !t.premium).length;
  const all = THEMES.length;
  const themeText = !c.custom_themes
    ? (fr ? `Thème de base uniquement (${free})` : `Base theme only (${free})`)
    : premium
      ? (fr ? `Tous les thèmes (${all}), dont Showroom et Cinéma 3D` : `All themes (${all}), including Showroom and 3D Cinema`)
      : (fr ? `${classic} thèmes classiques (hors thèmes Premium)` : `${classic} classic themes (Premium themes excluded)`);

  const rows: FeatureRow[] = [
    { id: 'products', included: true, text: limit(c.max_products, fr ? 'produits max' : 'products max', fr ? 'Produits illimités' : 'Unlimited products') },
    { id: 'services', included: true, text: limit(c.max_services, 'services max', fr ? 'Services illimités' : 'Unlimited services') },
    { id: 'social', included: true, text: limit(c.max_social_links, fr ? 'liens sociaux' : 'social links', fr ? 'Liens sociaux illimités' : 'Unlimited social links') },
    { id: 'themes', included: c.custom_themes, text: themeText },
    { id: 'hero3d', included: hasPremiumFeature(plan, 'hero3d'), text: fr ? 'Héros 3D animé et votre photo produit en 3D' : 'Animated 3D hero and your product photo in 3D' },
    { id: 'stats', included: c.statistics_access, text: c.statistics_access ? (fr ? 'Statistiques complètes' : 'Full statistics') : (fr ? 'Statistiques bloquées' : 'Statistics locked') },
    { id: 'map', included: c.map_access, text: c.map_access ? (fr ? 'Carte de vos produits' : 'Map of your products') : (fr ? 'Carte des produits bloquée' : 'Products map locked') },
    { id: 'qrcode', included: hasPremiumFeature(plan, 'qrcode'), text: fr ? 'QR code de votre boutique' : 'QR code for your shop' },
    { id: 'whatsapp', included: hasPremiumFeature(plan, 'whatsapp_orders'), text: fr ? 'Commande par WhatsApp (produits)' : 'WhatsApp ordering (products)' },
    { id: 'logo', included: c.shop_logo, text: c.shop_logo ? (fr ? 'Votre propre logo de boutique' : 'Your own shop logo') : (fr ? 'Logo BioLinkWD uniquement' : 'BioLinkWD logo only') },
    { id: 'badge', included: plan !== 'free', text: plan !== 'free' ? (fr ? 'Aucun badge BioLinkWD sur votre page' : 'No BioLinkWD badge on your page') : (fr ? 'Badge BioLinkWD affiché sur votre page' : 'BioLinkWD badge shown on your page') },
    { id: 'verified', included: plan !== 'free', text: plan !== 'free' ? (fr ? 'Badge « Vendeur vérifié »' : '“Verified seller” badge') : (fr ? '« Vendeur vérifié » après 5 commandes terminées' : '“Verified seller” after 5 completed orders') },
    { id: 'ai', included: plan !== 'free', text: plan !== 'free' ? (fr ? 'Génération IA des fiches produit illimitée' : 'Unlimited AI product descriptions') : (fr ? `Génération IA : ${FREE_AI_QUOTA} par mois` : `AI generation: ${FREE_AI_QUOTA} per month`) },
    { id: 'withdrawal', included: c.priority_withdrawal, text: c.priority_withdrawal ? (fr ? 'Retrait prioritaire (< 2h)' : 'Priority withdrawal (< 2h)') : (fr ? 'Retrait standard (24-48h)' : 'Standard withdrawal (24-48h)') },
    { id: 'commission', included: true, text: fr ? `${Math.round(c.commission_rate * 100)}% de commission sur chaque vente` : `${Math.round(c.commission_rate * 100)}% commission on each sale` },
  ];
  return rows;
}
