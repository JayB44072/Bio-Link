import React, { useState, useEffect, useRef } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../lib/LanguageContext';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import {
  ArrowLeft, Link2, Eye, EyeOff, Zap, Check,
  Sun, Moon, Globe, ShoppingBag, BarChart2,
} from 'lucide-react';
import { LandingLang } from '../../lib/landingTranslations';

/* ── Carousel slides ── */
const SLIDES = [
  {
    img: '/carroussel1.jpg',
    title: 'Ton bio link qui vend',
    sub: 'Une page personnalisée avec tous tes liens et ta boutique, partageable en un clic.',
  },
  {
    img: '/carroussel2.png',
    title: 'Reçois des paiements',
    sub: 'MTN Money, Orange Money ou carte bancaire — encaisse directement depuis ta page.',
  },
  {
    img: '/carroussel3.png',
    title: 'Suis tes performances',
    sub: 'Vues, ventes, revenus en temps réel. Toutes tes stats au même endroit.',
  },
];

function Carousel({ dk }: { dk: boolean }) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const go = (i: number) => setIdx((i + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    timer.current = setInterval(() => go(idx + 1), 4500);
    return () => clearInterval(timer.current);
  }, [idx]);

  const slide = SLIDES[idx];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Image */}
      <div className="relative flex-1 overflow-hidden rounded-2xl mx-2">
        {SLIDES.map((s, i) => (
          <img key={i} src={s.img} alt={s.title}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
            style={{ opacity: i === idx ? 1 : 0 }} />
        ))}
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 rounded-2xl"
          style={{ background: 'linear-gradient(to top,rgba(10,8,30,0.85) 0%,rgba(10,8,30,0.2) 50%,transparent 100%)' }} />

        {/* Text on image */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-white text-xl font-black mb-1 leading-snug">{slide.title}</h3>
          <p className="text-white/70 text-sm leading-relaxed">{slide.sub}</p>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-2 py-4">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => { clearInterval(timer.current); go(i); }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === idx ? 24 : 8, height: 8,
              background: i === idx ? '#6C63FF' : 'rgba(255,255,255,0.3)',
            }} />
        ))}
      </div>
    </div>
  );
}

interface AuthScreenProps {
  onAuth: () => void;
  onBack?: () => void;
  defaultMode?: 'login' | 'register';
}

const LANG_OPTIONS: { code: LandingLang; label: string }[] = [
  { code: 'fr', label: '🇫🇷 Français'  },
  { code: 'en', label: '🇬🇧 English'   },
  { code: 'pt', label: '🇵🇹 Português' },
  { code: 'de', label: '🇩🇪 Deutsch'   },
];

