import { useMemo, useRef, useState } from 'react';
import { ArrowRight, ChevronsDown } from 'lucide-react';
import type { Hero3DStyle } from '../../lib/planLimits';
import type { Product } from '../../lib/types';
import { scrollPhase, scrollTimeline } from '../../lib/product3d/timeline';
import { lowBandwidth } from '../../lib/product3d/env';
import { useHeroEngine } from '../../lib/product3d/useHeroEngine';
import { useScrollProgress } from '../../lib/useScrollProgress';
import { useElementWidth } from '../../lib/useElementWidth';
import StageBackdrop from './StageBackdrop';
import HeroProductDeck from './HeroProductDeck';

/** Hauteur de l'en-tête collant de la boutique : la scène se fige juste dessous. */
const STICKY_OFFSET = 60;

const COPY = {
  fr: { scroll: 'Faites défiler', cta: 'Découvrir la collection', outro: 'Tout est là. À vous de choisir.', parts: (n: number) => `${n} pièces` },
  en: { scroll: 'Scroll', cta: 'Explore the collection', outro: 'Everything is here. Your move.', parts: (n: number) => `${n} parts` },
  pt: { scroll: 'Role para baixo', cta: 'Descobrir a coleção', outro: 'Está tudo aqui. A escolha é sua.', parts: (n: number) => `${n} peças` },
  de: { scroll: 'Scrollen', cta: 'Kollektion entdecken', outro: 'Alles ist da. Du entscheidest.', parts: (n: number) => `${n} Teile` },
} as const;

interface ProductHeroScrollProps {
  modelId: string | null;
  style: Hero3DStyle;
  lang: string;
  shopName: string;
  /** Propriétaire des photos du héros (photo du vendeur sur le produit). */
  ownerId?: string | null;
  /** Appelé par le bouton final (défilement vers la liste des produits). */
  onCta: () => void;
  /** Produits de la boutique : leurs photos s'affichent sur les côtés pendant que l'objet se décompose. */
  products?: Product[];
  onOpenProduct?: (product: Product) => void;
}

/**
 * Hero « Cinéma », plein écran : la scène reste collée à l'écran pendant que le défilement pilote l'animation —
 * le produit tourne, s'éclate, chaque pièce est présentée avec sa légende, puis il se recompose.
 */
