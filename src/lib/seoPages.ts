import { isoCurrency, SITE_NAME, SITE_URL, truncate, type SeoConfig } from './seoCore';
import type { Product, Profile } from './types';

/** Fiche d'un produit : son propre titre, aperçu de partage et données structurées (page `/u/<boutique>/p/<id>`). */
export function productSeo(profile: Pick<Profile, 'username' | 'shop_name' | 'display_name' | 'contact_phone'>, product: Product, lang = 'fr'): SeoConfig {
  const shop = profile.shop_name || profile.display_name || profile.username;
  const fr = lang === 'fr';
  const price = `${product.price.toLocaleString(fr ? 'fr-FR' : 'en-US')} ${product.currency}`;
  const url = `${SITE_URL}/u/${profile.username}/p/${product.id}`;
  return {
    title: `${product.name} — ${shop} | ${SITE_NAME}`,
    description: truncate(`${product.name} · ${price}. ${product.description ?? ''}`, 158),
    path: `/u/${profile.username}/p/${product.id}`,
    image: product.image_url || product.images?.[0] || undefined,
    type: 'product',
    lang,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: truncate(product.description ?? '', 500) || undefined,
        image: [product.image_url, ...(product.images ?? [])].filter(Boolean).slice(0, 5),
        category: product.category || undefined,
        url,
        offers: {
          '@type': 'Offer',
          price: String(product.price),
          priceCurrency: isoCurrency(product.currency),
          availability: product.quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url,
          seller: { '@type': 'Organization', name: shop },
        },
        ...(product.ratings_count > 0 && product.avg_rating > 0
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.avg_rating, reviewCount: product.ratings_count } } : {}),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: shop, item: `${SITE_URL}/u/${profile.username}` },
          { '@type': 'ListItem', position: 3, name: product.name, item: url },
        ],
      },
    ],
  };
}

/* ── Rendu HTML côté serveur (aperçus WhatsApp / Facebook / Google avant l'exécution du JavaScript) ── */

const escAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Balises <head> d'une page, en texte. */
export function renderHeadTags(cfg: SeoConfig): string {
  const url = `${SITE_URL}${cfg.path ?? '/'}`;
  const image = !cfg.image ? `${SITE_URL}/logo.png` : /^https?:\/\//i.test(cfg.image) ? cfg.image : `${SITE_URL}${cfg.image.startsWith('/') ? '' : '/'}${cfg.image}`;
  const lang = cfg.lang ?? 'fr';
  const robots = cfg.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const m = (attr: 'name' | 'property', k: string, v: string) => `<meta ${attr}="${k}" content="${escAttr(v)}" />`;
  const blocks = cfg.jsonLd ? (Array.isArray(cfg.jsonLd) ? cfg.jsonLd : [cfg.jsonLd]) : [];
  return [
    `<title>${escAttr(cfg.title)}</title>`,
    m('name', 'description', cfg.description),
    m('name', 'robots', robots),
    `<link rel="canonical" href="${escAttr(url)}" />`,
    m('property', 'og:title', cfg.title),
    m('property', 'og:description', cfg.description),
    m('property', 'og:url', url),
    m('property', 'og:type', cfg.type === 'profile' ? 'website' : cfg.type ?? 'website'),
    m('property', 'og:image', image),
    m('property', 'og:image:secure_url', image),
    m('property', 'og:locale', lang === 'fr' ? 'fr_FR' : 'en_US'),
    m('name', 'twitter:card', 'summary_large_image'),
    m('name', 'twitter:title', cfg.title),
    m('name', 'twitter:description', cfg.description),
    m('name', 'twitter:image', image),
    ...blocks.map(b => `<script type="application/ld+json">${JSON.stringify(b).replace(/</g, '\\u003c')}</script>`),
  ].join('\n    ');
}

/** Remplace les balises génériques de `index.html` par celles de la page demandée. */
export function injectSeo(html: string, cfg: SeoConfig): string {
  const strip = [
    /<title>[\s\S]*?<\/title>\s*/gi,
    /<meta\s+name="(?:description|robots|googlebot|twitter:[^"]+)"[^>]*>\s*/gi,
    /<meta\s+property="og:[^"]+"[^>]*>\s*/gi,
    /<link\s+rel="canonical"[^>]*>\s*/gi,
    /<link\s+rel="alternate"\s+hreflang[^>]*>\s*/gi,
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi,
  ];
  let out = html;
  for (const re of strip) out = out.replace(re, '');
  out = out.replace(/<html lang="[^"]*"/, `<html lang="${cfg.lang ?? 'fr'}"`);
  return out.replace('</head>', `    ${renderHeadTags(cfg)}\n  </head>`);
}

/* ── Sitemap ── */

export interface SitemapShop { username: string; updated_at?: string | null; products?: string[] }

const xmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (iso?: string | null) => (iso ? new Date(iso) : new Date()).toISOString().slice(0, 10);

/** Sitemap complet : pages du site, boutiques et fiches produits. */
export function buildSitemap(shops: SitemapShop[], today = day()): string {
  const url = (loc: string, lastmod: string, changefreq: string, priority: string, extra = '') =>
    `  <url>\n    <loc>${xmlEsc(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>${extra}\n  </url>`;
  const alt = `\n    <xhtml:link rel="alternate" hreflang="fr" href="${SITE_URL}/"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/?lang=en"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/"/>`;
  const entries = [
    url(`${SITE_URL}/`, today, 'weekly', '1.0', alt),
    url(`${SITE_URL}/privacy`, today, 'yearly', '0.3'),
    url(`${SITE_URL}/cgu`, today, 'yearly', '0.3'),
    ...shops.flatMap(s => [
      url(`${SITE_URL}/u/${encodeURIComponent(s.username)}`, day(s.updated_at), 'weekly', '0.7'),
      ...(s.products ?? []).map(id => url(`${SITE_URL}/u/${encodeURIComponent(s.username)}/p/${encodeURIComponent(id)}`, day(s.updated_at), 'weekly', '0.6')),
    ]),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}
