import React, { useRef, useState } from 'react';
import type { Profile, SocialLink } from '../../../../lib/types';
import { PLAN_CONFIGS, SOCIAL_PLATFORMS } from '../../../../lib/planLimits';
import { updateProfile } from '../../../../lib/api/profiles';
import { uploadPublicFile } from '../../../../lib/api/storage';
import { useFeedback } from '../../../../lib/feedbackContext';

export type SectionKey = 'profile' | 'socials' | 'announcement' | 'whatsapp';

const ALL_OFF: Record<SectionKey, boolean> = { profile: false, socials: false, announcement: false, whatsapp: false };

/** Type de champ, texte d'aide et préfixe affichés pour chaque réseau social. */
export function getSocialInputConfig(platform: string) {
  switch (platform) {
    case 'whatsapp':  return { type: 'tel',  placeholder: '+225 07 XX XX XX', prefix: undefined };
    case 'telegram':  return { type: 'text', placeholder: '@username',        prefix: 't.me/' };
    case 'instagram': return { type: 'text', placeholder: '@votre_compte',    prefix: 'instagram.com/' };
    case 'tiktok':    return { type: 'text', placeholder: '@votre_compte',    prefix: 'tiktok.com/@' };
    case 'facebook':  return { type: 'text', placeholder: 'votre-page',       prefix: 'facebook.com/' };
    case 'twitter':   return { type: 'text', placeholder: '@votre_compte',    prefix: 'x.com/' };
    case 'youtube':   return { type: 'text', placeholder: '@votrechaine',     prefix: 'youtube.com/' };
    case 'linkedin':  return { type: 'text', placeholder: 'votre-profil',     prefix: 'linkedin.com/in/' };
    case 'website':   return { type: 'url',  placeholder: 'https://…',        prefix: undefined };
    default:          return { type: 'text', placeholder: 'URL ou identifiant', prefix: undefined };
  }
}

/**
 * État et actions de l'onglet « Mon lien bio » : copie de travail du profil,
 * édition / enregistrement par section, logo de la boutique et liens sociaux.
 */
