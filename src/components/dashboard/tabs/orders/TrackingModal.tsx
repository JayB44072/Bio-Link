import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Crosshair, Lock, MapPin, Package, Route, Send, Truck, X } from 'lucide-react';
import type { Profile, Transaction } from '../../../../lib/types';
import { PLAN_CONFIGS } from '../../../../lib/planLimits';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';
import { useLang } from '../../../../lib/LanguageContext';
import { dashPalette } from '../../../../lib/dashPalette';
import { BRAND, GRADIENTS, STATUS } from '../../../../lib/theme';
import { useFeedback } from '../../../../lib/feedbackContext';
import { getProductLocation } from '../../../../lib/api/products';
import {
  addTrackingEvent, currentStageIndex, latestPosition, listTrackingEvents, routePoints, stageLabel,
  TRACKING_STAGES, type GeoPoint, type TrackingEvent, type TrackingStage,
} from '../../../../lib/api/tracking';
import Modal from '../../../ui/Modal';
import DeliveryMap from '../../../ui/DeliveryMap';
import { ButtonSpinner } from '../../../ui/Spinner';

interface TrackingModalProps {
  order: Transaction;
  profile: Profile;
  onClose: () => void;
  /** Appelé quand une étape ≥ « expédié » a fait passer la commande en « expédiée ». */
  onShipped: (orderId: string) => void;
}

const STAGE_ICON: Record<TrackingStage, typeof Package> = {
  preparing: Package, shipped: Truck, in_transit: Route, out_for_delivery: Truck, arrived: CheckCircle2,
};

/**
 * Suivi de livraison d'une commande : le vendeur indique l'étape et, avec un forfait Business ou Premium,
 * l'endroit où se trouve le colis sur la carte. L'acheteur voit le même suivi sur sa page de commande.
 */
