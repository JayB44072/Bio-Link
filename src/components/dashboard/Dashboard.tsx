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
import {
  Link2, ShoppingBag, Briefcase, BarChart3, Wallet as WalletIcon, PackageSearch, MapPin,
  Crown, LogOut, Menu, X, Sun, Moon, Globe, Check, Sparkles, Bell, ShoppingCart,
} from 'lucide-react';
import { LandingLang } from '../../lib/landingTranslations';

const TABS = [
  { id: 'biolink',      icon: Link2,        accent: '#6C63FF' },
  { id: 'products',     icon: ShoppingBag,  accent: '#FF6B9D' },
  { id: 'services',     icon: Briefcase,    accent: '#00C2FF' },
  { id: 'orders',       icon: PackageSearch, accent: '#f59e0b' },
  { id: 'map',          icon: MapPin,       accent: '#22c55e' },
  { id: 'statistics',   icon: BarChart3,    accent: '#00C2FF' },
  { id: 'wallet',       icon: WalletIcon,   accent: '#6C63FF' },
  { id: 'subscription', icon: Crown,        accent: '#FF6B9D' },
] as const;

type TabId = typeof TABS[number]['id'];

const PLAN_STYLES: Record<PlanType, { grad: string; text: string }> = {
  free:     { grad: 'linear-gradient(135deg,#9ca3af,#6b7280)', text: '#fff' },
  starter:  { grad: 'linear-gradient(135deg,#6C63FF,#8B7CFF)', text: '#fff' },
  business: { grad: 'linear-gradient(135deg,#00C2FF,#6C63FF)', text: '#fff' },
  premium:  { grad: 'linear-gradient(135deg,#FF6B9D,#6C63FF)', text: '#fff' },
};

