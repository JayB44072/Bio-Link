import { describe, it, expect, vi, beforeEach } from 'vitest';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { rpc, functions: { invoke: vi.fn() }, from: vi.fn() } }));

import {
  addTrackingEvent, currentStageIndex, getOrderTracking, latestPosition, routePoints, stageLabel, TRACKING_STAGES,
  type TrackingEvent,
} from '../../lib/api/tracking';
import { isValidEmail, subscribeToPage, subscribersToCsv, unsubscribeFromPage } from '../../lib/api/subscribers';
import { notifySubscribers } from '../../lib/api/notify';
import { supabase } from '../../lib/supabase';

const ev = (stage: TrackingEvent['stage'], extra: Partial<TrackingEvent> = {}): TrackingEvent =>
  ({ id: stage + Math.random(), stage, lat: null, lng: null, place_label: '', note: '', created_at: '2026-10-15T10:00:00Z', ...extra });

beforeEach(() => { rpc.mockReset(); vi.mocked(supabase.functions.invoke).mockReset(); });

describe('suivi de livraison — fonctions pures', () => {
  it('liste les étapes dans l\'ordre de la livraison', () => {
    expect(TRACKING_STAGES).toEqual(['preparing', 'shipped', 'in_transit', 'out_for_delivery', 'arrived']);
  });

  it('donne un libellé en français et en anglais', () => {
    expect(stageLabel('in_transit', 'fr')).toBe('En route');
    expect(stageLabel('in_transit', 'en')).toBe('In transit');
    expect(stageLabel('arrived', 'pt')).toBe('Arrived at destination'); // repli sur l'anglais
  });

  it('calcule la dernière étape atteinte', () => {
    expect(currentStageIndex([])).toBe(-1);
    expect(currentStageIndex([ev('preparing'), ev('in_transit'), ev('shipped')])).toBe(2);
  });

  it('retrouve la dernière position connue du colis', () => {
    expect(latestPosition([ev('preparing')])).toBeNull();
    const events = [ev('shipped', { lat: 4.05, lng: 9.7, place_label: 'Douala' }), ev('in_transit'), ev('in_transit', { lat: 3.87, lng: 11.5, place_label: 'Yaoundé', created_at: '2026-10-15T14:00:00Z' })];
    expect(latestPosition(events)).toMatchObject({ lat: 3.87, lng: 11.5, label: 'Yaoundé', at: '2026-10-15T14:00:00Z' });
  });

  it('construit le trajet : départ, positions successives, sans doublons consécutifs', () => {
    const origin = { lat: 4.05, lng: 9.7 };
    const events = [ev('shipped', { lat: 4.05, lng: 9.7 }), ev('in_transit', { lat: 4.5, lng: 10 }), ev('in_transit', { lat: 4.5, lng: 10 }), ev('in_transit')];
    expect(routePoints({ origin, events })).toEqual([{ lat: 4.05, lng: 9.7 }, { lat: 4.5, lng: 10, label: '' }]);
    expect(routePoints({ origin: null, events: [] })).toEqual([]);
  });
});

describe('getOrderTracking', () => {
  it('normalise la réponse de la fonction', async () => {
    rpc.mockResolvedValue({ data: { plan_map: true, origin: { lat: 1, lng: 2 }, events: [ev('shipped')] }, error: null });
    const t = await getOrderTracking('o1');
    expect(rpc).toHaveBeenCalledWith('get_order_tracking', { p_order_id: 'o1' });
    expect(t).toMatchObject({ plan_map: true, origin: { lat: 1, lng: 2 }, destination: null });
    expect(t?.events).toHaveLength(1);
  });

  it('renvoie null si la commande est introuvable, en erreur, ou si la fonction n\'existe pas encore', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null });
    expect(await getOrderTracking('o1')).toBeNull();
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'function does not exist' } });
    expect(await getOrderTracking('o1')).toBeNull();
    rpc.mockRejectedValueOnce(new Error('réseau'));
    expect(await getOrderTracking('o1')).toBeNull();
  });

  it('tolère une réponse sans liste d\'étapes', async () => {
    rpc.mockResolvedValue({ data: { plan_map: false }, error: null });
    expect((await getOrderTracking('o1'))?.events).toEqual([]);
  });
});

