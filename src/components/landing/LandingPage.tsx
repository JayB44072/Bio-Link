import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollAnimation';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import ReviewsSection from './ReviewsSection';
import AnimSection from './AnimSection';
import BeforeAfterSection from './BeforeAfterSection';
import { fetchPublicStats, type PublicStats } from '../../lib/publicStats';

const PhoneShowcase = lazy(() => import('./PhoneShowcase'));

/** Boutique de démonstration ouverte par « Voir une boutique en vrai » (variable VITE_DEMO_SHOP_USERNAME). */
const DEMO_SHOP = ((import.meta.env.VITE_DEMO_SHOP_USERNAME as string | undefined) ?? '').trim().replace(/[^a-zA-Z0-9-_.]/g, '');

interface NetworkInformation { saveData?: boolean; effectiveType?: string }
/** Connexion lente ou mode économie de données : on n'embarque pas l'animation 3D. */
const isLowBandwidth = () => {
  const c = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return !!c && (c.saveData === true || c.effectiveType === '2g' || c.effectiveType === 'slow-2g');
};

/** Téléphone statique affiché pendant le chargement de l'animation (même encombrement, pas de décalage). */
function PhonePlaceholder() {
  return (
    <div data-ui className="relative mx-auto w-[285px] sm:w-[300px] shrink-0" aria-hidden>
      <div className="rounded-[2.6rem] bg-[#15142B] p-2.5">
        <div className="grid h-[560px] place-items-center rounded-[2.1rem]"
          style={{ background: 'radial-gradient(120% 80% at 50% 45%,#2a2a38 0%,#15151d 60%,#0b0b11 100%)' }}>
          <ShoppingBag size={56} className="text-white/20" />
        </div>
      </div>
    </div>
  );
}
import LanguageMenu from '../ui/LanguageMenu';
import ThemeToggle from '../ui/ThemeToggle';
import { BRAND, GRADIENTS } from '../../lib/theme';
import {
  Link2, ShoppingBag, Zap, Check, ArrowRight,
  Users, ChevronRight, Menu, X, Sparkles,
  UserPlus, Palette, Rocket, CreditCard,
  Share2, BadgeCheck, LineChart, Store, Globe, Instagram,
  MessageCircle, Star, Wallet, Bell, Shield,
  Sparkle, QrCode, Megaphone, Award, Eye,
  ShieldCheck, Gift, Plus, Minus, Smartphone, ExternalLink,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ─────────────────────────────────────────────
   COUNT-UP HOOK
───────────────────────────────────────────── */
function useCountUp(target: number, duration = 1800, suffix = '', decimals = 0) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) { setStarted(true); observer.disconnect(); } },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(decimals ? Number(start.toFixed(decimals)) : Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration, decimals]);

  return { ref, display: (started ? count : 0).toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix };
}

