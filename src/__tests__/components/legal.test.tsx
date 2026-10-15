import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CguPage from '../../components/legal/CguPage';
import PrivacyPage from '../../components/legal/PrivacyPage';

import { useAppPrefs } from '../../lib/AppPrefsContext';

// Mock AppPrefsContext (les pages légales l'utilisent pour le thème)
vi.mock('../../lib/AppPrefsContext', () => ({
  useAppPrefs: vi.fn(() => ({ isDark: false })),
}));

// ── CguPage ───────────────────────────────────────────────────────────────────

describe('CguPage', () => {
  beforeEach(() => {
    render(<CguPage />);
  });

  it('s\'affiche sans crash', () => {
    expect(document.body).toBeTruthy();
  });

  it('contient le titre principal', () => {
    expect(screen.getByRole('heading', { name: /Conditions Générales d'Utilisation/i, level: 1 })).toBeInTheDocument();
  });

  it('mentionne WhiteDuckSaaS', () => {
    expect(screen.getAllByText(/WhiteDuckSaaS/i).length).toBeGreaterThan(0);
  });

  it('contient l\'article sur les commissions', () => {
    expect(screen.getByText(/5\. Commissions et tarification/i)).toBeInTheDocument();
  });

  it('affiche les 4 forfaits dans le tableau des commissions', () => {
    expect(screen.getAllByText('Gratuit').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Starter').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Business').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Premium').length).toBeGreaterThanOrEqual(1);
  });

  it('affiche les taux de commission (5%, 4%, 3%, 2%)', () => {
    expect(screen.getByText('5 %')).toBeInTheDocument();
    expect(screen.getByText('4 %')).toBeInTheDocument();
    expect(screen.getByText('3 %')).toBeInTheDocument();
    expect(screen.getByText('2 %')).toBeInTheDocument();
  });

  it('contient l\'article sur les contenus interdits', () => {
    expect(screen.getByText(/4\. Contenus interdits/i)).toBeInTheDocument();
  });

  it('contient l\'article sur le droit applicable (Cameroun)', () => {
    expect(screen.getByText(/13\. Droit applicable/i)).toBeInTheDocument();
    expect(screen.getByText(/camerounais/i)).toBeInTheDocument();
  });

  it('le lien "Retour à l\'accueil" pointe vers /', () => {
    const link = screen.getByRole('link', { name: /retour à l'accueil/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('contient un pied de page avec l\'année 2026', () => {
    expect(screen.getByText(/2026 WhiteDuckSaaS/i)).toBeInTheDocument();
  });
});

// ── CguPage en mode sombre ────────────────────────────────────────────────────

describe('CguPage — mode sombre', () => {
  it('s\'affiche sans crash en mode dark', () => {
    vi.mocked(useAppPrefs).mockReturnValueOnce({ isDark: true });
    expect(() => render(<CguPage />)).not.toThrow();
    vi.mocked(useAppPrefs).mockReturnValue({ isDark: false });
  });
});

// ── PrivacyPage ───────────────────────────────────────────────────────────────

describe('PrivacyPage', () => {
  beforeEach(() => {
    render(<PrivacyPage />);
  });

  it('s\'affiche sans crash', () => {
    expect(document.body).toBeTruthy();
  });

  it('contient le titre principal', () => {
    expect(screen.getByRole('heading', { name: /Politique de Confidentialité/i, level: 1 })).toBeInTheDocument();
  });

  it('mentionne Supabase comme infrastructure', () => {
    expect(screen.getByText(/Supabase/i)).toBeInTheDocument();
  });

  it('mentionne MTN Mobile Money et Orange Money', () => {
    expect(screen.getAllByText(/MTN Mobile Money/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Orange Money/i).length).toBeGreaterThanOrEqual(1);
  });

  it('contient la section sur les droits des utilisateurs', () => {
    expect(screen.getByText(/6\. Vos droits/i)).toBeInTheDocument();
  });

  it('contient la section cookies', () => {
    expect(screen.getByText(/7\. Cookies/i)).toBeInTheDocument();
  });

  it('le lien "Retour" pointe vers /', () => {
    const link = screen.getByRole('link', { name: /retour à l'accueil/i });
    expect(link).toHaveAttribute('href', '/');
  });
});
