import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { LanguageProvider } from '../../lib/LanguageContext';
import { AppPrefsProvider } from '../../lib/AppPrefsContext';
import type { Profile, Transaction } from '../../lib/types';
import type { OrderTracking, TrackingEvent } from '../../lib/api/tracking';

/* ── Faux accès aux données ── */
const m = vi.hoisted(() => ({
  subscribeToPage: vi.fn(), listSubscribers: vi.fn(), deleteSubscriber: vi.fn(), notifySubscribers: vi.fn(),
  listTrackingEvents: vi.fn(), addTrackingEvent: vi.fn(), getProductLocation: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({ supabase: { rpc: vi.fn(), from: vi.fn(), functions: { invoke: vi.fn() } } }));
vi.mock('../../lib/api/subscribers', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/api/subscribers')>()),
  subscribeToPage: m.subscribeToPage, listSubscribers: m.listSubscribers, deleteSubscriber: m.deleteSubscriber,
}));
vi.mock('../../lib/api/notify', () => ({ notifySubscribers: m.notifySubscribers }));
vi.mock('../../lib/api/tracking', async importOriginal => ({
  ...(await importOriginal<typeof import('../../lib/api/tracking')>()),
  listTrackingEvents: m.listTrackingEvents, addTrackingEvent: m.addTrackingEvent,
}));
vi.mock('../../lib/api/products', () => ({ getProductLocation: m.getProductLocation }));
// Leaflet n'est pas utile ici : on vérifie seulement ce qu'on lui donne
vi.mock('../../components/ui/DeliveryMap', () => ({
  default: (p: { current?: { lat: number } | null; picked?: { lat: number } | null; onPick?: (pt: { lat: number; lng: number }) => void }) => (
    <div data-testid="map" data-current={p.current?.lat ?? ''} data-picked={p.picked?.lat ?? ''}>
      <button type="button" onClick={() => p.onPick?.({ lat: 3.87, lng: 11.5 })}>choisir-sur-la-carte</button>
    </div>
  ),
}));

import SubscribeBox from '../../components/public/SubscribeBox';
import OrderTrackingPanel from '../../components/public/OrderTrackingPanel';
import Subscribers from '../../components/dashboard/tabs/Subscribers';
import TrackingModal from '../../components/dashboard/tabs/orders/TrackingModal';

const wrap = (ui: React.ReactNode) => render(<AppPrefsProvider><LanguageProvider>{ui}</LanguageProvider></AppPrefsProvider>);

const theme = {
  dark: true, pageBg: '#000', text: '#fff', subtext: '#aaa', cardBg: '#111', cardBorder: '#333',
  accent: '#C9A96E', priceColor: '#C9A96E', buttonGradient: 'linear-gradient(135deg,#C9A96E,#a8894e)', cardRadius: 'rounded-3xl',
};

beforeEach(() => {
  Object.values(m).forEach(f => f.mockReset());
  m.listTrackingEvents.mockResolvedValue([]);
  m.getProductLocation.mockResolvedValue({ data: { location_lat: 4.05, location_lng: 9.7, location_address: 'Douala' } });
  localStorage.clear();
});
afterEach(() => { vi.restoreAllMocks(); });

