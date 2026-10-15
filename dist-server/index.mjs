// server/index.ts
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { request as httpsRequest } from "node:https";

// src/lib/seoCore.ts
var SITE_URL = "https://biolinkwd.duckdns.org";
var SITE_NAME = "BioLinkWD";
var DEFAULT_IMAGE = `${SITE_URL}/logo.png`;
function truncate(text, max) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.!-]+$/, "")}\u2026`;
}
function isoCurrency(currency) {
  const c = (currency ?? "").trim().toUpperCase();
  if (c === "FCFA" || c === "CFA" || c === "F CFA" || c === "XOF") return "XOF";
  if (c === "XAF") return "XAF";
  return /^[A-Z]{3}$/.test(c) ? c : "XOF";
}
function shopJsonLd(profile, products, services) {
  const name = profile.shop_name || profile.display_name || profile.username;
  const url = `${SITE_URL}/u/${profile.username}`;
  const sameAs = (profile.social_links ?? []).map((l) => l.url).filter((u) => /^https?:\/\//i.test(u));
  const items = [
    ...products.slice(0, 20).map((p) => ({
      "@type": "Product",
      name: p.name,
      description: truncate(p.description, 300) || void 0,
      image: [p.image_url, ...p.images ?? []].filter(Boolean).slice(0, 4),
      url,
      offers: {
        "@type": "Offer",
        price: String(p.price),
        priceCurrency: isoCurrency(p.currency),
        availability: p.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        url,
        seller: { "@type": "Organization", name }
      },
      // On n'affiche une note que si de vrais avis existent
      ...p.ratings_count > 0 && p.avg_rating > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.avg_rating, reviewCount: p.ratings_count } } : {}
    })),
    ...services.slice(0, 10).map((s) => ({
      "@type": "Service",
      name: s.name,
      description: truncate(s.description, 300) || void 0,
      provider: { "@type": "Organization", name },
      url
    }))
  ];
  return [
    {
      "@context": "https://schema.org",
      "@type": "Store",
      name,
      url,
      description: truncate(profile.bio, 300) || void 0,
      image: profile.shop_logo_url || profile.avatar_url || void 0,
      ...profile.contact_phone ? { telephone: profile.contact_phone } : {},
      ...sameAs.length ? { sameAs } : {}
    },
    ...items.length ? [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${name} \u2014 catalogue`,
      itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, item }))
    }] : [],
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name, item: url }
      ]
    }
  ];
}
function shopSeo(profile, products, services, lang = "fr") {
  const name = profile.shop_name || profile.display_name || profile.username;
  const fr = lang === "fr";
  const names = [...products.map((p) => p.name), ...services.map((s) => s.name)].slice(0, 4).join(", ");
  const fallback = fr ? `D\xE9couvrez la boutique ${name}${names ? ` : ${names}` : ""}. Commandez en ligne et payez par Mobile Money, carte bancaire ou WhatsApp.` : `Discover ${name}${names ? `: ${names}` : ""}. Order online and pay by Mobile Money, card or WhatsApp.`;
  return {
    title: fr ? `${name} \u2014 Boutique en ligne | ${SITE_NAME}` : `${name} \u2014 Online shop | ${SITE_NAME}`,
    description: truncate(profile.bio?.trim() ? `${profile.bio.trim()} ${names ? `\xB7 ${names}` : ""}` : fallback, 158),
    path: `/u/${profile.username}`,
    image: profile.shop_logo_url || products[0]?.image_url || profile.avatar_url || void 0,
    type: "profile",
    lang,
    jsonLd: shopJsonLd(profile, products, services)
  };
}

