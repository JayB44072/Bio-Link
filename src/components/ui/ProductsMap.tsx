import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Layers, Satellite, Map as MapIcon, Search, X } from 'lucide-react';
import { BRAND } from '../../lib/theme';
import { filterByQuery } from '../../lib/search';
import type { OrderRoute } from '../../lib/api/orderRoutes';
import { courierIcon, pin3d } from './mapParts';
import { Fit, RouteLayer, RouteSummary, type Icons } from './OrdersRouteMap';

export interface MapPin {
  id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  lat: number;
  lng: number;
}

interface ProductsMapProps {
  pins: MapPin[];
  isDark?: boolean;
  height?: number | string;
  emptyLabel?: string;
  searchPlaceholder?: string;
  noResultsLabel?: string;
  /** Livraisons à tracer sur la carte (départ → adresse, avec le livreur). */
  routes?: OrderRoute[];
  selectedRouteId?: string | null;
  onSelectRoute?: (id: string) => void;
  lang?: string;
}

const TILE_LAYERS = {
  simple: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

function makePhotoIcon(imageUrl: string, highlighted = false) {
  const border = highlighted ? BRAND.pink : BRAND.violet;
  const size = highlighted ? 52 : 44;
  const shadow = highlighted ? '0 6px 22px rgba(255,107,157,0.55)' : '0 4px 14px rgba(108,99,255,0.45)';
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;overflow:hidden;
        border:3px solid ${border};box-shadow:${shadow};
        background:#12122b url('${imageUrl.replace(/'/g, '%27')}') center/cover no-repeat;
      "></div>
      <div style="
        width:0;height:0;margin:-2px auto 0;
        border-left:6px solid transparent;border-right:6px solid transparent;
        border-top:9px solid ${border};
      "></div>
    `,
    iconSize: [size, size + 9],
    iconAnchor: [size / 2, size + 9],
    popupAnchor: [0, -size - 6],
  });
}

/** Sous-composant qui a accès à l'instance Leaflet via useMap, pour piloter le zoom
 *  et l'ouverture des popups depuis la barre de recherche (au-dessus du <MapContainer>). */
function MapController({
  focusedId, pins, markerRefs,
}: {
  focusedId: string | null;
  pins: MapPin[];
  markerRefs: React.MutableRefObject<Map<string, L.Marker>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!focusedId) return;
    const pin = pins.find(p => p.id === focusedId);
    if (!pin) return;
    map.setView([pin.lat, pin.lng], 15, { animate: true });
    const marker = markerRefs.current.get(pin.id);
    if (marker) marker.openPopup();
  }, [focusedId, pins, map, markerRefs]);
  return null;
}

export default function ProductsMap({
  pins, isDark: dk = false, height = 480,
  emptyLabel, searchPlaceholder, noResultsLabel,
  routes = [], selectedRouteId = null, onSelectRoute, lang = 'fr',
}: ProductsMapProps) {
  const routeIcons = useMemo<Icons>(() => ({
    origin: pin3d(BRAND.violet, '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>'),
    destination: pin3d(BRAND.pink, '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22V4M5 4h12l-2 4 2 4H5"/></svg>'),
    courier: courierIcon(BRAND.violet),
  }), []);
  const selectedRoute = routes.find(r => r.id === selectedRouteId) ?? null;
  const [layer, setLayer] = useState<'simple' | 'satellite'>('simple');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const valid = pins.filter(p => p.lat != null && p.lng != null);
  const center: [number, number] = valid.length
    ? [valid.reduce((s, p) => s + p.lat, 0) / valid.length, valid.reduce((s, p) => s + p.lng, 0) / valid.length]
    : [7.539989, -5.54708]; // Côte d'Ivoire par défaut

  const results = useMemo(() => {
    if (!query.trim()) return valid.slice(0, 6);
    return filterByQuery(valid, query, p => [p.name]);
  }, [query, valid]);

  function selectResult(pin: MapPin) {
    setFocusedId(pin.id);
    setSearchOpen(false);
    setQuery(pin.name);
  }

  return (
    <div className="relative rounded-3xl overflow-hidden" style={{ height, border: `1px solid ${dk ? 'rgba(139,124,255,0.16)' : '#eeebfb'}` }}>

      {/* Barre de recherche — flottante en haut à gauche */}
      {valid.length > 0 && (
        <div ref={boxRef} className="absolute top-3 left-3 z-[1000] w-[calc(100%-140px)] max-w-xs">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg"
            style={{
              background: dk ? '#12122b' : '#fff',
              border: `1px solid ${dk ? 'rgba(139,124,255,0.2)' : '#e5e7eb'}`,
            }}>
            <Search size={14} className="shrink-0" style={{ color: dk ? '#8c8ab0' : '#8a87a3' }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder={searchPlaceholder || 'Rechercher un produit...'}
              className="flex-1 min-w-0 bg-transparent text-xs font-medium outline-none"
              style={{ color: dk ? '#f2f1ff' : '#16162e' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setFocusedId(null); setSearchOpen(false); }}
                className="shrink-0" style={{ color: dk ? '#8c8ab0' : '#8a87a3' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {searchOpen && (
            <div className="mt-1.5 rounded-xl shadow-xl max-h-60 overflow-y-auto"
              style={{
                background: dk ? '#12122b' : '#fff',
                border: `1px solid ${dk ? 'rgba(139,124,255,0.2)' : '#e5e7eb'}`,
              }}>
              {results.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs font-medium"
                  style={{ color: dk ? '#8c8ab0' : '#8a87a3' }}>
                  {noResultsLabel || 'Aucun produit trouvé.'}
                </div>
              ) : results.map(pin => (
                <button key={pin.id} onClick={() => selectResult(pin)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 text-left transition hover:opacity-80"
                  style={{
                    borderBottom: `1px solid ${dk ? 'rgba(139,124,255,0.08)' : '#f3f4f6'}`,
                  }}>
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0"
                    style={{ background: dk ? '#191938' : '#f3f4f6' }}>
                    {pin.image_url && <img src={pin.image_url} alt={pin.name} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: dk ? '#f2f1ff' : '#16162e' }}>{pin.name}</p>
                    <p className="text-[10px] font-bold" style={{ color: BRAND.violet }}>{pin.price.toLocaleString()} {pin.currency}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toggle vue simple/satellite */}
      <div className="absolute top-3 right-3 z-[1000] flex rounded-xl overflow-hidden shadow-lg"
        style={{ background: dk ? '#12122b' : '#fff', border: `1px solid ${dk ? 'rgba(139,124,255,0.2)' : '#e5e7eb'}` }}>
        <button onClick={() => setLayer('simple')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition"
          style={layer === 'simple' ? { background: BRAND.violet, color: '#fff' } : { color: dk ? '#8c8ab0' : '#6b7280' }}>
          <MapIcon size={13} />
        </button>
        <button onClick={() => setLayer('satellite')}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition"
          style={layer === 'satellite' ? { background: BRAND.violet, color: '#fff' } : { color: dk ? '#8c8ab0' : '#6b7280' }}>
          <Satellite size={13} />
        </button>
      </div>

      {valid.length === 0 && routes.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2"
          style={{ background: dk ? '#0d0d22' : '#faf9ff' }}>
          <Layers size={28} style={{ color: dk ? '#8c8ab0' : '#8a87a3' }} />
          <p className="text-xs font-medium" style={{ color: dk ? '#8c8ab0' : '#8a87a3' }}>
            {emptyLabel || 'Aucun emplacement renseigné pour le moment.'}
          </p>
        </div>
      ) : (
        <MapContainer center={center} zoom={valid.length === 1 ? 13 : 6} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
          <TileLayer url={TILE_LAYERS[layer].url} attribution={TILE_LAYERS[layer].attribution} />
          <MapController focusedId={focusedId} pins={valid} markerRefs={markerRefs} />
          {routes.length > 0 && <Fit routes={routes} selectedId={selectedRouteId} />}
          {routes.map(r => (
            <RouteLayer key={r.id} r={r} selectedId={selectedRouteId} onSelect={id => onSelectRoute?.(id)} icons={routeIcons}
              labels={{ origin: lang === 'fr' ? 'Départ' : 'Start', destination: lang === 'fr' ? 'Livraison' : 'Delivery', current: lang === 'fr' ? 'Position du colis' : 'Parcel position' }} />
          ))}
          {valid.map(pin => (
            <Marker key={pin.id} position={[pin.lat, pin.lng]}
              icon={makePhotoIcon(pin.image_url || '/logo.png', focusedId === pin.id)}
              ref={ref => {
                if (ref) markerRefs.current.set(pin.id, ref);
                else markerRefs.current.delete(pin.id);
              }}>
              <Popup>
                <div style={{ textAlign: 'center', minWidth: 120 }}>
                  <strong style={{ fontSize: 13 }}>{pin.name}</strong>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: BRAND.violet, fontWeight: 700 }}>
                    {pin.price.toLocaleString()} {pin.currency}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
      {routes.length > 0 && <RouteSummary route={selectedRoute} lang={lang} />}
    </div>
  );
}
