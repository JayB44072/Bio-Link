import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { BRAND } from '../../lib/theme';
import type { GeoPoint } from '../../lib/api/tracking';
import { distanceKm, formatDistance, formatDuration, pathLengthKm } from '../../lib/geo';
import { courierIcon, MapControls, pin3d, useCourierAlong } from './mapParts';

interface DeliveryMapProps {
  /** Point de départ (emplacement du produit). */
  origin?: GeoPoint | null;
  /** Adresse de livraison de l'acheteur. */
  destination?: GeoPoint | null;
  /** Trajet déjà parcouru, dans l'ordre. */
  route?: GeoPoint[];
  /** Dernière position connue du colis. */
  current?: GeoPoint | null;
  /** Position en cours de choix (vendeur). */
  picked?: GeoPoint | null;
  /** Si fourni, un clic sur la carte choisit une position. */
  onPick?: (point: GeoPoint) => void;
  height?: number | string;
  lang?: string;
  labels: { origin: string; destination: string; current: string; picked: string };
}

const CENTER: [number, number] = [4.05, 9.7];

/** Pastille ronde avec pictogramme (SVG en ligne : aucune image externe à charger). */
function dot(color: string, svg: string, size = 34, pulse = false) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      ${pulse ? `<span style="position:absolute;inset:-6px;border-radius:50%;background:${color};opacity:.25;animation:pulseDot 1.8s ease-out infinite;"></span>` : ''}
      <div style="position:relative;width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;">${svg}</div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ICON_BOX = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>';
const ICON_FLAG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22V4M5 4h12l-2 4 2 4H5"/></svg>';
const ICON_PIN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>';

/** Ajuste la vue sur l'ensemble des points quand ils changent. */
function FitView({ points }: { points: GeoPoint[] }) {
  const map = useMap();
  const key = points.map(p => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) { map.setView([points[0].lat, points[0].lng], 13, { animate: true }); return; }
    map.fitBounds(L.latLngBounds(points.map(p => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 14, animate: true });
    // `points` est entièrement décrit par `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (p: GeoPoint) => void }) {
  useMapEvents({ click: e => onPick({ lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) }) });
  return null;
}

/**
 * Carte de livraison : départ, trajet, position actuelle du colis et destination.
 * Avec `onPick`, elle sert aussi au vendeur à indiquer où se trouve le colis (clic sur la carte).
 */
export default function DeliveryMap({ origin, destination, route = [], current, picked, onPick, height = 320, lang = 'fr', labels }: DeliveryMapProps) {
  const fr = lang === 'fr';
  const [is3d, setIs3d] = useState(false);
  const icons = useMemo(() => ({
    origin: pin3d(BRAND.violet, ICON_BOX),
    destination: pin3d(BRAND.pink, ICON_FLAG),
    courier: courierIcon(BRAND.violet),
    picked: dot(BRAND.cyan, ICON_PIN, 38, true),
  }), []);

  const focus = [origin, destination, current, picked].filter((p): p is GeoPoint => !!p);
  const line = route.map(p => [p.lat, p.lng] as [number, number]);
  if (current && line.length) line.push([current.lat, current.lng]);

  // Le livreur parcourt le trajet déjà fait, puis reste à la dernière position connue
  const travelled: GeoPoint[] = route.length ? [...route, ...(current ? [current] : [])] : [];
  const { position: courier, progress, replay } = useCourierAlong(travelled);
  const head = current ?? route[route.length - 1] ?? origin ?? null;
  const rider = travelled.length > 1 ? courier : head;

  const done = pathLengthKm(travelled);
  const remaining = head && destination ? distanceKm(head, destination) : null;
  const total = remaining != null ? done + remaining : null;
  const share = total && total > 0 ? Math.min(1, done / total) : 0;

  return (
    <div className="relative">
      <div className={`map3d-stage rounded-2xl ${is3d ? 'is-3d' : ''}`} style={{ height, width: '100%' }}>
        <div className="map3d-plane">
          <MapContainer center={CENTER} zoom={6} style={{ width: '100%', height: '100%' }} scrollWheelZoom={!!onPick}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <FitView points={focus} />
            {onPick && <ClickToPick onPick={onPick} />}
            {head && destination && (
              <Polyline positions={[[head.lat, head.lng], [destination.lat, destination.lng]]}
                pathOptions={{ color: BRAND.pink, weight: 4, opacity: 0.75, dashArray: '2 10', lineCap: 'round', className: 'route-flow' }} />
            )}
            {line.length > 1 && <Polyline positions={line} pathOptions={{ color: BRAND.violet, weight: 5, opacity: 0.9, lineCap: 'round' }} />}
            {origin && <Marker position={[origin.lat, origin.lng]} icon={icons.origin} title={labels.origin} />}
            {destination && <Marker position={[destination.lat, destination.lng]} icon={icons.destination} title={labels.destination} />}
            {rider && <Marker position={[rider.lat, rider.lng]} icon={icons.courier} title={labels.current} zIndexOffset={500} />}
            {picked && <Marker position={[picked.lat, picked.lng]} icon={icons.picked} title={labels.picked} zIndexOffset={800} />}
          </MapContainer>
        </div>
      </div>

      <MapControls is3d={is3d} onToggle3d={onPick ? undefined : () => setIs3d(v => !v)}
        onReplay={travelled.length > 1 ? replay : undefined}
        label3d={fr ? 'Vue 3D' : '3D view'} labelReplay={fr ? 'Rejouer' : 'Replay'} />

      {remaining != null && (
        <div className="absolute left-3 bottom-3 right-3 sm:right-auto sm:w-[300px] z-[500] rounded-2xl bg-white/95 backdrop-blur shadow-xl p-3" role="status" aria-live="polite">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{fr ? 'Il reste' : 'Remaining'}</p>
            <p className="text-sm font-black text-gray-900 tabular-nums">{formatDistance(remaining, lang)} <span className="text-gray-500 font-semibold">· {formatDuration(remaining)}</span></p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(share * 100)} aria-label={fr ? 'Avancement du trajet' : 'Route progress'}>
            <div className="h-full rounded-full" style={{ width: `${Math.round(share * 100 * (travelled.length > 1 ? progress : 1))}%`, background: `linear-gradient(90deg, ${BRAND.violet}, ${BRAND.pink})`, transition: 'width .3s linear' }} />
          </div>
          <p className="mt-1.5 text-[10px] text-gray-500">{fr ? `À vol d'oiseau · trajet total ≈ ${formatDistance(total ?? remaining, lang)}` : `As the crow flies · total ≈ ${formatDistance(total ?? remaining, lang)}`}</p>
        </div>
      )}
    </div>
  );
}
