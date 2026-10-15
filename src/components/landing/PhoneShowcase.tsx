import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Heart, MessageCircle, Plus, ShoppingBag, Star } from 'lucide-react';
import { BRAND } from '../../lib/theme';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import type { LandingLang } from '../../lib/landingTranslations';
import { THEMES, SHOP_THEMES } from '../../lib/planLimits';
import { PART_ORDER } from '../auth/shoe/buildShoe';
import { startShoeEngine } from '../auth/shoe/shoeEngine';
import { renderColorwaySnapshots } from '../auth/shoe/shoeSnapshots';
import { SHOE_COPY } from '../auth/shoe/shoeCopy';

/* ── Chronologie (secondes) du défilement dans le téléphone ── */
const T_HOLD = 1.3;       // chaussure assemblée
const T_STAGE = 8.5;      // défilement : la chaussure se décompose
const T_PAUSE = 0.4;
const T_CARDS = 3.6;      // défilement jusqu'aux cartes
const T_SHOW = 2.8;       // cartes affichées
const T_BACK = 1.9;       // retour en haut
const T_LOOP = T_HOLD + T_STAGE + T_PAUSE + T_CARDS + T_SHOW + T_BACK;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const smoothSine = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(x));

/** Pièces mises en avant pendant la décomposition (indices dans PART_ORDER). */
const SHOWN_STEPS = [0, 1, 3, 5, 6];

/* ── Contenu du site de démonstration ── */
interface ShopCopy {
  shop: string; kicker: string; headline: string; hint: string;
  collection: string; models: string; isNew: string; whatsapp: string; add: string; theme: string;
}
const SHOP_COPY: Record<LandingLang, ShopCopy> = {
  fr: { shop: 'Awa Kicks', kicker: 'Collection 2026', headline: 'Nos baskets, pièce par pièce', hint: 'Fais défiler pour découvrir', collection: 'La collection', models: '5 modèles', isNew: 'Nouveau', whatsapp: 'Commander sur WhatsApp', add: 'Ajouter', theme: 'Thème' },
  en: { shop: 'Awa Kicks', kicker: '2026 collection', headline: 'Our sneakers, piece by piece', hint: 'Scroll to explore', collection: 'The collection', models: '5 models', isNew: 'New', whatsapp: 'Order on WhatsApp', add: 'Add', theme: 'Theme' },
  pt: { shop: 'Awa Kicks', kicker: 'Coleção 2026', headline: 'Os nossos ténis, peça a peça', hint: 'Desliza para descobrir', collection: 'A coleção', models: '5 modelos', isNew: 'Novo', whatsapp: 'Encomendar no WhatsApp', add: 'Adicionar', theme: 'Tema' },
  de: { shop: 'Awa Kicks', kicker: 'Kollektion 2026', headline: 'Unsere Sneaker, Teil für Teil', hint: 'Scrollen zum Entdecken', collection: 'Die Kollektion', models: '5 Modelle', isNew: 'Neu', whatsapp: 'Per WhatsApp bestellen', add: 'Hinzufügen', theme: 'Theme' },
};

const PRODUCTS = [
  { key: 'violet', name: 'Pulse Violet', price: 35000, tint: '#ECEAFF', dot: BRAND.violet },
  { key: 'noir',   name: 'Noir Total',   price: 42500, tint: '#E9E9EF', dot: '#2b2b36' },
  { key: 'sable',  name: 'Dune Sable',   price: 38000, tint: '#F3EBDD', dot: '#b88a4a' },
  { key: 'corail', name: 'Corail Vif',   price: 39500, tint: '#FFE9E2', dot: '#ff7a59' },
  { key: 'ciel',   name: 'Ciel Léger',   price: 36000, tint: '#E2F4FF', dot: BRAND.cyan },
] as const;

