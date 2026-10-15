import { describe, it, expect } from 'vitest';
import { MODELS, CATEGORIES, buildModel, getModel, guessModelId, DEFAULT_MODEL_ID } from '../../lib/product3d/catalog';
import { SHOP_THEMES, THEMES } from '../../lib/planLimits';
import { formatThemeValue, parseThemeValue, resolveShopTheme, resolveHero } from '../../lib/shopTheme';
import { heroStyleFor, readableOn } from '../../lib/heroStyles';
import { scrollTimeline, scrollPhase, loopTimeline, SCROLL_PHASES } from '../../lib/product3d/timeline';

// jsdom n'a pas de contexte 2D : les textures de l'écran retombent sur une toile vide (cf. screenMat)
describe('catalogue 3D', () => {
  it('propose au moins 30 produits, avec des identifiants uniques', () => {
    expect(MODELS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(MODELS.map(m => m.id)).size).toBe(MODELS.length);
  });

  it('chaque catégorie contient des produits', () => {
    for (const c of CATEGORIES) expect(MODELS.some(m => m.category === c.id)).toBe(true);
  });

  it('le modèle par défaut existe', () => expect(getModel(DEFAULT_MODEL_ID)).toBeDefined());

  it.each(MODELS.map(m => [m.id, m] as const))('%s se construit, avec des pièces nommées et libérables', (_id, def) => {
    const product = buildModel(def);
    expect(product.groups.length).toBeGreaterThanOrEqual(3);
    for (const g of product.groups) {
      expect(def.parts[g], `libellé manquant pour « ${g} »`).toBeDefined();
      expect(def.parts[g].fr).toBeTruthy();
      expect(def.parts[g].en).toBeTruthy();
    }
    for (const it of product.items) expect(product.groups).toContain(it.group);
    expect(() => product.dispose()).not.toThrow();
  });
});

describe('guessModelId', () => {
  it('reconnaît un produit à son nom', () => {
    expect(guessModelId('Robe de soirée')).toBe('dress');
    expect(guessModelId('iPhone 15 Pro')).toBe('smartphone');
  });
  it('renvoie null sans indice', () => {
    expect(guessModelId('', null, undefined)).toBeNull();
    expect(guessModelId('xyzzy')).toBeNull();
  });
});

describe('valeur de thème « thème:produit »', () => {
  it('lit un thème simple et un thème avec produit', () => {
    expect(parseThemeValue('luxury')).toEqual({ themeId: 'luxury', modelId: null, use3d: false, scroll: false });
    expect(parseThemeValue('neon:laptop')).toEqual({ themeId: 'neon', modelId: 'laptop', use3d: false, scroll: false });
  });
  it('retombe sur default si vide', () => {
    expect(parseThemeValue('')).toEqual({ themeId: 'default', modelId: null, use3d: false, scroll: false });
    expect(parseThemeValue(null)).toEqual({ themeId: 'default', modelId: null, use3d: false, scroll: false });
  });
  it('formate dans les deux sens', () => {
    expect(formatThemeValue('neon', 'laptop')).toBe('neon:laptop');
    expect(formatThemeValue('neon', null)).toBe('neon');
    expect(parseThemeValue(formatThemeValue('studio', 'watch'))).toEqual({ themeId: 'studio', modelId: 'watch', use3d: false, scroll: false });
  });
  it('résout un thème inconnu vers default', () => {
    expect(resolveShopTheme('inconnu:laptop').themeId).toBe('default');
    expect(resolveShopTheme('onyx:watch').config).toBe(SHOP_THEMES.onyx);
  });
});

describe('thèmes Showroom', () => {
  const showroom = THEMES.filter(t => (t as { hero3d?: boolean }).hero3d);
  it('au moins 6 thèmes avec héros 3D, déclarés des deux côtés', () => {
    expect(showroom.length).toBeGreaterThanOrEqual(6);
    for (const t of showroom) expect(SHOP_THEMES[t.id]?.hero3d, t.id).toBeDefined();
  });
});

