import { useMemo, useRef } from 'react';
import { Briefcase, Clock, Eye, Play } from 'lucide-react';
import type { Service } from '../../lib/types';
import { BRAND } from '../../lib/theme';
import { sineEdgePath, waveLayout } from '../../lib/waveLayout';
import { useElementWidth } from '../../lib/useElementWidth';
import { useScrollFocus } from '../../lib/useScrollFocus';
import WaveRibbon from '../ui/WaveRibbon';

/** Couleurs et formes de la boutique, déjà résolues selon le thème et le mode clair/sombre. */
export interface ServiceWaveTheme {
  dark: boolean;
  /** Fond de la page de la boutique (la fiche d'un service s'y fond). */
  pageBg: string;
  text: string;
  subtext: string;
  cardBg: string;
  cardBorder: string;
  /** Couleur d'accent du thème (anneaux, ruban). */
  accent: string;
  priceColor: string;
  /** Dégradé CSS du bouton principal. */
  buttonGradient: string;
  /** Classe de rayon des cartes du thème (rounded-none, rounded-3xl…). */
  cardRadius: string;
}

interface PublicServiceWaveProps {
  services: Service[];
  lang: string;
  theme: ServiceWaveTheme;
  onOpen: (service: Service) => void;
}

const ROW = 250;
const TOP = 30;
const COMPACT_BELOW = 560;
const isVideo = (u: string) => u.includes('youtube') || u.includes('youtu.be') || u.includes('vimeo');

/**
 * Services d'une boutique le long d'un ruban sinusoïdal, dans l'esprit du tableau de bord :
 * médaillon sur la crête de la vague, carte à bord ondulé de l'autre côté, couleurs et rayons du thème.
 */
export default function PublicServiceWave({ services, lang, theme, onOpen }: PublicServiceWaveProps) {
  const fr = lang === 'fr';
  const boxRef = useRef<HTMLOListElement>(null);
  const width = useElementWidth(boxRef);
  useScrollFocus(boxRef);
  const compact = width < COMPACT_BELOW;

  const R = compact ? 30 : 44;
  const cx = compact ? 54 : width / 2;
  const amplitude = compact ? 18 : Math.min(width * 0.2, 170);
  const layout = useMemo(() => waveLayout({ rows: services.length, rowHeight: ROW, cx, amplitude, top: TOP }), [services.length, cx, amplitude]);
  const edge = useMemo(() => sineEdgePath(240, 14, 7, 3), []);
  const ring = `conic-gradient(${theme.accent}, ${theme.priceColor}, ${theme.accent})`;

  return (
    <ol ref={boxRef} className="relative list-none m-0 p-0" style={{ height: layout.height }}>
      <WaveRibbon layout={layout} compact={compact} dark={theme.dark} stops={[theme.accent, theme.priceColor, theme.accent]} dot={theme.accent} startX={layout.nodes[0]?.x ?? cx} />

      {services.map((service, i) => {
        const node = layout.nodes[i];
        const delay = `${i * 90}ms`;
        const cardBox = compact
          ? { left: cx + amplitude + R + 12, right: 0 }
          : node.side === 'right'
            ? { left: 0, width: Math.max(220, node.x - R - 34) }
            : { left: node.x + R + 34, right: 0 };
        const hasVideo = service.images?.some(isVideo);

        return (
          <li key={service.id} data-focus-item className="wave3d-stage absolute inset-x-0"
            style={{ top: node.y - ROW / 2, height: ROW, ['--dir' as string]: node.side === 'right' ? 1 : -1 }}>
            {/* Médaillon */}
            <button type="button" onClick={() => onOpen(service)}
              aria-label={fr ? `Voir ${service.name}` : `View ${service.name}`}
              className="wave-in absolute rounded-full transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4"
              style={{ left: node.x - R, top: ROW / 2 - R, width: R * 2, height: R * 2, animationDelay: delay, boxShadow: `0 10px 30px color-mix(in srgb, ${theme.accent} 35%, transparent)`, ['--tw-ring-color' as string]: `color-mix(in srgb, ${theme.accent} 40%, transparent)` }}>
              {/* « Pièce » en 3D : elle pivote et avance selon la position à l'écran */}
              <span className="wave3d-coin absolute inset-0 rounded-full">
                <span className="wave-spin absolute inset-0 rounded-full" style={{ background: ring }} />
                <span className="absolute rounded-full overflow-hidden flex items-center justify-center" style={{ inset: 4, background: theme.cardBg }}>
                  {service.image_url
                    ? <img src={service.image_url} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover" />
                    : <Briefcase size={compact ? 20 : 28} aria-hidden style={{ color: theme.accent, opacity: 0.7 }} />}
                </span>
              </span>
            </button>

            {/* Carte */}
            <div className="wave-in absolute top-0 bottom-0 flex items-center" style={{ ...cardBox, animationDelay: delay }}>
              <div className={`wave3d-card relative w-full overflow-hidden ${theme.cardRadius}`}
                style={{ background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, boxShadow: theme.dark ? '0 10px 30px rgba(0,0,0,0.35)' : '0 8px 28px rgba(108,99,255,0.1)' }}>
                <svg className="absolute inset-x-0 top-0 w-full" style={{ height: 40 }} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true">
                  <path d={edge} fill={`color-mix(in srgb, ${theme.accent} ${theme.dark ? 26 : 14}%, transparent)`} />
                </svg>
                <div className="relative px-4 pt-3 pb-4">
                  <div className="flex items-center gap-1.5 flex-wrap min-h-[26px]">
                    {service.duration && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.9)', color: '#16162e' }}>
                        <Clock size={12} aria-hidden />{service.duration}
                      </span>
                    )}
                    {hasVideo && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ background: BRAND.violet }}>
                        <Play size={11} aria-hidden fill="currentColor" />{fr ? 'Vidéo' : 'Video'}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base leading-snug mt-2.5 truncate" style={{ color: theme.text }} title={service.name}>{service.name}</h3>
                  <p className="text-[13px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: theme.subtext }}>{service.description}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    {service.price > 0 ? (
                      <p className="flex items-baseline gap-1.5">
                        <span className="text-xl font-black tabular-nums" style={{ color: theme.priceColor }}>{service.price.toLocaleString()}</span>
                        <span className="text-xs font-bold" style={{ color: theme.subtext }}>{service.currency}</span>
                      </p>
                    ) : <span />}
                    <button type="button" onClick={() => onOpen(service)}
                      className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-xs font-bold text-white transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      style={{ background: theme.buttonGradient, boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
                      <Eye size={14} aria-hidden />{fr ? 'Voir le service' : 'View service'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
