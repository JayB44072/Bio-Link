import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductBlurb from '../../components/public/ProductBlurb';
import HeroProductDeck from '../../components/public/HeroProductDeck';
import { wavyLinePath } from '../../lib/waveLayout';
import { SHOP_THEMES } from '../../lib/planLimits';
import type { Product } from '../../lib/types';

const style = SHOP_THEMES.cinema.hero3d!;
const product = (id: string, name: string, extra: Partial<Product> = {}) =>
  ({ id, name, price: 15000, currency: 'XAF', image_url: `https://x/${id}.jpg`, images: [], ...extra }) as unknown as Product;

describe('wavyLinePath', () => {
  it('trace une sinusoïde bornée par son amplitude, de la largeur demandée', () => {
    const d = wavyLinePath(64, 3, 3);
    const nums = [...d.matchAll(/[ML]([\d.-]+) ([\d.-]+)/g)].map(m => [Number(m[1]), Number(m[2])]);
    expect(nums[0][0]).toBe(0);
    expect(nums[nums.length - 1][0]).toBeCloseTo(64, 0);
    for (const [, y] of nums) { expect(y).toBeGreaterThanOrEqual(-0.01); expect(y).toBeLessThanOrEqual(6.01); }
    expect(new Set(nums.map(n => Math.round(n[1] * 10))).size).toBeGreaterThan(5); // elle ondule vraiment
  });
});

describe('ProductBlurb', () => {
  const props = { color: '#888', accent: '#C9A96E', moreLabel: 'Voir plus' };

  it('affiche la description', () => {
    render(<ProductBlurb text="Sneakers légères en cuir végétal" fallback="Aucune description." {...props} />);
    expect(screen.getByText('Sneakers légères en cuir végétal')).toBeInTheDocument();
    expect(screen.queryByText('Voir plus')).toBeNull();
  });

  it('indique « Voir plus » seulement quand le texte est long', () => {
    render(<ProductBlurb text={'Un très long texte. '.repeat(12)} fallback="x" {...props} />);
    expect(screen.getByText('Voir plus')).toBeInTheDocument();
  });

  it('utilise le texte de remplacement sans description', () => {
    render(<ProductBlurb text="   " fallback="Aucune description." {...props} />);
    expect(screen.getByText('Aucune description.')).toBeInTheDocument();
  });
});

describe('HeroProductDeck', () => {
  const items = [product('a', 'Sneakers Aero'), product('b', 'Montre Classic', { price: 0 })];

  it('affiche les produits en médaillons avec nom et prix (grand écran)', () => {
    render(<HeroProductDeck products={items} side="left" compact={false} style={style} lang="fr" onOpen={vi.fn()} />);
    expect(screen.getByText('Sneakers Aero')).toBeInTheDocument();
    expect(screen.getByText(content => content.replace(/\D/g, '') === '15000')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('n\'affiche que les médaillons sur petit écran, avec un nom accessible', () => {
    render(<HeroProductDeck products={items} side="right" compact style={style} lang="fr" onOpen={vi.fn()} />);
    expect(screen.queryByText('Sneakers Aero')).toBeNull();
    expect(screen.getByRole('button', { name: 'Voir Sneakers Aero' })).toBeInTheDocument();
  });

  it('ouvre le produit au clic', () => {
    const onOpen = vi.fn();
    render(<HeroProductDeck products={items} side="left" compact={false} style={style} lang="fr" onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Voir Montre Classic' }));
    expect(onOpen).toHaveBeenCalledWith(items[1]);
  });

  it('n\'affiche pas de prix pour un produit gratuit/sans prix', () => {
    render(<HeroProductDeck products={[items[1]]} side="left" compact={false} style={style} lang="fr" onOpen={vi.fn()} />);
    expect(screen.queryByText(/XAF/)).toBeNull();
  });
});
