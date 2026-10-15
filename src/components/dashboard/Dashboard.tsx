import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile, Product, Service, PlanType, Notification } from '../../lib/types';
import { PLAN_CONFIGS } from '../../lib/planLimits';
import { useLang } from '../../lib/LanguageContext';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import BioLink from './tabs/BioLink';
import Products from './tabs/Products';
import Services from './tabs/Services';
import Orders from './tabs/Orders';
import Statistics from './tabs/Statistics';
import DashboardMap from './tabs/DashboardMap';
import Wallet from './tabs/Wallet';
import Subscription from './tabs/Subscription';
import Themes from './tabs/Themes';
import QrCodeTab from './tabs/QrCode';
import Affiliate from './tabs/Affiliate';
import Subscribers from './tabs/Subscribers';
import Announcements from './tabs/Announcements';
import { Skeleton as SkelBlock } from '../ui/Skeleton';
import {
  Link2, ShoppingBag, Briefcase, BarChart3, Wallet as WalletIcon, PackageSearch, MapPin,
  Crown, LogOut, Menu, X, Check, Sparkles, Bell, ShoppingCart, Palette,
  ChevronLeft, ChevronRight, QrCode, Users, BellRing, Megaphone,
} from 'lucide-react';
import { LandingLang } from '../../lib/landingTranslations';
import LanguageMenu from '../ui/LanguageMenu';
import ThemeToggle from '../ui/ThemeToggle';
import { BRAND, GRADIENTS } from '../../lib/theme';
import { dashPalette } from '../../lib/dashPalette';
import { FeedbackProvider } from '../ui/FeedbackProvider';
import { listProducts } from '../../lib/api/products';
import { listServices } from '../../lib/api/services';
import { listNotifications, markNotificationsRead } from '../../lib/api/notifications';

const TABS = [
  { id: 'biolink',      icon: Link2,        accent: BRAND.violet },
  { id: 'products',     icon: ShoppingBag,  accent: BRAND.pink },
  { id: 'services',     icon: Briefcase,    accent: BRAND.cyan },
  { id: 'orders',       icon: PackageSearch, accent: '#f59e0b' },
  { id: 'subscribers',  icon: BellRing,     accent: BRAND.cyan },
  { id: 'themes',       icon: Palette,      accent: '#a855f7' },
  { id: 'qrcode',       icon: QrCode,       accent: '#8B7CFF' },
  { id: 'map',          icon: MapPin,       accent: '#22c55e' },
  { id: 'statistics',   icon: BarChart3,    accent: BRAND.cyan },
  { id: 'affiliate',    icon: Users,        accent: '#22c55e' },
  { id: 'wallet',       icon: WalletIcon,   accent: BRAND.violet },
  { id: 'subscription', icon: Crown,        accent: BRAND.pink },
  // Réservé aux administrateurs (affichage ; l'envoi est revérifié par le serveur)
  { id: 'announcements', icon: Megaphone,   accent: BRAND.pink },
] as const;

type TabId = typeof TABS[number]['id'];

const PLAN_STYLES: Record<PlanType, { grad: string; text: string }> = {
  free:     { grad: 'linear-gradient(135deg,#9ca3af,#6b7280)', text: '#fff' },
  starter:  { grad: GRADIENTS.violetSoft, text: '#fff' },
  business: { grad: GRADIENTS.brandReverse, text: '#fff' },
  premium:  { grad: GRADIENTS.pinkViolet, text: '#fff' },
};

const BALANCE_LABEL: Record<string, string> = {
  fr: 'Solde disponible', en: 'Available balance', pt: 'Saldo disponível', de: 'Verfügbares Guthaben',
};

