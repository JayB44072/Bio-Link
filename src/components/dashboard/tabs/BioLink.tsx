import React, { useState, useRef } from 'react';
import { Profile, SocialLink, Product, Service } from '../../../lib/types';
import { PLAN_CONFIGS, THEMES, SOCIAL_PLATFORMS, SHOP_THEMES } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import PublicProfileView from '../../public/PublicProfileView';
import {
  Lock, Plus, Trash2, Check, Copy, ExternalLink, Crown, Upload, Loader2, Store, Link2, MessageCircle,
} from 'lucide-react';

interface BioLinkProps {
  profile: Profile;
  products: Product[];
  services: Service[];
  onUpdate: (p: Partial<Profile>) => void;
}

export default function BioLink({ profile, products, services, onUpdate }: BioLinkProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const [form, setForm] = useState({
    display_name: profile.display_name,
    bio: profile.bio,
    shop_name: profile.shop_name,
    shop_logo_url: profile.shop_logo_url,
    contact_phone: profile.contact_phone,
    theme: profile.theme,
    social_links: [...(profile.social_links || [])] as SocialLink[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [attemptedPremiumTheme, setAttemptedPremiumTheme] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const plan = PLAN_CONFIGS[profile.plan_type];
  const canCustomizeTheme = plan.custom_themes;
  const canUseLogo = plan.shop_logo;
  const maxSocial = plan.max_social_links;
  const atSocialLimit = maxSocial !== null && form.social_links.length >= maxSocial;
  const publicUrl = `${window.location.origin}/u/${profile.username}`;

  /* ── Theme tokens ── */
  const surface    = dk ? '#12122b' : '#ffffff';
  const surfaceAlt = dk ? '#191938' : '#faf9ff';
  const border     = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim    = dk ? '#f2f1ff' : '#16162e';
  const txtLabel   = dk ? '#c7c5e8' : '#2d2b45';
  const txtSub     = dk ? '#8c8ab0' : '#8a87a3';
  const inputBg    = dk ? '#0d0d22' : '#faf9ff';
  const inputBorder= dk ? 'rgba(139,124,255,0.18)' : '#e6e1fb';
  const inputCls   = `w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25`;
  const labelCls   = 'block text-sm font-semibold mb-1.5';

  function updateForm(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
    onUpdate({ [key]: value });
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!canUseLogo) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'fr' ? 'Veuillez sélectionner un fichier image valide.' : 'Please select a valid image file.');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/logo_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setForm(prev => ({ ...prev, shop_logo_url: publicUrl }));
      onUpdate({ shop_logo_url: publicUrl });
    } catch (err: any) {
      console.error("Erreur lors de l'upload du logo:", err.message);
      alert(lang === 'fr' ? "Échec du téléchargement du logo." : "Logo upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function addSocialLink() {
    if (atSocialLimit) return;
    const newLinks = [...form.social_links, { platform: 'instagram', url: '', icon: 'Instagram' }];
    updateForm('social_links', newLinks);
  }

  function updateSocialLink(idx: number, field: keyof SocialLink, value: string) {
    const updated = form.social_links.map((s, i) => {
      if (i !== idx) return s;
      if (field === 'platform') {
        const p = SOCIAL_PLATFORMS.find(p => p.id === value);
        return { ...s, platform: value, url: '', icon: p?.icon || 'Globe' };
      }
      return { ...s, [field]: value };
    });
    updateForm('social_links', updated);
  }

  function getSocialInputConfig(platform: string): { type: string; placeholder: string; prefix?: string } {
    switch (platform) {
      case 'whatsapp': return { type: 'tel', placeholder: '+225 07 XX XX XX XX' };
      case 'telegram': return { type: 'text', placeholder: '@username', prefix: 't.me/' };
      case 'instagram': return { type: 'text', placeholder: '@votre_compte', prefix: 'instagram.com/' };
      case 'tiktok': return { type: 'text', placeholder: '@votre_compte', prefix: 'tiktok.com/@' };
      case 'facebook': return { type: 'text', placeholder: 'votre-page', prefix: 'facebook.com/' };
      case 'twitter': return { type: 'text', placeholder: '@votre_compte', prefix: 'x.com/' };
      case 'youtube': return { type: 'text', placeholder: '@votrechaine', prefix: 'youtube.com/' };
      case 'linkedin': return { type: 'text', placeholder: 'votre-profil', prefix: 'linkedin.com/in/' };
      case 'website': return { type: 'url', placeholder: 'https://votresite.com' };
      default: return { type: 'text', placeholder: 'URL ou identifiant' };
    }
  }

  function removeSocialLink(idx: number) {
    updateForm('social_links', form.social_links.filter((_, i) => i !== idx));
  }

  function handleThemeSelect(themeId: string) {
    const selectedTheme = THEMES.find(t => t.id === themeId);
    if (selectedTheme?.premium && profile.plan_type !== 'premium') {
      setAttemptedPremiumTheme(themeId);
      setPremiumModalOpen(true);
      return;
    }
    updateForm('theme', themeId);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('user_id', profile.user_id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      onUpdate(form);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const previewProfile = { ...profile, ...form };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Form */}
      <div className="flex-1 space-y-6">

        {/* ══ Carte Mon lien bio — mise en avant ══ */}
        <div className="rounded-3xl p-5 md:p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#6C63FF 0%,#8B5FBF 55%,#FF6B9D 120%)' }}>
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="absolute -bottom-14 -left-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
                <Link2 size={15} color="#fff" />
              </span>
              <h2 className="text-white font-black text-base">
                {lang === 'fr' ? 'Mon lien bio public' : 'My public bio link'}
              </h2>
            </div>

            <div className="rounded-2xl px-4 py-3 mb-4 font-mono text-[13px] truncate"
              style={{ background: 'rgba(0,0,0,0.18)', color: 'rgba(255,255,255,0.9)' }}>
              {publicUrl.replace(/^https?:\/\//, '')}
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-2xl transition-all"
                style={{ background: '#fff', color: '#6C63FF' }}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? t.copied : t.copyLink}
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-2xl transition-all border-2"
                style={{ borderColor: 'rgba(255,255,255,0.5)', color: '#fff' }}
              >
                <ExternalLink size={15} />
                {t.visitPublicPage}
              </a>
            </div>
          </div>
        </div>

        {/* ══ Carte Profil — Nom + Photo + Bio regroupés ══ */}
        <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
          <h2 className="font-black text-base mb-4" style={{ color: txtPrim }}>{t.editProfile}</h2>

          {/* Logo + Nom de la boutique côte à côte */}
          <div className="flex items-center gap-4 mb-5">
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoChange} className="hidden" disabled={!canUseLogo} />
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, opacity: canUseLogo ? 1 : 0.5 }}>
              {form.shop_logo_url ? (
                <img src={form.shop_logo_url} alt="Logo Preview" className="w-full h-full object-cover" />
              ) : canUseLogo ? (
                <Store size={24} style={{ color: txtSub }} />
              ) : (
                <Lock size={20} style={{ color: txtSub }} />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}
              {canUseLogo && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(0,0,0,0)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}
                >
                  <Upload size={14} className="text-white opacity-0 hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <label className={labelCls} style={{ color: txtLabel }}>{t.shopName}</label>
              <input
                type="text"
                value={form.shop_name}
                onChange={e => updateForm('shop_name', e.target.value)}
                placeholder={t.shopNamePlaceholder}
                className={inputCls}
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
              />
            </div>
          </div>

          {canUseLogo ? (
            <div className="flex items-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition disabled:opacity-50"
                style={{ background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff', color: '#6C63FF' }}
              >
                <Upload size={12} />
                {lang === 'fr' ? 'Changer le logo' : 'Change logo'}
              </button>
              <p className="text-[11px]" style={{ color: txtSub }}>PNG, JPG, WEBP (Max 3MB)</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-5"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Lock size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-500 text-xs font-medium">
                {lang === 'fr'
                  ? 'Le logo de boutique est réservé aux forfaits payants. Passez au Starter ou plus pour en ajouter un.'
                  : 'The shop logo is reserved for paid plans. Upgrade to Starter or above to add one.'}
              </p>
            </div>
          )}

          {/* Nom */}
          <div className="mb-5">
            <label className={labelCls} style={{ color: txtLabel }}>
              {lang === 'de' ? 'Name' : lang === 'pt' ? 'Nome' : lang === 'en' ? 'Name' : 'Nom'}
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={e => updateForm('display_name', e.target.value)}
              className={inputCls}
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
            />
          </div>

          {/* Numéro de contact */}
          <div className="mb-5">
            <label className={labelCls} style={{ color: txtLabel }}>
              <span className="inline-flex items-center gap-1.5">
                <MessageCircle size={13} />
                {lang === 'fr' ? 'Numéro de contact (WhatsApp)' : 'Contact number (WhatsApp)'}
              </span>
            </label>
            <input
              type="tel"
              value={form.contact_phone}
              onChange={e => updateForm('contact_phone', e.target.value)}
              placeholder="+225 07 00 00 00"
              className={inputCls}
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
            />
            <p className="text-[11px] mt-1.5" style={{ color: txtSub }}>
              {lang === 'fr'
                ? "Vos clients l'utiliseront pour vous contacter après une commande."
                : "Your customers will use it to reach you after an order."}
            </p>
          </div>

          {/* Bio */}
          <div>
            <label className={labelCls} style={{ color: txtLabel }}>Bio</label>
            <textarea
              value={form.bio}
              onChange={e => updateForm('bio', e.target.value)}
              placeholder={t.bioPlaceholder}
              rows={3}
              className={`${inputCls} resize-none`}
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
            />
          </div>
        </div>

        {/* Theme */}
        <div>
          <label className={labelCls} style={{ color: txtLabel }}>{t.theme}</label>
          {!canCustomizeTheme && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-3"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Lock size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-500 text-xs font-medium">{t.themeLockedMsg}</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {THEMES.map(theme => {
              const isLocked = !canCustomizeTheme && !theme.free;
              const isPremiumTheme = theme.premium;
              const disabled = isLocked || (isPremiumTheme && profile.plan_type !== 'premium');
              const selected = form.theme === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  disabled={disabled}
                  className={`group relative rounded-2xl overflow-hidden transition-all duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5'}`}
                  style={{
                    border: `2px solid ${selected ? '#6C63FF' : (dk ? 'rgba(255,255,255,0.08)' : '#eeecfb')}`,
                    background: surface,
                    boxShadow: selected ? '0 6px 18px rgba(108,99,255,0.25)' : 'none',
                  }}
                  title={isPremiumTheme ? 'Premium uniquement' : ''}
                >
                  {/* Color swatch preview */}
                  <div className={`h-14 w-full relative ${theme.bg}`}>
                    {(isLocked || isPremiumTheme) && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                        {isPremiumTheme ? <Crown size={15} className="text-yellow-300" /> : <Lock size={15} className="text-white" />}
                      </div>
                    )}
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#6C63FF' }}>
                        <Check size={11} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    {/* Palette dots for themes with custom shop config */}
                    {SHOP_THEMES[theme.id] && SHOP_THEMES[theme.id] !== SHOP_THEMES.default && (
                      <div className="absolute bottom-1.5 left-1.5 flex gap-1">
                        {[SHOP_THEMES[theme.id].pageBg, SHOP_THEMES[theme.id].priceColor, SHOP_THEMES[theme.id].cardBg].map((c, ci) => (
                          <div key={ci} className="w-3 h-3 rounded-full border border-white/30" style={{ background: c }} />
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Label */}
                  <div className="py-2 px-1">
                    <span className="text-xs font-semibold" style={{ color: selected ? '#6C63FF' : txtPrim }}>
                      {theme.label[lang as 'fr' | 'en']}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Social Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold" style={{ color: txtLabel }}>{t.socialLinks}</label>
            <span className="text-xs font-medium" style={{ color: txtSub }}>
              {form.social_links.length}{maxSocial ? ` / ${maxSocial}` : ''} liens
            </span>
          </div>

          {atSocialLimit && (
            <div className="flex items-start gap-2 rounded-xl px-4 py-3 mb-3"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
              <Lock size={14} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-amber-500 text-xs font-medium">{t.socialLimitMsg}</p>
            </div>
          )}

          <div className="space-y-3">
            {form.social_links.map((link, idx) => {
              const inputCfg = getSocialInputConfig(link.platform);
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex gap-2">
                    <select
                      value={link.platform}
                      onChange={e => updateSocialLink(idx, 'platform', e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}
                    >
                      {SOCIAL_PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                    <div className="flex-1 relative">
                      {inputCfg.prefix && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs pointer-events-none select-none"
                          style={{ color: txtSub }}>
                          {inputCfg.prefix}
                        </span>
                      )}
                      <input
                        type={inputCfg.type}
                        value={link.url}
                        onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                        placeholder={inputCfg.placeholder}
                        className="w-full rounded-lg py-2 text-sm transition focus:outline-none"
                        style={{
                          background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim,
                          paddingLeft: inputCfg.prefix ? `${inputCfg.prefix.length * 7 + 12}px` : '12px',
                          paddingRight: '12px',
                        }}
                      />
                    </div>
                    <button
                      onClick={() => removeSocialLink(idx)}
                      className="p-2 rounded-lg transition"
                      style={{ color: '#FF6B9D' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {link.platform === 'whatsapp' && (
                    <p className="text-xs pl-1" style={{ color: txtSub }}>Numéro avec indicatif pays, ex: +2250712345678</p>
                  )}
                </div>
              );
            })}
          </div>

          {!atSocialLimit && (
            <button
              onClick={addSocialLink}
              className="mt-3 flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition w-full justify-center"
              style={{ background: dk ? 'rgba(108,99,255,0.15)' : '#f5f3ff', color: '#6C63FF' }}
            >
              <Plus size={16} />
              {t.addSocialLink}
            </button>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving || uploading}
          className="w-full text-white font-bold py-3.5 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)', boxShadow: '0 8px 24px rgba(108,99,255,0.3)' }}
        >
          {saving ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.saving}</>
          ) : saved ? (
            <><Check size={16} />{t.saved}</>
          ) : (
            t.saveChanges
          )}
        </button>
      </div>

      {/* Preview — aperçu réel de la page publique, inversé selon l'appareil :
          sur PC on montre le rendu téléphone, sur mobile on montre le rendu bureau. */}
      <div className="lg:w-80 flex flex-col gap-3">
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: txtSub }}>
          <Link2 size={12} />
          {lang === 'fr' ? 'Aperçu en direct de votre page publique' : 'Live preview of your public page'}
        </p>

        {/* ── Sur PC (md+) : cadre téléphone ── */}
        <div className="hidden md:flex justify-center">
          <div className="relative w-[375px] h-[700px] bg-gray-900 rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden shrink-0">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-full z-20" />
            <div className="w-full h-full overflow-y-auto scrollbar-hide">
              <PublicProfileView profile={previewProfile} products={products} services={services} interactive={false} previewMode="mobile" />
            </div>
          </div>
        </div>

        {/* ── Sur mobile (<md) : rendu bureau, sans cadre ── */}
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
                ? `Le thème "${THEMES.find(t => t.id === attemptedPremiumTheme)?.label.fr}" est réservé aux forfaits Premium. Passez à la version Premium pour l'activer.`
                : `The "${THEMES.find(t => t.id === attemptedPremiumTheme)?.label.en}" theme is reserved for Premium plans. Upgrade to Premium to activate it.`}
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