/* ═════════ Abonnement sur la page publique ═════════ */
describe('SubscribeBox', () => {
  it('invite à suivre la boutique, bouton inactif tant qu\'aucune adresse n\'est saisie', () => {
    wrap(<SubscribeBox username="kora" shopName="Atelier Kora" lang="fr" theme={theme} interactive />);
    expect(screen.getByRole('heading', { name: 'Suivez Atelier Kora' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /abonne/i })).toBeDisabled();
  });

  it('abonne le visiteur puis confirme', async () => {
    m.subscribeToPage.mockResolvedValue({ ok: true });
    wrap(<SubscribeBox username="kora" shopName="Atelier Kora" lang="fr" theme={theme} interactive />);
    fireEvent.change(screen.getByLabelText('Votre adresse e-mail'), { target: { value: 'moi@exemple.com' } });
    fireEvent.click(screen.getByRole('button', { name: /abonne/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/Merci/);
    expect(m.subscribeToPage).toHaveBeenCalledWith('kora', 'moi@exemple.com');
    expect(localStorage.getItem('biolinkwd_subscribed_kora')).toBe('1');
  });

  it('explique l\'erreur sans perdre l\'adresse saisie', async () => {
    m.subscribeToPage.mockResolvedValue({ ok: false, error: 'invalid_email' });
    wrap(<SubscribeBox username="kora" shopName="Atelier Kora" lang="fr" theme={theme} interactive />);
    const input = screen.getByLabelText('Votre adresse e-mail') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'pas-un-email' } });
    fireEvent.click(screen.getByRole('button', { name: /abonne/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/ne semble pas valide/);
    expect(input.value).toBe('pas-un-email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('affiche l\'état « abonné » si le visiteur l\'est déjà (sur cet appareil)', () => {
    localStorage.setItem('biolinkwd_subscribed_kora', '1');
    wrap(<SubscribeBox username="kora" shopName="Atelier Kora" lang="fr" theme={theme} interactive />);
    expect(screen.getByRole('status')).toHaveTextContent(/Merci/);
  });

  it('n\'envoie rien dans un aperçu (page non interactive)', () => {
    wrap(<SubscribeBox username="kora" shopName="Atelier Kora" lang="fr" theme={theme} interactive={false} />);
    expect(screen.getByLabelText('Votre adresse e-mail')).toBeDisabled();
    expect(screen.getByRole('button', { name: /abonne/i })).toBeDisabled();
    expect(m.subscribeToPage).not.toHaveBeenCalled();
  });
});

/* ═════════ Suivi vu par l'acheteur ═════════ */
describe('OrderTrackingPanel', () => {
  const event = (stage: TrackingEvent['stage'], extra: Partial<TrackingEvent> = {}): TrackingEvent =>
    ({ id: stage, stage, lat: null, lng: null, place_label: '', note: '', created_at: '2026-10-15T10:00:00Z', ...extra });
  const tracking = (extra: Partial<OrderTracking> = {}): OrderTracking => ({ plan_map: false, origin: null, destination: null, events: [], ...extra });

  it('explique qu\'il n\'y a pas encore de suivi', () => {
    render(<OrderTrackingPanel tracking={tracking()} lang="fr" orderStatus="pending" />);
    expect(screen.getByText(/pas encore indiqué l'avancement/)).toBeInTheDocument();
    expect(screen.queryByText('Suivi en direct')).toBeNull();
  });

  it('montre l\'étape actuelle, la progression et l\'historique', () => {
    const events = [event('preparing'), event('shipped'), event('in_transit', { place_label: 'Agence de Douala', note: 'En route', created_at: '2026-10-15T14:00:00Z' })];
    render(<OrderTrackingPanel tracking={tracking({ events })} lang="fr" orderStatus="shipped" />);
    expect(screen.getByText('Suivi en direct')).toBeInTheDocument();
    expect(screen.getAllByText('En route').length).toBeGreaterThan(0);
    // le lieu et le message apparaissent dans la carte « étape actuelle » et dans l'historique
    expect(screen.getAllByText('Agence de Douala · En route')).toHaveLength(2);
    const steps = within(screen.getByRole('list', { name: 'Progression' })).getAllByRole('listitem');
    expect(steps).toHaveLength(5);
    expect(steps[2]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('list', { name: 'Historique du suivi' })).toBeInTheDocument();
  });

  it('affiche la carte avec la position du colis pour un vendeur Business / Premium', async () => {
    const events = [event('in_transit', { lat: 4.5, lng: 10, place_label: 'Édéa' })];
    render(<OrderTrackingPanel tracking={tracking({ plan_map: true, origin: { lat: 4.05, lng: 9.7 }, events })} lang="fr" orderStatus="shipped" />);
    expect(await screen.findByTestId('map')).toHaveAttribute('data-current', '4.5');
    expect(screen.getByText(/Dernière position connue/)).toHaveTextContent('Édéa');
  });

  it('n\'affiche pas de carte sans forfait avec carte, et le dit', () => {
    render(<OrderTrackingPanel tracking={tracking({ plan_map: false, events: [event('shipped')] })} lang="fr" orderStatus="shipped" />);
    expect(screen.queryByTestId('map')).toBeNull();
    expect(screen.getByText(/n'affiche pas la position du colis/)).toBeInTheDocument();
  });

  it('n\'est plus « en direct » une fois la commande livrée', () => {
    render(<OrderTrackingPanel tracking={tracking({ events: [event('arrived')] })} lang="fr" orderStatus="completed" />);
    expect(screen.queryByText('Suivi en direct')).toBeNull();
  });
});

/* ═════════ Onglet Abonnés du vendeur ═════════ */
describe('Subscribers (tableau de bord)', () => {
  const profile = { username: 'kora', user_id: 'u1' } as unknown as Profile;
  const recent = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  const old = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const list = [
    { id: 'a', email: 'ama@exemple.com', created_at: recent, unsubscribed_at: null },
    { id: 'b', email: 'bob@exemple.com', created_at: old, unsubscribed_at: null },
    { id: 'c', email: 'parti@exemple.com', created_at: old, unsubscribed_at: old },
  ];

  it('compte les abonnés actifs, les nouveaux et les désabonnés', async () => {
    m.listSubscribers.mockResolvedValue(list);
    wrap(<Subscribers profile={profile} />);
    expect(await screen.findByText('ama@exemple.com')).toBeInTheDocument();
    const tile = (label: string) => screen.getByText(label).parentElement!;
    expect(tile('Abonnés actifs')).toHaveTextContent('2');
    expect(tile('Nouveaux (7 jours)')).toHaveTextContent('1');
    expect(tile('Désabonnés')).toHaveTextContent('1');
    expect(screen.getByText(/Désabonné$/)).toBeInTheDocument();
  });

  it('filtre par e-mail', async () => {
    m.listSubscribers.mockResolvedValue(list);
    wrap(<Subscribers profile={profile} />);
    await screen.findByText('ama@exemple.com');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un abonné' }), { target: { value: 'bob' } });
    expect(screen.queryByText('ama@exemple.com')).toBeNull();
    expect(screen.getByText('bob@exemple.com')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher un abonné' }), { target: { value: 'zzz' } });
    expect(screen.getByText(/Aucun abonné ne correspond/)).toBeInTheDocument();
  });

  it('retire un abonné après confirmation', async () => {
    m.listSubscribers.mockResolvedValue(list);
    m.deleteSubscriber.mockResolvedValue({ error: null });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    wrap(<Subscribers profile={profile} />);
    await screen.findByText('bob@exemple.com');
    fireEvent.click(screen.getByRole('button', { name: 'Retirer bob@exemple.com' }));
    await waitFor(() => expect(screen.queryByText('bob@exemple.com')).toBeNull());
    expect(m.deleteSubscriber).toHaveBeenCalledWith('b');
  });

  it('ne retire personne si le vendeur annule', async () => {
    m.listSubscribers.mockResolvedValue(list);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    wrap(<Subscribers profile={profile} />);
    await screen.findByText('bob@exemple.com');
    fireEvent.click(screen.getByRole('button', { name: 'Retirer bob@exemple.com' }));
    await Promise.resolve();
    expect(m.deleteSubscriber).not.toHaveBeenCalled();
    expect(screen.getByText('bob@exemple.com')).toBeInTheDocument();
  });

  it('envoie un message à tous les abonnés actifs, après confirmation', async () => {
    m.listSubscribers.mockResolvedValue(list);
    m.notifySubscribers.mockResolvedValue({ ok: true, sent: 2 });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    wrap(<Subscribers profile={profile} />);
    await screen.findByText('ama@exemple.com');
    const send = screen.getByRole('button', { name: /Envoyer à 2 abonnés/ });
    expect(send).toBeDisabled(); // pas d'objet
    fireEvent.change(screen.getByLabelText('Objet du message'), { target: { value: 'Promo -20 %' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Jusqu’à dimanche' } });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer à 2 abonnés/ }));
    await waitFor(() => expect(m.notifySubscribers).toHaveBeenCalledWith({ kind: 'custom', title: 'Promo -20 %', body: 'Jusqu’à dimanche' }));
    await waitFor(() => expect(alert).toHaveBeenCalledWith(expect.stringContaining('2 abonnés')));
  });

  it('explique clairement quand l\'envoi d\'e-mails n\'est pas activé', async () => {
    m.listSubscribers.mockResolvedValue(list);
    m.notifySubscribers.mockResolvedValue({ ok: false, error: 'unavailable' });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    wrap(<Subscribers profile={profile} />);
    await screen.findByText('ama@exemple.com');
    fireEvent.change(screen.getByLabelText('Objet du message'), { target: { value: 'Salut' } });
    fireEvent.click(screen.getByRole('button', { name: /Envoyer à 2 abonnés/ }));
    await waitFor(() => expect(alert).toHaveBeenCalledWith(expect.stringMatching(/pas encore activé/)));
  });

  it('guide le vendeur quand il n\'a aucun abonné', async () => {
    m.listSubscribers.mockResolvedValue([]);
    wrap(<Subscribers profile={profile} />);
    expect(await screen.findByText(/Aucun abonné pour l'instant/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Envoyer à 0 abonné/ })).toBeDisabled();
  });
});

/* ═════════ Suivi côté vendeur ═════════ */
describe('TrackingModal', () => {
  const order = { id: 'abcdef12-0000', product_id: 'p1', status: 'pending', buyer_name: 'Ama', delivery_lat: 3.87, delivery_lng: 11.5, delivery_address: 'Yaoundé' } as unknown as Transaction;
  const seller = (plan: string) => ({ plan_type: plan, user_id: 'u1' }) as unknown as Profile;

  it('propose la carte avec un forfait Business ou Premium', async () => {
    wrap(<TrackingModal order={order} profile={seller('business')} onClose={vi.fn()} onShipped={vi.fn()} />);
    expect(await screen.findByTestId('map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Utiliser ma position/ })).toBeInTheDocument();
  });

  it('remplace la carte par une invitation à passer au forfait supérieur sinon', () => {
    wrap(<TrackingModal order={order} profile={seller('starter')} onClose={vi.fn()} onShipped={vi.fn()} />);
    expect(screen.queryByTestId('map')).toBeNull();
    expect(screen.getByText(/réservé aux forfaits Business et Premium/)).toBeInTheDocument();
  });

  it('enregistre l\'étape avec la position choisie sur la carte, et marque la commande expédiée', async () => {
    m.addTrackingEvent.mockResolvedValue({ ok: true });
    m.listTrackingEvents.mockResolvedValue([]);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onShipped = vi.fn();
    wrap(<TrackingModal order={order} profile={seller('premium')} onClose={vi.fn()} onShipped={onShipped} />);
    await screen.findByTestId('map');
    fireEvent.click(screen.getByRole('radio', { name: 'En route' }));
    fireEvent.click(screen.getByRole('button', { name: 'choisir-sur-la-carte' }));
    fireEvent.change(screen.getByPlaceholderText(/Agence de Bonabéri/), { target: { value: 'Édéa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour le suivi' }));
    await waitFor(() => expect(m.addTrackingEvent).toHaveBeenCalledWith({ transactionId: 'abcdef12-0000', stage: 'in_transit', lat: 3.87, lng: 11.5, place: 'Édéa', note: '' }));
    expect(onShipped).toHaveBeenCalledWith('abcdef12-0000');
  });

  it('n\'envoie aucune position sans forfait avec carte', async () => {
    m.addTrackingEvent.mockResolvedValue({ ok: true });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    wrap(<TrackingModal order={order} profile={seller('free')} onClose={vi.fn()} onShipped={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour le suivi' }));
    await waitFor(() => expect(m.addTrackingEvent).toHaveBeenCalledWith(expect.objectContaining({ lat: null, lng: null, stage: 'preparing' })));
  });

  it('ne marque pas la commande expédiée pour la simple préparation', async () => {
    m.addTrackingEvent.mockResolvedValue({ ok: true });
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onShipped = vi.fn();
    wrap(<TrackingModal order={order} profile={seller('premium')} onClose={vi.fn()} onShipped={onShipped} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour le suivi' }));
    await waitFor(() => expect(m.addTrackingEvent).toHaveBeenCalled());
    expect(onShipped).not.toHaveBeenCalled();
  });

  it('affiche l\'erreur du serveur (forfait insuffisant) sans fermer la fenêtre', async () => {
    m.addTrackingEvent.mockResolvedValue({ ok: false, error: 'plan_required' });
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onClose = vi.fn();
    wrap(<TrackingModal order={order} profile={seller('premium')} onClose={onClose} onShipped={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mettre à jour le suivi' }));
    await waitFor(() => expect(alert).toHaveBeenCalledWith(expect.stringMatching(/réservées aux forfaits Business et Premium/)));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('se ferme avec le bouton de fermeture', () => {
    const onClose = vi.fn();
    wrap(<TrackingModal order={order} profile={seller('premium')} onClose={onClose} onShipped={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(onClose).toHaveBeenCalled();
  });
});
