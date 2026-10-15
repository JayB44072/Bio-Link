import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { rpc, from } = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { rpc, from, functions: { invoke: vi.fn() } } }));

import { confirmDelivery, getOrderDetails, lookupOrders, recentPublicSales, isMissingFunction, type OrderDetails } from '../../lib/api/orders';
import OrderDetailsCard from '../../components/public/OrderDetailsCard';
import { PLAN_CONFIGS } from '../../lib/planLimits';

beforeEach(() => { rpc.mockReset(); from.mockReset(); });

const details = (over: Partial<OrderDetails['order']> = {}, tracking: OrderDetails['tracking'] = null): OrderDetails => ({
  order: { id: 'abcdef12-0000-0000-0000-000000000000', status: 'shipped', amount: 15000, currency: 'XOF', quantity: 2, payment_method: 'mobile',
    created_at: '2026-10-15T10:00:00Z', shipped_at: null, delivery_confirmed_at: null, delivery_address: 'Cocody, Abidjan', buyer_name: 'Awa', ...over },
  product: { id: 'p1', name: 'Sac en cuir', description: 'Un sac cousu main.', image_url: 'https://img/x.jpg', images: [], price: 7500, currency: 'XOF', location_address: 'Marché de Treichville' },
  seller: { username: 'boutique', shop_name: 'Ma Boutique', display_name: '', logo_url: '', avatar_url: '', whatsapp_number: '+2250700000000', plan_type: 'business' },
  tracking,
});

describe('api/orders', () => {
  it('reconnaît une fonction serveur absente', () => {
    expect(isMissingFunction({ code: 'PGRST202' })).toBe(true);
    expect(isMissingFunction({ message: 'Could not find the function public.lookup_orders' })).toBe(true);
    expect(isMissingFunction({ code: '42501', message: 'denied' })).toBe(false);
  });

  it('getOrderDetails renvoie le détail du serveur avec un suivi normalisé', async () => {
    rpc.mockResolvedValue({ data: { ...details(), tracking: { plan_map: true } }, error: null });
    const d = await getOrderDetails('x');
    expect(d?.product?.name).toBe('Sac en cuir');
    expect(d?.tracking).toEqual({ plan_map: true, origin: null, destination: null, events: [] });
  });

  it("getOrderDetails renvoie null si la commande n'existe pas", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await getOrderDetails('x')).toBeNull();
  });

  it('lookupOrders passe la boutique et le téléphone au serveur', async () => {
    rpc.mockResolvedValue({ data: [{ id: '1', product_name: 'Sac', product_image: 'i' }], error: null });
    const r = await lookupOrders({ sellerId: 's1', phone: '0700' });
    expect(rpc).toHaveBeenCalledWith('lookup_orders', { p_seller_id: 's1', p_phone: '0700', p_card_last4: null });
    expect(r).toHaveLength(1);
  });

  it("lookupOrders retombe sur l'ancien accès si la fonction n'existe pas encore", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find the function' } });
    const chain: Record<string, unknown> = {};
    chain.select = () => chain; chain.order = () => chain; chain.eq = () => chain;
    chain.then = (res: (v: unknown) => void) => res({ data: [{ id: '1', status: 'pending', amount: 10, currency: 'XOF', created_at: 'd', product_id: null }] });
    from.mockReturnValue(chain);
    const r = await lookupOrders({ phone: '0700' });
    expect(r[0]).toMatchObject({ id: '1', product_name: null });
  });

  it('confirmDelivery distingue les cas', async () => {
    rpc.mockResolvedValueOnce({ data: { ok: true }, error: null });
    expect(await confirmDelivery('x')).toEqual({ ok: true });
    rpc.mockResolvedValueOnce({ data: { ok: false, error: 'not_shipped' }, error: null });
    expect(await confirmDelivery('x')).toEqual({ ok: false, error: 'not_shipped' });
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'PGRST202' } });
    expect(await confirmDelivery('x')).toEqual({ ok: false, error: 'unavailable' });
  });

  it('recentPublicSales renvoie null quand la fonction manque (pour le repli)', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    expect(await recentPublicSales('s')).toBeNull();
  });
});