export default function AuthScreen({ onAuth, onBack, defaultMode = 'login' }: AuthScreenProps) {
  const { t: dashT } = useLang();
  const { isDark, lang, t: lt, toggleDark, setLang } = useAppPrefs();
  const dk = isDark;

  const [mode, setMode]                 = useState<'login' | 'register'>(defaultMode);
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [displayName, setDisplayName]   = useState('');
  const [username, setUsername]         = useState('');
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [langOpen, setLangOpen]         = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  /* Close lang dropdown on outside click */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* Capture ?ref=CODE on mount and persist it until signup completes */
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        localStorage.setItem('biolinkwd_pending_referral', ref.trim().toUpperCase());
      }
    } catch { /* noop */ }
  }, []);

  const sanitizeUsername = (v: string) => v.toLowerCase().replace(/[^a-z0-9-]/g, '');

  const switchMode = (m: 'login' | 'register') => {
    setMode(m); setError('');
    setEmail(''); setPassword(''); setConfirm('');
    setDisplayName(''); setUsername('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError(dashT.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth();
      } else {
        const { data: existing } = await supabase
          .from('profiles').select('id').eq('username', username).maybeSingle();
        if (existing) { setError(dashT.usernameTaken); setLoading(false); return; }
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          // const password_hash = await bcrypt.hash(password, 10);
          const password_hash = password;
          //je vais revenir plutard hasher les mots de passe en remplacant password par password_hash

          // Resolve pending referral code → referrer profile id
          let referredBy: string | null = null;
          try {
            const pendingRef = localStorage.getItem('biolinkwd_pending_referral');
            if (pendingRef) {
              const { data: referrer } = await supabase
                .from('profiles').select('id').eq('referral_code', pendingRef).maybeSingle();
              if (referrer?.id) referredBy = referrer.id as string;
            }
          } catch { /* noop */ }

          // Generate a unique 8-char referral code for the new user
          const newReferralCode = (
            Math.random().toString(36) + Date.now().toString(36)
          ).replace(/[^a-z0-9]/gi, '').slice(0, 8).toUpperCase();

          await supabase.from('profiles').insert({
            user_id: data.user.id,
            username,
            display_name: displayName,
            plan_type: 'free',
            password_hash,
            referral_code: newReferralCode,
            referred_by: referredBy,
          });

          try { localStorage.removeItem('biolinkwd_pending_referral'); } catch { /* noop */ }
        }
        onAuth();
      }
    } catch (err: any) {
      setError(err.message || dashT.error);
    } finally {
      setLoading(false);
    }
  }

  /* ── Theme colours ── */
  const bg         = dk ? '#080818' : '#f8f7ff';
  const panelBg    = dk ? '#0d0d22' : '#ffffff';
  const border     = dk ? '#1e1e3f' : '#e5e7eb';
  const txtPrim    = dk ? '#f0f0ff' : '#111827';
  const txtSub     = dk ? '#8b8bab' : '#6b7280';
  const inputBg    = dk ? '#111128' : '#f9fafb';
  const inputBorder= dk ? '#1e1e3f' : '#e5e7eb';
  const inputFocus = 'focus:outline-none focus:ring-2 focus:ring-brand-violet/25 focus:border-brand-violet';
  const inputCls   = `w-full rounded-xl px-4 py-3 text-sm transition-all border ${inputFocus}`;

  return (
    <div className="min-h-screen flex" style={{ background: bg }}>

      {/* ══ LEFT PANEL — carousel (desktop only) ══ */}
      <div className="hidden lg:flex flex-col w-[46%] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#0d0820 0%,#1a1a40 50%,#0d0820 100%)' }}>

        {/* Dot grid */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'radial-gradient(white 1.5px,transparent 1.5px)', backgroundSize: '28px 28px' }} />
        {/* Blobs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle,#6C63FF,transparent)' }} />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle,#00C2FF,transparent)' }} />

        <div className="relative z-10 flex flex-col h-full px-8 pt-8 pb-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <img src="/logo.png" alt="BioLinkWD" className="h-9 w-auto brightness-200"
              onError={e => { e.currentTarget.style.display = 'none'; }} />
            <div>
              <span className="text-white font-bold text-xl">BioLinkWD</span>
              <p className="text-xs font-semibold" style={{ color: '#6C63FF' }}>by WhiteDuckSaaS</p>
            </div>
          </div>

          {/* Carousel */}
          <Carousel dk={dk} />

          {/* Features strip */}
          <div className="shrink-0 grid grid-cols-3 gap-3 mt-2">
            {[
              { icon: <ShoppingBag size={18} />, label: lt.feat2Tag },
              { icon: <Link2 size={18} />, label: 'Bio Link' },
              { icon: <BarChart2 size={18} />, label: lt.feat3Tag },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2"
                style={{ background: 'rgba(255,255,255,0.06)' }}>
                <span className="text-white/70">{icon}</span>
                <span className="text-xs text-white/60 font-medium text-center">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL — form ══ */}
      <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: panelBg }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{ borderColor: border }}>
          <div className="flex items-center gap-4">
            {onBack && (
              <button onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors shrink-0"
                style={{ color: txtSub }}
                onMouseEnter={e => (e.currentTarget.style.color = '#6C63FF')}
                onMouseLeave={e => (e.currentTarget.style.color = txtSub)}>
                <ArrowLeft size={16} />{lt.navFeatures === 'Fonctionnalités' ? 'Retour' : 'Back'}
              </button>
            )}
            {/* Logo + titre — toujours visible */}
            <div className="flex items-center gap-2.5">
              <img src="/logo.png" alt="BioLinkWD" className="h-8 w-auto"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <div className="leading-tight">
                <span className="font-black text-base tracking-tight" style={{ color: txtPrim }}>BioLinkWD</span>
                <p className="text-[10px] font-semibold" style={{ color: '#6C63FF' }}>by WhiteDuckSaaS</p>
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button onClick={toggleDark}
              className="p-2 rounded-xl transition-colors"
              style={{ background: dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: dk ? '#fbbf24' : '#6b7280' }}>
              {dk ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Language selector */}
            <div className="relative" ref={langRef}>
              <button onClick={() => setLangOpen(v => !v)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ background: dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6', color: txtSub }}>
                <Globe size={13} />{lang.toUpperCase()}
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 rounded-xl shadow-xl border py-1 min-w-[144px] z-50"
                  style={{ background: panelBg, borderColor: border }}>
                  {LANG_OPTIONS.map(({ code, label }) => (
                    <button key={code}
                      onClick={() => { setLang(code); setLangOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                      style={{
                        color: lang === code ? '#6C63FF' : txtPrim,
                        background: lang === code ? (dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff') : 'transparent',
                      }}>
                      {label}
                      {lang === code && <Check size={11} className="ml-auto text-brand-violet" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Switch mode shortcut */}
            <span className="hidden sm:flex items-center gap-1.5 text-sm" style={{ color: txtSub }}>
              {mode === 'login' ? (
                <><span>{lt.navRegister === "S'inscrire" ? 'Pas de compte ?' : 'No account?'}</span>
                  <button onClick={() => switchMode('register')}
                    className="font-semibold text-brand-violet hover:underline">{lt.navRegister}</button></>
              ) : (
                <><span>{lt.navLogin === 'Connexion' ? 'Déjà un compte ?' : 'Already registered?'}</span>
                  <button onClick={() => switchMode('login')}
                    className="font-semibold text-brand-violet hover:underline">{lt.navLogin}</button></>
              )}
            </span>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">

            {/* Heading */}
            <div className="mb-7">
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-4 border"
                style={{ background: dk ? 'rgba(108,99,255,0.12)' : '#f5f3ff', borderColor: dk ? 'rgba(108,99,255,0.25)' : '#ede9fe' }}>
                <Zap size={12} className="text-brand-violet" />
                <span className="text-xs font-semibold text-brand-violet">
                  {mode === 'login'
                    ? (lang === 'de' ? 'Willkommen zurück!' : lang === 'pt' ? 'Bem-vindo de volta!' : lang === 'en' ? 'Welcome back!' : 'Bon retour !')
                    : (lang === 'de' ? 'Kostenlos starten' : lang === 'pt' ? 'Começa grátis' : lang === 'en' ? 'Join BioLinkWD' : 'Rejoins BioLinkWD')}
                </span>
              </div>
              <h1 className="text-3xl font-black mb-2" style={{ color: txtPrim }}>
                {mode === 'login' ? lt.navLogin : lt.navRegister}
              </h1>
              <p className="text-sm" style={{ color: txtSub }}>
                {mode === 'login'
                  ? (lang === 'de' ? 'Melde dich an, um deine Boutique zu verwalten.'
                     : lang === 'pt' ? 'Entra para gerir a tua loja e bio link.'
                     : lang === 'en' ? 'Log in to manage your store and bio link.'
                     : 'Connecte-toi pour gérer ta boutique et ton bio link.')
                  : (lang === 'de' ? 'Erstelle dein Konto kostenlos und starte in 2 Minuten.'
                     : lang === 'pt' ? 'Cria a tua conta grátis e começa em 2 minutos.'
                     : lang === 'en' ? 'Create your free account and go live in 2 minutes.'
                     : 'Crée ton compte gratuitement et lance-toi en 2 minutes.')}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 mb-5 flex items-start gap-2 border"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.2)' }}>
                <span className="text-red-500 mt-0.5 shrink-0 text-sm">⚠</span>
                <p className="text-red-500 text-sm">{error}</p>
              </div>
            )}

            {/* Google OAuth */}
            <button type="button" disabled={loading}
              onClick={async () => {
                setError(''); setLoading(true);
                const { error: err } = await supabase.auth.signInWithOAuth({
                  provider: 'google', options: { redirectTo: window.location.origin },
                });
                if (err) { setError(err.message); setLoading(false); }
              }}
              className="w-full flex items-center justify-center gap-3 font-semibold py-3.5 rounded-xl transition-all border-2 shadow-sm mb-5 disabled:opacity-50"
              style={{
                background: dk ? '#111128' : '#fff',
                borderColor: dk ? '#1e1e3f' : '#e5e7eb',
                color: dk ? '#f0f0ff' : '#374151',
              }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.638-.057-1.252-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.252 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              {loading ? '...' : (mode === 'login' ? 'Google' : 'Google')}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px" style={{ background: border }} />
              <span className="text-xs font-medium" style={{ color: txtSub }}>
                {lang === 'de' ? 'oder per E-Mail' : lang === 'pt' ? 'ou por email' : lang === 'en' ? 'or by email' : 'ou par email'}
              </span>
              <div className="flex-1 h-px" style={{ background: border }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: txtPrim }}>{dashT.displayName}</label>
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      required placeholder="Ex : nom"
                      className={inputCls}
                      style={{ background: inputBg, borderColor: inputBorder, color: txtPrim }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: txtPrim }}>{dashT.username}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: txtSub }}>@</span>
                      <input type="text" value={username}
                        onChange={e => setUsername(sanitizeUsername(e.target.value))}
                        required placeholder="mon-username"
                        className={`${inputCls} pl-8`}
                        style={{ background: inputBg, borderColor: inputBorder, color: txtPrim }} />
                    </div>
                    <p className="text-xs mt-1.5" style={{ color: txtSub }}>{dashT.usernameHelper}</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: txtPrim }}>{dashT.email}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="vous@exemple.com"
                  className={inputCls}
                  style={{ background: inputBg, borderColor: inputBorder, color: txtPrim }} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium" style={{ color: txtPrim }}>{dashT.password}</label>
                  {mode === 'login' && (
                    <button type="button" className="text-xs font-medium text-brand-violet hover:underline">
                      {lang === 'de' ? 'Passwort vergessen?' : lang === 'pt' ? 'Esqueceu a senha?' : lang === 'en' ? 'Forgot password?' : 'Mot de passe oublié ?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    className={`${inputCls} pr-11`}
                    style={{ background: inputBg, borderColor: inputBorder, color: txtPrim }} />
                  <button type="button" tabIndex={-1} onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: txtSub }}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: txtPrim }}>{dashT.confirmPassword}</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirm(e.target.value)}
                      required placeholder="••••••••"
                      className={`${inputCls} pr-11`}
                      style={{ background: inputBg, borderColor: inputBorder, color: txtPrim }} />
                    <button type="button" tabIndex={-1} onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: txtSub }}>
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {[4,6,8,10].map((threshold, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{ background: password.length >= threshold
                            ? ['#ef4444','#f97316','#eab308','#22c55e'][i]
                            : (dk ? '#1e1e3f' : '#e5e7eb') }} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-purple-200/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-2"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === 'login' ? dashT.loggingIn : dashT.registering}
                    </span>
                  : (mode === 'login' ? dashT.loginAction : dashT.registerAction)
                }
              </button>
            </form>

            {/* Switch mode — mobile */}
            <p className="text-center text-sm mt-6" style={{ color: txtSub }}>
              {mode === 'login' ? (
                <>{lang === 'de' ? 'Noch kein Konto?' : lang === 'pt' ? 'Ainda sem conta?' : lang === 'en' ? 'No account yet?' : 'Pas encore de compte ?'}{' '}
                  <button onClick={() => switchMode('register')} className="font-semibold text-brand-violet hover:underline">{lt.navRegister}</button></>
              ) : (
                <>{lang === 'de' ? 'Bereits ein Konto?' : lang === 'pt' ? 'Já tem conta?' : lang === 'en' ? 'Already have an account?' : 'Déjà un compte ?'}{' '}
                  <button onClick={() => switchMode('login')} className="font-semibold text-brand-violet hover:underline">{lt.navLogin}</button></>
              )}
            </p>

            {/* Legal */}
            <p className="text-center text-xs mt-8" style={{ color: dk ? '#4b4b6b' : '#9ca3af' }}>
              {lang === 'de' ? 'Mit dem Fortfahren stimmst du unseren ' : lang === 'pt' ? 'Ao continuar, aceitas os nossos ' : lang === 'en' ? 'By continuing you accept our ' : 'En continuant, tu acceptes nos '}
              <a href="/confidentialite" className="hover:text-brand-violet underline transition-colors">
                {lang === 'de' ? 'AGB' : lang === 'pt' ? 'Termos' : lang === 'en' ? 'Terms' : 'CGU'}
              </a>{' '}
              {lang === 'de' ? 'und unsere' : lang === 'pt' ? 'e' : lang === 'en' ? 'and' : 'et notre'}{' '}
              <a href="/confidentialite" className="hover:text-brand-violet underline transition-colors">
                {lang === 'de' ? 'Datenschutzerklärung' : lang === 'pt' ? 'Política de Privacidade' : lang === 'en' ? 'Privacy Policy' : 'Politique de confidentialité'}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
