// Serveur de production (Render « Web Service ») : sert le site compilé (`dist/`) et, pour chaque page boutique
// (`/u/<boutique>` et `/u/<boutique>/p/<produit>`), écrit dans le HTML le titre, la description, l'image de partage
// et les données structurées AVANT l'exécution du JavaScript. C'est ce que lisent WhatsApp, Facebook, Telegram,
// LinkedIn et les robots de Google : sans cela, tous les liens de boutique afficheraient l'aperçu générique du site.
//
// Il sert aussi le sitemap à jour (`/sitemap.xml`, boutiques et produits compris).
//
// Variables d'environnement : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (déjà définies pour le build), PORT.
// Compilé par `npm run build:server` (esbuild) en `dist-server/index.mjs`.

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { request as httpsRequest } from 'node:https';
import { productSeo, injectSeo, buildSitemap, type SitemapShop } from '../src/lib/seoPages';
import { shopSeo, SITE_NAME, type SeoConfig } from '../src/lib/seoCore';
import type { Product, Profile, Service } from '../src/lib/types';

const DIST = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 3000);
const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? '';
const CACHE_MS = 5 * 60 * 1000;
const MAX_CACHE = 500;

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.map': 'application/json',
};
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.xml', '.txt', '.svg']);

/* ── Petit cache mémoire ── */
const cache = new Map<string, { at: number; value: unknown }>();
/** `ok` : refuse de mémoriser un résultat issu d'une panne passagère de la base (il serait servi 5 minutes). */
async function cached<T>(key: string, load: () => Promise<T>, ok: (v: T) => boolean = () => true): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value as T;
  const value = await load();
  if (!ok(value)) return value;
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value as string);
  cache.set(key, { at: Date.now(), value });
  return value;
}

/** Lecture de l'API REST de Supabase. Connexion en IPv4 : certains hébergeurs n'ont pas d'IPv6 sortant et `fetch` attendrait en vain. */
function rest<T>(path: string): Promise<T | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return Promise.resolve(null);
  return new Promise(resolveRest => {
    const req = httpsRequest(`${SUPABASE_URL}/rest/v1/${path}`, {
      family: 4, timeout: 6000,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: 'application/json' },
    }, res => {
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        if ((res.statusCode ?? 500) >= 300) { resolveRest(null); return; }
        try { resolveRest(JSON.parse(Buffer.concat(chunks).toString('utf8')) as T); } catch { resolveRest(null); }
      });
    });
    req.on('timeout', () => { req.destroy(); resolveRest(null); });
    req.on('error', () => resolveRest(null));
    req.end();
  });
}

const PRODUCT_COLS = 'id,name,description,price,currency,image_url,images,quantity,category,avg_rating,ratings_count,created_at';

interface ShopData { profile: Profile; products: Product[]; services: Service[] }

/** Données publiques d'une boutique (`null` si elle n'existe pas). */
function loadShop(username: string): Promise<ShopData | null> {
  return cached(`shop:${username}`, async () => {
    const profiles = await rest<Profile[]>(
      `profiles?select=user_id,username,shop_name,display_name,bio,shop_logo_url,avatar_url,contact_phone,social_links&username=eq.${encodeURIComponent(username)}&limit=1`);
    if (profiles === null) return undefined as unknown as null; // panne de la base : ne pas mémoriser
    const profile = profiles[0];
    if (!profile) return null;
    const [products, services] = await Promise.all([
      rest<Product[]>(`products?select=${PRODUCT_COLS}&user_id=eq.${profile.user_id}&is_active=eq.true&order=created_at.desc&limit=20`),
      rest<Service[]>(`services?select=id,name,description,price,currency,image_url&user_id=eq.${profile.user_id}&is_active=eq.true&order=created_at.desc&limit=10`),
    ]);
    return { profile, products: products ?? [], services: services ?? [] };
  }, v => v !== undefined);
}

function loadProduct(userId: string, productId: string): Promise<Product | null> {
  return cached(`product:${productId}`, async () => {
    const rows = await rest<Product[]>(`products?select=${PRODUCT_COLS}&id=eq.${encodeURIComponent(productId)}&user_id=eq.${userId}&is_active=eq.true&limit=1`);
    return rows?.[0] ?? null;
  });
}