/** Couleur d'accent d'un thème de boutique (accent explicite, sinon première couleur du dégradé du bouton). */
const accentOf = (th: { accentColor?: string; buttonGradient: string }) =>
  th.accentColor ?? th.buttonGradient.match(/#[0-9a-fA-F]{6}/)?.[0] ?? BRAND.violet;

const fcfa = (n: number) => n.toLocaleString('fr-FR');
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Position de défilement (px) à l'instant t de la boucle. */
function scrollAt(t: number, stageLen: number, maxScroll: number) {
  let c = t % T_LOOP;
  if (c < T_HOLD) return 0;
  c -= T_HOLD;
  if (c < T_STAGE) return stageLen * smoothSine(c / T_STAGE);
  c -= T_STAGE;
  if (c < T_PAUSE) return stageLen;
  c -= T_PAUSE;
  if (c < T_CARDS) return stageLen + (maxScroll - stageLen) * easeInOut(c / T_CARDS);
  c -= T_CARDS;
  if (c < T_SHOW) return maxScroll;
  c -= T_SHOW;
  return maxScroll * (1 - easeInOut(clamp01(c / T_BACK)));
}

/**
 * Téléphone de la landing : un petit site de vente défile à l'intérieur.
 * La chaussure 3D du haut se décompose au fil du défilement, puis les produits apparaissent en cartes.
 */
export default function PhoneShowcase() {
  const { lang, isDark, t: lt } = useAppPrefs();
  const themeHint = lt.themeHint;
  const shop = SHOP_COPY[lang] ?? SHOP_COPY.fr;
  const parts = (SHOE_COPY[lang] ?? SHOE_COPY.fr).parts;

  const screenRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stageMountRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1);
  const [showCards, setShowCards] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [webgl, setWebgl] = useState(true);
  const [screenH, setScreenH] = useState(540);
  const [themeId, setThemeId] = useState('default');
  const elapsedRef = useRef(0);
  const holdUntil = useRef(0);
  const jumping = useRef(false);
  const th = SHOP_THEMES[themeId] ?? SHOP_THEMES.default;
  const accent = accentOf(th);
  const themeLabel = (THEMES.find(x => x.id === themeId)?.label ?? { fr: 'Standard', en: 'Standard' })[lang === 'fr' ? 'fr' : 'en'];
  const reduced = useMemo(prefersReducedMotion, []);

  // Hauteur réelle de l'écran (la section « scène » et la distance de défilement en dépendent)
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const update = () => setScreenH(el.clientHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const stageLen = Math.round(screenH * 1.6);

  // Visuels produits : la même chaussure 3D, rendue dans plusieurs coloris
  useEffect(() => {
    setImages(renderColorwaySnapshots(PRODUCTS.map(p => p.key)));
  }, []);

  // Chaussure 3D, pilotée par la position de défilement
  useEffect(() => {
    const mount = stageMountRef.current;
    const scroller = scrollerRef.current;
    if (!mount || !scroller) return;
    return startShoeEngine(mount, {
      frame: () => {
        const p = clamp01(scroller.scrollTop / stageLen);
        const explode = easeInOut(clamp01((p - 0.05) / 0.35));
        if (titleRef.current) titleRef.current.style.opacity = String(1 - clamp01(p / 0.12));
        let s = -1;
        if (p > 0.45) s = SHOWN_STEPS[Math.min(SHOWN_STEPS.length - 1, Math.floor(clamp01((p - 0.45) / 0.55) * SHOWN_STEPS.length))];
        return { explode, step: s };
      },
      onStep: setStep,
      onUnavailable: () => setWebgl(false),
      reducedMotion: reduced,
    });
  }, [stageLen, reduced]);

  // Défilement automatique en boucle
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || reduced) return;
    let raf = 0;
    let running = false;
    let visible = true;
    let prev = performance.now();
    const CARDS_AT = T_HOLD + T_STAGE + T_PAUSE + T_CARDS;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      // Après un choix de thème, on reste sur les cartes quelques secondes
      if (now < holdUntil.current) elapsedRef.current = Math.max(elapsedRef.current, CARDS_AT);
      else elapsedRef.current += dt;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const target = scrollAt(elapsedRef.current, stageLen, max);
      let y = target;
      if (jumping.current) {
        y = scroller.scrollTop + (target - scroller.scrollTop) * 0.14;
        if (Math.abs(target - y) < 2) jumping.current = false;
      }
      scroller.scrollTop = y;
      setShowCards(prevShow => {
        const next = y > stageLen + 24;
        return prevShow === next ? prevShow : next;
      });
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || !visible || document.hidden) return;
      running = true;
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    start();
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(scroller);
    return () => { stop(); io.disconnect(); document.removeEventListener('visibilitychange', onVis); };
  }, [stageLen, reduced]);

  const activePart = step >= 0 ? parts[PART_ORDER[step]] : null;
  const light = showCards;
  const pickTheme = (id: string) => {
    setThemeId(id);
    elapsedRef.current = T_HOLD + T_STAGE + T_PAUSE + T_CARDS;
    holdUntil.current = performance.now() + 9000;
    jumping.current = true;
  };
  const pageBg = th.pageBgLight ?? '#F4F4F8';
  const cardBg = th.cardBgLight ?? '#ffffff';
  const text = th.textColorLight ?? '#15142B';
  const sub = th.subtextColorLight ?? '#5b5a72';

  return (
    <div data-ui className="relative mx-auto w-[285px] sm:w-[300px] shrink-0">
      <div className="rounded-[2.6rem] bg-[#15142B] p-2.5 shadow-[0_30px_60px_-20px_rgba(21,20,43,0.45)]">
        <div ref={screenRef} className="relative h-[560px] overflow-hidden rounded-[2.1rem] isolate transition-colors duration-500" style={{ background: th.pageBg }}>

          {/* Barre du site (fixe en haut de l'écran) */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-6 pb-2.5 transition-colors duration-500"
            style={{ background: light ? (th.headerBgLight ?? 'rgba(255,255,255,0.96)') : 'rgba(0,0,0,0)' }}>
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold text-white transition-colors duration-500" style={{ background: accent }}>A</span>
              <span className="text-[13px] font-bold tracking-tight transition-colors duration-500" style={{ color: light ? text : '#fff' }}>{shop.shop}</span>
            </div>
            <span className="relative transition-colors duration-500" style={{ color: light ? text : '#fff' }}>
              <ShoppingBag size={18} aria-hidden />
              <span className="absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] font-bold text-white" style={{ background: accent }}>2</span>
            </span>
          </div>

          {/* Notch */}
          <div className="absolute left-1/2 top-1.5 z-30 h-1.5 w-16 -translate-x-1/2 rounded-full bg-black/80" />

          {/* Contenu qui défile */}
          <div ref={scrollerRef} className="absolute inset-0 overflow-hidden" aria-hidden>
            {/* Scène 3D : reste en place pendant que la chaussure se décompose */}
            <div style={{ height: screenH + stageLen }}>
              <div className="sticky top-0 overflow-hidden"
                style={{ height: screenH, background: `radial-gradient(120% 80% at 50% 45%,${th.cardBg} 0%,${th.pageBg} 62%)` }}>
                <div ref={stageMountRef} className="absolute inset-0" />
                <div ref={titleRef} className="relative z-10 px-5 pt-[68px]">
                  <p className="text-[11px] font-medium text-white/60">{shop.kicker}</p>
                  <h3 className="mt-1 max-w-[190px] text-[19px] font-bold leading-tight text-white">{shop.headline}</h3>
                </div>
                <div className="absolute inset-x-0 bottom-5 z-10 px-5">
                  {activePart ? (
                    <div key={step} className="animate-fade-in rounded-xl bg-white/10 px-3.5 py-2.5 backdrop-blur-sm">
                      <p className="text-[13px] font-bold text-white">{activePart.title}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-white/75">{activePart.text}</p>
                    </div>
                  ) : (
                    <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/70">
                      {shop.hint}<ChevronDown size={13} aria-hidden />
                    </p>
                  )}
                </div>
                {!webgl && (
                  <div className="absolute inset-0 grid place-items-center">
                    <ShoppingBag size={64} className="text-white/20" aria-hidden />
                  </div>
                )}
              </div>
            </div>

            {/* Collection (habillée par le thème choisi) */}
            <div className="px-3.5 pb-24 pt-5 transition-colors duration-500" style={{ background: pageBg }}>
              <div className="mb-3 flex items-end justify-between px-0.5">
                <h3 className="text-[17px] font-bold" style={{ color: text }}>{shop.collection}</h3>
                <span className="text-[11px]" style={{ color: sub }}>{shop.models}</span>
              </div>

              {/* Produit mis en avant */}
              <div className={`p-2.5 transition-all duration-700 ${th.cardRadius}`}
                style={{ background: cardBg, border: `1px solid ${th.cardBorderLight ?? 'transparent'}`, boxShadow: th.cardShadow || '0 1px 3px rgba(0,0,0,0.06)', opacity: showCards ? 1 : 0, transform: showCards ? 'none' : 'translateY(26px)' }}>
                <div className={`relative grid aspect-[4/3] place-items-center ${th.imageRadius}`} style={{ background: PRODUCTS[0].tint }}>
                  {images.violet && <img src={images.violet} alt="" width={480} height={360} className="h-full w-full object-contain" />}
                  <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: accent }}>{shop.isNew}</span>
                  <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/90 text-[#15142B]"><Heart size={12} aria-hidden /></span>
                </div>
                <div className="mt-2.5 flex items-end justify-between px-0.5">
                  <div>
                    <p className="text-[13px] font-bold" style={{ color: text }}>{PRODUCTS[0].name}</p>
                    <p className="mt-0.5 flex items-center gap-0.5 text-[10px]" style={{ color: sub }}>
                      <Star size={10} fill="#E8A317" color="#E8A317" aria-hidden />4,9
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold tabular-nums" style={{ color: th.priceColor }}>{fcfa(PRODUCTS[0].price)} <span className="text-[10px] font-medium" style={{ color: sub }}>FCFA</span></p>
                    <span className="grid h-7 w-7 place-items-center rounded-full text-white" style={{ background: th.buttonGradient }} aria-label={shop.add}><Plus size={14} aria-hidden /></span>
                  </div>
                </div>
              </div>

              {/* Autres produits */}
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                {PRODUCTS.slice(1).map((p, i) => (
                  <div key={p.key} className={`p-2 transition-all duration-700 ${th.cardRadius}`}
                    style={{ background: cardBg, border: `1px solid ${th.cardBorderLight ?? 'transparent'}`, boxShadow: th.cardShadow || '0 1px 3px rgba(0,0,0,0.06)', opacity: showCards ? 1 : 0, transform: showCards ? 'none' : 'translateY(30px)', transitionDelay: showCards ? `${150 + i * 110}ms` : '0ms' }}>
                    <div className={`relative grid aspect-[4/3] place-items-center ${th.imageRadius}`} style={{ background: p.tint }}>
                      {images[p.key] && <img src={images[p.key]} alt="" width={480} height={360} className="h-full w-full object-contain" />}
                    </div>
                    <p className="mt-2 truncate px-0.5 text-[12px] font-bold" style={{ color: text }}>{p.name}</p>
                    <div className="mt-1 flex items-center justify-between px-0.5">
                      <p className="text-[12px] font-bold tabular-nums" style={{ color: th.priceColor }}>{fcfa(p.price)}</p>
                      <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.dot }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bouton WhatsApp du site */}
          <div className="absolute inset-x-0 bottom-0 z-20 px-3.5 pb-4 pt-6 transition-all duration-500"
            style={{ opacity: showCards ? 1 : 0, transform: showCards ? 'none' : 'translateY(16px)', background: `linear-gradient(to top,${pageBg} 55%,transparent)` }}>
            <div className="flex items-center justify-center gap-2 rounded-xl bg-[#1FA855] py-2.5 text-[12px] font-semibold text-white">
              <MessageCircle size={15} aria-hidden />{shop.whatsapp}
            </div>
          </div>
        </div>
      </div>

      {/* Choix du thème : habille la boutique du téléphone avec un vrai thème BioLinkWD */}
      <div className="mt-5 text-center">
        <p className="mb-2 text-xs font-medium" style={{ color: isDark ? '#a0a0c0' : '#6b7280' }}>{themeHint}</p>
        <div role="radiogroup" aria-label={themeHint} className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          {THEMES.map(item => {
            const cfg = SHOP_THEMES[item.id] ?? SHOP_THEMES.default;
            const selected = item.id === themeId;
            const name = item.label[lang === 'fr' ? 'fr' : 'en'];
            return (
              <button key={item.id} type="button" role="radio" aria-checked={selected} aria-label={name} title={name}
                onClick={() => pickTheme(item.id)}
                className="grid h-9 w-9 place-items-center rounded-full transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet">
                <span className="h-6 w-6 rounded-full border-2 transition-all"
                  style={{
                    background: `linear-gradient(135deg,${cfg.pageBgLight ?? cfg.pageBg} 50%,${accentOf(cfg)} 50%)`,
                    borderColor: selected ? BRAND.violet : (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.12)'),
                    boxShadow: selected ? `0 0 0 2px ${isDark ? '#080818' : '#fff'}, 0 0 0 4px ${BRAND.violet}` : 'none',
                  }} />
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs font-semibold" style={{ color: isDark ? '#f0f0ff' : BRAND.navy }}>{shop.theme} : {themeLabel}</p>
      </div>
    </div>
  );
}
