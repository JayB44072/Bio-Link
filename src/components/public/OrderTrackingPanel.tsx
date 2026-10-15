import { lazy, Suspense, useMemo } from 'react';
import { CheckCircle2, MapPin, Package, Route, Truck } from 'lucide-react';
import { GRADIENTS, STATUS } from '../../lib/theme';
import {
  currentStageIndex, latestPosition, routePoints, stageLabel, TRACKING_STAGES,
  type OrderTracking, type TrackingStage,
} from '../../lib/api/tracking';
import type { ServiceWaveTheme } from './PublicServiceWave';
import { LIGHT_ORDER_THEME } from './orderTheme';

// La carte (Leaflet) n'est chargée que si le suivi a une position à montrer
const DeliveryMap = lazy(() => import('../ui/DeliveryMap'));

const STAGE_ICON: Record<TrackingStage, typeof Package> = {
  preparing: Package, shipped: Truck, in_transit: Route, out_for_delivery: Truck, arrived: CheckCircle2,
};

interface OrderTrackingPanelProps {
  tracking: OrderTracking;
  lang: string;
  /** Statut de la commande : le suivi est « en direct » tant qu'elle n'est ni livrée ni annulée. */
  orderStatus: string;
  /** Couleurs de la boutique (clair par défaut). */
  theme?: ServiceWaveTheme;
  /** Intégré dans une autre carte : pas de cadre ni de titre propres. */
  embedded?: boolean;
}

/** « Où est mon colis ? » : étape actuelle, progression, carte (forfaits Business / Premium) et historique. */
export default function OrderTrackingPanel({ tracking, lang, orderStatus, theme = LIGHT_ORDER_THEME, embedded = false }: OrderTrackingPanelProps) {
  const fr = lang === 'fr';
  const { events, origin, destination } = tracking;
  const idx = currentStageIndex(events);
  const last = events[events.length - 1];
  const current = useMemo(() => latestPosition(events), [events]);
  const route = useMemo(() => routePoints({ origin, events }), [origin, events]);
  const live = orderStatus === 'pending' || orderStatus === 'shipped';
  const showMap = tracking.plan_map && !!(origin || current || destination);
  const idle = theme.dark ? 'rgba(255,255,255,0.1)' : '#f3f4f6';

  const when = (iso: string) => new Date(iso).toLocaleString(fr ? 'fr-FR' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });

  const body = (
    <>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 id="order-tracking-title" className="font-black flex items-center gap-2" style={{ color: theme.text }}>
          <MapPin size={17} aria-hidden style={{ color: theme.accent }} />{fr ? 'Où est mon colis ?' : 'Where is my parcel?'}
        </h2>
        {live && events.length > 0 && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.14)', color: theme.dark ? '#4ade80' : '#15803d' }}>
            <span className="relative flex w-2 h-2"><span className="absolute inset-0 rounded-full animate-ping" style={{ background: STATUS.success, opacity: 0.6 }} /><span className="relative w-2 h-2 rounded-full" style={{ background: STATUS.success }} /></span>
            {fr ? 'Suivi en direct' : 'Live tracking'}
          </span>
        )}
      </div>

      {events.length === 0 ? (
        <p className="text-sm leading-relaxed mb-1" style={{ color: theme.subtext }}>
          {fr ? "Le vendeur n'a pas encore indiqué l'avancement de la livraison. Cette page se met à jour automatiquement." : 'The seller has not shared delivery progress yet. This page updates automatically.'}
        </p>
      ) : (
        <>
          {/* Étape actuelle */}
          <div className="rounded-2xl p-4 mb-5" style={{ background: `color-mix(in srgb, ${theme.accent} ${theme.dark ? 14 : 9}%, transparent)` }}>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: theme.subtext }}>{fr ? 'Étape actuelle' : 'Current step'}</p>
            <p className="text-lg font-black mt-0.5" style={{ color: theme.text }}>{stageLabel(last.stage, lang)}</p>
            {(last.place_label || last.note) && <p className="text-sm mt-1" style={{ color: theme.subtext }}>{[last.place_label, last.note].filter(Boolean).join(' · ')}</p>}
            <p className="text-xs mt-1.5" style={{ color: theme.subtext, opacity: 0.85 }}>{fr ? 'Mis à jour le' : 'Updated'} {when(last.created_at)}</p>
          </div>

          {/* Progression */}
          <ol className="flex items-start justify-between mb-5" aria-label={fr ? 'Progression' : 'Progress'}>
            {TRACKING_STAGES.map((s, i) => {
              const Icon = STAGE_ICON[s];
              const done = i <= idx;
              return (
                <li key={s} className="flex-1 flex flex-col items-center relative" aria-current={i === idx ? 'step' : undefined}>
                  {i > 0 && <span className="absolute top-[17px] right-1/2 w-full h-0.5" style={{ background: i <= idx ? theme.accent : theme.cardBorder }} aria-hidden />}
                  <span className="relative z-10 w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: done ? GRADIENTS.brand : idle, color: done ? '#fff' : theme.subtext, boxShadow: i === idx ? `0 0 0 4px color-mix(in srgb, ${theme.accent} 22%, transparent)` : 'none' }}>
                    <Icon size={15} aria-hidden />
                  </span>
                  <span className="mt-1.5 text-[10px] font-semibold text-center leading-tight px-0.5" style={{ color: done ? theme.text : theme.subtext }}>{stageLabel(s, lang)}</span>
                </li>
              );
            })}
          </ol>
        </>
      )}

      {/* Carte */}
      {showMap && (
        <div className="mb-5">
          <Suspense fallback={<div className="h-[260px] rounded-2xl animate-pulse" style={{ background: idle }} />}>
            <DeliveryMap origin={origin} destination={destination} route={route} current={current} height={320} lang={lang}
              labels={{ origin: fr ? 'Départ' : 'Start', destination: fr ? 'Votre adresse' : 'Your address', current: fr ? 'Position du colis' : 'Parcel position', picked: '' }} />
          </Suspense>
          {current && <p className="text-xs mt-2" style={{ color: theme.subtext }}>{fr ? 'Dernière position connue' : 'Last known position'} : {current.label || (fr ? 'voir la carte' : 'see the map')} · {when(current.at)}</p>}
        </div>
      )}

      {/* Historique */}
      {events.length > 1 && (
        <ol className="space-y-2.5" aria-label={fr ? 'Historique du suivi' : 'Tracking history'}>
          {[...events].reverse().map(e => (
            <li key={e.id} className="flex items-start gap-3">
              <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ background: e.stage === 'arrived' ? STATUS.success : theme.accent }} aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: theme.text }}>{stageLabel(e.stage, lang)}</p>
                {(e.place_label || e.note) && <p className="text-xs" style={{ color: theme.subtext }}>{[e.place_label, e.note].filter(Boolean).join(' · ')}</p>}
                <p className="text-[11px]" style={{ color: theme.subtext, opacity: 0.8 }}>{when(e.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {!tracking.plan_map && events.length > 0 && (
        <p className="text-[11px] mt-4" style={{ color: theme.subtext }}>{fr ? "Ce vendeur n'affiche pas la position du colis sur une carte." : 'This seller does not show the parcel position on a map.'}</p>
      )}
    </>
  );

  if (embedded) return <section aria-labelledby="order-tracking-title">{body}</section>;
  return (
    <section className={`${theme.cardRadius} p-6 mt-4`} aria-labelledby="order-tracking-title"
      style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.dark ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
      {body}
    </section>
  );
}
