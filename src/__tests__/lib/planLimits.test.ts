import { describe, it, expect } from 'vitest';
import {
  PLAN_CONFIGS,
  SOCIAL_PLATFORMS,
  SHOP_THEMES,
  THEMES,
  canAddProduct,
  canAddService,
  getNextPlan,
} from '../../lib/planLimits';

// ── PLAN_CONFIGS ──────────────────────────────────────────────────────────────

describe('PLAN_CONFIGS — données des forfaits', () => {
  it('les 4 forfaits existent', () => {
    expect(Object.keys(PLAN_CONFIGS)).toEqual(['free', 'starter', 'business', 'premium']);
  });

  describe('free', () => {
    const p = PLAN_CONFIGS.free;
    it('max_products = 10',       () => expect(p.max_products).toBe(10));
    it('max_services = 5',        () => expect(p.max_services).toBe(5));
    it('max_social_links = 2',    () => expect(p.max_social_links).toBe(2));
    it('commission = 5 %',        () => expect(p.commission_rate).toBe(0.05));
    it('shop_logo désactivé',     () => expect(p.shop_logo).toBe(false));
    it('statistics désactivées',  () => expect(p.statistics_access).toBe(false));
    it('retrait prioritaire off', () => expect(p.priority_withdrawal).toBe(false));
    it('map désactivée',          () => expect(p.map_access).toBe(false));
    it('thèmes perso désactivés', () => expect(p.custom_themes).toBe(false));
    it('prix = 0 FCFA',           () => expect(p.price_fcfa).toBe(0));
  });

  describe('starter', () => {
    const p = PLAN_CONFIGS.starter;
    it('max_products = 25',    () => expect(p.max_products).toBe(25));
    it('max_services = 15',    () => expect(p.max_services).toBe(15));
    it('liens sociaux illimités', () => expect(p.max_social_links).toBeNull());
    it('commission = 4 %',     () => expect(p.commission_rate).toBe(0.04));
    it('shop_logo activé',     () => expect(p.shop_logo).toBe(true));
    it('prix = 2 000 FCFA',    () => expect(p.price_fcfa).toBe(2000));
  });

  describe('business', () => {
    const p = PLAN_CONFIGS.business;
    it('max_products = 55',    () => expect(p.max_products).toBe(55));
    it('max_services = 30',    () => expect(p.max_services).toBe(30));
    it('commission = 3 %',     () => expect(p.commission_rate).toBe(0.03));
    it('statistics activées',  () => expect(p.statistics_access).toBe(true));
    it('map activée',          () => expect(p.map_access).toBe(true));
    it('prix = 5 000 FCFA',    () => expect(p.price_fcfa).toBe(5000));
  });

  describe('premium', () => {
    const p = PLAN_CONFIGS.premium;
    it('produits illimités',       () => expect(p.max_products).toBeNull());
    it('services illimités',       () => expect(p.max_services).toBeNull());
    it('liens sociaux illimités',  () => expect(p.max_social_links).toBeNull());
    it('commission = 2 %',         () => expect(p.commission_rate).toBe(0.02));
    it('retrait prioritaire ON',   () => expect(p.priority_withdrawal).toBe(true));
    it('statistics ON',            () => expect(p.statistics_access).toBe(true));
    it('prix = 10 000 FCFA',       () => expect(p.price_fcfa).toBe(10000));
  });
});

// ── canAddProduct ─────────────────────────────────────────────────────────────

describe('canAddProduct', () => {
  it('free : 9 produits → peut ajouter',    () => expect(canAddProduct('free', 9)).toBe(true));
  it('free : 10 produits → ne peut plus',   () => expect(canAddProduct('free', 10)).toBe(false));
  it('free : 11 produits → ne peut plus',   () => expect(canAddProduct('free', 11)).toBe(false));
  it('starter : 24 produits → peut ajouter', () => expect(canAddProduct('starter', 24)).toBe(true));
  it('starter : 25 produits → ne peut plus', () => expect(canAddProduct('starter', 25)).toBe(false));
  it('premium : 1000 produits → peut ajouter (illimité)', () => expect(canAddProduct('premium', 1000)).toBe(true));
  it('business : 54 produits → peut ajouter', () => expect(canAddProduct('business', 54)).toBe(true));
  it('business : 55 produits → ne peut plus', () => expect(canAddProduct('business', 55)).toBe(false));
});

