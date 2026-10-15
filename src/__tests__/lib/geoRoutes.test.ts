import { describe, it, expect, vi } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { from: vi.fn(), rpc } }));

import { distanceKm, formatDistance, formatDuration, pathLengthKm, pointAlong } from '../../lib/geo';
import { buildOrderRoutes, getSubscriberDeliveries, routeFromDetails } from '../../lib/api/orderRoutes';

const douala = { lat: 4.0511, lng: 9.7679 };
const yaounde = { lat: 3.848, lng: 11.5021 };

describe('geo', () => {
  it('calcule la distance Douala–Yaoundé (≈ 200 km à vol d\'oiseau)', () => {
    const d = distanceKm(douala, yaounde);
    expect(d).toBeGreaterThan(190);
    expect(d).toBeLessThan(205);
  });
  it('mesure une ligne brisée et trouve un point à mi-parcours', () => {
    const mid = { lat: 4.0, lng: 10.5 };
    expect(pathLengthKm([douala, mid, yaounde])).toBeGreaterThan(distanceKm(douala, yaounde) - 0.5);
    expect(pointAlong([douala, yaounde], 0)).toEqual(douala);
    expect(pointAlong([douala, yaounde], 1)).toEqual(yaounde);
    const half = pointAlong([douala, yaounde], 0.5)!;
    expect(distanceKm(douala, half)).toBeCloseTo(distanceKm(douala, yaounde) / 2, 0);
    expect(pointAlong([], 0.5)).toBeNull();
  });
  it('formate distances et durées', () => {
    expect(formatDistance(0.85)).toBe('850 m');
    expect(formatDistance(4.23, 'en')).toBe('4.2 km');
    expect(formatDuration(5)).toBe('~12 min');
    expect(formatDuration(50)).toBe('~2 h');
  });
});

describe('buildOrderRoutes', () => {
  const product = { id: 'p1', name: 'Sac', image_url: 'i', location_lat: douala.lat, location_lng: douala.lng, location_address: 'Akwa' };
  const tx = (id: string, extra = {}) => ({ id, status: 'shipped', product_id: 'p1', buyer_name: 'Awa', amount: 10, currency: 'XAF', created_at: '2026-10-15', delivery_address: 'Yaoundé', delivery_lat: yaounde.lat, delivery_lng: yaounde.lng, ...extra });

  it('relie le produit à l\'adresse et suit les étapes dans l\'ordre', () => {
    const [r] = buildOrderRoutes([tx('a')], [product], [
      { transaction_id: 'a', lat: 3.9, lng: 10.8, place_label: 'Édéa', created_at: '2026-10-15T12:00:00Z' },
      { transaction_id: 'a', lat: 4.0, lng: 10.2, place_label: 'Dibombari', created_at: '2026-10-15T09:00:00Z' },
    ]);
    expect(r.origin).toMatchObject({ lat: douala.lat });
    expect(r.destination).toMatchObject({ lat: yaounde.lat });
    expect(r.travelled.map(p => p.label)).toEqual(['Akwa', 'Dibombari', 'Édéa']);
    expect(r.current?.label).toBe('Édéa');
  });
  it('ignore les commandes sans aucune position', () => {
    expect(buildOrderRoutes([tx('b', { delivery_lat: null, delivery_lng: null })], [{ ...product, location_lat: null, location_lng: null }], [])).toEqual([]);
  });
});

describe('livraisons d un abonné', () => {
  it('refuse un jeton mal formé sans appeler le serveur', async () => {
    rpc.mockClear();
    expect(await getSubscriberDeliveries('abc')).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });
  it('transforme la réponse du serveur en trajets', async () => {
    rpc.mockResolvedValue({ error: null, data: [{
      id: 'o1', status: 'shipped', amount: 5, currency: 'XAF', created_at: '2026-10-15', delivery_address: 'Yaoundé', delivery_lat: yaounde.lat, delivery_lng: yaounde.lng, buyer_name: 'Awa',
      product_id: 'p1', product_name: 'Sac', product_image: 'i', product_lat: douala.lat, product_lng: douala.lng, product_address: 'Akwa',
      events: [{ lat: 4.0, lng: 10.2, place_label: 'Dibombari', created_at: '2026-10-15T09:00:00Z' }],
    }] });
    const r = await getSubscriberDeliveries('123e4567-e89b-12d3-a456-426614174000');
    expect(rpc).toHaveBeenCalledWith('subscriber_deliveries', { p_token: '123e4567-e89b-12d3-a456-426614174000' });
    expect(r).toHaveLength(1);
    expect(r[0].productName).toBe('Sac');
    expect(r[0].current?.label).toBe('Dibombari');
  });
  it('un jeton inconnu ou une erreur donne une liste vide', async () => {
    rpc.mockResolvedValue({ error: { message: 'x' }, data: null });
    expect(await getSubscriberDeliveries('123e4567-e89b-12d3-a456-426614174000')).toEqual([]);
  });
  it('routeFromDetails : null sans position, trajet sinon', () => {
    const order = { id: 'o', status: 'shipped', amount: 1, currency: 'XAF', created_at: 'd', delivery_address: 'a', buyer_name: 'b' };
    expect(routeFromDetails({ order, product: null, tracking: { origin: null, destination: null, events: [] } })).toBeNull();
    const r = routeFromDetails({ order, product: { name: 'Sac', image_url: 'i' }, tracking: { origin: douala, destination: yaounde, events: [{ lat: 4, lng: 10, place_label: 'X', created_at: 'd' }] } });
    expect(r?.travelled).toHaveLength(2);
    expect(r?.destination).toEqual(yaounde);
  });
});