describe('addTrackingEvent', () => {
  const base = { transactionId: 't1', stage: 'in_transit' as const };

  it('envoie l\'étape, la position et les textes', async () => {
    rpc.mockResolvedValue({ data: {}, error: null });
    const r = await addTrackingEvent({ ...base, lat: 4.05, lng: 9.7, place: 'Douala', note: 'Bientôt' });
    expect(r).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('add_tracking_event', { p_transaction_id: 't1', p_stage: 'in_transit', p_lat: 4.05, p_lng: 9.7, p_place: 'Douala', p_note: 'Bientôt' });
  });

  it('envoie des valeurs vides sans position', async () => {
    rpc.mockResolvedValue({ data: {}, error: null });
    await addTrackingEvent(base);
    expect(rpc).toHaveBeenCalledWith('add_tracking_event', expect.objectContaining({ p_lat: null, p_lng: null, p_place: '', p_note: '' }));
  });

  it.each([
    ['plan_required', 'plan_required'], ['forbidden', 'forbidden'], ['not_authenticated', 'forbidden'],
    ['order_closed', 'order_closed'], ['invalid_coordinates', 'invalid'], ['quelque chose', 'unknown'],
  ])('traduit l\'erreur serveur « %s » en « %s »', async (message, expected) => {
    rpc.mockResolvedValue({ data: null, error: { message } });
    expect(await addTrackingEvent({ ...base, lat: 1, lng: 2 })).toEqual({ ok: false, error: expected });
  });

  it('ne plante pas si le réseau échoue', async () => {
    rpc.mockRejectedValue(new Error('réseau'));
    expect(await addTrackingEvent(base)).toEqual({ ok: false, error: 'unknown' });
  });
});

describe('abonnés', () => {
  it('valide les adresses e-mail', () => {
    for (const ok of ['a@b.co', 'prenom.nom+tag@domaine.cm', '  a@b.co  ']) expect(isValidEmail(ok), ok).toBe(true);
    for (const bad of ['', 'abc', 'a@b', '@b.co', 'a b@c.de', 'a@@b.co', `${'x'.repeat(250)}@b.co`]) expect(isValidEmail(bad), bad).toBe(false);
  });

  it('n\'appelle pas le serveur pour une adresse invalide', async () => {
    expect(await subscribeToPage('kora', 'nimporte')).toEqual({ ok: false, error: 'invalid_email' });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('abonne un visiteur et nettoie l\'adresse', async () => {
    rpc.mockResolvedValue({ data: { ok: true }, error: null });
    expect(await subscribeToPage('kora', '  moi@exemple.com ')).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('subscribe_to_page', { p_username: 'kora', p_email: 'moi@exemple.com' });
  });

  it("envoie l'e-mail de bienvenue après un abonnement réussi, jamais après un refus", async () => {
    const invoke = vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: null } as never);
    rpc.mockResolvedValueOnce({ data: { ok: true }, error: null });
    await subscribeToPage('kora', ' moi@exemple.com ');
    expect(invoke).toHaveBeenCalledWith('welcome-subscriber', { body: { username: 'kora', email: 'moi@exemple.com' } });
    invoke.mockClear();
    rpc.mockResolvedValueOnce({ data: { ok: false, error: 'not_found' }, error: null });
    await subscribeToPage('kora', 'moi@exemple.com');
    expect(invoke).not.toHaveBeenCalled();
  });

  it("un échec de l'e-mail de bienvenue n'empêche pas l'abonnement", async () => {
    vi.mocked(supabase.functions.invoke).mockRejectedValue(new Error('hors ligne') as never);
    rpc.mockResolvedValueOnce({ data: { ok: true }, error: null });
    expect(await subscribeToPage('kora', 'moi@exemple.com')).toEqual({ ok: true });
  });

  it('relaie les refus du serveur et les pannes', async () => {
    rpc.mockResolvedValueOnce({ data: { ok: false, error: 'not_found' }, error: null });
    expect(await subscribeToPage('x', 'a@b.co')).toEqual({ ok: false, error: 'not_found' });
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'x' } });
    expect(await subscribeToPage('x', 'a@b.co')).toEqual({ ok: false, error: 'unavailable' });
    rpc.mockRejectedValueOnce(new Error('réseau'));
    expect(await subscribeToPage('x', 'a@b.co')).toEqual({ ok: false, error: 'unavailable' });
  });

  it('désabonne avec le jeton', async () => {
    rpc.mockResolvedValueOnce({ data: true, error: null });
    expect(await unsubscribeFromPage('tok')).toBe(true);
    expect(rpc).toHaveBeenCalledWith('unsubscribe_from_page', { p_token: 'tok' });
    rpc.mockResolvedValueOnce({ data: false, error: null });
    expect(await unsubscribeFromPage('tok')).toBe(false);
    rpc.mockRejectedValueOnce(new Error('x'));
    expect(await unsubscribeFromPage('tok')).toBe(false);
  });

  it('exporte en CSV les abonnés actifs seulement, avec échappement', () => {
    const csv = subscribersToCsv([
      { id: '1', email: 'a@b.co', created_at: '2026-10-01', unsubscribed_at: null },
      { id: '2', email: 'parti@b.co', created_at: '2026-10-02', unsubscribed_at: '2026-10-03' },
      { id: '3', email: 'we"ird@b.co', created_at: '2026-10-04', unsubscribed_at: null },
    ]);
    expect(csv.split('\n')).toEqual(['email,subscribed_at', '"a@b.co","2026-10-01"', '"we""ird@b.co","2026-10-04"']);
  });
});

