import { describe, it, expect, beforeEach } from 'vitest';
import { shareMessage, applySeo, isoCurrency, shopJsonLd, shopSeo, truncate } from '../../lib/seo';
import type { Product, Profile, Service } from '../../lib/types';

const profile = {
  username: 'kora', shop_name: 'Atelier Kora', display_name: '', bio: 'Maroquinerie faite main à Abidjan.', shop_logo_url: 'https://img/logo.png',
  avatar_url: '', contact_phone: '+2250700000000', social_links: [{ platform: 'instagram', url: 'https://instagram.com/kora', icon: '' }],
} as unknown as Profile;
const product = (over: Partial<Product> = {}) => ({ id: 'p1', name: 'Sac en cuir', description: 'Un sac cousu main', price: 15000, currency: 'FCFA', quantity: 3, image_url: 'https://img/sac.jpg', images: [], avg_rating: 0, ratings_count: 0, ...over }) as Product;
const service = { id: 's1', name: 'Réparation', description: 'Réparation de sacs', price: 5000 } as Service;

beforeEach(() => {
  document.head.innerHTML = '<meta name="description" content="orig"><link rel="canonical" href="https://x/">';
  document.title = 'Titre initial';
  document.documentElement.setAttribute('lang', 'fr');
});

describe('seo — utilitaires', () => {
  it('coupe un texte sans casser un mot', () => {
    expect(truncate('Un texte très court', 50)).toBe('Un texte très court');
    const t = truncate('mot '.repeat(60), 40);
    expect(t.length).toBeLessThanOrEqual(40);
    expect(t.endsWith('…')).toBe(true);
  });
  it('convertit FCFA en code devise valide', () => {
    expect(isoCurrency('FCFA')).toBe('XOF');
    expect(isoCurrency('eur')).toBe('EUR');
    expect(isoCurrency('bizarre')).toBe('XOF');
  });
});

describe('seo — boutique', () => {
  it('produit un titre, une description et une URL canonique propres', () => {
    const cfg = shopSeo(profile, [product()], [service], 'fr');
    expect(cfg.title).toBe('Atelier Kora — Boutique en ligne | BioLinkWD');
    expect(cfg.description).toContain('Maroquinerie');
    expect(cfg.description.length).toBeLessThanOrEqual(158);
    expect(cfg.path).toBe('/u/kora');
    expect(cfg.image).toBe('https://img/logo.png');
  });
  it('décrit les produits avec prix, devise valide et stock', () => {
    const [store, list] = shopJsonLd(profile, [product(), product({ id: 'p2', quantity: 0 })], [service]) as Array<Record<string, unknown>>;
    expect(store['@type']).toBe('Store');
    const items = (list.itemListElement as Array<{ item: Record<string, unknown> }>).map(e => e.item);
    const offer = items[0].offers as Record<string, string>;
    expect(offer.price).toBe('15000');
    expect(offer.priceCurrency).toBe('XOF');
    expect(offer.availability).toContain('InStock');
    expect((items[1].offers as Record<string, string>).availability).toContain('OutOfStock');
    expect(items[2]['@type']).toBe('Service');
  });
  it('n\'invente jamais de note : elle n\'apparaît que s\'il existe de vrais avis', () => {
    const none = JSON.stringify(shopJsonLd(profile, [product()], []));
    expect(none).not.toContain('aggregateRating');
    const some = JSON.stringify(shopJsonLd(profile, [product({ ratings_count: 4, avg_rating: 4.5 })], []));
    expect(some).toContain('"reviewCount":4');
  });
});

describe('seo — application dans le <head>', () => {
  it('écrit les balises puis rétablit l\'état d\'origine', () => {
    const restore = applySeo(document, { ...shopSeo(profile, [product()], [], 'fr') });
    expect(document.title).toContain('Atelier Kora');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain('Maroquinerie');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://biolinkwd.duckdns.org/u/kora');
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toContain('Atelier Kora');
    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBeGreaterThan(0);
    restore();
    expect(document.title).toBe('Titre initial');
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('orig');
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe('https://x/');
    expect(document.querySelector('meta[property="og:title"]')).toBeNull();
    expect(document.querySelectorAll('script[type="application/ld+json"]').length).toBe(0);
  });
  it('marque une page privée en noindex', () => {
    applySeo(document, { title: 't', description: 'd', noindex: true });
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow');
  });
  it('empêche un texte vendeur de fermer la balise script', () => {
    applySeo(document, { title: 't', description: 'd', jsonLd: { name: '</script><img src=x onerror=alert(1)>' } });
    const script = document.querySelector('script[type="application/ld+json"]')!;
    expect(script.textContent).not.toContain('</script>');
    expect(JSON.parse(script.textContent!).name).toBe('</script><img src=x onerror=alert(1)>');
  });
});

describe('message de partage', () => {
  it('invite à découvrir les produits phares de la boutique', () => {
    expect(shareMessage('Kora', ['Sac en cuir', 'Ceinture', 'Portefeuille', 'Autre'], 'fr'))
      .toBe('Venez découvrir Sac en cuir, Ceinture et Portefeuille sur la boutique Kora ! 🛍️');
    expect(shareMessage('Kora', ['Sac'], 'fr')).toBe('Venez découvrir Sac sur la boutique Kora ! 🛍️');
    expect(shareMessage('Kora', [], 'fr')).toBe('Venez découvrir la boutique Kora ! 🛍️');
    expect(shareMessage('Kora', ['Bag', 'Belt'], 'en')).toBe('Come and discover Bag and Belt on the Kora shop! 🛍️');
  });
});
