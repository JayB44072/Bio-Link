import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BRAND, STATUS } from '../../lib/theme';
import type { OrderRoute } from '../../lib/api/orderRoutes';
import { distanceKm, formatDistance, formatDuration, pathLengthKm } from '../../lib/geo';
import { courierIcon, MapControls, pin3d, useCourierAlong } from './mapParts';

export const ROUTE_COLORS: Record<string, string> = {
  pending: STATUS.warning, shipped: BRAND.violet, completed: STATUS.success,
};

interface OrdersRouteMapProps {
  routes: OrderRoute[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  height?: number | string;
  lang?: string;
  labels: { origin: string; destination: string; current: string };
}

const BOX = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>';
const FLAG = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22V4M5 4h12l-2 4 2 4H5"/></svg>';

export function Fit({ routes, selectedId }: { routes: OrderRoute[]; selectedId: string | null }) {
  const map = useMap();
  const pts = useMemo(() => {
    const list = selectedId ? routes.filter(r => r.id === selectedId) : routes;
    return list.flatMap(r => [r.origin, r.destination, r.current, ...r.travelled]).filter((p): p is NonNullable<typeof p> => !!p);
  }, [routes, selectedId]);
  const key = `${selectedId ?? 'all'}|${pts.length}`;
  useEffect(() => {
    if (pts.length === 0) return;
    if (pts.length === 1) { map.setView([pts[0].lat, pts[0].lng], 12); return; }
    map.fitBounds(L.latLngBounds(pts.map(p => [p.lat, p.lng] as [number, number])), { padding: [36, 36], maxZoom: 13, animate: true });
    // `pts` est entièrement décrit par `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

export type Icons = { origin: L.DivIcon; destination: L.DivIcon; courier: L.DivIcon };

/** Une commande sur la carte : trajet parcouru (trait plein), reste à faire (pointillés animés) et livreur. */
export function RouteLayer({ r, selectedId, onSelect, icons, labels }: {
  r: OrderRoute; selectedId: string | null; onSelect: (id: string) => void; icons: Icons; labels: OrdersRouteMapProps["labels"];
}) {
  const color = ROUTE_COLORS[r.status] ?? BRAND.violet;
  const active = r.id === selectedId;
  const dim = selectedId != null && !active;
  const head = r.current ?? r.origin;
  const open: [number, number][] = head && r.destination ? [[head.lat, head.lng], [r.destination.lat, r.destination.lng]] : [];
  const done: [number, number][] = r.travelled.map(p => [p.lat, p.lng]);
  // Le livreur ne s'anime que pour la commande choisie ; les autres restent à leur dernière position
  const { position } = useCourierAlong(active ? r.travelled : [], 4200);
  const rider = active && r.travelled.length > 1 ? position : head;
  const opacity = dim ? 0.25 : 0.9;
  const click = { click: () => onSelect(r.id) };
  return (
    <>
      {open.length === 2 && <Polyline positions={open} eventHandlers={click}
        pathOptions={{ color, weight: active ? 5 : 3, opacity: opacity * 0.85, dashArray: '2 10', lineCap: 'round', className: 'route-flow' }} />}
      {done.length > 1 && <Polyline positions={done} eventHandlers={click} pathOptions={{ color, weight: active ? 6 : 4, opacity, lineCap: 'round' }} />}
      {r.origin && <Marker position={[r.origin.lat, r.origin.lng]} icon={icons.origin} title={`${labels.origin} · ${r.productName}`} opacity={dim ? 0.4 : 1} eventHandlers={click} />}
      {r.destination && <Marker position={[r.destination.lat, r.destination.lng]} icon={icons.destination} title={`${labels.destination} · ${r.buyerName}`} opacity={dim ? 0.4 : 1} eventHandlers={click} />}
      {rider && r.status !== 'completed' && <Marker position={[rider.lat, rider.lng]} icon={icons.courier} title={labels.current} zIndexOffset={500} opacity={dim ? 0.4 : 1} eventHandlers={click} />}
    </>
  );
}

/** Panneau flottant : distance départ → livraison, déjà parcourue et restante pour la commande choisie. */
export function RouteSummary({ route: sel, lang = 'fr' }: { route: OrderRoute | null; lang?: string }) {
  const fr = lang === 'fr';
  const head = sel ? sel.current ?? sel.origin : null;
  const remaining = sel && head && sel.destination ? distanceKm(head, sel.destination) : null;
  const done = sel ? pathLengthKm(sel.travelled) : 0;
  const direct = sel?.origin && sel.destination ? distanceKm(sel.origin, sel.destination) : null;
  return (
  <div className="absolute left-3 bottom-3 right-3 sm:right-auto sm:w-[320px] z-[500] rounded-2xl bg-white/95 backdrop-blur shadow-xl p-3" role="status" aria-live="polite">
    {sel ? (
      <>
        <p className="text-xs font-black text-gray-900 truncate">{sel.productName || (fr ? 'Commande' : 'Order')} → {sel.buyerName}</p>
        <dl className="mt-1.5 grid grid-cols-3 gap-2 text-center">
          {[
            [fr ? 'Départ → livraison' : 'Start → delivery', direct != null ? formatDistance(direct, lang) : '—'],
            [fr ? 'Déjà parcouru' : 'Covered', done > 0 ? formatDistance(done, lang) : '—'],
            [fr ? 'Reste' : 'Remaining', remaining != null ? `${formatDistance(remaining, lang)} · ${formatDuration(remaining)}` : '—'],
          ].map(([k, v]) => (
            <div key={k}><dt className="text-[10px] font-bold uppercase tracking-wide text-gray-500 leading-tight">{k}</dt><dd className="text-xs font-black text-gray-900 tabular-nums">{v}</dd></div>
          ))}
        </dl>
        <p className="mt-1.5 text-[10px] text-gray-500">{fr ? "Distances à vol d'oiseau, durée estimée à 25 km/h." : 'Straight-line distances, time estimated at 25 km/h.'}</p>
      </>
    ) : (
      <p className="text-xs font-semibold text-gray-700">{fr ? 'Choisissez une commande pour voir la distance à parcourir.' : 'Pick an order to see the distance to cover.'}</p>
    )}
  </div>
  );
}

/** Carte du vendeur : pour chaque commande, une ligne du produit vers l'adresse de livraison, avec distance estimée et vue 3D. */
export default function OrdersRouteMap({ routes, selectedId, onSelect, height = 480, lang = 'fr', labels }: OrdersRouteMapProps) {
  const fr = lang === 'fr';
  const [is3d, setIs3d] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const icons = useMemo<Icons>(() => ({
    origin: pin3d(BRAND.violet, BOX), destination: pin3d(BRAND.pink, FLAG), courier: courierIcon(BRAND.violet),
  }), []);

  const sel = routes.find(r => r.id === selectedId) ?? null;

  return (
    <div className="relative">
      <div className={`map3d-stage rounded-2xl ${is3d ? 'is-3d' : ''}`} style={{ height, width: '100%' }}>
        <div className="map3d-plane">
          <MapContainer center={[4.05, 9.7]} zoom={6} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <Fit routes={routes} selectedId={selectedId} />
            {routes.map(r => <RouteLayer key={r.id + replayKey} r={r} selectedId={selectedId} onSelect={onSelect} icons={icons} labels={labels} />)}
          </MapContainer>
        </div>
      </div>
      <MapControls is3d={is3d} onToggle3d={() => setIs3d(v => !v)} onReplay={sel && sel.travelled.length > 1 ? () => setReplayKey(k => k + 1) : undefined}
        label3d={fr ? 'Vue 3D' : '3D view'} labelReplay={fr ? 'Rejouer' : 'Replay'} />

      <RouteSummary route={sel} lang={lang} />
    </div>
  );
}