describe('notifySubscribers', () => {
  const invoke = () => vi.mocked(supabase.functions.invoke);

  it('renvoie le nombre d\'envois', async () => {
    invoke().mockResolvedValue({ data: { sent: 12 }, error: null });
    expect(await notifySubscribers({ kind: 'custom', title: 'Promo' })).toEqual({ ok: true, sent: 12 });
    expect(invoke()).toHaveBeenCalledWith('notify-subscribers', { body: { kind: 'custom', title: 'Promo' } });
  });

  it('distingue la limite quotidienne, l\'absence d\'abonnés et l\'échec', async () => {
    invoke().mockResolvedValueOnce({ data: { error: 'rate_limited' }, error: null });
    expect(await notifySubscribers({ kind: 'custom', title: 'x' })).toEqual({ ok: false, error: 'rate_limited' });
    invoke().mockResolvedValueOnce({ data: { error: 'no_subscribers' }, error: null });
    expect(await notifySubscribers({ kind: 'custom', title: 'x' })).toEqual({ ok: false, error: 'no_subscribers' });
    invoke().mockResolvedValueOnce({ data: { error: 'failed' }, error: null });
    expect(await notifySubscribers({ kind: 'custom', title: 'x' })).toEqual({ ok: false, error: 'failed' });
  });

  it('signale « indisponible » (fonction non déployée) sans lever d\'erreur', async () => {
    invoke().mockResolvedValueOnce({ data: null, error: { message: 'Function not found' } });
    expect(await notifySubscribers({ kind: 'product', title: 'x' })).toEqual({ ok: false, error: 'unavailable' });
    invoke().mockRejectedValueOnce(new Error('réseau'));
    expect(await notifySubscribers({ kind: 'product', title: 'x' })).toEqual({ ok: false, error: 'unavailable' });
  });
});

describe('route de désabonnement', () => {
  const RE = /^\/desabonnement\/([0-9a-fA-F-]{36})\/?$/;
  it('accepte un jeton UUID et refuse le reste', () => {
    expect('/desabonnement/123e4567-e89b-12d3-a456-426614174000'.match(RE)?.[1]).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect('/desabonnement/abc').toBeTruthy();
    expect('/desabonnement/abc'.match(RE)).toBeNull();
    expect('/desabonnement/'.match(RE)).toBeNull();
  });
});
