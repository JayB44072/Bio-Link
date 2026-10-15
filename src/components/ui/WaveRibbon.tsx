import { useEffect, useId, useRef, useState } from 'react';
import type { WaveLayout } from '../../lib/waveLayout';

interface WaveRibbonProps {
  layout: WaveLayout;
  compact: boolean;
  dark: boolean;
  /** Dégradé du ruban, du haut vers le bas. */
  stops: [string, string, string];
  /** Couleur du point de départ. */
  dot: string;
  /** Abscisse du point de départ (première station). */
  startX: number;
}

/**
 * Ruban sinusoïdal décoratif : tracé principal dégradé qui se dessine à l'apparition,
 * tracé secondaire déphasé et points lumineux qui circulent. Partagé entre le tableau de bord et la page publique.
 */
export default function WaveRibbon({ layout, compact, dark, stops, dot, startX }: WaveRibbonProps) {
  const gradId = `wave-${useId().replace(/:/g, '')}`;
  const pathRef = useRef<SVGPathElement>(null);
  const [length, setLength] = useState(0);
  useEffect(() => {
    const p = pathRef.current;
    if (p && typeof p.getTotalLength === 'function') setLength(p.getTotalLength());
  }, [layout.path]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2={layout.height} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={stops[0]} />
          <stop offset="0.5" stopColor={stops[1]} />
          <stop offset="1" stopColor={stops[2]} />
        </linearGradient>
      </defs>
      <path d={layout.companion} fill="none" stroke={dark ? 'rgba(139,124,255,0.35)' : 'rgba(108,99,255,0.22)'} strokeWidth="2" strokeLinecap="round" />
      <path d={layout.path} fill="none" stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(108,99,255,0.1)'} strokeWidth={compact ? 8 : 12} strokeLinecap="round" />
      <path ref={pathRef} d={layout.path} fill="none" stroke={`url(#${gradId})`} strokeWidth={compact ? 3 : 4} strokeLinecap="round"
        className="wave-draw" style={length ? { strokeDasharray: length, strokeDashoffset: length, ['--len' as string]: length } : undefined} />
      <path d={layout.path} fill="none" stroke="#fff" strokeOpacity={0.9} strokeWidth={compact ? 3 : 4} strokeLinecap="round" strokeDasharray="1 90" className="wave-flow" />
      <circle cx={startX} cy={6} r="5" fill={dot} />
    </svg>
  );
}