/* ─────────────────────────────────────────────
   ILLUSTRATIONS SVG
───────────────────────────────────────────── */
/* ─────────────────────────────────────────────
   DECORATIVE SHAPES
───────────────────────────────────────────── */
function BgShapes({ variant = 'default' }: { variant?: 'default'|'dark'|'light' }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {variant === 'default' && <>
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle,#6C63FF,transparent)' }} />
        <div className="absolute top-1/2 -right-20 w-64 h-64 rounded-full opacity-[0.06]"
          style={{ background: 'radial-gradient(circle,#00C2FF,transparent)' }} />
        <svg className="absolute top-20 right-10 opacity-[0.06]" width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="55" stroke={BRAND.violet} strokeWidth="1.5" fill="none" />
          <circle cx="60" cy="60" r="40" stroke={BRAND.violet} strokeWidth="1" fill="none" />
        </svg>
        <svg className="absolute bottom-20 left-10 opacity-[0.06]" width="80" height="80" viewBox="0 0 80 80">
          <rect x="5" y="5" width="70" height="70" rx="12" stroke={BRAND.cyan} strokeWidth="1.5" fill="none" transform="rotate(15 40 40)" />
        </svg>
      </>}
      {variant === 'light' && <>
        <div className="absolute -top-20 right-1/4 w-96 h-96 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle,#6C63FF,transparent)' }} />
        <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle,#00C2FF,transparent)' }} />
        <svg className="absolute top-10 left-10 opacity-[0.07]" width="100" height="100" viewBox="0 0 100 100">
          <polygon points="50,5 95,75 5,75" stroke={BRAND.violet} strokeWidth="1.5" fill="none" />
        </svg>
        <svg className="absolute bottom-10 right-10 opacity-[0.07]" width="90" height="90" viewBox="0 0 90 90">
          <circle cx="45" cy="45" r="40" stroke={BRAND.pink} strokeWidth="1.5" fill="none" />
          <circle cx="45" cy="45" r="28" stroke={BRAND.pink} strokeWidth="1" fill="none" />
        </svg>
      </>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────── */
function StatCard({ target, suffix, label, icon: Icon, delay, dk, decimals = 0 }:
  { target: number; suffix: string; label: string; icon: LucideIcon; delay: number; dk: boolean; decimals?: number }) {
  const { ref, display } = useCountUp(target, 1600, suffix, decimals);
  const { ref: animRef, visible } = useScrollAnimation(0.3);

  return (
    <div ref={animRef as React.RefObject<HTMLDivElement>}
      className={`flex flex-col items-center gap-2 transition-all duration-700 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${delay}ms` }}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1 shadow-sm"
        style={{ background: dk ? 'linear-gradient(135deg,#1a1a35,#12122a)' : 'linear-gradient(135deg,#F0EEFF,#E8F7FF)' }}>
        <Icon size={20} className="text-brand-violet" />
      </div>
      <div ref={ref as React.RefObject<HTMLDivElement>}
        className={`text-3xl font-black ${dk ? 'text-white' : 'text-brand-navy'}`}>{display}</div>
      <div className={`text-sm font-medium ${dk ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PRICING PLAN BUILDER (traduit)
───────────────────────────────────────────── */
type AnyIcon = React.ComponentType<{ size?: number; className?: string }>;

function getPricingPlans(t: import('../../lib/landingTranslations').LandingT) {
  return [
    {
      id: 'free', name: t.planFree, price: '0', period: '', badge: '', highlighted: false,
      features: [
        { Icon: ShoppingBag as AnyIcon, text: t.planFreeF1 },
        { Icon: Link2       as AnyIcon, text: t.planFreeF2 },
        { Icon: Palette     as AnyIcon, text: t.planFreeF3 },
        { Icon: CreditCard  as AnyIcon, text: t.planFreeF4 },
      ],
    },
    {
      id: 'starter', name: t.planStarter, price: '2 000', period: 'FCFA/mois', badge: '', highlighted: false,
      features: [
        { Icon: ShoppingBag as AnyIcon, text: t.planStarterF1 },
        { Icon: Link2       as AnyIcon, text: t.planStarterF2 },
        { Icon: Palette     as AnyIcon, text: t.planStarterF3 },
        { Icon: Shield      as AnyIcon, text: t.planStarterF4 },
      ],
    },
    {
      id: 'business', name: t.planBusiness, price: '5 000', period: 'FCFA/mois', badge: t.planBadgeBusiness, highlighted: true,
      features: [
        { Icon: ShoppingBag as AnyIcon, text: t.planBusinessF1 },
        { Icon: LineChart   as AnyIcon, text: t.planBusinessF2 },
        { Icon: Wallet      as AnyIcon, text: t.planBusinessF3 },
        { Icon: Bell        as AnyIcon, text: t.planBusinessF4 },
      ],
    },
    {
      id: 'premium', name: t.planPremium, price: '10 000', period: 'FCFA/mois', badge: t.planBadgePremium, highlighted: false,
      features: [
        { Icon: ShoppingBag as AnyIcon, text: t.planPremiumF1 },
        { Icon: Zap         as AnyIcon, text: t.planPremiumF2 },
        { Icon: BadgeCheck  as AnyIcon, text: t.planPremiumF3 },
        { Icon: Shield      as AnyIcon, text: t.planPremiumF4 },
      ],
    },
  ];
}

/* ─────────────────────────────────────────────
   FAQ ITEM
───────────────────────────────────────────── */
function FaqItem({ q, a, dk, cardBg, cardBorder, txtPrimary, txtSub }:
  { q: string; a: string; dk: boolean; cardBg: string; cardBorder: string; txtPrimary: string; txtSub: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border overflow-hidden transition-all"
      style={{ background: cardBg, borderColor: cardBorder }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
        <span className="font-bold text-sm sm:text-base" style={{ color: txtPrimary }}>{q}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff' }}>
          {open ? <Minus size={14} className="text-brand-violet" /> : <Plus size={14} className="text-brand-violet" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 -mt-1">
          <p className={`text-sm leading-relaxed ${txtSub}`}>{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
interface LandingPageProps { onLogin: () => void; onRegister: () => void; }

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const { isDark, lang, t, toggleDark, setLang: setLangCtx } = useAppPrefs();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [show3d, setShow3d] = useState(false);

  // Chiffres réels (créateurs, ventes, note moyenne)
  useEffect(() => {
    let alive = true;
    fetchPublicStats().then(r => { if (alive) setStats(r); });
    return () => { alive = false; };
  }, []);

  // L'animation 3D se charge quand le navigateur est disponible, jamais en mode économie de données
  useEffect(() => {
    if (isLowBandwidth()) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setShow3d(true), { timeout: 1500 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(() => setShow3d(true), 600);
    return () => clearTimeout(id);
  }, []);
  /* ── Scroll handler ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  /* ── Theme shortcuts ── */
  const dk = isDark;
  const bg0    = dk ? '#080818' : '#fff';
  const bgHero = dk
    ? 'linear-gradient(160deg,#0a0a1e 0%,#0e1028 55%,#0a0a1e 100%)'
    : 'linear-gradient(160deg,#F8F6FF 0%,#EDF7FF 55%,#F8F6FF 100%)';
  const bgFeat = dk
    ? 'linear-gradient(180deg,#080818 0%,#0d0d22 100%)'
    : 'linear-gradient(180deg,#fff 0%,#F8F6FF 100%)';
  const bgPric = dk
    ? 'linear-gradient(180deg,#0d0d22 0%,#080818 100%)'
    : 'linear-gradient(180deg,#F8F6FF 0%,#EDF7FF 100%)';
  const navBg = scrolled
    ? (dk ? 'rgba(8,8,24,0.95)' : 'rgba(255,255,255,0.92)')
    : 'transparent';
  const navBorder = scrolled ? (dk ? '#1e1e3f' : '#f3f4f6') : 'transparent';
  const cardBg     = dk ? '#111128' : '#fff';
  const cardBorder = dk ? '#1e1e3f' : '#f3f4f6';
  const txtPrimary = dk ? '#f0f0ff' : BRAND.navy;
  const txtSub     = dk ? 'text-gray-400' : 'text-gray-500';
  const menuBg     = dk ? '#0d0d22' : '#fff';

  // Chiffres réels uniquement : une donnée indisponible ou nulle n'est pas affichée
  const statItems: { target: number; suffix: string; decimals?: number; label: string; icon: LucideIcon }[] = [];
  if (stats?.shops) statItems.push({ target: stats.shops, suffix: '', label: t.statsCreators, icon: Users });
  if (stats?.sales) statItems.push({ target: stats.sales, suffix: '', label: t.statsSales, icon: ShoppingBag });
  if (stats?.rating) statItems.push({ target: stats.rating, suffix: '/5', decimals: 1, label: t.statsSatisfaction, icon: Star });
  statItems.push({ target: 2, suffix: ' min', label: t.statsTime, icon: Zap });
  const statCols = statItems.length >= 4 ? 'md:grid-cols-4' : statItems.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2';

  const NAV_LINKS = [
    [t.navFeatures, 'features'],
    [t.navHowTo,    'howto'],
    [t.navPricing,  'pricing'],
    [t.reviewsTag,  'reviews'],
  ] as const;

  return (
    <div className="min-h-screen font-sans antialiased overflow-x-hidden" style={{ background: bg0, color: txtPrimary }}>

      {/* ══ NAVBAR ══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: navBg, backdropFilter: scrolled ? 'blur(12px)' : 'none', borderBottom: `1px solid ${navBorder}`,
          boxShadow: scrolled ? '0 1px 20px rgba(108,99,255,0.08)' : 'none' }}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo-sm.png" alt="BioLinkWD" className="h-9 w-auto"
              onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextSibling as HTMLElement).style.display='flex'; }} />
            <div className="hidden items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: GRADIENTS.brand }}>
                <Link2 size={16} className="text-white" />
              </div>
              <span className="font-extrabold text-lg" style={{ color: txtPrimary }}>BioLinkWD</span>
            </div>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="text-sm font-medium transition-colors hover:text-brand-violet"
                style={{ color: dk ? '#a0a0c0' : '#4b5563' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle isDark={dk} onToggle={toggleDark} label={dk ? t.darkOff : t.darkOn} iconSize={17}
              className="p-2 rounded-xl transition-colors"
              style={{ background: dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: dk ? '#fbbf24' : '#6b7280' }} />

            <LanguageMenu value={lang} onChange={setLangCtx} iconSize={13}
              buttonClassName="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              buttonStyle={{ background: dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: dk ? '#c0c0e0' : '#6b7280' }}
              menuClassName="absolute right-0 top-full mt-2 rounded-xl shadow-xl border py-1 min-w-[140px] z-50"
              menuStyle={{ background: dk ? '#111128' : '#fff', borderColor: cardBorder }}
              itemStyle={a => ({
                color: a ? BRAND.violet : (dk ? '#c0c0e0' : '#374151'),
                background: a ? (dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff') : 'transparent',
              })}
              checkSize={11} checkClassName="ml-auto text-brand-violet" />

            {/* Login — desktop only */}
            <button onClick={onLogin}
              className="hidden md:block text-sm font-semibold transition-colors px-4 py-2 rounded-xl"
              style={{ color: BRAND.violet, background: dk ? 'rgba(108,99,255,0.1)' : 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = dk ? 'rgba(108,99,255,0.2)' : '#f5f3ff')}
              onMouseLeave={e => (e.currentTarget.style.background = dk ? 'rgba(108,99,255,0.1)' : 'transparent')}>
              {t.navLogin}
            </button>
            {/* Register — desktop only */}
            <button onClick={onRegister}
              className="hidden md:block text-sm font-bold text-white px-5 py-2.5 rounded-xl shadow-md shadow-purple-200 transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: GRADIENTS.brand }}>
              {t.navRegister}
            </button>
            {/* Hamburger */}
            <button onClick={() => setMenuOpen(v => !v)}
              className="md:hidden p-2 rounded-xl transition-colors"
              style={{ color: dk ? '#a0a0c0' : '#6b7280', background: dk ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
              <Menu size={22} />
            </button>
          </div>
        </div>
      </nav>

      {/* ══ MOBILE DRAWER ══ */}
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 md:hidden transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.45)',
          opacity: menuOpen ? 1 : 0,
          pointerEvents: menuOpen ? 'auto' : 'none',
        }}
        onClick={() => setMenuOpen(false)}
      />
      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 md:hidden flex flex-col"
        style={{
          width: '75vw',
          maxWidth: '320px',
          background: menuBg,
          borderLeft: `1px solid ${cardBorder}`,
          boxShadow: '-8px 0 40px rgba(108,99,255,0.15)',
          transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 h-16 border-b" style={{ borderColor: cardBorder }}>
          <span className="font-extrabold text-base" style={{ color: txtPrimary }}>BioLinkWD</span>
          <button onClick={() => setMenuOpen(false)}
            className="p-2 rounded-xl transition-colors"
            style={{ color: dk ? '#a0a0c0' : '#6b7280', background: dk ? 'rgba(255,255,255,0.06)' : '#f3f4f6' }}>
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {NAV_LINKS.map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)}
              className="flex items-center gap-3 w-full text-left font-medium py-3 px-3 rounded-xl transition-colors"
              style={{ color: dk ? '#c0c0e0' : '#374151' }}
              onMouseEnter={e => (e.currentTarget.style.background = dk ? 'rgba(255,255,255,0.05)' : '#f9fafb')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <ChevronRight size={14} className="text-brand-violet shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Auth buttons at bottom */}
        <div className="px-4 pb-8 pt-4 space-y-3 border-t" style={{ borderColor: cardBorder }}>
          <button onClick={() => { setMenuOpen(false); onLogin(); }}
            className="w-full py-3 rounded-xl text-sm font-semibold border-2 transition-all"
            style={{ color: BRAND.violet, borderColor: dk ? 'rgba(108,99,255,0.4)' : '#ddd6fe', background: dk ? 'rgba(108,99,255,0.08)' : 'transparent' }}>
            {t.navLogin}
          </button>
          <button onClick={() => { setMenuOpen(false); onRegister(); }}
            className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5"
            style={{ background: GRADIENTS.brand }}>
            {t.navRegister}
          </button>
        </div>
      </div>

      {/* ══ HERO ══ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden" style={{ background: bgHero }}>
        <div className="absolute -top-40 -left-40 w-[580px] h-[580px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: 'radial-gradient(circle,#6C63FF,transparent)' }} />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.10] blur-3xl"
          style={{ background: 'radial-gradient(circle,#00C2FF,transparent)' }} />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full opacity-[0.08] blur-2xl"
          style={{ background: 'radial-gradient(circle,#FF6B9D,transparent)' }} />
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(#6C63FF 1.5px,transparent 1.5px)', backgroundSize: '32px 32px' }} />
        <svg className="absolute right-12 top-24 opacity-[0.07] hidden lg:block" width="160" height="160" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="75" stroke={BRAND.violet} strokeWidth="1.5" fill="none" />
          <circle cx="80" cy="80" r="55" stroke={BRAND.violet} strokeWidth="1" fill="none" />
        </svg>

        <div className="max-w-6xl mx-auto px-5 w-full grid lg:grid-cols-2 gap-12 items-center py-16">
          <div>
            <AnimSection direction="up" delay={0}>
              <div className="inline-flex items-center gap-2 border rounded-full px-4 py-2 mb-6 shadow-sm"
                style={{ background: dk ? 'rgba(108,99,255,0.12)' : '#fff', borderColor: dk ? 'rgba(108,99,255,0.25)' : '#ede9fe' }}>
                <Sparkles size={13} className="text-brand-violet" />
                <span className="text-xs font-semibold text-brand-violet">{t.heroTag}</span>
              </div>
            </AnimSection>

            <AnimSection direction="up" delay={100}>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6" style={{ color: txtPrimary }}>
                {t.heroTitle}
                <span className="relative ml-3 inline-block">
                  <span className="relative z-10 bg-clip-text text-transparent"
                    style={{ backgroundImage: GRADIENTS.brand }}>{t.heroHighlight}</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
                    <path d="M2 6 Q50 1 98 6" stroke="url(#uGrad)" strokeWidth="3" strokeLinecap="round" />
                    <defs><linearGradient id="uGrad" x1="0" y1="0" x2="1" y2="0"><stop stopColor={BRAND.violet}/><stop offset="1" stopColor={BRAND.cyan}/></linearGradient></defs>
                  </svg>
                </span>
              </h1>
            </AnimSection>

            <AnimSection direction="up" delay={150}>
              <p className="text-xl sm:text-2xl font-semibold leading-snug mb-3 max-w-lg" style={{ color: txtPrimary }}>{t.heroDesign}</p>
            </AnimSection>

            <AnimSection direction="up" delay={220}>
              <p className={`text-lg leading-relaxed mb-8 max-w-lg ${txtSub}`}>{t.heroSub}</p>
            </AnimSection>

            <AnimSection direction="up" delay={300}>
              <div className="flex flex-wrap gap-4 mb-10">
                <button onClick={onRegister}
                  className="flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-purple-200 transition-all hover:shadow-xl hover:-translate-y-1"
                  style={{ background: GRADIENTS.brand }}>
                  {t.heroCta1}<ArrowRight size={18} />
                </button>
                <button onClick={() => scrollTo('howto')}
                  className="flex items-center gap-2 font-semibold px-6 py-3.5 rounded-2xl border-2 transition-all"
                  style={{ color: BRAND.violet, borderColor: dk ? 'rgba(108,99,255,0.4)' : '#ddd6fe', background: dk ? 'rgba(108,99,255,0.08)' : '#fff' }}>
                  {t.heroCta2}
                </button>
                {DEMO_SHOP && (
                  <a href={`/u/${DEMO_SHOP}`}
                    className="flex items-center gap-2 font-semibold px-2 py-3.5 text-brand-violet underline-offset-4 hover:underline">
                    {t.demoCta}<ExternalLink size={16} aria-hidden />
                  </a>
                )}
              </div>
            </AnimSection>

            <AnimSection direction="up" delay={400}>
              <div className="flex flex-wrap gap-5">
                {[
                  { icon: Sparkle,    text: t.heroBadge1, color: 'text-brand-violet' },
                  { icon: Zap,        text: t.heroBadge2, color: 'text-amber-500'   },
                  { icon: CreditCard, text: t.heroBadge3, color: 'text-emerald-500' },
                ].map(({ icon: Icon, text, color }) => (
                  <div key={text} className="flex items-center gap-2">
                    <Icon size={16} className={color} />
                    <span className={`text-sm font-medium ${txtSub}`}>{text}</span>
                  </div>
                ))}
              </div>
            </AnimSection>
          </div>

          <AnimSection direction="right" delay={200} className="flex justify-center lg:justify-end">
            {show3d ? (
              <Suspense fallback={<PhonePlaceholder />}>
                <PhoneShowcase />
              </Suspense>
            ) : <PhonePlaceholder />}
          </AnimSection>
        </div>
      </section>

      {/* ══ STATS BAR ══ */}
      <section className="border-y py-12 relative overflow-hidden"
        style={{ background: dk ? '#0d0d22' : '#fff', borderColor: cardBorder }}>
        <BgShapes variant="default" />
        <div className="max-w-5xl mx-auto px-5 relative z-10">
          <div className={`grid grid-cols-2 ${statCols} gap-8 text-center`}>
            {statItems.map((it, i) => (
              <StatCard key={it.label} target={it.target} suffix={it.suffix} decimals={it.decimals} label={it.label}
                icon={it.icon} delay={i * 100} dk={dk} />
            ))}
          </div>
        </div>
      </section>

      {/* ══ PAYMENTS STRIP ══ */}
      <section className="py-12 px-5 border-b" style={{ background: dk ? '#0b0b1e' : '#fafaff', borderColor: cardBorder }}>
        <div className="max-w-5xl mx-auto">
          <AnimSection direction="up">
            <p className={`text-center text-xs font-bold uppercase tracking-widest mb-6 ${txtSub}`}>{t.payStripTitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {/* MTN */}
              <div className="flex items-center gap-3 rounded-2xl px-5 py-3 border shadow-sm"
                style={{ background: cardBg, borderColor: cardBorder }}>
                <img src="/mtn.png" alt="MTN" className="h-8 w-auto object-contain"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                <span className="text-sm font-bold" style={{ color: txtPrimary }}>{t.payMtn}</span>
              </div>
              {/* Orange */}
              <div className="flex items-center gap-3 rounded-2xl px-5 py-3 border shadow-sm"
                style={{ background: cardBg, borderColor: cardBorder }}>
                <img src="/orange.png" alt="Orange" className="h-8 w-auto object-contain"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                <span className="text-sm font-bold" style={{ color: txtPrimary }}>{t.payOrange}</span>
              </div>
              {/* Card */}
              <div className="flex items-center gap-3 rounded-2xl px-5 py-3 border shadow-sm"
                style={{ background: cardBg, borderColor: cardBorder }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: GRADIENTS.brand }}>
                  <CreditCard size={16} className="text-white" />
                </div>
                <span className="text-sm font-bold" style={{ color: txtPrimary }}>{t.payCard}</span>
              </div>
              {/* WhatsApp */}
              <div className="flex items-center gap-3 rounded-2xl px-5 py-3 border shadow-sm"
                style={{ background: '#25D366', borderColor: '#25D366' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/25">
                  <MessageCircle size={16} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white">{t.payWa}</span>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      <BeforeAfterSection t={t} dk={dk} />

      {/* ══ FEATURES ══ */}
      <section id="features" className="py-24 px-5 relative overflow-hidden" style={{ background: bgFeat }}>
        <BgShapes variant="light" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimSection direction="up" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border"
              style={{ background: dk ? 'rgba(108,99,255,0.12)' : '#f5f3ff', borderColor: dk ? 'rgba(108,99,255,0.25)' : '#ede9fe' }}>
              <Sparkles size={12} className="text-brand-violet" />
              <span className="text-xs font-semibold text-brand-violet uppercase tracking-wide">{t.featuresTag}</span>
            </div>
            <h2 className="text-4xl font-black mb-4" style={{ color: txtPrimary }}>
              {t.featuresTitle.split('\n').map((l, i) => <React.Fragment key={i}>{l}{i === 0 && <br />}</React.Fragment>)}
            </h2>
            <p className={`max-w-xl mx-auto ${txtSub}`}>{t.featuresSub}</p>
          </AnimSection>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                accent: '#25D366', bg: dk ? '#0d2318' : '#ecfdf5', tag: t.catSellTag,
                icon: Wallet, title: t.catSellTitle, desc: t.catSellDesc,
                perks: [
                  { Icon: Smartphone, text: t.catSell1 },
                  { Icon: CreditCard, text: t.catSell2 },
                  { Icon: MessageCircle, text: t.catSell3 },
                  { Icon: BadgeCheck, text: t.catSell4 },
                ],
              },
              {
                accent: BRAND.violet, bg: dk ? '#1a1535' : '#F0EEFF', tag: t.catBoostTag,
                icon: Sparkle, title: t.catBoostTitle, desc: t.catBoostDesc,
                perks: [
                  { Icon: Sparkle, text: t.catBoost1 },
                  { Icon: Palette, text: t.catBoost2 },
                  { Icon: QrCode, text: t.catBoost3 },
                  { Icon: Megaphone, text: t.catBoost4 },
                ],
              },
              {
                accent: BRAND.pink, bg: dk ? '#201520' : '#FFF0F6', tag: t.catTrustTag,
                icon: ShieldCheck, title: t.catTrustTitle, desc: t.catTrustDesc,
                perks: [
                  { Icon: Award, text: t.catTrust1 },
                  { Icon: Star, text: t.catTrust2 },
                  { Icon: ShieldCheck, text: t.catTrust3 },
                  { Icon: Bell, text: t.catTrust4 },
                ],
              },
              {
                accent: BRAND.cyan, bg: dk ? '#0f1e2e' : '#E8F7FF', tag: t.catGrowTag,
                icon: LineChart, title: t.catGrowTitle, desc: t.catGrowDesc,
                perks: [
                  { Icon: Gift, text: t.catGrow1 },
                  { Icon: Eye, text: t.catGrow2 },
                  { Icon: Store, text: t.catGrow3 },
                  { Icon: Globe, text: t.catGrow4 },
                ],
              },
            ].map(({ accent, bg, tag, icon: Icon, title, desc, perks }, i) => (
              <AnimSection key={title} direction="up" delay={i * 120}>
                <div className="rounded-3xl p-8 shadow-sm border hover:shadow-xl hover:shadow-purple-100/30 transition-all duration-300 hover:-translate-y-1.5 h-full flex flex-col"
                  style={{ background: cardBg, borderColor: cardBorder }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                      <Icon size={22} style={{ color: accent }} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>{tag}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2" style={{ color: txtPrimary }}>{title}</h3>
                  <p className={`text-sm leading-relaxed mb-6 ${txtSub}`}>{desc}</p>
                  <ul className="space-y-3 mt-auto">
                    {perks.map(({ Icon: PIcon, text }) => (
                      <li key={text} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                          <PIcon size={13} style={{ color: accent }} />
                        </div>
                        <span className={`text-sm font-medium leading-tight pt-1 ${txtSub}`}>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section id="howto" className="py-24 px-5 relative overflow-hidden" style={{ background: bg0 }}>
        <BgShapes variant="default" />
        <div className="max-w-5xl mx-auto relative z-10">
          <AnimSection direction="up" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border"
              style={{ background: dk ? 'rgba(0,194,255,0.1)' : '#eff6ff', borderColor: dk ? 'rgba(0,194,255,0.2)' : '#dbeafe' }}>
              <Zap size={12} className="text-brand-cyan" />
              <span className="text-xs font-semibold text-brand-cyan uppercase tracking-wide">{t.howTag}</span>
            </div>
            <h2 className="text-4xl font-black mb-4" style={{ color: txtPrimary }}>{t.howTitle}</h2>
            <p className={`max-w-md mx-auto ${txtSub}`}>{t.howSub}</p>
          </AnimSection>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-12 left-[calc(33%+16px)] right-[calc(33%+16px)] h-px bg-gradient-to-r from-brand-violet to-brand-cyan opacity-20 z-0" />
            {[
              { icon: UserPlus, color: BRAND.violet, bg: dk ? '#1a1535' : '#F0EEFF', step: 1, title: t.step1Title, desc: t.step1Desc },
              { icon: Palette,  color: BRAND.cyan, bg: dk ? '#0f1e2e' : '#E8F7FF', step: 2, title: t.step2Title, desc: t.step2Desc },
              { icon: Share2,   color: BRAND.pink, bg: dk ? '#201520' : '#FFF0F6', step: 3, title: t.step3Title, desc: t.step3Desc },
            ].map(({ icon: Icon, color, bg, step, title, desc }, i) => (
              <AnimSection key={title} direction="up" delay={i * 150} className="relative z-10">
                <div className="text-center group">
                  <div className="relative w-24 h-24 mx-auto mb-5">
                    <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-lg mx-auto"
                      style={{ background: bg }}>
                      <Icon size={38} style={{ color }} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-white text-xs font-black flex items-center justify-center shadow-md"
                      style={{ background: GRADIENTS.brand }}>{step}</div>
                  </div>
                  <h3 className="text-lg font-black mb-2" style={{ color: txtPrimary }}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${txtSub}`}>{desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ REFERRAL MULTI-LEVEL ══ */}
      <section id="referral" className="py-24 px-5 relative overflow-hidden" style={{ background: bgFeat }}>
        <BgShapes variant="light" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimSection direction="up" className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border"
              style={{ background: dk ? 'rgba(108,99,255,0.12)' : '#fff', borderColor: dk ? 'rgba(108,99,255,0.25)' : '#ede9fe' }}>
              <Gift size={12} className="text-brand-violet" />
              <span className="text-xs font-semibold text-brand-violet uppercase tracking-wide">{t.refTag}</span>
            </div>
            <h2 className="text-4xl font-black mb-4" style={{ color: txtPrimary }}>{t.refTitle}</h2>
            <p className={`max-w-2xl mx-auto ${txtSub}`}>{t.refDesc}</p>
          </AnimSection>

          <AnimSection direction="up" delay={100}>
            <div className="rounded-3xl p-8 sm:p-10 border shadow-lg"
              style={{ background: cardBg, borderColor: cardBorder }}>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[
                  { pct: '5%', label: t.refL1, color: '#22c55e', bg: dk ? '#0d2318' : '#ecfdf5', tier: 'L1' },
                  { pct: '2%', label: t.refL2, color: BRAND.cyan, bg: dk ? '#0f1e2e' : '#E8F7FF', tier: 'L2' },
                  { pct: '1%', label: t.refL3, color: BRAND.violet, bg: dk ? '#1a1535' : '#F0EEFF', tier: 'L3' },
                ].map(({ pct, label, color, bg, tier }, i) => (
                  <div key={tier} className="relative rounded-2xl p-6 text-center border-2 transition-transform hover:-translate-y-1"
                    style={{ background: bg, borderColor: color + '40' }}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black px-3 py-1 rounded-full text-white shadow"
                      style={{ background: color }}>{tier}</div>
                    <div className="text-5xl font-black mb-2" style={{ color }}>{pct}</div>
                    <div className="text-sm font-semibold" style={{ color: dk ? '#e5e7eb' : BRAND.navy }}>{label}</div>
                    {i < 2 && (
                      <ArrowRight size={20} className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10"
                        style={{ color: dk ? '#4b5563' : '#cbd5e1' }} />
                    )}
                  </div>
                ))}
              </div>
              <ul className="grid sm:grid-cols-2 gap-3 mb-8">
                {[t.refP1, t.refP2, t.refP3, t.refP4].map(text => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff' }}>
                      <Check size={13} className="text-brand-violet" />
                    </div>
                    <span className={`text-sm font-medium leading-snug ${txtSub}`}>{text}</span>
                  </li>
                ))}
              </ul>
              <div className="text-center">
                <button onClick={onRegister}
                  className="inline-flex items-center gap-2 text-white font-bold px-7 py-3.5 rounded-2xl shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
                  style={{ background: GRADIENTS.brand }}>
                  {t.refCta}<ArrowRight size={18} />
                </button>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ══ PRICING ══ */}
      <section id="pricing" className="py-24 px-5 relative overflow-hidden" style={{ background: bgPric }}>
        <BgShapes variant="light" />
        <div className="max-w-6xl mx-auto relative z-10">
          <AnimSection direction="up" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border"
              style={{ background: dk ? 'rgba(108,99,255,0.12)' : '#fff', borderColor: dk ? 'rgba(108,99,255,0.25)' : '#ede9fe' }}>
              <Star size={12} className="text-brand-violet" />
              <span className="text-xs font-semibold text-brand-violet uppercase tracking-wide">{t.pricingTag}</span>
            </div>
            <h2 className="text-4xl font-black mb-4" style={{ color: txtPrimary }}>
              {t.pricingTitle.split('\n').map((l, i) => <React.Fragment key={i}>{l}{i === 0 && <br />}</React.Fragment>)}
            </h2>
            <p className={`max-w-md mx-auto ${txtSub}`}>{t.pricingSub}</p>
          </AnimSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {getPricingPlans(t).map(({ id, name, price, period, badge, highlighted, features }, i) => (
              <AnimSection key={id} direction="up" delay={i * 100}>
                <div
                  className={`relative flex flex-col rounded-3xl p-7 h-full transition-all duration-300 hover:-translate-y-1 ${highlighted ? 'text-white shadow-2xl shadow-purple-300/40 scale-105' : 'shadow-sm hover:shadow-lg'}`}
                  style={highlighted ? { background: 'linear-gradient(160deg,#1a1a2e,#2d2060)' } : { background: cardBg, border: `1px solid ${cardBorder}` }}
                >
                  {badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap ${highlighted ? 'bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-lg' : 'bg-amber-100 text-amber-700'}`}>
                      {badge}
                    </div>
                  )}
                  <div className="mb-6">
                    <p className={`text-sm font-bold mb-1 ${highlighted ? 'text-blue-300' : 'text-brand-violet'}`}>{name}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-black" style={{ color: highlighted ? '#fff' : txtPrimary }}>{price}</span>
                      {period && <span className="text-xs pb-1" style={{ color: highlighted ? '#d1d5db' : (dk ? '#6b7280' : '#9ca3af') }}>{period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {features.map(({ Icon, text }) => (
                      <li key={text} className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${highlighted ? 'bg-white/10' : ''}`}
                          style={!highlighted ? { background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff' } : {}}>
                          <Icon size={13} className={highlighted ? 'text-blue-300' : 'text-brand-violet'} />
                        </div>
                        <span className="text-sm" style={{ color: highlighted ? '#e5e7eb' : (dk ? '#a0a0c0' : '#4b5563') }}>{text}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={onRegister}
                    className={`w-full py-3 rounded-2xl text-sm font-bold transition-all hover:-translate-y-0.5 ${highlighted ? 'bg-gradient-to-r from-brand-violet to-brand-cyan text-white shadow-lg shadow-purple-500/30' : ''}`}
                    style={!highlighted ? { border: `2px solid ${dk ? 'rgba(108,99,255,0.4)' : '#ddd6fe'}`, color: BRAND.violet, background: dk ? 'rgba(108,99,255,0.08)' : 'transparent' } : {}}
                  >
                    {id === 'free' ? t.pricingFree : `${t.pricingChoose} ${name}`}
                  </button>
                </div>
              </AnimSection>
            ))}
          </div>

          <AnimSection direction="up" delay={200}>
            <div className="mt-10 rounded-2xl px-6 py-4 flex items-center justify-center gap-3 border text-center"
              style={{ background: dk ? 'rgba(108,99,255,0.1)' : '#f5f3ff', borderColor: dk ? 'rgba(108,99,255,0.25)' : '#ddd6fe' }}>
              <QrCode size={18} className="text-brand-violet shrink-0" />
              <span className="text-sm font-semibold" style={{ color: dk ? '#e5e7eb' : BRAND.navy }}>{t.premiumQrCallout}</span>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ══ REVIEWS ══ */}
      <ReviewsSection t={t} dk={dk} />

      {/* ══ FAQ ══ */}
      <section id="faq" className="py-24 px-5 relative overflow-hidden" style={{ background: bgFeat }}>
        <BgShapes variant="light" />
        <div className="max-w-3xl mx-auto relative z-10">
          <AnimSection direction="up" className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 border"
              style={{ background: dk ? 'rgba(0,194,255,0.1)' : '#eff6ff', borderColor: dk ? 'rgba(0,194,255,0.2)' : '#dbeafe' }}>
              <MessageCircle size={12} className="text-brand-cyan" />
              <span className="text-xs font-semibold text-brand-cyan uppercase tracking-wide">{t.faqTag}</span>
            </div>
            <h2 className="text-4xl font-black mb-4" style={{ color: txtPrimary }}>{t.faqTitle}</h2>
          </AnimSection>
          <div className="space-y-3">
            {[
              { q: t.faq1Q, a: t.faq1A },
              { q: t.faq2Q, a: t.faq2A },
              { q: t.faq3Q, a: t.faq3A },
              { q: t.faq4Q, a: t.faq4A },
            ].map((item, i) => (
              <AnimSection key={i} direction="up" delay={i * 80}>
                <FaqItem q={item.q} a={item.a} dk={dk} cardBg={cardBg} cardBorder={cardBorder} txtPrimary={txtPrimary} txtSub={txtSub} />
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ══ */}
      <section className="py-24 px-5" style={{ background: bg0 }}>
        <div className="max-w-4xl mx-auto">
          <AnimSection direction="up">
            <div className="relative rounded-3xl overflow-hidden p-12 text-center"
              style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#00C2FF 100%)' }}>
              <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-white/5 -translate-x-1/3 -translate-y-1/3" />
              <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />
              <div className="absolute inset-0 opacity-[0.07]"
                style={{ backgroundImage: 'radial-gradient(white 1.5px,transparent 1.5px)', backgroundSize: '28px 28px' }} />
              <svg className="absolute top-6 right-6 opacity-20" width="60" height="60" viewBox="0 0 60 60">
                <circle cx="30" cy="30" r="28" stroke="white" strokeWidth="1.5" fill="none" />
                <circle cx="30" cy="30" r="18" stroke="white" strokeWidth="1" fill="none" />
              </svg>
              <svg className="absolute bottom-6 left-6 opacity-20" width="50" height="50" viewBox="0 0 50 50">
                <rect x="3" y="3" width="44" height="44" rx="10" stroke="white" strokeWidth="1.5" fill="none" transform="rotate(10 25 25)" />
              </svg>
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-white/20 backdrop-blur-sm">
                  <Rocket size={32} className="text-white" />
                </div>
                <h2 className="text-4xl font-black text-white mb-4">{t.ctaTitle}</h2>
                <p className="text-blue-100 text-lg mb-8 max-w-md mx-auto">{t.ctaSub}</p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <button onClick={onRegister}
                    className="flex items-center gap-2 bg-white text-brand-violet font-black px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5">
                    {t.ctaBtn1}<ChevronRight size={18} />
                  </button>
                  <button onClick={onLogin}
                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-8 py-4 rounded-2xl transition-all border border-white/30">
                    {t.ctaBtn2}
                  </button>
                </div>
                <p className="text-blue-200 text-xs mt-6 flex items-center justify-center gap-2">
                  <BadgeCheck size={13} />{t.ctaBadge}
                </p>
              </div>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: dk ? '#030312' : BRAND.navy, color: '#9ca3af' }} className="py-12 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <img src="/logo-sm.png" alt="BioLinkWD" className="h-8 w-auto brightness-200"
                  onError={e => { e.currentTarget.style.display='none'; }} />
                <span className="text-white font-bold">BioLinkWD</span>
              </div>
              <p className="text-xs font-semibold mb-2" style={{ color: BRAND.violet }}>by WhiteDuckSaaS</p>
              <p className="text-sm leading-relaxed text-gray-500">{t.footerDesc}</p>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">{t.footerNav}</h4>
              <ul className="space-y-2.5">
                {NAV_LINKS.map(([label, id]) => (
                  <li key={id}>
                    <button onClick={() => scrollTo(id)}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                      <ChevronRight size={12} className="text-brand-violet" />{label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compte */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">{t.footerAccount}</h4>
              <ul className="space-y-2.5">
                <li>
                  <button onClick={onRegister} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-brand-violet" />{t.footerRegister}
                  </button>
                </li>
                <li>
                  <button onClick={onLogin} className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-brand-violet" />{t.footerLogin}
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">{t.footerContact}</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href={`https://wa.me/640336384?text=${encodeURIComponent("Bonjour, j'ai besoin d'aide avec BioLinkWD 👋")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-500/20 group-hover:bg-green-500/30 transition-colors shrink-0">
                      <MessageCircle size={13} className="text-green-400" />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-300 group-hover:text-white transition-colors">{t.footerSupport}</span>
                      <span className="text-xs text-gray-500">+640 33 63 84</span>
                    </div>
                  </a>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Instagram size={13} className="text-brand-violet shrink-0" />
                  <span>@biolinkwd</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-center sm:text-left text-gray-500">
              © 2026 <span className="text-white font-semibold">WhiteDuckSaaS</span>. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <a href="/privacy" className="hover:text-white transition-colors">Politique de confidentialité</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
