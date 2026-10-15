import { describe, it, expect } from 'vitest';
import { translations } from '../../lib/translations';

// ── Complétude des traductions ────────────────────────────────────────────────

describe('Traductions — complétude', () => {
  const frKeys = Object.keys(translations.fr);
  const enKeys = Object.keys(translations.en);

  it('toutes les clés fr existent dans en', () => {
    const missing = frKeys.filter(k => !(k in translations.en));
    expect(missing, `Clés manquantes dans en: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('toutes les clés en existent dans fr', () => {
    const missing = enKeys.filter(k => !(k in translations.fr));
    expect(missing, `Clés manquantes dans fr: ${missing.join(', ')}`).toHaveLength(0);
  });

  it('ni fr ni en ne sont vides', () => {
    expect(frKeys.length).toBeGreaterThan(50);
    expect(enKeys.length).toBeGreaterThan(50);
  });
});

// ── Valeurs non-nulles ────────────────────────────────────────────────────────

describe('Traductions — valeurs non-nulles', () => {
  it('aucune valeur fr n\'est null ou undefined', () => {
    const nullKeys: string[] = [];
    for (const [k, v] of Object.entries(translations.fr)) {
      if (v == null) nullKeys.push(k);
    }
    expect(nullKeys).toHaveLength(0);
  });

  it('aucune valeur en n\'est null ou undefined', () => {
    const nullKeys: string[] = [];
    for (const [k, v] of Object.entries(translations.en)) {
      if (v == null) nullKeys.push(k);
    }
    expect(nullKeys).toHaveLength(0);
  });

  it('les chaînes fr ne sont pas des chaînes vides', () => {
    const emptyKeys: string[] = [];
    for (const [k, v] of Object.entries(translations.fr)) {
      if (typeof v === 'string' && v.trim() === '') emptyKeys.push(k);
    }
    expect(emptyKeys).toHaveLength(0);
  });

  it('les chaînes en ne sont pas des chaînes vides', () => {
    const emptyKeys: string[] = [];
    for (const [k, v] of Object.entries(translations.en)) {
      if (typeof v === 'string' && v.trim() === '') emptyKeys.push(k);
    }
    expect(emptyKeys).toHaveLength(0);
  });
});

// ── Clés critiques ────────────────────────────────────────────────────────────

describe('Traductions — clés critiques', () => {
  const REQUIRED = [
    'login', 'register', 'email', 'password', 'logout',
    'save', 'cancel', 'error', 'loading',
    'myProducts', 'myWallet', 'subscription',
    'passwordMismatch', 'usernameTaken',
    'insufficientBalance', 'minWithdraw',
  ];

  for (const key of REQUIRED) {
    it(`fr.${key} est défini`, () => {
      expect(translations.fr).toHaveProperty(key);
      expect(translations.fr[key as keyof typeof translations.fr]).toBeTruthy();
    });
    it(`en.${key} est défini`, () => {
      expect(translations.en).toHaveProperty(key);
      expect(translations.en[key as keyof typeof translations.en]).toBeTruthy();
    });
  }
});

// ── Fonctions de template ─────────────────────────────────────────────────────

describe('Traductions — fonctions de template', () => {
  it('fr.upgradeToAdd retourne une chaîne avec le nom du plan', () => {
    const result = translations.fr.upgradeToAdd('Starter');
    expect(typeof result).toBe('string');
    expect(result).toContain('Starter');
  });

  it('en.upgradeToAdd retourne une chaîne avec le nom du plan', () => {
    const result = translations.en.upgradeToAdd('Starter');
    expect(typeof result).toBe('string');
    expect(result).toContain('Starter');
  });

  it('fr.productsCount avec max affiche count/max', () => {
    const result = translations.fr.productsCount(5, 10);
    expect(result).toContain('5');
    expect(result).toContain('10');
  });

  it('fr.productsCount sans max affiche "illimité"', () => {
    const result = translations.fr.productsCount(5, null);
    expect(result).toContain('illimité');
  });

  it('en.productsCount sans max affiche "unlimited"', () => {
    const result = translations.en.productsCount(5, null);
    expect(result).toContain('unlimited');
  });

  it('fr.upgradeSuccess contient le nom du plan', () => {
    const result = translations.fr.upgradeSuccess('Premium');
    expect(result).toContain('Premium');
  });
});
