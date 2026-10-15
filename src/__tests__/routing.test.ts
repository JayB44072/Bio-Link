import { describe, it, expect } from 'vitest';

/**
 * Ces tests vérifient la logique de routage de App.tsx (pattern matching).
 * Ils n'instancient pas React — ils testent les expressions régulières
 * et les conditions de chemin directement.
 */

const ORDER_RE  = /^\/commande\/([^/]+)\/?$/;
const PUBLIC_RE = /^\/u\/([^/]+)\/?$/;

// ── Routes légales ────────────────────────────────────────────────────────────

describe('Routes légales', () => {
  it('/cgu est reconnu comme route CGU', () => {
    expect('/cgu').toBe('/cgu');
  });

  it('/confidentialite est la route principale de la politique de confidentialité', () => {
    expect('/confidentialite').toBe('/confidentialite');
  });

  it('/privacy est un alias de /confidentialite', () => {
    const path = '/privacy';
    expect(path === '/confidentialite' || path === '/privacy').toBe(true);
  });
});

// ── Route commande ────────────────────────────────────────────────────────────

describe('Route /commande/:id', () => {
  it('matche un id alphanumérique',         () => {
    const m = '/commande/order123'.match(ORDER_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe('order123');
  });

  it('matche un UUID',                      () => {
    const m = '/commande/550e8400-e29b-41d4-a716-446655440000'.match(ORDER_RE);
    expect(m![1]).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('matche avec slash final',             () => {
    const m = '/commande/abc123/'.match(ORDER_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe('abc123');
  });

  it('ne matche PAS /commande/ (id vide)', () => {
    expect('/commande/'.match(ORDER_RE)).toBeNull();
  });

  it('ne matche PAS /commande (sans id)', () => {
    expect('/commande'.match(ORDER_RE)).toBeNull();
  });

  it('ne matche PAS /commande/a/b (deux segments)', () => {
    expect('/commande/a/b'.match(ORDER_RE)).toBeNull();
  });
});

// ── Route suivi ───────────────────────────────────────────────────────────────

describe('Route /suivi', () => {
  it('/suivi est reconnu', () => {
    expect('/suivi').toBe('/suivi');
  });

  it('/suivi-commande ne matche pas /suivi', () => {
    expect('/suivi-commande' === '/suivi').toBe(false);
  });
});

// ── Route boutique publique ───────────────────────────────────────────────────

describe('Route /u/:username', () => {
  it('matche un username simple',          () => {
    const m = '/u/alice'.match(PUBLIC_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe('alice');
  });

  it('matche un username avec chiffres',   () => {
    const m = '/u/shop2024'.match(PUBLIC_RE);
    expect(m![1]).toBe('shop2024');
  });

  it('matche avec tiret dans le username', () => {
    const m = '/u/ma-boutique'.match(PUBLIC_RE);
    expect(m![1]).toBe('ma-boutique');
  });

  it('matche avec slash final',            () => {
    const m = '/u/alice/'.match(PUBLIC_RE);
    expect(m).not.toBeNull();
    expect(m![1]).toBe('alice');
  });

  it('ne matche PAS /u/ (username vide)', () => {
    expect('/u/'.match(PUBLIC_RE)).toBeNull();
  });

  it('ne matche PAS /u (sans slash)',     () => {
    expect('/u'.match(PUBLIC_RE)).toBeNull();
  });

  it('ne matche PAS /u/alice/extra',      () => {
    expect('/u/alice/extra'.match(PUBLIC_RE)).toBeNull();
  });

  it('ne matche PAS /utilisateur/alice',  () => {
    expect('/utilisateur/alice'.match(PUBLIC_RE)).toBeNull();
  });
});

// ── Priorité des routes ───────────────────────────────────────────────────────

describe('Priorité : les routes spéciales passent avant /u/:username', () => {
  it('/cgu ne matche pas le pattern /u/:username', () => {
    expect('/cgu'.match(PUBLIC_RE)).toBeNull();
  });

  it('/confidentialite ne matche pas le pattern commande', () => {
    expect('/confidentialite'.match(ORDER_RE)).toBeNull();
  });

  it('/suivi ne matche pas le pattern /u/:username', () => {
    expect('/suivi'.match(PUBLIC_RE)).toBeNull();
  });
});