// src/lib/seoPages.ts
function productSeo(profile, product, lang = "fr") {
  const shop = profile.shop_name || profile.display_name || profile.username;
  const fr = lang === "fr";
  const price = `${product.price.toLocaleString(fr ? "fr-FR" : "en-US")} ${product.currency}`;
  const url = `${SITE_URL}/u/${profile.username}/p/${product.id}`;
  return {
    title: `${product.name} \u2014 ${shop} | ${SITE_NAME}`,
    description: truncate(`${product.name} \xB7 ${price}. ${product.description ?? ""}`, 158),
    path: `/u/${profile.username}/p/${product.id}`,
    image: product.image_url || product.images?.[0] || void 0,
    type: "product",
    lang,
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: truncate(product.description ?? "", 500) || void 0,
        image: [product.image_url, ...product.images ?? []].filter(Boolean).slice(0, 5),
        category: product.category || void 0,
        url,
        offers: {
          "@type": "Offer",
          price: String(product.price),
          priceCurrency: isoCurrency(product.currency),
          availability: product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url,
          seller: { "@type": "Organization", name: shop }
        },
        ...product.ratings_count > 0 && product.avg_rating > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.avg_rating, reviewCount: product.ratings_count } } : {}
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: shop, item: `${SITE_URL}/u/${profile.username}` },
          { "@type": "ListItem", position: 3, name: product.name, item: url }
        ]
      }
    ]
  };
}
var escAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function renderHeadTags(cfg) {
  const url = `${SITE_URL}${cfg.path ?? "/"}`;
  const image = !cfg.image ? `${SITE_URL}/logo.png` : /^https?:\/\//i.test(cfg.image) ? cfg.image : `${SITE_URL}${cfg.image.startsWith("/") ? "" : "/"}${cfg.image}`;
  const lang = cfg.lang ?? "fr";
  const robots = cfg.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  const m = (attr, k, v) => `<meta ${attr}="${k}" content="${escAttr(v)}" />`;
  const blocks = cfg.jsonLd ? Array.isArray(cfg.jsonLd) ? cfg.jsonLd : [cfg.jsonLd] : [];
  return [
    `<title>${escAttr(cfg.title)}</title>`,
    m("name", "description", cfg.description),
    m("name", "robots", robots),
    `<link rel="canonical" href="${escAttr(url)}" />`,
    m("property", "og:title", cfg.title),
    m("property", "og:description", cfg.description),
    m("property", "og:url", url),
    m("property", "og:type", cfg.type === "profile" ? "website" : cfg.type ?? "website"),
    m("property", "og:image", image),
    m("property", "og:image:secure_url", image),
    m("property", "og:locale", lang === "fr" ? "fr_FR" : "en_US"),
    m("name", "twitter:card", "summary_large_image"),
    m("name", "twitter:title", cfg.title),
    m("name", "twitter:description", cfg.description),
    m("name", "twitter:image", image),
    ...blocks.map((b) => `<script type="application/ld+json">${JSON.stringify(b).replace(/</g, "\\u003c")}</script>`)
  ].join("\n    ");
}
function injectSeo(html, cfg) {
  const strip = [
    /<title>[\s\S]*?<\/title>\s*/gi,
    /<meta\s+name="(?:description|robots|googlebot|twitter:[^"]+)"[^>]*>\s*/gi,
    /<meta\s+property="og:[^"]+"[^>]*>\s*/gi,
    /<link\s+rel="canonical"[^>]*>\s*/gi,
    /<link\s+rel="alternate"\s+hreflang[^>]*>\s*/gi,
    /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi
  ];
  let out = html;
  for (const re of strip) out = out.replace(re, "");
  out = out.replace(/<html lang="[^"]*"/, `<html lang="${cfg.lang ?? "fr"}"`);
  return out.replace("</head>", `    ${renderHeadTags(cfg)}
  </head>`);
}
var xmlEsc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var day = (iso) => (iso ? new Date(iso) : /* @__PURE__ */ new Date()).toISOString().slice(0, 10);
function buildSitemap(shops, today = day()) {
  const url = (loc, lastmod, changefreq, priority, extra = "") => `  <url>
    <loc>${xmlEsc(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${extra}
  </url>`;
  const alt = `
    <xhtml:link rel="alternate" hreflang="fr" href="${SITE_URL}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${SITE_URL}/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}/"/>`;
  const entries = [
    url(`${SITE_URL}/`, today, "weekly", "1.0", alt),
    url(`${SITE_URL}/privacy`, today, "yearly", "0.3"),
    url(`${SITE_URL}/cgu`, today, "yearly", "0.3"),
    ...shops.flatMap((s) => [
      url(`${SITE_URL}/u/${encodeURIComponent(s.username)}`, day(s.updated_at), "weekly", "0.7"),
      ...(s.products ?? []).map((id) => url(`${SITE_URL}/u/${encodeURIComponent(s.username)}/p/${encodeURIComponent(id)}`, day(s.updated_at), "weekly", "0.6"))
    ])
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
}

// server/index.ts
var DIST = resolve(process.cwd(), "dist");
var PORT = Number(process.env.PORT ?? 3e3);
var SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
var SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
var CACHE_MS = 5 * 60 * 1e3;
var MAX_CACHE = 500;
var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json"
};
var COMPRESSIBLE = /* @__PURE__ */ new Set([".html", ".js", ".mjs", ".css", ".json", ".xml", ".txt", ".svg"]);
var cache = /* @__PURE__ */ new Map();
async function cached(key, load, ok = () => true) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await load();
  if (!ok(value)) return value;
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, { at: Date.now(), value });
  return value;
}
function rest(path) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return Promise.resolve(null);
  return new Promise((resolveRest) => {
    const req = httpsRequest(`${SUPABASE_URL}/rest/v1/${path}`, {
      family: 4,
      timeout: 6e3,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Accept: "application/json" }
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        if ((res.statusCode ?? 500) >= 300) {
          resolveRest(null);
          return;
        }
        try {
          resolveRest(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        } catch {
          resolveRest(null);
        }
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolveRest(null);
    });
    req.on("error", () => resolveRest(null));
    req.end();
  });
}
var PRODUCT_COLS = "id,name,description,price,currency,image_url,images,quantity,category,avg_rating,ratings_count,created_at";
function loadShop(username) {
  return cached(`shop:${username}`, async () => {
    const profiles = await rest(
      `profiles?select=user_id,username,shop_name,display_name,bio,shop_logo_url,avatar_url,contact_phone,social_links&username=eq.${encodeURIComponent(username)}&limit=1`
    );
    if (profiles === null) return void 0;
    const profile = profiles[0];
    if (!profile) return null;
    const [products, services] = await Promise.all([
      rest(`products?select=${PRODUCT_COLS}&user_id=eq.${profile.user_id}&is_active=eq.true&order=created_at.desc&limit=20`),
      rest(`services?select=id,name,description,price,currency,image_url&user_id=eq.${profile.user_id}&is_active=eq.true&order=created_at.desc&limit=10`)
    ]);
    return { profile, products: products ?? [], services: services ?? [] };
  }, (v) => v !== void 0);
}
function loadProduct(userId, productId) {
  return cached(`product:${productId}`, async () => {
    const rows = await rest(`products?select=${PRODUCT_COLS}&id=eq.${encodeURIComponent(productId)}&user_id=eq.${userId}&is_active=eq.true&limit=1`);
    return rows?.[0] ?? null;
  });
}
function loadSitemap() {
  let healthy = true;
  return cached("sitemap", async () => {
    const [profiles, products, services] = await Promise.all([
      rest("profiles?select=user_id,username,updated_at&username=not.is.null&limit=5000"),
      rest("products?select=id,user_id&is_active=eq.true&limit=20000"),
      rest("services?select=user_id&is_active=eq.true&limit=20000")
    ]);
    healthy = profiles !== null && products !== null && services !== null;
    const productsByUser = /* @__PURE__ */ new Map();
    (products ?? []).forEach((p) => productsByUser.set(p.user_id, [...productsByUser.get(p.user_id) ?? [], p.id]));
    const withService = new Set((services ?? []).map((s) => s.user_id));
    const shops = (profiles ?? []).filter((p) => /^[\w.-]{1,40}$/.test(p.username) && (productsByUser.has(p.user_id) || withService.has(p.user_id))).map((p) => ({ username: p.username, updated_at: p.updated_at, products: productsByUser.get(p.user_id) }));
    return buildSitemap(shops);
  }, () => healthy);
}
var gzipCache = /* @__PURE__ */ new Map();
function send(req, res, status, body, type, cacheControl, key) {
  const ext = Object.keys(MIME).find((k) => MIME[k] === type) ?? "";
  let data = typeof body === "string" ? Buffer.from(body) : body;
  const headers = {
    "Content-Type": type,
    "Cache-Control": cacheControl,
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Vary": "Accept-Encoding"
  };
  if (COMPRESSIBLE.has(ext) && data.length > 1024 && /\bgzip\b/.test(String(req.headers["accept-encoding"] ?? ""))) {
    const k = key ? `${key}:${data.length}` : "";
    let z = k ? gzipCache.get(k) : void 0;
    if (!z) {
      z = gzipSync(data);
      if (k && gzipCache.size < 300) gzipCache.set(k, z);
    }
    data = z;
    headers["Content-Encoding"] = "gzip";
  }
  headers["Content-Length"] = String(data.length);
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? void 0 : data);
}
var template = "";
var indexHtml = () => template || (template = readFileSync(join(DIST, "index.html"), "utf8"));
function sendPage(req, res, status, seo) {
  const html = seo ? injectSeo(indexHtml(), seo) : indexHtml();
  send(req, res, status, html, MIME[".html"], "public, max-age=0, s-maxage=300, must-revalidate");
}
var SHOP_RE = /^\/u\/([\w.-]{1,40})\/?$/;
var PRODUCT_RE = /^\/u\/([\w.-]{1,40})\/p\/([0-9a-fA-F-]{36})\/?$/;
async function handle(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405).end();
    return;
  }
  const url = new URL(req.url ?? "/", "http://localhost");
  const path = decodeURIComponent(url.pathname);
  const lang = url.searchParams.get("lang") === "en" ? "en" : "fr";
  if (path === "/healthz") {
    send(req, res, 200, "ok", MIME[".txt"], "no-store");
    return;
  }
  if (path === "/sitemap.xml") {
    const xml = await loadSitemap();
    send(req, res, 200, xml, MIME[".xml"], "public, max-age=3600", "sitemap");
    return;
  }
  const productMatch = path.match(PRODUCT_RE);
  const shopMatch = productMatch ? null : path.match(SHOP_RE);
  if (productMatch || shopMatch) {
    const username = (productMatch ?? shopMatch)[1];
    const shop = await loadShop(username);
    if (!shop) {
      sendPage(req, res, 404, { title: `Boutique introuvable | ${SITE_NAME}`, description: "Cette boutique n\u2019existe pas ou a \xE9t\xE9 supprim\xE9e.", noindex: true, lang, path });
      return;
    }
    if (productMatch) {
      const product = await loadProduct(shop.profile.user_id, productMatch[2]);
      if (product) {
        sendPage(req, res, 200, productSeo(shop.profile, product, lang));
        return;
      }
    }
    sendPage(req, res, 200, shopSeo(shop.profile, shop.products, shop.services, lang));
    return;
  }
  const file = normalize(join(DIST, path));
  if (file.startsWith(DIST) && existsSync(file) && statSync(file).isFile() && path !== "/index.html") {
    const ext = extname(file).toLowerCase();
    const hashed = path.startsWith("/assets/");
    send(
      req,
      res,
      200,
      readFileSync(file),
      MIME[ext] ?? "application/octet-stream",
      hashed ? "public, max-age=31536000, immutable" : "public, max-age=3600",
      file
    );
    return;
  }
  const isAsset = /\.[a-z0-9]{2,5}$/i.test(path);
  if (isAsset) {
    send(req, res, 404, "Not found", MIME[".txt"], "no-store");
    return;
  }
  sendPage(req, res, 200, null);
}
createServer((req, res) => {
  handle(req, res).catch(() => {
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Erreur serveur");
  });
}).listen(PORT, () => console.log(`BioLinkWD : serveur pr\xEAt sur le port ${PORT}`));