export function useBioLinkForm(profile: Profile, onUpdate: (p: Partial<Profile>) => void, lang: string) {
  const { notify } = useFeedback();

  /* Copie de travail du profil */
  const [form, setForm] = useState({
    display_name:           profile.display_name,
    bio:                    profile.bio,
    shop_name:              profile.shop_name,
    shop_logo_url:          profile.shop_logo_url,
    contact_phone:          profile.contact_phone,
    theme:                  profile.theme,
    social_links:           [...(profile.social_links || [])] as SocialLink[],
    whatsapp_enabled:       profile.whatsapp_enabled ?? false,
    whatsapp_number:        profile.whatsapp_number ?? '',
    whatsapp_greeting:      profile.whatsapp_greeting ?? '',
    announcement_active:    profile.announcement_active ?? false,
    announcement_text:      profile.announcement_text ?? '',
    announcement_expires_at:profile.announcement_expires_at ?? '',
  });

  /* Dernier état enregistré (pour annuler) */
  const [lastSaved, setLastSaved] = useState({ ...form });

  const [editing, setEditing]     = useState<Record<SectionKey, boolean>>({ ...ALL_OFF });
  const [secSaving, setSecSaving] = useState<Record<SectionKey, boolean>>({ ...ALL_OFF });
  const [secSaved, setSecSaved]   = useState<Record<SectionKey, boolean>>({ ...ALL_OFF });

  /* Logo */
  const [cropperFile, setCropperFile] = useState<File | null>(null);
  const [uploading, setUploading]     = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copied, setCopied] = useState(false);

  const plan          = PLAN_CONFIGS[profile.plan_type];
  const canUseLogo    = plan.shop_logo;
  const maxSocial     = plan.max_social_links;
  const atSocialLimit = maxSocial !== null && form.social_links.length >= maxSocial;
  const publicUrl     = `${window.location.origin}/u/${profile.username}`;

  function setField(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function startEdit(s: SectionKey) {
    setEditing(prev => ({ ...prev, [s]: true }));
  }

  function cancelEdit(s: SectionKey) {
    if (s === 'profile') {
      setForm(p => ({
        ...p,
        display_name: lastSaved.display_name,
        bio: lastSaved.bio,
        shop_name: lastSaved.shop_name,
        shop_logo_url: lastSaved.shop_logo_url,
        contact_phone: lastSaved.contact_phone,
      }));
    } else if (s === 'socials') {
      setForm(p => ({ ...p, social_links: [...lastSaved.social_links] }));
    } else if (s === 'announcement') {
      setForm(p => ({
        ...p,
        announcement_active: lastSaved.announcement_active,
        announcement_text: lastSaved.announcement_text,
        announcement_expires_at: lastSaved.announcement_expires_at,
      }));
    } else if (s === 'whatsapp') {
      setForm(p => ({
        ...p,
        whatsapp_enabled: lastSaved.whatsapp_enabled,
        whatsapp_number: lastSaved.whatsapp_number,
        whatsapp_greeting: lastSaved.whatsapp_greeting,
      }));
    }
    setEditing(prev => ({ ...prev, [s]: false }));
  }

  async function saveSection(s: SectionKey) {
    setSecSaving(p => ({ ...p, [s]: true }));

    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (s === 'profile') {
      Object.assign(payload, {
        display_name:  form.display_name,
        bio:           form.bio,
        shop_name:     form.shop_name,
        shop_logo_url: form.shop_logo_url,
        contact_phone: form.contact_phone,
      });
    } else if (s === 'socials') {
      Object.assign(payload, { social_links: form.social_links });
    } else if (s === 'announcement') {
      Object.assign(payload, {
        announcement_active:     form.announcement_active,
        announcement_text:       form.announcement_text,
        announcement_expires_at: form.announcement_expires_at
          ? new Date(form.announcement_expires_at).toISOString()
          : null,
      });
    } else if (s === 'whatsapp') {
      Object.assign(payload, {
        whatsapp_enabled:  form.whatsapp_enabled,
        whatsapp_number:   form.whatsapp_number,
        whatsapp_greeting: form.whatsapp_greeting,
      });
    }

    const { error } = await updateProfile(profile.user_id, payload);

    setSecSaving(p => ({ ...p, [s]: false }));

    if (!error) {
      setLastSaved(p => ({ ...p, ...payload }));
      setEditing(p => ({ ...p, [s]: false }));
      onUpdate(payload);
      setSecSaved(p => ({ ...p, [s]: true }));
      setTimeout(() => setSecSaved(p => ({ ...p, [s]: false })), 2200);
    }
  }

  /* ── Logo : sélection → recadrage → envoi ── */
  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify(lang === 'fr' ? 'Veuillez sélectionner une image.' : 'Please select an image file.', 'error');
      return;
    }
    setCropperFile(file);
    e.target.value = '';
  }

  async function handleCropConfirm(blob: Blob) {
    setCropperFile(null);
    if (!canUseLogo) return;
    setUploading(true);
    try {
      const url = await uploadPublicFile('avatars', `${profile.user_id}/logo_${Date.now()}.jpg`, blob, { contentType: 'image/jpeg' });

      // Enregistrement immédiat du logo (déjà envoyé dans le stockage)
      setField('shop_logo_url', url);
      await updateProfile(profile.user_id, { shop_logo_url: url, updated_at: new Date().toISOString() });
      setLastSaved(p => ({ ...p, shop_logo_url: url }));
      onUpdate({ shop_logo_url: url });
    } catch {
      notify(lang === 'fr' ? 'Échec du téléchargement.' : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  }

  /* ── Liens sociaux ── */
  function addSocialLink() {
    if (atSocialLimit) return;
    setField('social_links', [...form.social_links, { platform: 'instagram', url: '', icon: 'Instagram' }]);
  }
  function removeSocialLink(idx: number) {
    setField('social_links', form.social_links.filter((_, i) => i !== idx));
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
    setField('social_links', updated);
  }

  function handleCopy() {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return {
    form, setField, editing, secSaving, secSaved, startEdit, cancelEdit, saveSection,
    cropperFile, setCropperFile, uploading, fileInputRef, handleFileInput, handleCropConfirm,
    addSocialLink, removeSocialLink, updateSocialLink,
    copied, handleCopy, publicUrl, canUseLogo, maxSocial, atSocialLimit,
  };
}

export type BioLinkState = ReturnType<typeof useBioLinkForm>;