export default function Dashboard() {
  const { t, lang: dashLang, setLang: setDashLang } = useLang();
  const { isDark, toggleDark, lang, setLang } = useAppPrefs();
  const dk = isDark;

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [products, setProducts]   = useState<Product[]>([]);
  const [services, setServices]   = useState<Service[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('biolink');
  const [loading, setLoading]     = useState(true);
  const [sideOpen, setSideOpen]   = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('biolinkwd_sidebar_collapsed') === '1';
    } catch { return false; }
  });
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const TAB_LABELS: Record<TabId, string> = {
    biolink:      t.bioLink,
    themes:       lang === 'fr' ? 'Thèmes' : lang === 'pt' ? 'Temas' : lang === 'de' ? 'Themen' : 'Themes',
    products:     t.products,
    qrcode:       lang === 'fr' ? 'QR Code' : lang === 'pt' ? 'QR Code' : lang === 'de' ? 'QR-Code' : 'QR Code',
    services:     t.services,
    orders:       'Commandes',
    subscribers:  lang === 'fr' ? 'Abonnés' : lang === 'pt' ? 'Assinantes' : lang === 'de' ? 'Abonnenten' : 'Subscribers',
    map:          lang === 'de' ? 'Karte' : lang === 'pt' ? 'Carte' : lang === 'en' ? 'Map' : 'Carte',
    statistics:   t.statistics,
    affiliate:    lang === 'fr' ? 'Parrainage' : lang === 'pt' ? 'Afiliados' : lang === 'de' ? 'Empfehlungen' : 'Affiliate',
    wallet:       t.wallet,
    subscription: t.subscription,
    announcements: 'Annonces',
  };

  function handleSetLang(l: LandingLang) {
    setLang(l);
    setDashLang(l as 'fr' | 'en');
  }

  function toggleSideCollapsed() {
    setSideCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('biolinkwd_sidebar_collapsed', next ? '1' : '0'); } catch { /* stockage indisponible : sans conséquence */ }
      return next;
    });
  }

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    // Quoi qu'il arrive (réseau coupé, session expirée, erreur de requête), on sort du skeleton.
    async function load() {
      const timeout = new Promise<void>(resolve => setTimeout(resolve, 12000));
      try {
        await Promise.race([loadDashboard(), timeout]);
      } catch (err) {
        console.error('Chargement du tableau de bord impossible', err);
      } finally {
        setLoading(false);
      }
    }

    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Session invalide ou expirée : retour à l'accueil au lieu d'un skeleton infini
        await supabase.auth.signOut();
        return;
      }

      let { data: prof } = await supabase
        .from('profiles').select('*').eq('user_id', user.id).maybeSingle();

      if (!prof) {
        const base = (user.email ?? user.id).split('@')[0].toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30);
        const { data: created } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            username: `${base}-${user.id.slice(0, 6)}`,
            display_name: user.user_metadata?.full_name ?? user.email ?? 'Utilisateur',
            plan_type: 'free',
          })
          .select().single();
        prof = created;
      }

      if (prof) {
        setProfile({ ...prof, social_links: prof.social_links || [] });
        const [{ data: prods }, { data: svcs }, { data: notifData }] = await Promise.all([
          listProducts(user.id),
          listServices(user.id),
          listNotifications(user.id),
        ]);
        setProducts(prods || []);
        setServices(svcs || []);
        setNotifs((notifData || []) as Notification[]);
      }
    }
    load();
  }, []);

  // Realtime : nouvelle notification → mise à jour instantanée
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${profile.user_id}`,
      }, (payload) => {
        setNotifs(prev => [payload.new as Notification, ...prev].slice(0, 30));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile?.user_id]);

  /* ══════════ Theme tokens ══════════
     Light : blanc pur, ombres très douces, touches pastel
     Dark  : navy profond de la landing                       */
  const { bg, surface, txtSub, hoverBg } = dashPalette(dk);
  const border    = dk ? 'rgba(139,124,255,0.14)' : '#efecfb';
  const txtPrim   = dk ? '#f2f1ff' : BRAND.navy;

  if (loading) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ background: bg }}>
        {/* Sidebar skeleton */}
        <aside className="hidden md:flex shrink-0 flex-col" style={{ background: surface, borderRight: `1px solid ${border}`, width: 264 }}>
          <div className="px-6 pt-7 pb-6 flex items-center gap-3">
            <SkelBlock className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <SkelBlock className="h-3 w-24" />
              <SkelBlock className="h-2 w-16" />
            </div>
          </div>
          <div className="flex-1 px-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkelBlock key={i} className="h-11 w-full rounded-2xl" />
            ))}
          </div>
          <div className="mx-4 mb-4"><SkelBlock className="h-24 w-full rounded-3xl" /></div>
          <div className="mx-4 mb-5"><SkelBlock className="h-14 w-full rounded-2xl" /></div>
        </aside>
        {/* Main skeleton */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 border-b flex items-center justify-between px-4 md:px-8" style={{ background: surface, borderColor: border }}>
            <SkelBlock className="h-5 w-32" />
            <div className="flex items-center gap-2">
              <SkelBlock className="w-9 h-9 rounded-full" />
              <SkelBlock className="w-9 h-9 rounded-full" />
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <SkelBlock key={i} className="h-28 rounded-2xl" />)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => <SkelBlock key={i} className="h-56 rounded-2xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <p style={{ color: txtSub }}>{t.error}</p>
      </div>
    );
  }

  const planConfig = PLAN_CONFIGS[profile.plan_type];
  const planLabel  = planConfig.name[dashLang as 'fr' | 'en'] ?? planConfig.name['fr'];
  const planStyle  = PLAN_STYLES[profile.plan_type];
  const initials   = (profile.display_name || profile.username || 'U').slice(0, 2).toUpperCase();
  const activeMeta = TABS.find(tb => tb.id === activeTab)!;

  /* ══════════ Sidebar ══════════ */
  function formatCompactBalance(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    return `${n}`;
  }

  // Fonction de rendu (et non composant) : un composant défini ici serait recréé à chaque rendu
  // et remonterait la barre, ce qui ferait revenir son défilement tout en haut.
  const renderSidebar = (collapsed = false) => (
    <div className="flex flex-col h-full">

      {/* Logo du site */}
      <div className={`${collapsed ? 'px-3 pt-6 pb-5' : 'px-6 pt-7 pb-6'} shrink-0 transition-all duration-200`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <img src="/logo-sm.png" alt="BioLinkWD" className="h-10 w-auto"
            style={{ filter: dk ? 'brightness(1.6)' : 'none' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-black text-[17px] tracking-tight" style={{ color: txtPrim }}>
                BioLink<span style={{ color: BRAND.violet }}>WD</span>
              </p>
              <p className="text-[10px] font-bold tracking-wide" style={{ color: BRAND.pink }}>
                by WhiteDuckSaaS
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className={`flex-1 min-h-0 overflow-y-auto scrollbar-hide ${collapsed ? 'px-2' : 'px-4'} space-y-1.5`}>
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: txtSub }}>
            Menu
          </p>
        )}
        {TABS.filter(tb => tb.id !== 'announcements' || profile.is_admin).map(({ id, icon: Icon, accent }) => {
          const active = activeTab === id;
          return (
            <button key={id}
              onClick={() => { setActiveTab(id); setSideOpen(false); }}
              title={collapsed ? TAB_LABELS[id] : undefined}
              className={`relative w-full flex items-center rounded-2xl text-[13.5px] font-semibold transition-all duration-200 ${
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
              }`}
              style={{
                background: active ? `linear-gradient(135deg,${accent},${accent}cc)` : 'transparent',
                color: active ? '#fff' : txtSub,
                boxShadow: active ? `0 6px 18px ${accent}59` : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {!collapsed && TAB_LABELS[id]}
            </button>
          );
        })}
      </nav>

      {/* Carte solde — gradient signature (toujours visible) */}
      {collapsed ? (
        <button
          onClick={() => { setActiveTab('wallet'); setSideOpen(false); }}
          title={`${BALANCE_LABEL[lang] ?? BALANCE_LABEL.fr}: ${profile.wallet_balance.toLocaleString()} FCFA`}
          className="mx-2 mb-3 rounded-2xl px-2 py-3 relative overflow-hidden flex flex-col items-center gap-1"
          style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#8B5FBF 55%,#FF6B9D 120%)' }}
        >
          <WalletIcon size={16} color="#fff" />
          <span className="text-white font-black text-[11px] leading-none">
            {formatCompactBalance(profile.wallet_balance)}
          </span>
          <span className="text-[8px] font-bold text-white/70 leading-none">FCFA</span>
        </button>
      ) : (
        <div className="mx-4 mb-4 rounded-3xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#8B5FBF 55%,#FF6B9D 120%)' }}>
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full"
            style={{ background: 'rgba(255,255,255,0.12)' }} />
          <div className="absolute -bottom-10 -left-6 w-24 h-24 rounded-full"
            style={{ background: 'rgba(255,255,255,0.07)' }} />
          <div className="relative">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={12} color="rgba(255,255,255,0.8)" />
              <p className="text-[11px] font-semibold text-white/80">{BALANCE_LABEL[lang] ?? BALANCE_LABEL.fr}</p>
            </div>
            <p className="text-white font-black text-[22px] leading-none">
              {profile.wallet_balance.toLocaleString()}
              <span className="text-[11px] font-bold text-white/70 ml-1.5">FCFA</span>
            </p>
          </div>
        </div>
      )}

      {/* Utilisateur */}
      {collapsed ? (
        <div className="mx-2 mb-4 flex justify-center" title={`${profile.display_name || profile.username} — ${planLabel}`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black text-white shrink-0 relative"
            style={{ background: GRADIENTS.violetPink }}>
            {initials}
            <span className="absolute -bottom-1 -right-1 text-[8px] font-black px-1 py-0.5 rounded-full shrink-0 border-2"
              style={{ background: planStyle.grad, color: planStyle.text, borderColor: surface }}>
              {planLabel.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </div>
      ) : (
        <div className="mx-4 mb-5 flex items-center gap-3 rounded-2xl p-3 border"
          style={{ borderColor: border, background: dk ? 'rgba(255,255,255,0.03)' : '#fdfcff' }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black text-white shrink-0"
            style={{ background: GRADIENTS.violetPink }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate" style={{ color: txtPrim }}>
              {profile.display_name || profile.username}
            </p>
            <p className="text-[11px] truncate" style={{ color: txtSub }}>@{profile.username}</p>
          </div>
          <span className="text-[9.5px] font-black px-2.5 py-1 rounded-full shrink-0"
            style={{ background: planStyle.grad, color: planStyle.text }}>
            {planLabel.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <FeedbackProvider>
    <div className="h-screen flex overflow-hidden" style={{ background: bg }}>

      {/* ══ Sidebar desktop ══ */}
      <aside className="hidden md:flex shrink-0 flex-col relative transition-[width] duration-300 ease-out"
        style={{
          background: surface,
          borderRight: `1px solid ${border}`,
          width: sideCollapsed ? 76 : 264,
        }}>
        {renderSidebar(sideCollapsed)}

        {/* Toggle collapse button */}
        <button
          onClick={toggleSideCollapsed}
          title={sideCollapsed ? (lang === 'fr' ? 'Développer' : 'Expand') : (lang === 'fr' ? 'Réduire' : 'Collapse')}
          className="absolute top-8 -right-3 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 z-10"
          style={{
            background: surface,
            border: `1px solid ${border}`,
            color: txtSub,
          }}
        >
          {sideCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>
      </aside>

      {/* ══ Sidebar mobile ══ */}
      <div className="fixed inset-0 z-50 md:hidden transition-all"
        style={{ pointerEvents: sideOpen ? 'auto' : 'none' }}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          style={{ opacity: sideOpen ? 1 : 0 }}
          onClick={() => setSideOpen(false)} />
        <aside className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col shadow-2xl transition-transform duration-300"
          style={{ background: surface, transform: sideOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
          <button onClick={() => setSideOpen(false)}
            className="absolute top-5 right-4 p-1.5 rounded-xl" style={{ color: txtSub }}>
            <X size={18} />
          </button>
          {renderSidebar()}
        </aside>
      </div>

      {/* ══ Colonne principale ══ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Bande d'accent — prolonge en dégradé la couleur de l'onglet actif dans le contenu */}
        <div className="h-[3px] shrink-0 transition-all duration-300"
          style={{ background: `linear-gradient(90deg, ${activeMeta.accent} 0%, ${activeMeta.accent} 12%, transparent 85%)` }} />

        {/* Top bar */}
        <header className="flex items-center justify-between px-4 md:px-8 h-[64px] shrink-0"
          style={{ background: surface, borderBottom: `1px solid ${border}` }}>

          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSideOpen(true)}
              className="md:hidden p-2 rounded-xl shrink-0"
              style={{ color: txtSub, background: hoverBg }}>
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${activeMeta.accent}1f` }}>
                <activeMeta.icon size={15} color={activeMeta.accent} />
              </span>
              <div className="min-w-0">
                <h1 className="font-black text-[17px] md:text-lg truncate leading-tight" style={{ color: txtPrim }}>
                  {TAB_LABELS[activeTab]}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(v => !v)}
                className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{ background: hoverBg, color: txtSub }}>
                <Bell size={16} />
                {notifs.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-brand-pinkDark text-white text-[9px] font-black flex items-center justify-center">
                    {notifs.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full sm:mt-2 sm:w-[340px] max-h-[420px] overflow-y-auto rounded-2xl border z-50"
                  style={{ background: surface, borderColor: border, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: border }}>
                    <h3 className="font-bold text-sm" style={{ color: txtPrim }}>
                      {lang === 'fr' ? 'Notifications' : 'Notifications'}
                    </h3>
                    {notifs.some(n => !n.is_read) && (
                      <button onClick={async () => {
                        const unread = notifs.filter(n => !n.is_read).map(n => n.id);
                        await markNotificationsRead(unread);
                        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
                      }}
                        className="text-[11px] font-bold transition" style={{ color: BRAND.violet }}>
                        {lang === 'fr' ? 'Tout marquer comme lu' : 'Mark all read'}
                      </button>
                    )}
                  </div>
                  {notifs.length === 0 ? (
                    <div className="py-10 text-center">
                      <Bell size={24} className="mx-auto mb-2" style={{ color: txtSub }} />
                      <p className="text-xs font-medium" style={{ color: txtSub }}>
                        {lang === 'fr' ? 'Aucune notification' : 'No notifications'}
                      </p>
                    </div>
                  ) : notifs.map(n => (
                    <div key={n.id}
                      className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0 transition-colors"
                      style={{
                        borderColor: border,
                        background: n.is_read ? 'transparent' : (dk ? 'rgba(108,99,255,0.06)' : '#faf8ff'),
                      }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          background: n.type === 'order' ? 'rgba(108,99,255,0.12)' : n.type === 'delivery' ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.12)',
                        }}>
                        {n.type === 'order' ? <ShoppingCart size={14} style={{ color: BRAND.violet }} />
                          : n.type === 'delivery' ? <Check size={14} style={{ color: '#22c55e' }} />
                          : <Bell size={14} style={{ color: '#f59e0b' }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: txtPrim }}>{n.title}</p>
                        <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: txtSub }}>{n.message}</p>
                        <p className="text-[10px] mt-1 font-medium" style={{ color: dk ? '#5a5878' : '#c4c2d6' }}>
                          {new Date(n.created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-brand-violet shrink-0 mt-2" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dark toggle */}
            <ThemeToggle isDark={dk} onToggle={toggleDark}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: hoverBg, color: dk ? '#fbbf24' : '#8a87a3' }} />

            {/* Lang */}
            <LanguageMenu value={lang} onChange={handleSetLang} iconSize={14}
              buttonClassName="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all"
              buttonStyle={{ background: hoverBg, color: txtSub }}
              menuClassName="absolute right-0 top-full mt-2 rounded-2xl py-1.5 min-w-[156px] z-50 border"
              menuStyle={{ background: surface, borderColor: border, boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }}
              itemClassName="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2 transition-colors"
              itemStyle={a => ({ color: a ? BRAND.violet : txtPrim, background: a ? hoverBg : 'transparent' })}
              checkStyle={{ color: BRAND.violet }} />

            {/* Séparateur */}
            <div className="w-px h-6 mx-1 hidden sm:block" style={{ background: border }} />

            {/* Déconnexion */}
            <button onClick={() => supabase.auth.signOut()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: dk ? 'rgba(255,107,157,0.1)' : '#fff1f6', color: BRAND.pink }}
              title={t.logout}>
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Contenu */}
        <main className="flex-1 overflow-y-auto p-4 md:p-7 lg:p-9">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'biolink' && (
              <BioLink
                profile={profile}
                onUpdate={updates => setProfile(prev => prev ? { ...prev, ...updates } : prev)}
                onGoToSubscription={() => setActiveTab('subscription')}
              />
            )}
            {activeTab === 'themes' && (
              <Themes
                profile={profile}
                products={products}
                services={services}
                onUpdate={p => setProfile(prev => prev ? { ...prev, ...p } : prev)}
              />
            )}
            {activeTab === 'products' && (
              <Products profile={profile} products={products} onUpdate={setProducts} />
            )}
            {activeTab === 'qrcode' && (
              profile.plan_type === 'premium' ? (
                <QrCodeTab profile={profile} />
              ) : (
                <div className="max-w-2xl mx-auto rounded-3xl p-8 relative overflow-hidden text-center"
                  style={{ background: 'linear-gradient(135deg,#FF6B9D 0%,#8B5FBF 50%,#6C63FF 120%)' }}>
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
                  <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur">
                      <Crown size={28} color="#fff" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">
                      {lang === 'fr' ? 'QR Code réservé aux Premium' : 'QR Code — Premium only'}
                    </h2>
                    <p className="text-white/90 text-sm mb-6 max-w-md mx-auto">
                      {lang === 'fr'
                        ? 'Génère un QR code personnalisé, un poster A4 imprimable pour ton échoppe, ta carte de visite ou tes flyers. Disponible sur le forfait Premium.'
                        : 'Generate a custom QR code and a printable A4 poster for your shop, business card or flyers. Available on the Premium plan.'}
                    </p>
                    <button
                      onClick={() => setActiveTab('subscription')}
                      className="px-6 py-3 rounded-full font-bold bg-white text-sm shadow-lg hover:scale-105 transition-transform"
                      style={{ color: BRAND.violet }}>
                      {lang === 'fr' ? 'Passer au Premium' : 'Upgrade to Premium'}
                    </button>
                  </div>
                </div>
              )
            )}
            {activeTab === 'services' && (
              <Services profile={profile} services={services} onUpdate={setServices} />
            )}
            {activeTab === 'orders' && <Orders profile={profile} />}
            {activeTab === 'subscribers' && <Subscribers profile={profile} />}
            {activeTab === 'announcements' && profile.is_admin && <Announcements />}
            {activeTab === 'map' && <DashboardMap profile={profile} products={products} />}
            {activeTab === 'statistics' && <Statistics profile={profile} />}
            {activeTab === 'affiliate' && (
              <Affiliate
                profile={profile}
                onUpdate={updates => setProfile(prev => prev ? { ...prev, ...updates } : prev)}
              />
            )}
            {activeTab === 'wallet' && (
              <Wallet
                profile={profile}
                onBalanceUpdate={balance => setProfile(prev => prev ? { ...prev, wallet_balance: balance } : prev)}
              />
            )}
            {activeTab === 'subscription' && (
              <Subscription
                profile={profile}
                onPlanChange={(plan: PlanType) => setProfile(prev => prev ? { ...prev, plan_type: plan } : prev)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
    </FeedbackProvider>
  );
}