export default function TrackingModal({ order, profile, onClose, onShipped }: TrackingModalProps) {
  const { lang } = useLang();
  const fr = lang === 'fr';
  const { isDark: dk } = useAppPrefs();
  const { notify } = useFeedback();
  const { surface, surfaceAlt, border, txtPrim, txtSub, inputBg, inputBorder } = dashPalette(dk);
  const hasMap = PLAN_CONFIGS[profile.plan_type].map_access;

  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [stage, setStage] = useState<TrackingStage>('preparing');
  const [place, setPlace] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<GeoPoint | null>(null);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const destination: GeoPoint | null = order.delivery_lat != null && order.delivery_lng != null
    ? { lat: order.delivery_lat, lng: order.delivery_lng, label: order.delivery_address }
    : null;

  useEffect(() => {
    let alive = true;
    listTrackingEvents(order.id).then(list => {
      if (!alive) return;
      setEvents(list);
      // Étape suivante proposée par défaut
      const idx = currentStageIndex(list);
      setStage(TRACKING_STAGES[Math.min(idx + 1, TRACKING_STAGES.length - 1)]);
    }).catch(() => {});
    if (hasMap && order.product_id) {
      Promise.resolve(getProductLocation(order.product_id)).then(({ data }) => {
        const d = data as { location_lat: number | null; location_lng: number | null; location_address: string } | null;
        if (alive && d && d.location_lat != null && d.location_lng != null) setOrigin({ lat: d.location_lat, lng: d.location_lng, label: d.location_address });
      }).catch(() => {});
    }
    return () => { alive = false; };
  }, [order.id, order.product_id, hasMap]);

  const route = useMemo(() => routePoints({ origin, events }), [origin, events]);
  const current = useMemo(() => latestPosition(events), [events]);

  function useMyPosition() {
    if (!navigator.geolocation) { notify(fr ? "La localisation n'est pas disponible sur cet appareil." : 'Location is not available on this device.', 'error'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      pos => { setPicked({ lat: Number(pos.coords.latitude.toFixed(6)), lng: Number(pos.coords.longitude.toFixed(6)) }); setLocating(false); },
      () => { setLocating(false); notify(fr ? "Impossible d'obtenir votre position. Cliquez sur la carte pour la choisir." : 'Could not get your position. Click on the map to choose it.', 'error'); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function submit() {
    setSaving(true);
    const r = await addTrackingEvent({ transactionId: order.id, stage, lat: picked?.lat ?? null, lng: picked?.lng ?? null, place: place.trim(), note: note.trim() });
    setSaving(false);
    if (!r.ok) {
      const msg: Record<string, string> = {
        plan_required: fr ? 'Les positions sur la carte sont réservées aux forfaits Business et Premium.' : 'Map positions are reserved for Business and Premium plans.',
        order_closed: fr ? 'Cette commande est terminée ou annulée.' : 'This order is closed or cancelled.',
        forbidden: fr ? "Vous n'avez pas accès à cette commande." : 'You do not have access to this order.',
        invalid: fr ? 'Position ou texte invalide.' : 'Invalid position or text.',
        unknown: fr ? "Le suivi n'a pas pu être enregistré. Avez-vous exécuté la migration SQL ?" : 'Tracking could not be saved. Did you run the SQL migration?',
      };
      notify(msg[r.error], 'error');
      return;
    }
    if (stage !== 'preparing' && order.status === 'pending') onShipped(order.id);
    notify(fr ? 'Suivi mis à jour : le client le voit tout de suite.' : 'Tracking updated: the customer sees it right away.', 'success');
    const list = await listTrackingEvents(order.id);
    setEvents(list);
    setPlace(''); setNote(''); setPicked(null);
    setStage(TRACKING_STAGES[Math.min(currentStageIndex(list) + 1, TRACKING_STAGES.length - 1)]);
  }

  const field = { background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim } as const;
  const shortId = order.id.slice(0, 8);

  return (
    <Modal onClose={onClose} labelledBy="tracking-title">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl" style={{ background: surface, border: `1px solid ${border}` }}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 p-5 pb-3" style={{ background: surface }}>
          <div>
            <h2 id="tracking-title" className="font-black text-lg flex items-center gap-2" style={{ color: txtPrim }}>
              <Truck size={19} aria-hidden style={{ color: BRAND.violet }} />{fr ? 'Suivi de livraison' : 'Delivery tracking'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: txtSub }}>#{shortId} · {order.buyer_name}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={fr ? 'Fermer' : 'Close'}
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]" style={{ color: txtSub, background: surfaceAlt }}>
            <X size={18} aria-hidden />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-5">
          {/* Étape */}
          <fieldset>
            <legend className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: txtSub }}>{fr ? 'Où en est la commande ?' : 'Where is the order at?'}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
              {TRACKING_STAGES.map(s => {
                const Icon = STAGE_ICON[s];
                const on = s === stage;
                return (
                  <button key={s} type="button" role="radio" aria-checked={on} onClick={() => setStage(s)}
                    className="flex items-center gap-2.5 px-3.5 h-12 rounded-xl text-sm font-semibold text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                    style={{ background: on ? 'rgba(108,99,255,0.12)' : surfaceAlt, border: `2px solid ${on ? BRAND.violet : border}`, color: on ? BRAND.violet : txtPrim }}>
                    <Icon size={16} aria-hidden />{stageLabel(s, lang)}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Carte */}
          <section aria-labelledby="tracking-map-title">
            <h3 id="tracking-map-title" className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5" style={{ color: txtSub }}>
              <MapPin size={13} aria-hidden />{fr ? 'Position du colis sur la carte' : 'Parcel position on the map'}
            </h3>
            {hasMap ? (
              <>
                <DeliveryMap origin={origin} destination={destination} route={route} current={current} picked={picked} onPick={setPicked} height={280}
                  labels={{ origin: fr ? 'Départ (emplacement du produit)' : 'Start (product location)', destination: fr ? 'Destination' : 'Destination', current: fr ? 'Dernière position' : 'Last position', picked: fr ? 'Nouvelle position' : 'New position' }} />
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button type="button" onClick={useMyPosition} disabled={locating}
                    className="inline-flex items-center gap-2 h-10 px-4 rounded-full text-xs font-bold disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
                    style={{ background: surfaceAlt, border: `1px solid ${border}`, color: txtPrim }}>
                    {locating ? <ButtonSpinner /> : <Crosshair size={14} aria-hidden />}{fr ? 'Utiliser ma position' : 'Use my position'}
                  </button>
                  <p className="text-xs" style={{ color: txtSub }}>
                    {picked
                      ? (fr ? 'Nouvelle position choisie. Cliquez ailleurs pour la déplacer.' : 'New position chosen. Click elsewhere to move it.')
                      : (fr ? 'Cliquez sur la carte pour indiquer où se trouve le colis.' : 'Click on the map to show where the parcel is.')}
                  </p>
                  {picked && (
                    <button type="button" onClick={() => setPicked(null)} className="text-xs font-semibold underline underline-offset-2" style={{ color: txtSub }}>
                      {fr ? 'Retirer' : 'Clear'}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <Lock size={18} aria-hidden className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed" style={{ color: txtPrim }}>
                  {fr
                    ? "Le suivi sur carte (position du colis visible par le client) est réservé aux forfaits Business et Premium. Vous pouvez tout de même indiquer l'étape de la livraison."
                    : 'Map tracking (parcel position visible to the customer) is reserved for Business and Premium plans. You can still set the delivery stage.'}
                </p>
              </div>
            )}
          </section>

          {/* Lieu et note */}
          <div className="grid gap-3">
            <label className="block">
              <span className="text-xs font-bold" style={{ color: txtSub }}>{fr ? 'Lieu (optionnel)' : 'Place (optional)'}</span>
              <input value={place} onChange={e => setPlace(e.target.value)} maxLength={120} placeholder={fr ? 'Ex. Agence de Bonabéri, Douala' : 'E.g. Bonabéri depot, Douala'}
                className="mt-1 w-full h-11 px-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
            </label>
            <label className="block">
              <span className="text-xs font-bold" style={{ color: txtSub }}>{fr ? 'Message pour le client (optionnel)' : 'Message for the customer (optional)'}</span>
              <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={300} rows={2} placeholder={fr ? 'Ex. Le livreur arrive dans 30 minutes.' : 'E.g. The courier arrives in 30 minutes.'}
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none focus:ring-2 focus:ring-[#6C63FF]/40" style={field} />
            </label>
          </div>

          <button type="button" onClick={() => void submit()} disabled={saving}
            className="w-full h-12 rounded-full text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
            style={{ background: GRADIENTS.brand, boxShadow: '0 10px 26px rgba(108,99,255,0.3)' }}>
            {saving ? <ButtonSpinner /> : <Send size={16} aria-hidden />}{fr ? 'Mettre à jour le suivi' : 'Update tracking'}
          </button>
          {stage === 'arrived' && (
            <p className="text-xs leading-relaxed -mt-2" style={{ color: txtSub }}>
              {fr ? "Le paiement n'est libéré que lorsque le client confirme avoir reçu sa commande." : 'Payment is only released once the customer confirms receipt.'}
            </p>
          )}

          {/* Historique */}
          {events.length > 0 && (
            <section aria-labelledby="tracking-history">
              <h3 id="tracking-history" className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: txtSub }}>{fr ? 'Historique' : 'History'}</h3>
              <ol className="space-y-2">
                {[...events].reverse().map(e => (
                  <li key={e.id} className="flex items-start gap-3 rounded-xl p-3" style={{ background: surfaceAlt }}>
                    <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: e.stage === 'arrived' ? STATUS.success : BRAND.violet }} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold" style={{ color: txtPrim }}>{stageLabel(e.stage, lang)}</p>
                      {(e.place_label || e.note) && <p className="text-xs mt-0.5" style={{ color: txtSub }}>{[e.place_label, e.note].filter(Boolean).join(' · ')}</p>}
                      <p className="text-[11px] mt-0.5" style={{ color: txtSub }}>
                        {new Date(e.created_at).toLocaleString(fr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}{e.lat != null ? (fr ? ' · position sur la carte' : ' · map position') : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
}
