import React, { useState } from 'react';
import { Profile, SocialLink } from '../../../lib/types';
import { PLAN_CONFIGS, THEMES, SOCIAL_PLATFORMS } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { supabase } from '../../../lib/supabase';
import MobilePreview from '../MobilePreview';
import DesktopPreview from '../DesktopPreview';
import { Lock, Plus, Trash2, Check, Copy, ExternalLink, Crown, Smartphone, Monitor } from 'lucide-react';

interface BioLinkProps {
  profile: Profile;
  productCount: number;
  onUpdate: (p: Partial<Profile>) => void;
}

export default function BioLink({ profile, productCount, onUpdate }: BioLinkProps) {
  const { t, lang } = useLang();
  const [form, setForm] = useState({
    display_name: profile.display_name,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    theme: profile.theme,
    social_links: [...(profile.social_links || [])] as SocialLink[],
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [attemptedPremiumTheme, setAttemptedPremiumTheme] = useState('');

  const plan = PLAN_CONFIGS[profile.plan_type];
  const canCustomizeTheme = plan.custom_themes;
  const maxSocial = plan.max_social_links;
  const atSocialLimit = maxSocial !== null && form.social_links.length >= maxSocial;
  const publicUrl = `${window.location.origin}/u/${profile.username}`;

  function updateForm(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
    onUpdate({ [key]: value });
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
        return { ...s, platform: value, icon: p?.icon || 'Globe' };
      }
      return { ...s, [field]: value };
    });
    updateForm('social_links', updated);
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
        <div className="flex items-center justify-between">
          <h2 className="text-white text-xl font-bold">{t.editProfile}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? t.copied : t.copyLink}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20 px-3 py-2 rounded-lg transition"
            >
              <ExternalLink size={14} />
              {t.visitPublicPage}
            </a>
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="block text-gray-300 text-sm mb-1.5">{t.displayName}</label>
          <input
            type="text"
            value={form.display_name}
            onChange={e => updateForm('display_name', e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Photo URL */}
        <div>
          <label className="block text-gray-300 text-sm mb-1.5">{t.photoUrl}</label>
          <input
            type="url"
            value={form.avatar_url}
            onChange={e => updateForm('avatar_url', e.target.value)}
            placeholder="https://..."
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-gray-300 text-sm mb-1.5">Bio</label>
          <textarea
            value={form.bio}
            onChange={e => updateForm('bio', e.target.value)}
            placeholder={t.bioPlaceholder}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
          />
        </div>

        {/* Theme */}
        <div>
          <label className="block text-gray-300 text-sm mb-2">{t.theme}</label>
          {!canCustomizeTheme && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-3">
              <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-400 text-xs">{t.themeLockedMsg}</p>
            </div>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {THEMES.map(theme => {
              const isLocked = !canCustomizeTheme && !theme.free;
              const isPremiumTheme = theme.premium;
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeSelect(theme.id)}
                  disabled={isLocked || (isPremiumTheme && profile.plan_type !== 'premium')}
                  className={`relative rounded-xl h-16 border-2 transition-all overflow-hidden ${
                    form.theme === theme.id
                      ? 'border-blue-500 scale-95'
                      : 'border-gray-700 hover:border-gray-500'
                  } ${(isLocked || (isPremiumTheme && profile.plan_type !== 'premium')) ? 'opacity-50 cursor-not-allowed' : ''} ${theme.bg}`}
                  title={isPremiumTheme ? 'Premium uniquement' : ''}
                >
                  {(isLocked || isPremiumTheme) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      {isPremiumTheme ? (
                        <Crown size={14} className="text-yellow-400" />
                      ) : (
                        <Lock size={14} className="text-white" />
                      )}
                    </div>
                  )}
                  <span className={`text-xs font-medium ${theme.text} absolute bottom-1.5 left-0 right-0 text-center`}>
                    {theme.label[lang as 'fr' | 'en']}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Social Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-gray-300 text-sm">{t.socialLinks}</label>
            <span className="text-xs text-gray-500">
              {form.social_links.length}{maxSocial ? ` / ${maxSocial}` : ''} liens
            </span>
          </div>

          {atSocialLimit && (
            <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-3">
              <Lock size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-400 text-xs">{t.socialLimitMsg}</p>
            </div>
          )}

          <div className="space-y-3">
            {form.social_links.map((link, idx) => (
              <div key={idx} className="flex gap-2">
                <select
                  value={link.platform}
                  onChange={e => updateSocialLink(idx, 'platform', e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  {SOCIAL_PLATFORMS.map(p => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                <input
                  type="url"
                  value={link.url}
                  onChange={e => updateSocialLink(idx, 'url', e.target.value)}
                  placeholder="https://..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  onClick={() => removeSocialLink(idx)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {!atSocialLimit && (
            <button
              onClick={addSocialLink}
              className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 bg-blue-600/10 hover:bg-blue-600/20 px-4 py-2 rounded-xl transition w-full justify-center"
            >
              <Plus size={16} />
              {t.addSocialLink}
            </button>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
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

      {/* Preview */}
      <div className="lg:w-80 flex flex-col gap-4">
        {/* Preview mode selector */}
        <div className="flex gap-2 bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => setPreviewMode('mobile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              previewMode === 'mobile'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Smartphone size={14} />
            {lang === 'fr' ? 'Mobile' : 'Mobile'}
          </button>
          <button
            onClick={() => setPreviewMode('desktop')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              previewMode === 'desktop'
                ? 'bg-blue-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Monitor size={14} />
            {lang === 'fr' ? 'Bureau' : 'Desktop'}
          </button>
        </div>

        {/* Preview content */}
        <div className={previewMode === 'mobile' ? 'flex justify-center' : ''}>
          {previewMode === 'mobile' ? (
            <MobilePreview profile={previewProfile} productCount={productCount} />
          ) : (
            <DesktopPreview profile={previewProfile} productCount={productCount} />
          )}
        </div>
      </div>

      {/* Premium modal */}
      {premiumModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-yellow-600/30 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
            <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown size={24} className="text-yellow-400" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">{lang === 'fr' ? 'Thème Premium' : 'Premium Theme'}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {lang === 'fr'
                ? `Le thème "${THEMES.find(t => t.id === attemptedPremiumTheme)?.label.fr}" est réservé aux forfaits Premium. Passez à la version Premium pour l'activer.`
                : `The "${THEMES.find(t => t.id === attemptedPremiumTheme)?.label.en}" theme is reserved for Premium plans. Upgrade to Premium to activate it.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPremiumModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition">
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  setPremiumModalOpen(false);
                  // Scroll to subscription tab if in dashboard context
                }}
                className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
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
