import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { invoke, rpc } = vi.hoisted(() => ({ invoke: vi.fn(), rpc: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { functions: { invoke }, rpc } }));

import { buildSitemap, injectSeo, productSeo, renderHeadTags } from '../../lib/seoPages';
import { shopSeo } from '../../lib/seoCore';
import { sendAnnouncement, unsubscribePlatformEmails, validateAnnouncement } from '../../lib/api/platformEmails';
import type { Product, Profile } from '../../lib/types';

const profile = { username: 'kora', shop_name: 'Atelier <Kora>', bio: 'Maroquinerie', shop_logo_url: 'https://img/logo.png', social_links: [] } as unknown as Profile;
const product = { id: '123e4567-e89b-12d3-a456-426614174000', name: 'Sac "premium"', description: 'Cuir pleine fleur', price: 15000, currency: 'FCFA', quantity: 2, image_url: 'https://img/sac.jpg', images: [], ratings_count: 0, avg_rating: 0 } as unknown as Product;

const TEMPLATE = `<!doctype html><html lang="fr"><head>
<title>Générique</title>
<meta name="description" content="générique" />
<meta property="og:title" content="générique" />
<link rel="canonical" href="https://biolinkwd.duckdns.org/" />
<link rel="alternate" hreflang="fr" href="https://biolinkwd.duckdns.org/" />
<script type="application/ld+json">{"@type":"SoftwareApplication"}</script>
<meta name="theme-color" content="#6C63FF" />
</head><body><div id="root"></div></body></html>`;

describe('aperçus de partage rendus côté serveur', () => {
  it('remplace les balises génériques par celles de la boutique, en échappant le texte', () => {
    const html = injectSeo(TEMPLATE, shopSeo(profile, [product], [], 'fr'));
    expect(html).toContain('<title>Atelier &lt;Kora&gt; — Boutique en ligne | BioLinkWD</title>');
    expect(html).not.toContain('Générique');
    expect(html).not.toContain('SoftwareApplication');
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain('href="https://biolinkwd.duckdns.org/u/kora"');
    expect(html).toContain('og:image" content="https://img/logo.png"');
    expect(html).toContain('theme-color'); // les balises sans rapport sont conservées
  });
  it('ne peut pas être détourné par un nom contenant du HTML', () => {
    const html = renderHeadTags({ title: 'x', description: '"><script>alert(1)</script>', jsonLd: { n: '</script><b>' } });
    expect(html).not.toContain('<script>alert');
    expect(html.match(/<\/script>/g)).toHaveLength(1); // seulement celui du bloc JSON-LD
  });
  it('donne à chaque produit son adresse, son image et son prix', () => {
    const cfg = productSeo(profile, product, 'fr');
    expect(cfg.path).toBe('/u/kora/p/123e4567-e89b-12d3-a456-426614174000');
    expect(cfg.image).toBe('https://img/sac.jpg');
    expect(cfg.description).toContain('15');
    expect(JSON.stringify(cfg.jsonLd)).toContain('"priceCurrency":"XOF"');
    expect(JSON.stringify(cfg.jsonLd)).not.toContain('aggregateRating');
  });
  it('marque en noindex une boutique introuvable', () => {
    expect(renderHeadTags({ title: 't', description: 'd', noindex: true })).toContain('noindex, nofollow');
  });
});

describe('sitemap', () => {
  it('liste les pages, les boutiques et leurs produits', () => {
    const xml = buildSitemap([{ username: 'kora', updated_at: '2026-10-01T10:00:00Z', products: ['p1', 'p2'] }], '2026-10-15');
    expect(xml).toContain('<loc>https://biolinkwd.duckdns.org/u/kora</loc>');
    expect(xml).toContain('<loc>https://biolinkwd.duckdns.org/u/kora/p/p1</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(6);
    expect(xml).toContain('<lastmod>2026-10-01</lastmod>');
  });
});

describe('annonces aux vendeurs', () => {
  beforeEach(() => { invoke.mockReset(); rpc.mockReset(); });
  const ok = { title: 'Suivi sur carte', body: 'Nouveauté', cta_label: 'Découvrir', cta_path: '/' };

  it('contrôle la saisie avant tout envoi', () => {
    expect(validateAnnouncement(ok)).toBeNull();
    expect(validateAnnouncement({ ...ok, title: 'ab' })).toMatch(/titre/i);
    expect(validateAnnouncement({ ...ok, cta_path: '//evil.com' })).toMatch(/commencer/i);
    expect(validateAnnouncement({ ...ok, cta_path: 'https://evil.com' })).toMatch(/commencer/i);
    expect(validateAnnouncement({ ...ok, cta_label: '', cta_path: '/' })).toMatch(/texte/i);
  });
  it('n\'appelle pas le serveur si la saisie est invalide', async () => {
    expect(await sendAnnouncement({ ...ok, title: '' }, false)).toEqual({ ok: false, error: 'invalid' });
    expect(invoke).not.toHaveBeenCalled();
  });
  it('relaie les réponses du serveur', async () => {
    invoke.mockResolvedValueOnce({ data: { sent: 12 }, error: null });
    expect(await sendAnnouncement(ok, false)).toEqual({ ok: true, sent: 12 });
    expect(invoke).toHaveBeenCalledWith('platform-emails', { body: expect.objectContaining({ mode: 'announce', test: false }) });
    invoke.mockResolvedValueOnce({ data: { error: 'rate_limited' }, error: null });
    expect(await sendAnnouncement(ok, false)).toEqual({ ok: false, error: 'rate_limited' });
    invoke.mockResolvedValueOnce({ data: null, error: { context: { status: 403 } } });
    expect(await sendAnnouncement(ok, false)).toEqual({ ok: false, error: 'forbidden' });
    invoke.mockRejectedValueOnce(new Error('hors ligne'));
    expect(await sendAnnouncement(ok, true)).toEqual({ ok: false, error: 'unavailable' });
  });
  it('enregistre la désinscription via le jeton', async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    expect(await unsubscribePlatformEmails('tok')).toBe(true);
    expect(rpc).toHaveBeenCalledWith('platform_email_unsubscribe', { p_token: 'tok' });
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await unsubscribePlatformEmails('tok')).toBe(false);
  });
});

describe('fonction platform-emails et migration', () => {
  const fn = readFileSync(resolve(__dirname, '../../../supabase/functions/platform-emails/index.ts'), 'utf8');
  const sql = readFileSync(resolve(__dirname, '../../../supabase/migrations/20261019000000_platform_emails.sql'), 'utf8');

  it('reconnaît l\'administrateur par une liste serveur, jamais par profiles.is_admin', () => {
    expect(fn).toContain('ADMIN_EMAILS');
    expect(fn).not.toMatch(/\.select\([^)]*is_admin/);
  });
  it('protège le rappel hebdomadaire par un secret et limite sa fréquence', () => {
    expect(fn).toContain("x-cron-secret");
    expect(fn).toMatch(/INACTIVE_DAYS = 7/);
    expect(fn).toMatch(/MAX_REMINDERS = 8/);
  });
  it('annonce les vraies conditions du parrainage (5 % / 2 % / 1 %, 12 mois)', () => {
    expect(fn).toContain('5&nbsp;%');
    expect(fn).toContain('2&nbsp;%');
    expect(fn).toContain('1&nbsp;%');
    expect(fn).toContain('12 mois');
  });
  it('ferme la table des préférences au public', () => {
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).not.toMatch(/create policy[^;]*platform_email_prefs/i);
  });
});
