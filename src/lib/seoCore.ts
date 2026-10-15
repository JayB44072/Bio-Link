import type { Product, Profile, Service } from './types';

export const SITE_URL = 'https://biolinkwd.duckdns.org';
export const SITE_NAME = 'BioLinkWD';
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

export interface SeoConfig {
  title: string;
  description: string;
  /** Chemin canonique (ex. `/u/kora`). */
  path?: string;
  image?: string;
  /** Page à ne pas indexer (commande, désabonnement, tableau de bord…). */
  noindex?: boolean;
  lang?: string;
  type?: 'website' | 'profile' | 'product';
  /** Données structurées schema.org (un objet ou plusieurs). */
  jsonLd?: object | object[];
}

/** Coupe proprement un texte à `max` caractères (sans couper un mot, avec « … »). */
export function truncate(text: string, max: number): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.!-]+$/, '')}…`;
}

/** Code devise ISO 4217 attendu par Google (« FCFA » n'en est pas un). */
export function isoCurrency(currency: string): string {
  const c = (currency ?? '').trim().toUpperCase();
  if (c === 'FCFA' || c === 'CFA' || c === 'F CFA' || c === 'XOF') return 'XOF';
  if (c === 'XAF') return 'XAF';
  return /^[A-Z]{3}$/.test(c) ? c : 'XOF';
}

const absolute = (url: string | undefined) => {
  if (!url) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

/** Message de partage prêt à publier : invite à découvrir les premiers produits (ou services) de la boutique. */
export function shareMessage(shopName: string, itemNames: string[], lang = 'fr'): string {
  const names = itemNames.map(n => n.trim()).filter(Boolean).slice(0, 3);
  const fr = lang === 'fr';
  const list = names.length === 0 ? '' : names.length === 1 ? names[0]
    : `${names.slice(0, -1).join(', ')} ${fr ? 'et' : 'and'} ${names[names.length - 1]}`;
  if (fr) return list ? `Venez découvrir ${list} sur la boutique ${shopName} ! 🛍️` : `Venez découvrir la boutique ${shopName} ! 🛍️`;
  return list ? `Come and discover ${list} on the ${shopName} shop! 🛍️` : `Come and discover the ${shopName} shop! 🛍️`;
}

/* ── Données structurées ── */

/** Boutique d'un vendeur : l'organisation et un catalogue de ses produits (20 premiers) et services. */
export function shopJsonLd(profile: Profile, products: Product[], services: Service[]): object[] {
  const name = profile.shop_name || profile.display_name || profile.username;
  const url = `${SITE_URL}/u/${profile.username}`;
  const sameAs = (profile.social_links ?? []).map(l => l.url).filter(u => /^https?:\/\//i.test(u));
  const items = [
    ...products.slice(0, 20).map(p => ({
      '@type': 'Product',
      name: p.name,
      description: truncate(p.description, 300) || undefined,
      image: [p.image_url, ...(p.images ?? [])].filter(Boolean).slice(0, 4),
      url,
      offers: {
        '@type': 'Offer',
        price: String(p.price),
        priceCurrency: isoCurrency(p.currency),
        availability: p.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url,
        seller: { '@type': 'Organization', name },
      },
      // On n'affiche une note que si de vrais avis existent
      ...(p.ratings_count > 0 && p.avg_rating > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: p.avg_rating, reviewCount: p.ratings_count } } : {}),
    })),
    ...services.slice(0, 10).map(s => ({
      '@type': 'Service',
      name: s.name,
      description: truncate(s.description, 300) || undefined,
      provider: { '@type': 'Organization', name },
      url,
    })),
  ];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Store',
      name,
      url,
      description: truncate(profile.bio, 300) || undefined,
      image: profile.shop_logo_url || profile.avatar_url || undefined,
      ...(profile.contact_phone ? { telephone: profile.contact_phone } : {}),
      ...(sameAs.length ? { sameAs } : {}),
    },
    ...(items.length ? [{
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `${name} — catalogue`,
      itemListElement: items.map((item, i) => ({ '@type': 'ListItem', position: i + 1, item })),
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name, item: url },
      ],
    },
  ];
}

/** Titre et description d'une boutique (utilisés aussi par les aperçus de partage). */
export function shopSeo(profile: Profile, products: Product[], services: Service[], lang = 'fr'): SeoConfig {
  const name = profile.shop_name || profile.display_name || profile.username;
  const fr = lang === 'fr';
  const names = [...products.map(p => p.name), ...services.map(s => s.name)].slice(0, 4).join(', ');
  const fallback = fr
    ? `Découvrez la boutique ${name}${names ? ` : ${names}` : ''}. Commandez en ligne et payez par Mobile Money, carte bancaire ou WhatsApp.`
    : `Discover ${name}${names ? `: ${names}` : ''}. Order online and pay by Mobile Money, card or WhatsApp.`;
  return {
    title: fr ? `${name} — Boutique en ligne | ${SITE_NAME}` : `${name} — Online shop | ${SITE_NAME}`,
    description: truncate(profile.bio?.trim() ? `${profile.bio.trim()} ${names ? `· ${names}` : ''}` : fallback, 158),
    path: `/u/${profile.username}`,
    image: profile.shop_logo_url || products[0]?.image_url || profile.avatar_url || undefined,
    type: 'profile',
    lang,
    jsonLd: shopJsonLd(profile, products, services),
  };
}

/* ── Application dans <head> ── */

type Restore = () => void;

function upsert(doc: Document, selector: string, create: () => HTMLElement, attr: string, value: string, undo: Restore[]) {
  let el = doc.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    doc.head.appendChild(el);
    undo.push(() => el?.remove());
  } else {
    const previous = el.getAttribute(attr);
    undo.push(() => { if (previous === null) el?.removeAttribute(attr); else el?.setAttribute(attr, previous); });
  }
  el.setAttribute(attr, value);
}

const meta = (doc: Document, key: 'name' | 'property', name: string) => () => {
  const m = doc.createElement('meta');
  m.setAttribute(key, name);
  return m;
};

/** Écrit titre, description, canonical, Open Graph, Twitter et JSON-LD dans le <head> ; renvoie la fonction qui remet l'état précédent. */
export function applySeo(doc: Document, cfg: SeoConfig): Restore {
  const undo: Restore[] = [];
  const url = `${SITE_URL}${cfg.path ?? '/'}`;
  const image = absolute(cfg.image);
  const lang = cfg.lang ?? 'fr';

  const previousTitle = doc.title;
  doc.title = cfg.title;
  undo.push(() => { doc.title = previousTitle; });

  const prevLang = doc.documentElement.getAttribute('lang');
  doc.documentElement.setAttribute('lang', lang);
  undo.push(() => { if (prevLang) doc.documentElement.setAttribute('lang', prevLang); });

  const byName = (n: string, v: string) => upsert(doc, `meta[name="${n}"]`, meta(doc, 'name', n), 'content', v, undo);
  const byProp = (p: string, v: string) => upsert(doc, `meta[property="${p}"]`, meta(doc, 'property', p), 'content', v, undo);

  byName('description', cfg.description);
  byName('robots', cfg.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  byProp('og:title', cfg.title);
  byProp('og:description', cfg.description);
  byProp('og:url', url);
  byProp('og:type', cfg.type === 'profile' ? 'website' : cfg.type ?? 'website');
  byProp('og:image', image);
  byProp('og:image:secure_url', image);
  byProp('og:locale', lang === 'fr' ? 'fr_FR' : 'en_US');
  byName('twitter:title', cfg.title);
  byName('twitter:description', cfg.description);
  byName('twitter:image', image);

  upsert(doc, 'link[rel="canonical"]', () => { const l = doc.createElement('link'); l.setAttribute('rel', 'canonical'); return l; }, 'href', url, undo);

  const blocks = cfg.jsonLd ? (Array.isArray(cfg.jsonLd) ? cfg.jsonLd : [cfg.jsonLd]) : [];
  for (const block of blocks) {
    const s = doc.createElement('script');
    s.type = 'application/ld+json';
    s.setAttribute('data-seo', 'page');
    // `<` échappé : le contenu vendeur ne peut pas refermer la balise <script>
    s.textContent = JSON.stringify(block).replace(/</g, '\\u003c');
    doc.head.appendChild(s);
    undo.push(() => s.remove());
  }
  return () => { for (const fn of undo.reverse()) fn(); };
}

