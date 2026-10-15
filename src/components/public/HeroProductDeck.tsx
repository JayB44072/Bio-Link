import { useMemo } from 'react';
import { ShoppingBag } from 'lucide-react';
import type { Product } from '../../lib/types';
import type { Hero3DStyle } from '../../lib/planLimits';
import { sineEdgePath } from '../../lib/waveLayout';

interface HeroProductDeckProps {
  products: Product[];
  side: 'left' | 'right';
  /** Écran étroit : médaillons seuls, sans carte. */
  compact: boolean;
  style: Hero3DStyle;
  lang: string;
  onOpen: (product: Product) => void;
  /** Rang de départ, pour décaler l'apparition entre les deux côtés. */
  offset?: number;
}

/**
 * Colonne de produits sur un côté de la scène : médaillon rond (photo + anneau dégradé) et petite carte à bord ondulé,
 * comme les services. Chaque élément apparaît puis dérive selon la progression du défilement (variable CSS `--p`
 * posée par la scène), sans aucun rendu React par image.
 */
export default function HeroProductDeck({ products, side, compact, style, lang, onOpen, offset = 0 }: HeroProductDeckProps) {
  const edge = useMemo(() => sineEdgePath(240, 14, 7, 3), []);
  const fr = lang === 'fr';
  const R = compact ? 26 : 42;
  const dir = side === 'left' ? -1 : 1;

  return (
    <div className={`absolute ${compact ? 'top-[16%] bottom-[14%]' : 'top-[14%] bottom-[12%]'} flex flex-col justify-around ${side === 'left' ? 'items-start' : 'items-end'} pointer-events-none`}
      style={{ [side]: compact ? 8 : '3%', width: compact ? R * 2 + 4 : '23%' } as React.CSSProperties}>
      {products.map((p, i) => {
        const k = offset + i;
        const start = 0.1 + k * 0.045; // seuil de progression à partir duquel l'élément apparaît
        const reveal = `clamp(0, calc((var(--p, 0) - ${start}) * 14), 1)`;
        // Décalage horizontal sinusoïdal : la colonne ondule comme le ruban des services
        const sway = Math.sin(i * 1.5 + (side === 'left' ? 0 : Math.PI)) * (compact ? 6 : 26);
        const price = p.price > 0 ? `${p.price.toLocaleString()} ${p.currency ?? ''}`.trim() : '';
        return (
          <div key={p.id} className="hero-deck-item pointer-events-auto"
            style={{
              opacity: reveal as unknown as number,
              transform: `translate(calc((1 - ${reveal}) * ${dir * 70}px + ${sway}px), calc(var(--p, 0) * -${36 + (k % 3) * 14}px))`,
            }}>
            <button type="button" onClick={() => onOpen(p)}
              aria-label={`${fr ? 'Voir' : 'View'} ${p.name}`}
              className={`group flex items-center gap-3 text-left focus-visible:outline-none ${side === 'right' ? 'flex-row-reverse text-right' : ''}`}>
              {/* Médaillon */}
              <span className="relative shrink-0 rounded-full transition-transform duration-300 group-hover:scale-105 group-focus-visible:ring-4 group-focus-visible:ring-white/40"
                style={{ width: R * 2, height: R * 2, boxShadow: `0 10px 28px color-mix(in srgb, ${style.accent} 40%, transparent)` }}>
                <span className="wave-spin absolute inset-0 rounded-full" style={{ background: `conic-gradient(${style.accent}, ${style.rim}, ${style.accent})` }} />
                <span className="absolute rounded-full overflow-hidden flex items-center justify-center" style={{ inset: 3, background: '#0b0b12' }}>
                  {p.image_url || p.images?.[0]
                    ? <img src={p.image_url || p.images[0]} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover" />
                    : <ShoppingBag size={compact ? 18 : 26} aria-hidden style={{ color: style.accent }} />}
                </span>
              </span>
              {/* Carte à bord ondulé (écrans larges) */}
              {!compact && (
                <span className="relative min-w-0 flex-1 max-w-[190px] rounded-2xl overflow-hidden transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{ background: 'rgba(8,8,18,0.55)', border: `1px solid ${style.chip}`, backdropFilter: 'blur(10px)' }}>
                  <svg className="absolute inset-x-0 top-0 w-full" style={{ height: 22 }} viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true">
                    <path d={edge} fill={`color-mix(in srgb, ${style.accent} 26%, transparent)`} />
                  </svg>
                  <span className="relative block px-3 pt-4 pb-2.5">
                    <span className="block text-[13px] font-bold leading-snug truncate" style={{ color: style.ink }}>{p.name}</span>
                    {price && <span className="block mt-0.5 text-sm font-black tabular-nums" style={{ color: style.accent }}>{price}</span>}
                  </span>
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
