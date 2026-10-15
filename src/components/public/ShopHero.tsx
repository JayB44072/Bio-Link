import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import type { Product } from '../../lib/types';
import type { HeroStyle } from '../../lib/heroStyles';

const COPY = {
  fr: { cta: 'Voir les produits', products: (n: number) => `${n} produit${n > 1 ? 's' : ''}`, tag: 'Découvrez ma sélection du moment.', all: 'Tout' },
  en: { cta: 'Shop now', products: (n: number) => `${n} product${n > 1 ? 's' : ''}`, tag: 'Discover my current selection.', all: 'All' },
  pt: { cta: 'Ver produtos', products: (n: number) => `${n} produto${n > 1 ? 's' : ''}`, tag: 'Descubra a minha seleção do momento.', all: 'Tudo' },
  de: { cta: 'Produkte ansehen', products: (n: number) => `${n} Produkt${n > 1 ? 'e' : ''}`, tag: 'Entdecke meine aktuelle Auswahl.', all: 'Alle' },
} as const;

interface Photo { url: string; name: string; price: string }

interface ShopHeroProps {
  style: HeroStyle;
  shopName: string;
  bio?: string;
  logoUrl?: string;
  products: Product[];
  categories?: string[];
  lang: string;
  /** Appelé par le bouton principal (défilement vers la liste des produits). */
  onCta: () => void;
  onCategory?: (category: string | null) => void;
}

const lab = (l: { fr: string; en: string; pt?: string; de?: string }, lang: string) =>
  (l as Record<string, string | undefined>)[lang] ?? l.en;

interface VisualProps {
  photo?: Photo;
  shape?: string;
  className?: string;
  s: HeroStyle;
  logoUrl?: string;
  initial: string;
}

