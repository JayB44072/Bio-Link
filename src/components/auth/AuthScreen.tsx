import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useLang } from '../../lib/LanguageContext';
import { useAppPrefs } from '../../lib/AppPrefsContext';
import { ArrowLeft, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BRAND, GRADIENTS, NEUTRAL } from '../../lib/theme';
import type { LandingLang } from '../../lib/landingTranslations';
import LanguageMenu from '../ui/LanguageMenu';
import ThemeToggle from '../ui/ThemeToggle';
import { TextField, PasswordField, StrengthBar, type FieldPalette } from '../ui/FormField';
import ShoeShowcase from './ShoeShowcase';

/* ── Textes de l'écran (hors traductions du dashboard) ── */
type Copy = {
  welcomeBack: string; pwdHint: string;
  loginSub: string; registerSub: string;
  orEmail: string; google: string; forgot: string;
  resetNeedsEmail: string; resetSent: string;
  noAccount: string; hasAccount: string; back: string;
  showPwd: string; hidePwd: string;
  legalPre: string; terms: string; legalAnd: string; privacy: string;
};

const COPY: Record<LandingLang, Copy> = {
  fr: {
    welcomeBack: 'Bon retour !', pwdHint: '6 caractères minimum.',
    loginSub: 'Connecte-toi pour gérer ta boutique et ton bio link.',
    registerSub: 'Crée ton compte gratuitement et lance-toi en 2 minutes.',
    orEmail: 'ou par email', google: 'Google', forgot: 'Mot de passe oublié ?',
    resetNeedsEmail: 'Saisis ton email ci-dessus pour recevoir le lien.',
    resetSent: "Si ce compte existe, un lien de réinitialisation vient d'être envoyé.",
    noAccount: 'Pas encore de compte ?', hasAccount: 'Déjà un compte ?', back: 'Retour',
    showPwd: 'Afficher le mot de passe', hidePwd: 'Masquer le mot de passe',
    legalPre: 'En continuant, tu acceptes nos ', terms: 'CGU', legalAnd: ' et notre ', privacy: 'Politique de confidentialité',
  },
  en: {
    welcomeBack: 'Welcome back!', pwdHint: 'At least 6 characters.',
    loginSub: 'Log in to manage your store and bio link.',
    registerSub: 'Create your free account and go live in 2 minutes.',
    orEmail: 'or by email', google: 'Google', forgot: 'Forgot password?',
    resetNeedsEmail: 'Enter your email above to get the link.',
    resetSent: 'If this account exists, a reset link has been sent.',
    noAccount: 'No account yet?', hasAccount: 'Already have an account?', back: 'Back',
    showPwd: 'Show password', hidePwd: 'Hide password',
    legalPre: 'By continuing you accept our ', terms: 'Terms', legalAnd: ' and ', privacy: 'Privacy Policy',
  },
  pt: {
    welcomeBack: 'Bem-vindo de volta!', pwdHint: 'Mínimo de 6 caracteres.',
    loginSub: 'Entra para gerir a tua loja e bio link.',
    registerSub: 'Cria a tua conta grátis e começa em 2 minutos.',
    orEmail: 'ou por email', google: 'Google', forgot: 'Esqueceu a senha?',
    resetNeedsEmail: 'Indica o teu email acima para receber o link.',
    resetSent: 'Se esta conta existir, enviámos um link de redefinição.',
    noAccount: 'Ainda sem conta?', hasAccount: 'Já tem conta?', back: 'Voltar',
    showPwd: 'Mostrar senha', hidePwd: 'Ocultar senha',
    legalPre: 'Ao continuar, aceitas os nossos ', terms: 'Termos', legalAnd: ' e ', privacy: 'Política de Privacidade',
  },
  de: {
    welcomeBack: 'Willkommen zurück!', pwdHint: 'Mindestens 6 Zeichen.',
    loginSub: 'Melde dich an, um deine Boutique zu verwalten.',
    registerSub: 'Erstelle dein Konto kostenlos und starte in 2 Minuten.',
    orEmail: 'oder per E-Mail', google: 'Google', forgot: 'Passwort vergessen?',
    resetNeedsEmail: 'Gib oben deine E-Mail ein, um den Link zu erhalten.',
    resetSent: 'Falls das Konto existiert, wurde ein Link zum Zurücksetzen gesendet.',
    noAccount: 'Noch kein Konto?', hasAccount: 'Bereits ein Konto?', back: 'Zurück',
    showPwd: 'Passwort anzeigen', hidePwd: 'Passwort verbergen',
    legalPre: 'Mit dem Fortfahren stimmst du unseren ', terms: 'AGB', legalAnd: ' und unserer ', privacy: 'Datenschutzerklärung',
  },
};

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
    <path d="M17.64 9.2c0-.638-.057-1.252-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.252 17.64 11.945 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

