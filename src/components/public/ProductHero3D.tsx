import { useMemo, useRef } from 'react';
import type { Hero3DStyle } from '../../lib/planLimits';
import { loopTimeline } from '../../lib/product3d/timeline';
import { lowBandwidth, prefersReducedMotion } from '../../lib/product3d/env';
import { useHeroEngine } from '../../lib/product3d/useHeroEngine';

interface ProductHero3DProps {
  modelId: string | null;
  style: Hero3DStyle;
  lang: string;
  /** Nom de la boutique, affiché en légende. */
  shopName?: string;
  /** Propriétaire des photos du héros (photo du vendeur sur le produit). */
  ownerId?: string | null;
}

/** Héros de boutique : un produit 3D qui se décompose en pièces, présentées une à une. */
export default function ProductHero3D({ modelId, style, lang, shopName, ownerId }: ProductHero3DProps) {
  const l = lang === 'fr' ? 'fr' : 'en';
  const mountRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useMemo(() => prefersReducedMotion(), []);
  const skip3d = useMemo(() => lowBandwidth(), []);

  const { meta, groups, step, unavailable } = useHeroEngine({
    mountRef, modelId, accent: style.accent, rim: style.rim, ownerId, enabled: !skip3d, reducedMotion,
    makeFrame: count => { const tl = loopTimeline(count); return time => tl(time); },
  });

  const productName = meta.name[l];
  const partLabel = step >= 0 && step < groups.length ? meta.parts[groups[step]]?.[l] ?? null : null;
  const fallback = skip3d || unavailable;

  return (
    <section
      className="relative w-full overflow-hidden rounded-3xl mb-6 select-none"
      style={{ background: style.stage, height: 'clamp(300px, 52vw, 420px)' }}
      aria-label={l === 'fr' ? `Présentation 3D : ${productName}` : `3D showcase: ${productName}`}
    >
      {/* La scène laisse libres le bandeau du titre (haut) et la légende (bas) */}
      {!fallback && <div ref={mountRef} className="absolute inset-x-0 top-14 bottom-14" />}

      <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-3 pointer-events-none">
        <div className="min-w-0">
          {shopName && (
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] truncate" style={{ color: style.muted }}>{shopName}</p>
          )}
          <h2 className="text-lg sm:text-2xl font-black leading-tight" style={{ color: style.ink }}>{productName}</h2>
        </div>
        <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: style.chip, color: style.ink }}>
          {l === 'fr' ? `${groups.length} pièces` : `${groups.length} parts`}
        </span>
      </div>

      {fallback && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <p className="text-sm font-semibold" style={{ color: style.muted }}>
            {Object.values(meta.parts).map(p => p[l]).join(' · ')}
          </p>
        </div>
      )}

      {!fallback && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center gap-2 pointer-events-none" aria-live="polite">
          <div className="h-7 flex items-center">
            {partLabel && (
              <span key={step} className="text-xs font-bold px-3.5 py-1.5 rounded-full backdrop-blur-sm"
                style={{ background: style.chip, color: style.ink }}>
                {step + 1}/{groups.length} · {partLabel}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {groups.map((k, i) => (
              <span key={k} className="h-1 rounded-full transition-all duration-300"
                style={{ width: step === i ? 20 : 6, background: step === i ? style.accent : style.chip }} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
