import { describe, it, expect } from 'vitest';
import { planFeatureRows } from '../../lib/planFeatures';
import { PLAN_CONFIGS, THEMES } from '../../lib/planLimits';
import type { PlanType } from '../../lib/types';

const PLANS: PlanType[] = ['free', 'starter', 'business', 'premium'];
const row = (plan: PlanType, id: string, lang = 'fr') => planFeatureRows(plan, lang).find(r => r.id === id)!;
const digits = (s: string) => s.replace(/\D/g, '');

describe('fonctionnalités affichées = limites appliquées', () => {
  it.each(PLANS)('%s : produits, services et liens sociaux suivent la configuration', plan => {
    const c = PLAN_CONFIGS[plan];
    const check = (id: string, limit: number | null) => {
      const text = row(plan, id).text;
      if (limit === null) expect(text, `${plan}/${id}`).toMatch(/illimit/i);
      else expect(Number(digits(text)), `${plan}/${id}`).toBe(limit);
    };
    check('products', c.max_products);
    check('services', c.max_services);
    check('social', c.max_social_links);
  });

  it('annonce 25 produits pour Starter et 55 pour Business (et non plus 20 / 35)', () => {
    expect(row('starter', 'products').text).toContain('25');
    expect(row('business', 'products').text).toContain('55');
  });

  it.each(PLANS)('%s : la commission affichée est celle qui est prélevée', plan => {
    expect(Number(digits(row(plan, 'commission').text))).toBe(Math.round(PLAN_CONFIGS[plan].commission_rate * 100));
  });

  it.each(PLANS)('%s : statistiques, carte, logo et retrait suivent la configuration', plan => {
    const c = PLAN_CONFIGS[plan];
    expect(row(plan, 'stats').included).toBe(c.statistics_access);
    expect(row(plan, 'map').included).toBe(c.map_access);
    expect(row(plan, 'logo').included).toBe(c.shop_logo);
    expect(row(plan, 'withdrawal').included).toBe(c.priority_withdrawal);
  });

  it('réserve QR code, commande WhatsApp et héros 3D au Premium', () => {
    for (const id of ['qrcode', 'whatsapp', 'hero3d']) {
      expect(PLANS.filter(p => row(p, id).included), id).toEqual(['premium']);
    }
  });

  it('ne promet plus « tous les thèmes » aux forfaits qui n\'ont pas les thèmes Premium', () => {
    const premiumThemes = THEMES.filter(t => t.premium).length;
    expect(premiumThemes).toBeGreaterThan(0);
    for (const plan of ['starter', 'business'] as const) {
      const text = row(plan, 'themes').text;
      expect(text).toContain(String(THEMES.filter(t => !t.premium).length));
      expect(text).not.toMatch(/^Tous les thèmes/);
    }
    expect(row('premium', 'themes').text).toContain(String(THEMES.length));
    expect(row('free', 'themes').included).toBe(false);
  });

  it('utilise le nom BioLinkWD et plus les anciennes variantes', () => {
    for (const plan of PLANS) for (const lang of ['fr', 'en']) {
      const all = planFeatureRows(plan, lang).map(r => r.text).join(' | ');
      expect(all).not.toMatch(/WhiteDuke|WhiteDuck/i);
    }
  });

  it('existe en français et en anglais avec les mêmes lignes', () => {
    for (const plan of PLANS) {
      expect(planFeatureRows(plan, 'fr').map(r => r.id)).toEqual(planFeatureRows(plan, 'en').map(r => r.id));
      expect(planFeatureRows(plan, 'en').every(r => r.text.length > 0)).toBe(true);
    }
  });

  it('chaque forfait a la liste complète, avec des identifiants uniques', () => {
    for (const plan of PLANS) {
      const ids = planFeatureRows(plan, 'fr').map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThanOrEqual(14);
    }
  });
});