interface AuthScreenProps {
  onAuth: () => void;
  onBack?: () => void;
  defaultMode?: 'login' | 'register';
}

type Mode = 'login' | 'register';

/** Identifiant public (/u/...) tiré de l'email ; un suffixe est ajouté s'il est déjà pris. */
async function pickUsername(email: string): Promise<string> {
  const base = (email.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'user';
  let candidate = base;
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('username', candidate).maybeSingle();
    if (!existing) return candidate;
    candidate = `${base}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

export default function AuthScreen({ onAuth, onBack, defaultMode = 'login' }: AuthScreenProps) {
  const { t: dashT } = useLang();
  const { isDark: dk, lang, t: lt, toggleDark, setLang } = useAppPrefs();
  const copy = COPY[lang] ?? COPY.fr;

  const [mode, setMode]               = useState<Mode>(defaultMode);
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [info, setInfo]               = useState('');

  const isRegister = mode === 'register';

  /* Capture ?ref=CODE on mount and persist it until signup completes */
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) localStorage.setItem('biolinkwd_pending_referral', ref.trim().toUpperCase());
    } catch { /* noop */ }
  }, []);

  const switchMode = (m: Mode) => {
    setMode(m); setError(''); setInfo('');
    setEmail(''); setPassword('');
  };

  async function handleForgotPassword() {
    setError(''); setInfo('');
    if (!email) {
      setError(copy.resetNeedsEmail);
      document.getElementById('auth-email')?.focus();
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setInfo(copy.resetSent);
  }

  async function handleGoogle() {
    setError(''); setInfo(''); setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.origin },
    });
    if (err) { setError(err.message); setLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setInfo('');
    setLoading(true);
    try {
      if (!isRegister) {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onAuth();
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.user) {
          const username = await pickUsername(email);
          const displayName = email.split('@')[0] || username;
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
    } catch (err) {
      setError((err as { message?: string } | null)?.message || dashT.error);
    } finally {
      setLoading(false);
    }
  }

  /* ── Theme ── */
  const N = dk ? NEUTRAL.dark : NEUTRAL.light;
  const bg      = dk ? NEUTRAL.dark.page : NEUTRAL.light.page;
  const panelBg = N.surface;
  const border  = N.border;
  const txtPrim = N.text;
  const txtSub  = N.textMuted;
  const softBtn = dk ? 'rgba(255,255,255,0.08)' : '#f3f4f6';
  const palette: FieldPalette = {
    label: txtPrim, helper: txtSub, inputBg: N.inputBg, inputBorder: border,
    inputText: txtPrim, toggle: txtSub,
  };
  const errId = error ? 'auth-error' : undefined;
  const linkCls = 'font-semibold text-brand-violet hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet';

  const switchPrompt = (
    <>
      {isRegister ? copy.hasAccount : copy.noAccount}{' '}
      <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')} className={linkCls}>
        {isRegister ? lt.navLogin : lt.navRegister}
      </button>
    </>
  );

  return (
    <div className="h-[100dvh] flex overflow-hidden" style={{ background: bg }}>

      <ShoeShowcase />

      {/* ══ RIGHT PANEL — form ══ */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ background: panelBg }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: border }}>
          <div className="flex items-center gap-4">
            {onBack && (
              <button type="button" onClick={onBack}
                className="flex items-center gap-1.5 text-sm font-medium transition-colors shrink-0 hover:text-brand-violet rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
                style={{ color: txtSub }}>
                <ArrowLeft size={16} aria-hidden />{copy.back}
              </button>
            )}
            <div className="flex items-center gap-2.5">
              <img src="/logo-sm.png" alt="BioLinkWD" className="h-8 w-auto"
                onError={e => { e.currentTarget.style.display = 'none'; }} />
              <div className="leading-tight">
                <span className="font-black text-base tracking-tight" style={{ color: txtPrim }}>BioLinkWD</span>
                <p className="text-[10px] font-semibold text-brand-violet">by WhiteDuckSaaS</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle isDark={dk} onToggle={toggleDark} label={dk ? lt.darkOff : lt.darkOn}
              className="p-2 rounded-xl transition-colors"
              style={{ background: softBtn, color: dk ? '#fbbf24' : '#6b7280' }} />
            <LanguageMenu value={lang} onChange={setLang} iconSize={13}
              buttonClassName="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
              buttonStyle={{ background: softBtn, color: txtSub }}
              menuClassName="absolute right-0 top-full mt-2 rounded-xl shadow-xl border py-1 min-w-[144px] z-50"
              menuStyle={{ background: panelBg, borderColor: border }}
              itemStyle={a => ({
                color: a ? BRAND.violet : txtPrim,
                background: a ? (dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff') : 'transparent',
              })}
              checkSize={11} checkClassName="ml-auto text-brand-violet" />
            <span className="hidden sm:flex items-center gap-1.5 text-sm" style={{ color: txtSub }}>
              {switchPrompt}
            </span>
          </div>
        </div>

        {/* Form area — centré, défile uniquement si l'écran est vraiment trop petit */}
        <div className="flex-1 min-h-0 overflow-y-auto flex">
          <div className={`m-auto w-full px-6 py-5 ${isRegister ? 'max-w-lg' : 'max-w-md'}`}>

            {/* Heading */}
            <div className="mb-5 text-center">
              {!isRegister && (
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-3 border"
                  style={{ background: dk ? 'rgba(108,99,255,0.12)' : '#f5f3ff', borderColor: dk ? 'rgba(108,99,255,0.25)' : '#ede9fe' }}>
                  <Zap size={12} aria-hidden className="text-brand-violet" />
                  <span className="text-xs font-semibold text-brand-violet">{copy.welcomeBack}</span>
                </div>
              )}
              <h1 className="text-3xl font-black mb-1.5" style={{ color: txtPrim }}>
                {isRegister ? lt.navRegister : lt.navLogin}
              </h1>
              <p className="text-sm" style={{ color: txtSub }}>
                {isRegister ? copy.registerSub : copy.loginSub}
              </p>
            </div>

            {error && (
              <div id="auth-error" role="alert" className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5 border"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
                <AlertCircle size={18} aria-hidden className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-sm" style={{ color: dk ? '#fca5a5' : '#b91c1c' }}>{error}</p>
              </div>
            )}
            {info && (
              <div role="status" className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5 border"
                style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.25)' }}>
                <CheckCircle2 size={18} aria-hidden className="text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm" style={{ color: dk ? '#86efac' : '#15803d' }}>{info}</p>
              </div>
            )}

            {/* Google OAuth */}
            <button type="button" disabled={loading} onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 font-semibold py-3 rounded-xl transition-all border-2 shadow-sm mb-4 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
              style={{ background: dk ? NEUTRAL.dark.inputBg : '#fff', borderColor: border, color: dk ? txtPrim : '#374151' }}>
              <GoogleIcon />{copy.google}
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px" style={{ background: border }} />
              <span className="text-xs font-medium" style={{ color: txtSub }}>{copy.orEmail}</span>
              <div className="flex-1 h-px" style={{ background: border }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5" aria-busy={loading}>
              <TextField id="auth-email" name="email" type="email" required inputMode="email"
                autoComplete={isRegister ? 'email' : 'username'} autoCapitalize="none" spellCheck={false}
                label={dashT.email} value={email} onChange={setEmail}
                placeholder="vous@exemple.com" invalid={!!error} describedBy={errId} palette={palette} />

              <PasswordField id="auth-password" name="password" required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 6 : undefined}
                label={dashT.password} value={password} onChange={setPassword}
                placeholder="••••••••" invalid={!!error} describedBy={errId} palette={palette}
                helper={isRegister ? copy.pwdHint : undefined}
                showLabel={copy.showPwd} hideLabel={copy.hidePwd}
                labelAction={!isRegister && (
                  <button type="button" onClick={handleForgotPassword} disabled={loading}
                    className="text-xs font-medium text-brand-violet hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet">
                    {copy.forgot}
                  </button>
                )}
                footer={isRegister && <StrengthBar length={password.length} emptyColor={dk ? NEUTRAL.dark.border : '#e5e7eb'} />} />

              <button type="submit" disabled={loading}
                className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-200/40 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-violet"
                style={{ background: GRADIENTS.brand }}>
                {loading
                  ? <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isRegister ? dashT.registering : dashT.loggingIn}
                    </span>
                  : (isRegister ? dashT.registerAction : dashT.loginAction)}
              </button>
            </form>

            {/* Switch mode — mobile (sur desktop le lien est dans la barre du haut) */}
            <p className="sm:hidden text-center text-sm mt-4" style={{ color: txtSub }}>{switchPrompt}</p>

            {/* Legal */}
            <p className="text-center text-xs mt-4" style={{ color: txtSub }}>
              {copy.legalPre}
              <a href="/cgu" className="hover:text-brand-violet underline transition-colors">{copy.terms}</a>
              {copy.legalAnd}
              <a href="/confidentialite" className="hover:text-brand-violet underline transition-colors">{copy.privacy}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