const LANG_OPTIONS: { code: LandingLang; label: string }[] = [
  { code: 'fr', label: '🇫🇷 Français'  },
  { code: 'en', label: '🇬🇧 English'   },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'de', label: '🇩🇪 Deutsch'   },
];

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
  const [langOpen, setLangOpen]   = useState(false);
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const TAB_LABELS: Record<TabId, string> = {
    biolink:      t.bioLink,
    products:     t.products,
    services:     t.services,
    orders:       'Commandes',
    map:          lang === 'de' ? 'Karte' : lang === 'pt' ? 'Carte' : lang === 'en' ? 'Map' : 'Carte',
    statistics:   t.statistics,
    wallet:       t.wallet,
    subscription: t.subscription,
  };

  function handleSetLang(l: LandingLang) {
    setLang(l);
    setDashLang(l as 'fr' | 'en');
    setLangOpen(false);
  }

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
          supabase.from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('services').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        ]);
        setProducts(prods || []);
        setServices(svcs || []);
        setNotifs((notifData || []) as Notification[]);
      }
      setLoading(false);
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
  const bg        = dk ? '#0b0b1e' : '#fbfaff';
  const surface   = dk ? '#12122b' : '#ffffff';
  const border    = dk ? 'rgba(139,124,255,0.14)' : '#efecfb';
  const txtPrim   = dk ? '#f2f1ff' : '#1a1a2e';
  const txtSub    = dk ? '#8c8ab0' : '#8a87a3';
  const hoverBg   = dk ? 'rgba(139,124,255,0.08)' : '#f6f4ff';
  const cardShadow= dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full animate-spin mx-auto mb-4"
            style={{ border: '3px solid rgba(108,99,255,0.15)', borderTopColor: '#6C63FF' }} />
          <p className="text-sm font-medium" style={{ color: txtSub }}>{t.loading}</p>
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
  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo du site */}
      <div className="px-6 pt-7 pb-6 shrink-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BioLinkWD" className="h-10 w-auto"
            style={{ filter: dk ? 'brightness(1.6)' : 'none' }}
            onError={e => { e.currentTarget.style.display = 'none'; }} />
          <div className="leading-tight">
            <p className="font-black text-[17px] tracking-tight" style={{ color: txtPrim }}>
              BioLink<span style={{ color: '#6C63FF' }}>WD</span>
            </p>
            <p className="text-[10px] font-bold tracking-wide" style={{ color: '#FF6B9D' }}>
              by WhiteDuckSaaS
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-1.5">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: txtSub }}>
          Menu
        </p>
        {TABS.map(({ id, icon: Icon, accent }) => {
          const active = activeTab === id;
          return (
            <button key={id}
              onClick={() => { setActiveTab(id); setSideOpen(false); }}
              className="relative w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[13.5px] font-semibold transition-all duration-200"
              style={{
                background: active ? `linear-gradient(135deg,${accent},${accent}cc)` : 'transparent',
                color: active ? '#fff' : txtSub,
                boxShadow: active ? `0 6px 18px ${accent}59` : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}>
              <Icon size={17} strokeWidth={active ? 2.4 : 2} />
              {TAB_LABELS[id]}
            </button>
          );
        })}
      </nav>

      {/* Carte solde — gradient signature */}
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

      {/* Utilisateur */}
      <div className="mx-4 mb-5 flex items-center gap-3 rounded-2xl p-3 border"
        style={{ borderColor: border, background: dk ? 'rgba(255,255,255,0.03)' : '#fdfcff' }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#FF6B9D)' }}>
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
    </div>
  );

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: bg }}>

      {/* ══ Sidebar desktop ══ */}
      <aside className="hidden md:flex w-[264px] shrink-0 flex-col"
        style={{ background: surface, borderRight: `1px solid ${border}` }}>
        <SidebarContent />
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
          <SidebarContent />
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
                  <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-pink-600 text-white text-[9px] font-black flex items-center justify-center">
                    {notifs.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-[340px] max-h-[420px] overflow-y-auto rounded-2xl border z-50"
                  style={{ background: surface, borderColor: border, boxShadow: '0 12px 40px rgba(0,0,0,0.18)' }}>
                  <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: border }}>
                    <h3 className="font-bold text-sm" style={{ color: txtPrim }}>
                      {lang === 'fr' ? 'Notifications' : 'Notifications'}
                    </h3>
                    {notifs.some(n => !n.is_read) && (
                      <button onClick={async () => {
                        const unread = notifs.filter(n => !n.is_read).map(n => n.id);
                        await supabase.from('notifications').update({ is_read: true }).in('id', unread);
                        setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
                      }}
                        className="text-[11px] font-bold transition" style={{ color: '#6C63FF' }}>
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
                        {n.type === 'order' ? <ShoppingCart size={14} style={{ color: '#6C63FF' }} />
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
            <button onClick={toggleDark}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: hoverBg, color: dk ? '#fbbf24' : '#8a87a3' }}>
              {dk ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Lang */}
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangOpen(v => !v)}
                className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold transition-all"
                style={{ background: hoverBg, color: txtSub }}>
                <Globe size={14} />{lang.toUpperCase()}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 rounded-2xl py-1.5 min-w-[156px] z-50 border"
                  style={{ background: surface, borderColor: border, boxShadow: '0 12px 32px rgba(0,0,0,0.14)' }}>
                  {LANG_OPTIONS.map(({ code, label }) => (
                    <button key={code} onClick={() => handleSetLang(code)}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-medium flex items-center gap-2 transition-colors"
                      style={{
                        color: lang === code ? '#6C63FF' : txtPrim,
                        background: lang === code ? hoverBg : 'transparent',
                      }}>
                      {label}
                      {lang === code && <Check size={12} className="ml-auto" style={{ color: '#6C63FF' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Séparateur */}
            <div className="w-px h-6 mx-1 hidden sm:block" style={{ background: border }} />

            {/* Déconnexion */}
            <button onClick={() => supabase.auth.signOut()}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
              style={{ background: dk ? 'rgba(255,107,157,0.1)' : '#fff1f6', color: '#FF6B9D' }}
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
                products={products}
                services={services}
                onUpdate={updates => setProfile(prev => prev ? { ...prev, ...updates } : prev)}
              />
            )}
            {activeTab === 'products' && (
              <Products profile={profile} products={products} onUpdate={setProducts} />
            )}
            {activeTab === 'services' && (
              <Services profile={profile} services={services} onUpdate={setServices} />
            )}
            {activeTab === 'orders' && <Orders profile={profile} />}
            {activeTab === 'map' && <DashboardMap profile={profile} products={products} />}
            {activeTab === 'statistics' && <Statistics profile={profile} />}
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
  );
}