// ── canAddService ─────────────────────────────────────────────────────────────

describe('canAddService', () => {
  it('free : 4 services → peut ajouter',  () => expect(canAddService('free', 4)).toBe(true));
  it('free : 5 services → ne peut plus',  () => expect(canAddService('free', 5)).toBe(false));
  it('starter : 14 → peut ajouter',       () => expect(canAddService('starter', 14)).toBe(true));
  it('starter : 15 → ne peut plus',       () => expect(canAddService('starter', 15)).toBe(false));
  it('business : 29 → peut ajouter',      () => expect(canAddService('business', 29)).toBe(true));
  it('business : 30 → ne peut plus',      () => expect(canAddService('business', 30)).toBe(false));
  it('premium : 500 services → OK',       () => expect(canAddService('premium', 500)).toBe(true));
});

// ── getNextPlan ───────────────────────────────────────────────────────────────

describe('getNextPlan', () => {
  it('free → starter',    () => expect(getNextPlan('free')).toBe('starter'));
  it('starter → business',() => expect(getNextPlan('starter')).toBe('business'));
  it('business → premium',() => expect(getNextPlan('business')).toBe('premium'));
  it('premium → null (déjà au max)', () => expect(getNextPlan('premium')).toBeNull());
});

// ── SOCIAL_PLATFORMS ──────────────────────────────────────────────────────────

describe('SOCIAL_PLATFORMS', () => {
  it('contient 9 plateformes',   () => expect(SOCIAL_PLATFORMS).toHaveLength(9));
  it('chaque item a id/label/icon', () => {
    for (const p of SOCIAL_PLATFORMS) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('label');
      expect(p).toHaveProperty('icon');
    }
  });
  it('contient instagram, tiktok, whatsapp, website', () => {
    const ids = SOCIAL_PLATFORMS.map(p => p.id);
    expect(ids).toContain('instagram');
    expect(ids).toContain('tiktok');
    expect(ids).toContain('whatsapp');
    expect(ids).toContain('website');
  });
  it('pas de doublons d\'id', () => {
    const ids = SOCIAL_PLATFORMS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ── SHOP_THEMES ───────────────────────────────────────────────────────────────

describe('SHOP_THEMES', () => {
  it('le thème default existe', () => expect(SHOP_THEMES.default).toBeDefined());

  it('luxury est inherentlyDark (pas de light mode)', () => {
    expect(SHOP_THEMES.luxury.inherentlyDark).toBe(true);
    expect(SHOP_THEMES.luxury.pageBgLight).toBeNull();
  });

  it('elegance a pageBgLight (supporte le mode clair)', () => {
    expect(SHOP_THEMES.elegance.pageBgLight).not.toBeNull();
  });

  it('chaque thème a les champs obligatoires', () => {
    const required = ['pageBg', 'cardBg', 'textColor', 'buttonGradient', 'cardRadius', 'imageRadius'] as const;
    for (const [name, theme] of Object.entries(SHOP_THEMES)) {
      for (const field of required) {
        expect(theme[field], `${name}.${field} manquant`).toBeTruthy();
      }
    }
  });
});

// ── THEMES (liste UI) ─────────────────────────────────────────────────────────

describe('THEMES (liste UI)', () => {
  it('contient au moins 10 thèmes',   () => expect(THEMES.length).toBeGreaterThanOrEqual(10));
  it('le thème default est gratuit',  () => expect(THEMES.find(t => t.id === 'default')?.free).toBe(true));
  it('elegance n\'est pas gratuit',   () => expect(THEMES.find(t => t.id === 'elegance')?.free).toBe(false));
  it('tous ont un label fr et en',    () => {
    for (const theme of THEMES) {
      expect(theme.label.fr, `${theme.id} manque label.fr`).toBeTruthy();
      expect(theme.label.en, `${theme.id} manque label.en`).toBeTruthy();
    }
  });
});
