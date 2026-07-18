import React, { useState } from 'react';
import { Profile, Product, Service } from '../../../lib/types';
import { PLAN_CONFIGS, THEMES, SHOP_THEMES } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import PublicProfileView from '../../public/PublicProfileView';
import { Lock, Crown, Check, Palette, Link2 } from 'lucide-react';

interface ThemesProps {
  profile: Profile;
  products: Product[];
  services: Service[];
  onUpdate: (patch: Partial<Profile>) => void;
}

export default function Themes({ profile, products, services, onUpdate }: ThemesProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();

  const [selectedTheme, setSelectedTheme] = useState<string>(profile.theme || 'default');
  const [saving, setSaving] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [attemptedPremiumTheme, setAttemptedPremiumTheme] = useState('');

  const plan = PLAN_CONFIGS[profile.plan_type];
  const canCustomizeTheme = plan.custom_themes;

  /* ── Theme tokens ── */
  const surface    = dk ? '#12122b' : '#ffffff';
  const surfaceAlt = dk ? '#191938' : '#faf9ff';
  const border     = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim    = dk ? '#f2f1ff' : '#16162e';
  const txtLabel   = dk ? '#c7c5e8' : '#2d2b45';
  const txtSub     = dk ? '#8c8ab0' : '#8a87a3';

  async function handleThemeSelect(themeId: string) {
    const theme = THEMES.find(th => th.id === themeId);
    if (theme?.premium && profile.plan_type !== 'premium') {
      setAttemptedPremiumTheme(themeId);
      setPremiumModalOpen(true);
      return;
    }
    // Free users can preview themes but cannot save any non-free theme
    setSelectedTheme(themeId);

    // Only persist if user has permission (starter+) OR it's the free default theme
    if (!canCustomizeTheme && !theme?.free) {
      // preview-only for free users on non-free themes
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ theme: themeId, updated_at: new Date().toISOString() })
      .eq('user_id', profile.user_id);
    setSaving(false);
    if (!error) {
      onUpdate({ theme: themeId });
    }
  }

  const previewProfile = { ...profile, theme: selectedTheme };

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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map(theme => {
              const isPremiumTheme = theme.premium;
              const disabled = isPremiumTheme && profile.plan_type !== 'premium';
              const selected = selectedTheme === theme.id;
              const shopCfg = SHOP_THEMES[theme.id];
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  disabled={disabled}
                  className={`group relative rounded-2xl overflow-hidden transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                  style={{
                    border: `2px solid ${selected ? '#a855f7' : (dk ? 'rgba(255,255,255,0.08)' : '#eeecfb')}`,
                    background: surface,
                    boxShadow: selected ? '0 6px 18px rgba(168,85,247,0.25)' : 'none',
                  }}
                  title={isPremiumTheme ? 'Premium uniquement' : ''}
                >
                  <div className={`h-14 w-full relative ${theme.bg}`}>
                    {isPremiumTheme && (
                      <>
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full shadow-md"
                          style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}>
                          <Crown size={9} className="text-white" strokeWidth={2.5} />
                          <span className="text-[8px] font-black text-white uppercase tracking-wider">Premium</span>
                        </div>
                      </>
                    )}
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#a855f7' }}>
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    {shopCfg && shopCfg !== SHOP_THEMES.default && (
                      <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                        {[shopCfg.pageBg, shopCfg.priceColor, shopCfg.cardBg].map((c, ci) => (
                          <div key={ci} className="w-3 h-3 rounded-full border border-white/30" style={{ background: c }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="py-2 px-1 flex items-center justify-center gap-1.5">
                    <span className="text-xs font-semibold" style={{ color: selected ? '#a855f7' : txtPrim }}>
                      {theme.label[lang as 'fr' | 'en']}
                    </span>
                    {profile.theme === theme.id && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                        {lang === 'fr' ? 'ACTUEL' : 'CURRENT'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

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
          <div className="relative w-[375px] h-[700px] bg-gray-900 rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden shrink-0">
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl p-8 max-w-sm text-center shadow-2xl" style={{ background: surface, border: '1px solid rgba(251,191,36,0.3)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(251,191,36,0.15)' }}>
              <Crown size={24} className="text-yellow-400" />
            </div>
            <h3 className="font-bold text-lg mb-2" style={{ color: txtPrim }}>{lang === 'fr' ? 'Thème Premium' : 'Premium Theme'}</h3>
            <p className="text-sm leading-relaxed mb-6" style={{ color: txtSub }}>
              {lang === 'fr'
                ? `Le thème "${THEMES.find(th => th.id === attemptedPremiumTheme)?.label.fr}" est réservé aux forfaits Premium. Passez à la version Premium pour l'activer.`
                : `The "${THEMES.find(th => th.id === attemptedPremiumTheme)?.label.en}" theme is reserved for Premium plans. Upgrade to Premium to activate it.`}
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
        </div>
      )}
    </div>
  );
}
