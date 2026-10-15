import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Box, Play } from 'lucide-react';
import { pointAlong, type LatLng } from '../../lib/geo';

/** Livreur en 3D : silhouette sur un scooter avec colis, ombre au sol et petit rebond. */
export function courierIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<div class="courier3d"><div class="courier3d__shadow"></div><div class="courier3d__body">
      <svg viewBox="0 0 46 42" width="46" height="42" aria-hidden="true">
        <circle cx="11" cy="33" r="6" fill="#1f2937"/><circle cx="11" cy="33" r="2.4" fill="#9ca3af"/>
        <circle cx="35" cy="33" r="6" fill="#1f2937"/><circle cx="35" cy="33" r="2.4" fill="#9ca3af"/>
        <path d="M11 33 L18 24 H30 L35 33" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="30" y="17" width="9" height="9" rx="1.5" fill="#f59e0b" stroke="#b45309" stroke-width="1"/>
        <path d="M22 24 L24 13" stroke="${color}" stroke-width="5" stroke-linecap="round"/>
        <circle cx="25" cy="8" r="5" fill="#fcd9b6"/>
        <path d="M20 7 a5 5 0 0 1 10 0 z" fill="${color}"/>
        <path d="M24 14 L31 20" stroke="${color}" stroke-width="3" stroke-linecap="round"/>
      </svg></div></div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 40],
  });
}

/** Repère rond « 3D » : se redresse quand la carte est inclinée. */
export function pin3d(color: string, svg: string, size = 30) {
  return L.divIcon({
    className: '',
    html: `<div class="marker3d" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 5px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;color:#fff;">${svg}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Fait avancer un point le long d'un trajet (une fois, en douceur) ; `replay` relance l'animation.
 * Sans mouvement réduit demandé, sinon le point est directement à l'arrivée.
 */
export function useCourierAlong(path: LatLng[], durationMs = 4200) {
  const key = path.map(p => `${p.lat.toFixed(5)},${p.lng.toFixed(5)}`).join('|');
  const [t, setT] = useState(0);
  const [run, setRun] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (path.length < 2 || reduce) { setT(1); return; }
    const start = performance.now();
    const ease = (x: number) => 1 - Math.pow(1 - x, 3);
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / durationMs);
      setT(ease(k));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    setT(0);
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // `path` est entièrement décrit par `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, run, durationMs]);

  return { position: pointAlong(path, t), progress: t, replay: () => setRun(r => r + 1) };
}

/** Boutons flottants de la carte : vue 3D et relecture du trajet. */
export function MapControls({ is3d, onToggle3d, onReplay, label3d, labelReplay }: {
  is3d: boolean; onToggle3d?: () => void; onReplay?: () => void; label3d: string; labelReplay: string;
}) {
  const btn = 'h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur bg-white/90 text-gray-800 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500';
  return (
    <div className="absolute top-3 right-3 z-[500] flex gap-2">
      {onReplay && <button type="button" onClick={onReplay} className={btn}><Play size={13} aria-hidden />{labelReplay}</button>}
      {onToggle3d && <button type="button" onClick={onToggle3d} aria-pressed={is3d} className={btn} style={is3d ? { background: '#6C63FF', color: '#fff' } : undefined}><Box size={13} aria-hidden />{label3d}</button>}
    </div>
  );
}
