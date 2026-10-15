import { useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';
import type { Service } from '../../../../lib/types';
import { BRAND, STATUS } from '../../../../lib/theme';
import { useElementWidth } from '../../../../lib/useElementWidth';
import { useScrollFocus } from '../../../../lib/useScrollFocus';
import WaveRibbon from '../../../ui/WaveRibbon';
import { sineEdgePath, waveLayout } from '../../../../lib/waveLayout';
import { DurationChip, ServiceControls, ServiceThumb, StatusPill } from './serviceParts';
import { useServiceTheme } from './useServiceTheme';

interface ServiceWaveProps {
  services: Service[];
  togglingId: string | null;
  onToggle: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
  /** Station finale « ajouter » (absente si le forfait est atteint). */
  onAdd?: () => void;
  addLabel: string;
}

const ROW = 262;
const TOP = 36;
const COMPACT_BELOW = 640;

/**
 * Les services le long d'un ruban sinusoïdal : un médaillon par service sur la crête de la vague,
 * la carte d'information de l'autre côté, et une dernière station pour en ajouter un nouveau.
 * Sur mobile la vague se resserre contre le bord gauche et les cartes occupent la largeur restante.
 */
export default function ServiceWave({ services, togglingId, onToggle, onEdit, onDelete, onAdd, addLabel }: ServiceWaveProps) {
  const { fr, dk, surface, border, txtPrim, txtSub, cardShadow } = useServiceTheme();
  const boxRef = useRef<HTMLOListElement>(null);
  const width = useElementWidth(boxRef);
  useScrollFocus(boxRef);
  const compact = width < COMPACT_BELOW;

  const R = compact ? 30 : 46; // rayon des médaillons
  const rows = services.length + (onAdd ? 1 : 0);
  const cx = compact ? 54 : width / 2;
  const amplitude = compact ? 18 : Math.min(width * 0.2, 190);
  const layout = useMemo(() => waveLayout({ rows, rowHeight: ROW, cx, amplitude, top: TOP }), [rows, cx, amplitude]);

  const cardEdge = useMemo(() => sineEdgePath(240, 14, 7, 3), []);

  return (
    <ol ref={boxRef} className="relative list-none m-0 p-0" style={{ height: layout.height }}>
      {/* Ruban sinusoïdal (composant partagé avec la page publique) */}
      <WaveRibbon layout={layout} compact={compact} dark={dk} stops={[BRAND.pink, BRAND.violet, BRAND.cyan]} dot={BRAND.pink} startX={layout.nodes[0]?.x ?? cx} />

      {services.map((service, i) => {
        const node = layout.nodes[i];
        if (!node) return null;
        const active = service.is_active;
        const paused = !active;
        // La carte occupe l'espace de l'autre côté du médaillon
        const cardBox = compact
          ? { left: cx + amplitude + R + 12, right: 4 }
          : node.side === 'right'
            ? { left: 4, width: Math.max(220, node.x - R - 36) }
            : { left: node.x + R + 36, right: 4 };
        const delay = `${i * 90}ms`;

        return (
          <li key={service.id} data-focus-item className="wave3d-stage absolute inset-x-0"
            style={{ top: node.y - ROW / 2, height: ROW, ['--dir' as string]: node.side === 'right' ? 1 : -1 }}>
            {/* Médaillon */}
            <button type="button" onClick={() => onEdit(service)}
              aria-label={fr ? `Modifier ${service.name}` : `Edit ${service.name}`}
              className="wave-in absolute rounded-full transition-transform duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#6C63FF]/40"
              style={{ left: node.x - R, top: ROW / 2 - R, width: R * 2, height: R * 2, animationDelay: delay, boxShadow: active ? `0 10px 30px color-mix(in srgb, ${BRAND.violet} 35%, transparent)` : 'none' }}>
              {/* « Pièce » en 3D : elle pivote et avance selon la position à l'écran */}
              <span className="wave3d-coin absolute inset-0 rounded-full">
                {active ? (
                  <span className="wave-spin absolute inset-0 rounded-full"
                    style={{ background: `conic-gradient(${BRAND.pink}, ${BRAND.violet}, ${BRAND.cyan}, ${BRAND.pink})` }} />
                ) : (
                  <span className="absolute inset-0 rounded-full" style={{ border: `2px dashed ${txtSub}`, opacity: 0.7 }} />
                )}
                <span className="absolute rounded-full overflow-hidden" style={{ inset: active ? 4 : 5, background: surface }}>
                  <ServiceThumb service={service} className="w-full h-full" iconSize={compact ? 20 : 30} />
                </span>
                {/* Statut sur le médaillon : un point plein, ou « pause » */}
                <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2"
                  style={{ background: active ? STATUS.success : txtSub, borderColor: surface }} aria-hidden="true">
                  {paused && <span className="w-2 h-2 border-x-2 rounded-[1px]" style={{ borderColor: '#fff' }} />}
                </span>
              </span>
            </button>

            {/* Carte d'information */}
            <div className="wave-in absolute top-0 bottom-0 flex items-center" style={{ ...cardBox, animationDelay: delay }}>
              <div className="wave3d-card relative w-full rounded-3xl overflow-hidden"
                style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
                {/* Bandeau à bord sinusoïdal */}
                <svg className="absolute inset-x-0 top-0 w-full" style={{ height: 40 }} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true">
                  <path d={cardEdge} fill={paused ? (dk ? 'rgba(139,124,255,0.1)' : 'rgba(108,99,255,0.07)') : `color-mix(in srgb, ${BRAND.violet} ${dk ? 28 : 16}%, transparent)`} />
                </svg>
                <div className="relative px-4 pt-3 pb-3.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusPill active={active} />
                    {service.duration && <DurationChip duration={service.duration} />}
                  </div>
                  <h3 className="font-bold text-base leading-snug mt-2.5 truncate" style={{ color: paused ? txtSub : txtPrim }} title={service.name}>{service.name}</h3>
                  <p className="text-[13px] leading-relaxed mt-0.5 line-clamp-2" style={{ color: txtSub }}>
                    {service.description || (fr ? 'Aucune description.' : 'No description.')}
                  </p>
                  <p className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black tabular-nums" style={{ color: paused ? txtSub : BRAND.violet }}>{service.price.toLocaleString()}</span>
                    <span className="text-xs font-bold" style={{ color: txtSub }}>{service.currency}</span>
                  </p>
                  <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
                    <ServiceControls service={service} toggling={togglingId === service.id} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}

      {/* Dernière station : ajouter un service */}
      {onAdd && layout.nodes[services.length] && (() => {
        const node = layout.nodes[services.length];
        return (
          <li key="add" className="absolute inset-x-0" style={{ top: node.y - ROW / 2, height: ROW }}>
            <button type="button" onClick={onAdd}
              className="wave-in group absolute flex flex-col items-center justify-center gap-1 rounded-full transition hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FF6B9D]/40"
              style={{ left: node.x - R, top: ROW / 2 - R, width: R * 2, height: R * 2, border: `2px dashed ${BRAND.pink}`, color: BRAND.pinkDark, background: dk ? 'rgba(255,107,157,0.08)' : '#fff5f9', animationDelay: `${services.length * 90}ms` }}>
              <Plus size={compact ? 22 : 30} aria-hidden className="transition-transform duration-300 group-hover:rotate-90" />
              <span className="sr-only">{addLabel}</span>
            </button>
            <p className="wave-in absolute text-sm font-bold"
              style={{ top: ROW / 2 - 10, color: BRAND.pinkDark, animationDelay: `${services.length * 90 + 80}ms`, ...(compact || node.side === 'left' ? { left: node.x + R + 14 } : { right: width - node.x + R + 14 }) }}>
              {addLabel}
            </p>
          </li>
        );
      })()}
    </ol>
  );
}