function loadSitemap(): Promise<string> {
  let healthy = true;
  return cached('sitemap', async () => {
    const [profiles, products, services] = await Promise.all([
      rest<Array<{ user_id: string; username: string; updated_at: string }>>('profiles?select=user_id,username,updated_at&username=not.is.null&limit=5000'),
      rest<Array<{ id: string; user_id: string }>>('products?select=id,user_id&is_active=eq.true&limit=20000'),
      rest<Array<{ user_id: string }>>('services?select=user_id&is_active=eq.true&limit=20000'),
    ]);
    healthy = profiles !== null && products !== null && services !== null;
    const productsByUser = new Map<string, string[]>();
    (products ?? []).forEach(p => productsByUser.set(p.user_id, [...(productsByUser.get(p.user_id) ?? []), p.id]));
    const withService = new Set((services ?? []).map(s => s.user_id));
    const shops: SitemapShop[] = (profiles ?? [])
      .filter(p => /^[\w.-]{1,40}$/.test(p.username) && (productsByUser.has(p.user_id) || withService.has(p.user_id)))
      .map(p => ({ username: p.username, updated_at: p.updated_at, products: productsByUser.get(p.user_id) }));
    return buildSitemap(shops);
  }, () => healthy);
}

/* ── Réponses ── */
const gzipCache = new Map<string, Buffer>();

function send(req: IncomingMessage, res: ServerResponse, status: number, body: Buffer | string, type: string, cacheControl: string, key?: string) {
  const ext = Object.keys(MIME).find(k => MIME[k] === type) ?? '';
  let data = typeof body === 'string' ? Buffer.from(body) : body;
  const headers: Record<string, string> = {
    'Content-Type': type, 'Cache-Control': cacheControl, 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin', 'Vary': 'Accept-Encoding',
  };
  if (COMPRESSIBLE.has(ext) && data.length > 1024 && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
    const k = key ? `${key}:${data.length}` : '';
    let z = k ? gzipCache.get(k) : undefined;
    if (!z) { z = gzipSync(data); if (k && gzipCache.size < 300) gzipCache.set(k, z); }
    data = z;
    headers['Content-Encoding'] = 'gzip';
  }
  headers['Content-Length'] = String(data.length);
  res.writeHead(status, headers);
  res.end(req.method === 'HEAD' ? undefined : data);
}

let template = '';
const indexHtml = () => template || (template = readFileSync(join(DIST, 'index.html'), 'utf8'));

/** Page de l'application avec les balises de référencement de la page demandée. */
function sendPage(req: IncomingMessage, res: ServerResponse, status: number, seo: SeoConfig | null) {
  const html = seo ? injectSeo(indexHtml(), seo) : indexHtml();
  send(req, res, status, html, MIME['.html'], 'public, max-age=0, s-maxage=300, must-revalidate');
}

const SHOP_RE = /^\/u\/([\w.-]{1,40})\/?$/;
const PRODUCT_RE = /^\/u\/([\w.-]{1,40})\/p\/([0-9a-fA-F-]{36})\/?$/;

async function handle(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405).end(); return; }
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = decodeURIComponent(url.pathname);
  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'fr';

  if (path === '/healthz') { send(req, res, 200, 'ok', MIME['.txt'], 'no-store'); return; }

  if (path === '/sitemap.xml') {
    const xml = await loadSitemap();
    send(req, res, 200, xml, MIME['.xml'], 'public, max-age=3600', 'sitemap');
    return;
  }

  const productMatch = path.match(PRODUCT_RE);
  const shopMatch = productMatch ? null : path.match(SHOP_RE);
  if (productMatch || shopMatch) {
    const username = (productMatch ?? shopMatch)![1];
    const shop = await loadShop(username);
    if (!shop) {
      sendPage(req, res, 404, { title: `Boutique introuvable | ${SITE_NAME}`, description: 'Cette boutique n’existe pas ou a été supprimée.', noindex: true, lang, path });
      return;
    }
    if (productMatch) {
      const product = await loadProduct(shop.profile.user_id, productMatch[2]);
      if (product) { sendPage(req, res, 200, productSeo(shop.profile, product, lang)); return; }
    }
    sendPage(req, res, 200, shopSeo(shop.profile, shop.products, shop.services, lang));
    return;
  }

  // Fichiers du site
  const file = normalize(join(DIST, path));
  if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile() && path !== '/index.html') {
    const ext = extname(file).toLowerCase();
    const hashed = path.startsWith('/assets/');
    send(req, res, 200, readFileSync(file), MIME[ext] ?? 'application/octet-stream',
      hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=3600', file);
    return;
  }

  // Pages de l'application (accueil, mentions légales, commande…) : même fichier, l'application gère l'affichage
  const isAsset = /\.[a-z0-9]{2,5}$/i.test(path);
  if (isAsset) { send(req, res, 404, 'Not found', MIME['.txt'], 'no-store'); return; }
  sendPage(req, res, 200, null);
}

createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erreur serveur');
  });
}).listen(PORT, () => console.log(`BioLinkWD : serveur prêt sur le port ${PORT}`));
