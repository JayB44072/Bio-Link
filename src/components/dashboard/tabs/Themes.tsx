import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Profile, Product, Service } from '../../../lib/types';
import { PLAN_CONFIGS, THEMES, SHOP_THEMES } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import PublicProfileView from '../../public/PublicProfileView';
import { Lock, Crown, Palette, Link2 } from 'lucide-react';
import { dashPalette } from '../../../lib/dashPalette';
import Modal from '../../ui/Modal';
import ThemeCard from './themes/ThemeCard';
import Segmented from '../../ui/Segmented';
import { deriveHero3DStyle, formatThemeValue, parseThemeValue } from '../../../lib/shopTheme';

// Le sélecteur embarque three.js : chargé seulement quand un thème avec héros 3D est choisi
const HeroProductPicker = lazy(() => import('./themes/HeroProductPicker'));

interface ThemesProps {
  profile: Profile;
  products: Product[];
  services: Service[];
  onUpdate: (patch: Partial<Profile>) => void;
}

export default function Themes({ profile, products, services, onUpdate }: ThemesProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();

  const saved = parseThemeValue(profile.theme);
  const [selectedTheme, setSelectedTheme] = useState<string>(saved.themeId);
  const [selectedModel, setSelectedModel] = useState<string | null>(saved.modelId);
  const [use3d, setUse3d] = useState<boolean>(saved.use3d);
  // Animation 3D : au défilement par défaut ; la boucle automatique reste le choix d'un réglage déjà enregistré
  const [scrollMode, setScrollMode] = useState<boolean>(saved.scroll || !(saved.use3d || SHOP_THEMES[saved.themeId]?.hero3d));
  const [saving, setSaving] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [attemptedPremiumTheme, setAttemptedPremiumTheme] = useState('');

  const plan = PLAN_CONFIGS[profile.plan_type];
  const canCustomizeTheme = plan.custom_themes;

  /* ── Theme tokens ── */
  const { surface, surfaceAlt, border, txtPrim, txtLabel, txtSub } = dashPalette(dk);

  /** Enregistre le thème (et le héros 3D) dans profiles.theme, pour les forfaits qui personnalisent le thème. */
  async function persist(themeId: string, modelId: string | null, with3d = use3d, withScroll = scrollMode) {
    const theme = THEMES.find(th => th.id === themeId);
    // Les forfaits sans personnalisation peuvent seulement prévisualiser les thèmes non gratuits
    if (!canCustomizeTheme && !theme?.free) return;
    const active3d = with3d || !!SHOP_THEMES[themeId]?.hero3d;
    const value = formatThemeValue(themeId, modelId, with3d, active3d && withScroll);
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ theme: value, updated_at: new Date().toISOString() })
      .eq('user_id', profile.user_id);
    setSaving(false);
    if (!error) onUpdate({ theme: value });
  }

  async function handleThemeSelect(themeId: string) {
    const theme = THEMES.find(th => th.id === themeId);
    if (theme?.premium && profile.plan_type !== 'premium') {
      setAttemptedPremiumTheme(themeId);
      setPremiumModalOpen(true);
      return;
    }
    setSelectedTheme(themeId);
    await persist(themeId, selectedModel);
  }

  async function handleModelSelect(modelId: string | null) {
    setSelectedModel(modelId);
    await persist(selectedTheme, modelId);
  }

  /** Les thèmes Showroom ont la 3D d'office ; sur les autres c'est une option Premium. */
  const themeHas3d = !!SHOP_THEMES[selectedTheme]?.hero3d;
  const show3dPicker = themeHas3d || use3d;
  const pickerAccent = SHOP_THEMES[selectedTheme]?.hero3d?.accent ?? deriveHero3DStyle(SHOP_THEMES[selectedTheme] ?? SHOP_THEMES.default).accent;

  async function handle3dToggle() {
    if (profile.plan_type !== 'premium') {
      setAttemptedPremiumTheme('__hero3d');
      setPremiumModalOpen(true);
      return;
    }
    const next = !use3d;
    setUse3d(next);
    await persist(selectedTheme, selectedModel, next);
  }

  // Textes des produits actifs, pour l'option « Auto » du sélecteur
  const heroHints = useMemo(
    () => products.filter(p => p.is_active).slice(0, 12).flatMap(p => [p.name, p.category ?? '']),
    [products],
  );
  async function handleScrollMode(next: boolean) {
    setScrollMode(next);
    await persist(selectedTheme, selectedModel, use3d, next);
  }

  const heroImages = useMemo(
    () => products.filter(p => p.is_active && p.image_url).slice(0, 5).map(p => p.image_url),
    [products],
  );

  const previewProfile = { ...profile, theme: formatThemeValue(selectedTheme, selectedModel, use3d, show3dPicker && scrollMode) };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* ── Theme grid ── */}
      <div className="flex-1 space-y-6">
        <div className="rounded-3xl p-5 md:p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#a855f7 0%,#6C63FF 55%,#00C2FF 120%)' }}>
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <Palette size={15} color="#fff" />
              </span>
              <h2 className="text-white font-black text-base">
                {lang === 'fr' ? 'Personnalisez votre boutique' : 'Customize your shop'}
              </h2>
            </div>
            <p className="text-white/85 text-sm leading-relaxed">
              {lang === 'fr'
                ? 'Choisissez un thème visuel pour votre page publique. Un aperçu en direct s\'affiche à côté.'
                : 'Choose a visual theme for your public page. A live preview appears next to it.'}
            </p>
          </div>
        </div>

        {!canCustomizeTheme && (
          <div className="flex items-start gap-2 rounded-xl px-4 py-3"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Lock size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-amber-500 text-xs font-medium">
              {lang === 'fr'
                ? 'Vous pouvez tester tous les thèmes en aperçu. Passez au Starter pour les enregistrer.'
                : 'You can preview any theme. Upgrade to Starter to save your choice.'}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-3" style={{ color: txtLabel }}>
            {t.theme}
          </label>
          <div role="radiogroup" aria-label={t.theme} className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {THEMES.map(theme => (
              <ThemeCard
                key={theme.id}
                label={theme.label[lang as 'fr' | 'en']}
                config={SHOP_THEMES[theme.id] ?? SHOP_THEMES.default}
                dark={dk}
                selected={selectedTheme === theme.id}
                current={saved.themeId === theme.id}
                locked={theme.premium && profile.plan_type !== 'premium'}
                currentLabel={lang === 'fr' ? 'ACTUEL' : 'CURRENT'}
                premiumLabel="Premium"
                onSelect={() => handleThemeSelect(theme.id)}
                txtPrim={txtPrim}
                border={dk ? 'rgba(255,255,255,0.08)' : '#eeecfb'}
                surface={surface}
              />
            ))}
          </div>

          {!themeHas3d && (
            <button type="button" role="switch" aria-checked={use3d} onClick={handle3dToggle}
              className="mt-4 w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a855f7]"
              style={{ background: surface, border: `1px solid ${use3d ? '#a855f7' : border}` }}>
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 text-sm font-bold" style={{ color: txtPrim }}>
                  {lang === 'fr' ? 'Héros 3D' : '3D hero'}
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                    <Crown size={9} className="text-white" strokeWidth={2.5} />
                    <span className="text-[8px] font-black text-white uppercase tracking-wider">Premium</span>
                  </span>
                </span>
                <span className="block text-xs mt-0.5" style={{ color: txtSub }}>
                  {lang === 'fr' ? 'Un produit 3D qui se décompose en pièces, à la place des photos.' : 'A 3D product that breaks into parts, instead of photos.'}
                </span>
              </span>
              <span className="relative w-11 h-6 rounded-full shrink-0 transition-colors" style={{ background: use3d ? '#a855f7' : (dk ? 'rgba(255,255,255,0.18)' : '#d4d4dc') }}>
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: use3d ? 22 : 2 }} />
              </span>
            </button>
          )}

          {show3dPicker && SHOP_THEMES[selectedTheme]?.heroMode !== 'scroll' && (
            <div className="mt-4">
              <Segmented
                label={lang === 'fr' ? 'Animation du héros 3D' : '3D hero animation'}
                value={scrollMode ? 'scroll' : 'loop'}
                onChange={v => handleScrollMode(v === 'scroll')}
                options={[
                  { value: 'scroll', label: lang === 'fr' ? 'Au défilement' : 'On scroll', hint: lang === 'fr' ? 'Le visiteur fait défiler : le produit s’éclate (comme au cinéma)' : 'The visitor scrolls: the product breaks apart (cinematic)' },
                  { value: 'loop', label: lang === 'fr' ? 'Boucle automatique' : 'Auto loop', hint: lang === 'fr' ? 'Le produit s’anime tout seul, en continu' : 'The product animates on its own, continuously' },
                ]}
                accent="#a855f7" txtPrim={txtPrim} txtSub={txtSub} border={border} surface={surface}
              />
            </div>
          )}

          {show3dPicker && (
            <div className="mt-5">
              <Suspense fallback={<div className="h-40 rounded-2xl animate-pulse" style={{ background: surface }} />}>
                <HeroProductPicker
                  value={selectedModel}
                  hints={heroHints}
                  accent={pickerAccent}
                  ownerId={profile.user_id}
                  productImages={heroImages}
                  lang={lang}
                  dark={dk}
                  onChange={handleModelSelect}
                />
              </Suspense>
            </div>
          )}

          {saving && (
            <p className="text-xs mt-3 flex items-center gap-2" style={{ color: txtSub }}>
              <span className="w-3 h-3 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(168,85,247,0.25)', borderTopColor: '#a855f7' }} />
              {t.saving}
            </p>
          )}
        </div>
      </div>

      {/* ── Preview ── */}
      <div className="lg:w-80 flex flex-col gap-3">
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: txtSub }}>
          <Link2 size={12} />
          {lang === 'fr' ? 'Aperçu en direct de votre page publique' : 'Live preview of your public page'}
        </p>

        {/* Desktop: phone frame */}
        <div className="hidden md:flex justify-center">
          <div className="relative w-[300px] h-[min(700px,calc(100vh-10rem))] min-h-[460px] bg-gray-900 rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden shrink-0">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-full z-20" />
            <div className="w-full h-full overflow-y-auto scrollbar-hide">
              <PublicProfileView profile={previewProfile} products={products} services={services} interactive={false} previewMode="mobile" />
            </div>
          </div>
        </div>

        {/* Mobile: no frame */}
        <div className="md:hidden w-full rounded-2xl overflow-hidden border shadow-xl" style={{ borderColor: border }}>
          <div className="h-[520px] overflow-y-auto scrollbar-hide">
            <PublicProfileView profile={previewProfile} products={products} services={services} interactive={false} previewMode="desktop" />
          </div>
        </div>
      </div>

      {/* Premium modal */}
      {premiumModalOpen && (
        <Modal onClose={() => setPremiumModalOpen(false)} dim={60}>
          <div className="rounded-2xl p-8 max-w-sm text-center shadow-2xl" style={{ background: surface, border: '1px solid rgba(251,191,36,0.3)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Crown size={24} className="text-yellow-400" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: txtPrim }}>{attemptedPremiumTheme === '__hero3d' ? (lang === 'fr' ? 'Héros 3D Premium' : 'Premium 3D hero') : (lang === 'fr' ? 'Thème Premium' : 'Premium Theme')}</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: txtSub }}>
              {attemptedPremiumTheme === '__hero3d'
                ? (lang === 'fr'
                  ? "Le héros 3D est réservé aux forfaits Premium. Passez à la version Premium pour l'activer sur votre boutique."
                  : 'The 3D hero is reserved for Premium plans. Upgrade to Premium to enable it on your shop.')
                : lang === 'fr'
                  ? `Le thème "${THEMES.find(th => th.id === attemptedPremiumTheme)?.label.fr}" est réservé aux forfaits Premium. Passez à la version Premium pour l'activer.`
                  : `The "${THEMES.find(th => th.id === attemptedPremiumTheme)?.label.en}" theme is reserved for Premium plans. Upgrade to Premium to enable it.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPremiumModalOpen(false)}
                className="flex-1 text-sm font-medium py-2.5 rounded-xl transition"
                style={{ background: surfaceAlt, color: txtSub }}>
                {t.cancel}
              </button>
              <button
                onClick={() => setPremiumModalOpen(false)}
                className="flex-1 text-white text-sm font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}
              >
                <Crown size={14} />
                {lang === 'fr' ? 'Passer au Premium' : 'Upgrade'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}