describe('héros 3D : option Premium', () => {
  it('lit et écrit le drapeau 3D', () => {
    expect(parseThemeValue('luxury:sneaker:3d')).toEqual({ themeId: 'luxury', modelId: 'sneaker', use3d: true, scroll: false });
    expect(parseThemeValue('luxury::3d')).toEqual({ themeId: 'luxury', modelId: null, use3d: true, scroll: false });
    expect(formatThemeValue('luxury', 'sneaker', true)).toBe('luxury:sneaker:3d');
    expect(formatThemeValue('luxury', null, true)).toBe('luxury::3d');
  });
  it('hero photo par défaut sur un thème classique, quel que soit le forfait', () => {
    expect(resolveHero('luxury', 'premium').mode).toBe('photo');
    expect(resolveHero('luxury', 'free').mode).toBe('photo');
  });
  it('3D activée seulement pour le forfait Premium', () => {
    expect(resolveHero('luxury:sneaker:3d', 'premium').mode).toBe('3d');
    expect(resolveHero('luxury:sneaker:3d', 'business').mode).toBe('photo');
    expect(resolveHero('neon:laptop', 'premium').mode).toBe('3d');
    expect(resolveHero('neon:laptop', 'starter').mode).toBe('photo');
  });
});

describe('styles de hero photo', () => {
  it('chaque thème de la liste a un hero lisible', () => {
    for (const t of THEMES) {
      const s = heroStyleFor(t.id);
      expect(s.layout, t.id).toBeTruthy();
      expect(s.eyebrow.fr && s.eyebrow.en, t.id).toBeTruthy();
    }
  });
  it('readableOn choisit noir ou blanc', () => {
    expect(readableOn('#ffffff')).toBe('#111111');
    expect(readableOn('#0a0a0a')).toBe('#ffffff');
  });
});
describe('hero Cinéma (défilement)', () => {
  it('le thème Cinéma est Premium, en 3D et piloté par le défilement', () => {
    expect(THEMES.find(t => t.id === 'cinema')?.premium).toBe(true);
    expect(SHOP_THEMES.cinema.heroMode).toBe('scroll');
    expect(resolveHero('cinema:sneaker', 'premium')).toMatchObject({ mode: '3d', scroll: true });
    expect(resolveHero('cinema:sneaker', 'starter')).toMatchObject({ mode: 'photo' });
    expect(resolveHero('neon:laptop', 'premium').scroll).toBe(false);
  });

  it('la progression du défilement parcourt tout le scénario', () => {
    const tl = scrollTimeline(5);
    expect(tl(0)).toEqual({ explode: 0, step: -1 });
    expect(tl(SCROLL_PHASES.intro + SCROLL_PHASES.explode).explode).toBe(1);
    const steps = new Set<number>();
    for (let p = 0; p <= 1; p += 0.005) steps.add(tl(p).step);
    expect([...steps].filter(s => s >= 0).sort()).toEqual([0, 1, 2, 3, 4]);
    expect(tl(1)).toEqual({ explode: 0, step: -1 });
  });

  it('les phases d\'affichage s\'enchaînent', () => {
    expect([scrollPhase(0), scrollPhase(0.5), scrollPhase(0.99)]).toEqual(['intro', 'parts', 'outro']);
  });

  it('la boucle automatique reste inchangée', () => {
    expect(loopTimeline(3)(0)).toEqual({ explode: 0, step: -1 });
  });
});
describe('animation au défilement choisie par le vendeur', () => {
  it('lit et écrit le drapeau scroll', () => {
    expect(parseThemeValue('neon:laptop:scroll')).toEqual({ themeId: 'neon', modelId: 'laptop', use3d: true, scroll: true });
    expect(formatThemeValue('neon', 'laptop', true, true)).toBe('neon:laptop:scroll');
    expect(formatThemeValue('luxury', null, true, true)).toBe('luxury::scroll');
  });
  it('un thème Showroom ou classique passe au défilement sur demande (Premium)', () => {
    expect(resolveHero('neon:laptop:scroll', 'premium')).toMatchObject({ mode: '3d', scroll: true });
    expect(resolveHero('luxury:sneaker:scroll', 'premium')).toMatchObject({ mode: '3d', scroll: true });
    expect(resolveHero('luxury:sneaker:scroll', 'free').mode).toBe('photo');
    expect(resolveHero('neon:laptop', 'premium').scroll).toBe(false);
  });
});