/** Photo remplie, ou à défaut le logo / l'initiale de la boutique. (Hors du composant : identité stable entre les rendus.) */
function Visual({ photo, shape, className = '', s, logoUrl, initial }: VisualProps) {
  return (
    <div className={`${className.includes('absolute') ? '' : 'relative '}overflow-hidden ${className}`} style={{ borderRadius: shape ?? s.photoShape ?? '20px', background: photo ? 'rgba(0,0,0,0.08)' : s.accent }}>
      {photo ? (
        <img src={photo.url} alt={photo.name} loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover" />
      ) : logoUrl ? (
        <img src={logoUrl} alt="" loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-contain p-4" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-black" style={{ color: s.buttonInk }}>{initial}</span>
      )}
    </div>
  );
}
/** Hero d'une boutique : mêmes données pour tous les thèmes, mise en page propre à chacun. */
export default function ShopHero({ style: s, shopName, bio, logoUrl, products, categories = [], lang, onCta, onCategory }: ShopHeroProps) {
  const c = COPY[(lang in COPY ? lang : 'en') as keyof typeof COPY];
  const sub = (bio ?? '').trim().slice(0, 140) || c.tag;
  const locale = lang === 'fr' ? 'fr-FR' : 'en-US';

  const photos: Photo[] = useMemo(
    () => products
      .map(p => ({ p, url: p.image_url || p.images?.[0] || '' }))
      .filter(x => x.url)
      .sort((a, b) => (b.p.avg_rating || 0) - (a.p.avg_rating || 0))
      .slice(0, 4)
      .map(({ p, url }) => ({ url, name: p.name, price: `${Number(p.price).toLocaleString(locale)} ${p.currency ?? ''}`.trim() })),
    [products, locale],
  );

  const rated = products.filter(p => (p.ratings_count ?? 0) > 0);
  const rating = rated.length ? rated.reduce((t, p) => t + (p.avg_rating || 0), 0) / rated.length : 0;

  // Diaporama (layout « carousel ») : fixe si l'utilisateur préfère moins d'animations
  const [slide, setSlide] = useState(0);
  const animate = photos.length > 1 && s.layout === 'carousel'
    && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (!animate) return;
    const id = window.setInterval(() => setSlide(i => (i + 1) % photos.length), 3600);
    return () => window.clearInterval(id);
  }, [animate, photos.length]);

  const vp = { s, logoUrl, initial: (shopName.trim()[0] ?? '•').toUpperCase() };


  const chips = (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(127,127,127,0.18)', color: s.ink }}>{c.products(products.length)}</span>
      {rating > 0 && (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1" style={{ background: 'rgba(127,127,127,0.18)', color: s.ink }}>
          <Star size={11} fill="currentColor" /> {rating.toFixed(1)}
        </span>
      )}
    </div>
  );

  const cta = (
    <button type="button" onClick={onCta}
      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ background: s.button, color: s.buttonInk, boxShadow: '0 6px 18px rgba(0,0,0,0.18)' }}>
      {c.cta} <ArrowRight size={15} />
    </button>
  );

  const eyebrow = (
    <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: s.muted }}>{lab(s.eyebrow, lang)}</p>
  );

  const text = (align: 'left' | 'center' = 'left') => (
    <div className={align === 'center' ? 'text-center flex flex-col items-center' : ''}>
      {eyebrow}
      <h2 className="text-2xl sm:text-3xl font-black leading-tight mt-1 break-words" style={{ color: s.ink }}>{shopName}</h2>
      <p className="text-sm mt-2 leading-relaxed max-w-md" style={{ color: s.muted }}>{sub}</p>
      {chips}
      {cta}
    </div>
  );

  let body: JSX.Element;
  switch (s.layout) {
    case 'editorial':
      body = (
        <div className="p-6">
          <div className="flex items-center gap-3">{eyebrow}<span className="flex-1 h-px" style={{ background: s.ink, opacity: 0.25 }} /></div>
          <h2 className="mt-3 text-3xl sm:text-5xl font-light uppercase tracking-tight leading-none break-words" style={{ color: s.ink }}>{shopName}</h2>
          <p className="text-sm mt-3 max-w-md" style={{ color: s.muted }}>{sub}</p>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-5">
              {photos.slice(0, 3).map((ph, i) => <Visual {...vp} key={i} photo={ph} shape="2px" className="aspect-[3/4]" />)}
            </div>
          )}
          <div className="flex items-center justify-between gap-3 mt-4">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: s.muted }}>{c.products(products.length)}</span>
            <button type="button" onClick={onCta} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest pb-0.5 focus-visible:outline-none focus-visible:ring-2" style={{ color: s.ink, borderBottom: `1.5px solid ${s.ink}` }}>
              {c.cta} <ArrowRight size={13} />
            </button>
          </div>
        </div>
      );
      break;

    case 'circle':
      body = (
        <div className="p-6 flex flex-col items-center text-center">
          <div className="p-1.5 rounded-full" style={{ boxShadow: `0 0 0 1px ${s.accent}, 0 0 38px rgba(201,169,110,0.25)` }}>
            <Visual {...vp} photo={photos[0]} shape="9999px" className="w-36 h-36" />
          </div>
          <div className="mt-4">{text('center')}</div>
        </div>
      );
      break;

    case 'carousel': {
      const cur = photos[slide % Math.max(photos.length, 1)];
      body = (
        <div className="p-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">{text()}</div>
          <div className="relative flex-[0_0_38%] max-w-[300px] aspect-[3/4]" aria-hidden={photos.length === 0}>
            {photos.length ? photos.map((ph, i) => (
              <Visual {...vp} key={ph.url + i} photo={ph} shape="18px" className={`absolute inset-0 transition-opacity duration-700 ${i === slide % photos.length ? 'opacity-100' : 'opacity-0'}`} />
            )) : <Visual {...vp} shape="18px" className="absolute inset-0" />}
            {cur && (
              <span className="absolute left-2 bottom-2 right-2 flex items-center justify-between gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.88)', color: '#111' }}>
                <span className="truncate">{cur.name}</span><span className="shrink-0">{cur.price}</span>
              </span>
            )}
          </div>
        </div>
      );
      break;
    }

    case 'polaroid': {
      const tilts = [-7, 3, -3];
      body = (
        <div className="p-5">
          {text()}
          <div className="flex justify-center -space-x-6 mt-5 pb-1">
            {Array.from({ length: Math.max(1, Math.min(3, photos.length)) }, (_, i) => i).map(i => (
              <div key={i} className="w-28 p-1.5 pb-6 bg-white shadow-lg shrink-0" style={{ transform: `rotate(${tilts[i]}deg)`, zIndex: i === 1 ? 2 : 1 }}>
                <Visual {...vp} photo={photos[i]} shape="1px" className="aspect-square" />
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }

    case 'market':
      body = (
        <div className="p-5">
          {eyebrow}
          <h2 className="text-2xl sm:text-3xl font-black leading-tight mt-1 break-words" style={{ color: s.ink }}>{shopName}</h2>
          <p className="text-sm mt-2 max-w-md" style={{ color: s.muted }}>{sub}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {[null, ...categories.slice(0, 5)].map(cat => (
              <button key={cat ?? 'all'} type="button" onClick={() => { onCategory?.(cat); onCta(); }}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2"
                style={{ background: 'rgba(255,255,255,0.16)', color: s.ink, border: '1px solid rgba(255,255,255,0.35)' }}>
                {cat ?? c.all}
              </button>
            ))}
          </div>
          {chips}
        </div>
      );
      break;

    case 'duo':
      body = (
        <div className="flex flex-wrap items-stretch" style={{ minHeight: 170 }}>
          <div className="flex-[2_1_120px] min-h-[150px] relative" style={{ background: s.accent }}>
            {photos[0] && <img src={photos[0].url} alt={photos[0].name} loading="lazy" draggable={false} className="absolute inset-0 w-full h-full object-cover" />}
          </div>
          <div className="flex-[3_1_170px] flex flex-col items-center justify-center text-center px-4 py-6">
            <h2 className="text-4xl font-black tracking-wider" style={{ color: s.ink }}>SHOP</h2>
            <p className="text-xs mt-1.5" style={{ color: s.muted }}>{shopName} • {lab(s.eyebrow, lang)}</p>
            {cta}
          </div>
        </div>
      );
      break;

    default: // split
      body = (
        <div className="p-5 flex items-center gap-4">
          <div className="flex-1 min-w-0">{text()}</div>
          <div className="relative flex-[0_0_34%] max-w-[240px] mr-1">
            <Visual {...vp} photo={photos[0]} className="aspect-[4/5] w-full" />
            {photos[1] && (
              <div className="absolute -left-4 -bottom-3 w-[42%] p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.9)', boxShadow: '0 8px 22px rgba(0,0,0,0.2)' }}>
                <Visual {...vp} photo={photos[1]} shape="14px" className="aspect-square" />
              </div>
            )}
          </div>
        </div>
      );
  }

  return (
    <section className="w-full overflow-hidden mb-6" style={{ background: s.bg, borderRadius: s.radius }} aria-label={shopName}>
      {body}
    </section>
  );
}