describe('OrderDetailsCard — écran de suivi unique', () => {
  it('montre le produit : photo, description, emplacement, adresse, quantité', () => {
    render(<OrderDetailsCard details={details()} lang="fr" onConfirm={async () => null} />);
    expect(screen.getByRole('heading', { name: 'Sac en cuir' })).toBeInTheDocument();
    expect(screen.getByAltText('Sac en cuir')).toHaveAttribute('src', 'https://img/x.jpg');
    expect(screen.getByText('Un sac cousu main.')).toBeInTheDocument();
    expect(screen.getByText('Marché de Treichville')).toBeInTheDocument();
    expect(screen.getByText('Cocody, Abidjan')).toBeInTheDocument();
    expect(screen.getByText(/^2 × /)).toBeInTheDocument();
  });

  it('propose la confirmation seulement quand la commande est expédiée', () => {
    const { rerender } = render(<OrderDetailsCard details={details({ status: 'pending' })} lang="fr" onConfirm={async () => null} />);
    expect(screen.queryByRole('button', { name: /bien reçu/i })).toBeNull();
    expect(screen.getByText(/prépare votre commande/i)).toBeInTheDocument();
    rerender(<OrderDetailsCard details={details({ status: 'shipped' })} lang="fr" onConfirm={async () => null} />);
    expect(screen.getByRole('button', { name: /bien reçu/i })).toBeInTheDocument();
  });

  it("affiche l'erreur renvoyée par la confirmation", async () => {
    render(<OrderDetailsCard details={details()} lang="fr" onConfirm={async () => 'Indisponible'} />);
    fireEvent.click(screen.getByRole('button', { name: /bien reçu/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Indisponible');
  });

  it('intègre le suivi et propose de contacter le vendeur sur WhatsApp', () => {
    const tracking = { plan_map: false, origin: null, destination: null, events: [{ id: 'e1', stage: 'in_transit' as const, lat: null, lng: null, place_label: 'Yopougon', note: '', created_at: '2026-10-15T12:00:00Z' }] };
    render(<OrderDetailsCard details={details({}, tracking)} lang="fr" onConfirm={async () => null} />);
    expect(screen.getByText('Où est mon colis ?')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /contacter le vendeur/i });
    expect(link.getAttribute('href')).toContain('wa.me/2250700000000');
  });

  it('annulée : message dédié, pas de bouton de confirmation', () => {
    render(<OrderDetailsCard details={details({ status: 'cancelled' })} lang="fr" onConfirm={async () => null} />);
    expect(screen.getByText(/annulée par le vendeur/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /bien reçu/i })).toBeNull();
  });
});

describe('migration 20261016000000_secure_orders.sql', () => {
  const sql = readFileSync(resolve(__dirname, '../../../supabase/migrations/20261016000000_secure_orders.sql'), 'utf8');
  it('applique les mêmes commissions que PLAN_CONFIGS', () => {
    const m = sql.match(/case plan when 'starter' then ([\d.]+) when 'business' then ([\d.]+) when 'premium' then ([\d.]+) else ([\d.]+) end/);
    expect(m).not.toBeNull();
    expect(m!.slice(1).map(Number)).toEqual([
      PLAN_CONFIGS.starter.commission_rate, PLAN_CONFIGS.business.commission_rate, PLAN_CONFIGS.premium.commission_rate, PLAN_CONFIGS.free.commission_rate,
    ]);
  });
  it('ferme la lecture publique des transactions', () => {
    expect(sql).toMatch(/drop policy if exists "Public can view a transaction by id"/i);
    expect(sql).toMatch(/revoke update on (public\.)?transactions from anon, authenticated/i);
  });
});