export default function ProductHeroScroll({ modelId, style, lang, shopName, ownerId, onCta, products = [], onOpenProduct }: ProductHeroScrollProps) {
  const copy = COPY[(lang in COPY ? lang : 'en') as keyof typeof COPY];
  const l = lang === 'fr' ? 'fr' : 'en';
  const trackRef = useRef<HTMLElement>(null);
  const withPhoto = useMemo(
    () => products.filter(p => p.image_url || p.images?.[0]).sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0)).slice(0, 6),
    [products],
  );
  const leftProducts = withPhoto.filter((_, i) => i % 2 === 0);
  const rightProducts = withPhoto.filter((_, i) => i % 2 === 1);
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'intro' | 'parts' | 'outro'>('intro');
  const skip3d = useMemo(() => lowBandwidth(), []);

  const { progress, viewportHeight } = useScrollProgress(trackRef, {
    stickyOffset: STICKY_OFFSET,
    onProgress: p => {
      // Variable CSS lue par les calques (fondu du titre, indice de défilement) : aucun rendu React par image
      stageRef.current?.style.setProperty('--p', p.toFixed(4));
      setPhase(scrollPhase(p));
    },
  });

  const { meta, groups, step, unavailable } = useHeroEngine({
    mountRef, modelId, accent: style.accent, rim: style.rim, ownerId, enabled: !skip3d,
    makeFrame: count => { const tl = scrollTimeline(count); return () => tl(progress.current); },
    // Produit en relief (photo) : rotation limitée, un objet plat vu de profil disparaîtrait
    makeYaw: loaded => () => (loaded.yaw ? loaded.yaw(progress.current) : -0.75 + progress.current * 2.6),
  });
  const fallback = skip3d || unavailable;
  const stageWidth = useElementWidth(stageRef, 1000);
  const compactDeck = stageWidth < 700;

  // Plein écran : toute la hauteur visible sous l'en-tête
  const stageHeight = Math.round(Math.min(1000, Math.max(420, viewportHeight - STICKY_OFFSET)));
  // Chaque pièce dispose d'un peu moins d'un écran de défilement, plus l'ouverture et la conclusion
  const trackHeight = fallback ? undefined : Math.round(stageHeight * (1 + groups.length * 0.85 + 1.6));

  const productName = meta.name[l];
  const partLabel = step >= 0 && step < groups.length ? meta.parts[groups[step]]?.[l] ?? null : null;  const fade = 'clamp(0, calc(1 - var(--p, 0) * 9), 1)';

  if (fallback) {
    // Sans 3D : bandeau statique, aucune piste de défilement
    return (
      <section className="relative w-full overflow-hidden px-6 py-14 text-center" style={{ background: style.stage }} aria-label={shopName}>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: style.muted }}>{productName}</p>
        <h2 className="text-3xl font-black mt-1 break-words" style={{ color: style.ink }}>{shopName}</h2>
        <p className="text-sm mt-3" style={{ color: style.muted }}>{Object.values(meta.parts).map(p => p[l]).join(' · ')}</p>
        <button type="button" onClick={onCta} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold"
          style={{ background: style.accent, color: '#fff' }}>{copy.cta} <ArrowRight size={15} /></button>
      </section>
    );
  }

  return (
    <section ref={trackRef} className="relative w-full" style={{ height: trackHeight }} aria-label={`${shopName} — ${productName}`}>
      <div ref={stageRef} className="sticky overflow-hidden" style={{ top: STICKY_OFFSET, height: stageHeight, background: style.stage, ['--p' as string]: 0 }}>
        <StageBackdrop accent={style.accent} rim={style.rim} progress={progress} />

        {/* Lumière de scène : projecteur au centre, vignettage sur les bords */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(60% 45% at 50% 55%, color-mix(in srgb, ${style.rim} 18%, transparent), transparent 70%), radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)` }} />

        {/* Zone 3D : laisse la place du titre d'ouverture en haut et de l'indice de défilement en bas */}
        <div ref={mountRef} className="absolute inset-x-0 top-[22%] bottom-[8%]" />

        {/* Produits sur les côtés : ils apparaissent pendant que l'objet se décompose */}
        {onOpenProduct && withPhoto.length > 0 && (
          <>
            <HeroProductDeck products={leftProducts} side="left" compact={compactDeck} style={style} lang={lang} onOpen={onOpenProduct} offset={0} />
            <HeroProductDeck products={rightProducts} side="right" compact={compactDeck} style={style} lang={lang} onOpen={onOpenProduct} offset={1} />
          </>
        )}
        {/* Onde lumineuse à chaque nouvelle pièce */}
        {step >= 0 && (
          <span key={`ring-${step}`} className="cinema-ring absolute left-1/2 top-[52%] w-56 h-56 rounded-full pointer-events-none"
            style={{ border: `2px solid ${style.accent}` }} />
        )}
        {/* Ouverture : titre immense qui s'efface dès qu'on défile */}
        <div className="absolute inset-x-0 top-[9%] px-6 text-center pointer-events-none"
          style={{ opacity: fade, transform: 'translateY(calc(var(--p, 0) * -70px))' }}>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em]" style={{ color: style.muted }}>{productName}</p>
          <h2 className="mt-2 text-5xl sm:text-7xl md:text-8xl font-black leading-[0.92] tracking-tight break-words" style={{ color: style.ink }}>{shopName}</h2>
        </div>
        <div className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-1 pointer-events-none" style={{ opacity: fade }}>
          <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: style.muted }}>{copy.scroll}</span>
          <ChevronsDown size={20} className="cinema-bob" style={{ color: style.accent }} />
        </div>

        {/* Pièce présentée : grand numéro et nom */}
        {phase === 'parts' && partLabel && (
          <div key={step} className="cinema-in absolute left-6 bottom-8 right-16 pointer-events-none">
            <span className="block text-6xl sm:text-7xl font-black leading-none tabular-nums" style={{ color: style.accent, opacity: 0.9 }}>
              {String(step + 1).padStart(2, '0')}
            </span>
            <span className="block mt-1 text-2xl sm:text-3xl font-black leading-tight" style={{ color: style.ink }}>{partLabel}</span>
            <span className="block text-xs font-semibold mt-1" style={{ color: style.muted }}>{productName} · {copy.parts(groups.length)}</span>
          </div>
        )}

        {/* Rail de progression */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none" aria-hidden="true">
          {groups.map((k, i) => (
            <span key={k} className="w-1.5 rounded-full transition-all duration-300"
              style={{ height: step === i ? 26 : 8, background: step === i ? style.accent : style.chip }} />
          ))}
        </div>

        {/* Conclusion : appel à l'action */}
        {phase === 'outro' && (
          <div className="cinema-in absolute inset-x-0 bottom-0 px-6 pb-8 pt-24 text-center"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 35%, transparent)' }}>
            <p className="text-lg sm:text-xl font-black" style={{ color: style.ink }}>{copy.outro}</p>
            <button type="button" onClick={onCta}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ background: style.accent, color: '#fff', boxShadow: `0 10px 30px color-mix(in srgb, ${style.accent} 45%, transparent)` }}>
              {copy.cta} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
