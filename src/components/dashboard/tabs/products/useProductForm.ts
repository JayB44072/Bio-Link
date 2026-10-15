import React, { useMemo, useRef, useState } from 'react';
import type { Product, Profile } from '../../../../lib/types';
import { PLAN_CONFIGS } from '../../../../lib/planLimits';
import { createProduct, updateProduct, deleteProduct } from '../../../../lib/api/products';
import { uploadPublicFile } from '../../../../lib/api/storage';
import { useFeedback } from '../../../../lib/feedbackContext';
import { useOfferNotify } from '../../../../lib/useOfferNotify';
import type { LocationValue } from '../../../ui/LocationAutocomplete';
import {
  generateProductSheet,
  fileToBase64,
  urlToBase64,
  getFreeAiRemaining,
  bumpFreeAiUsage,
  FREE_AI_QUOTA,
} from '../../../../lib/aiProductGenerator';

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  images: string[];
  currency: string;
  is_active: boolean;
  location: LocationValue;
  category: string;
}

export const emptyForm: ProductFormData = {
  name: '', description: '', price: '', quantity: '', images: [], currency: 'FCFA', is_active: true,
  location: { address: '', lat: null, lng: null },
  category: '',
};

export const MAX_IMAGES = 8;

/**
 * État et actions de l'onglet Produits : formulaire (création / édition),
 * envoi des photos, génération de la fiche par IA, enregistrement et suppression.
 */
export function useProductForm(
  profile: Profile,
  products: Product[],
  onUpdate: (products: Product[]) => void,
  lang: string,
) {
  const { notify } = useFeedback();
  const offerNotify = useOfferNotify(profile.username, lang);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiHintOpen, setAiHintOpen] = useState(false);
  const [aiHint, setAiHint] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiImageInputRef = useRef<HTMLInputElement>(null);
  const pendingAiFileRef = useRef<File | null>(null);

  const fr = lang === 'fr';
  const plan = profile.plan_type;
  const isFreePlan = plan === 'free';
  const aiRemaining = getFreeAiRemaining();

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setView('form');
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name, description: p.description, price: String(p.price), quantity: String(p.quantity ?? 0),
      images: p.images?.length ? p.images : (p.image_url ? [p.image_url] : []),
      currency: p.currency, is_active: p.is_active,
      location: { address: p.location_address || '', lat: p.location_lat, lng: p.location_lng },
      category: p.category || '',
    });
    setEditingId(p.id);
    setView('form');
  }

  function closeForm() {
    setView('list');
    setEditingId(null);
  }

  /** Catégories déjà utilisées par le vendeur (suggestions de saisie). */
  const categorySuggestions = useMemo(() => {
    const seen = new Set<string>();
    for (const p of products) {
      const c = (p.category || '').trim();
      if (c) seen.add(c);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [products]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify(fr ? 'Veuillez sélectionner un fichier image valide.' : 'Please select a valid image file.', 'error');
      return;
    }
    if (form.images.length >= MAX_IMAGES) return;

    const slotIdx = form.images.length;
    setUploadingIdx(slotIdx);
    try {
      const fileExt = file.name.split('.').pop();
      const publicUrl = await uploadPublicFile('product-images', `${profile.user_id}/${Date.now()}.${fileExt}`, file);
      setForm(f => ({ ...f, images: [...f.images, publicUrl] }));
    } catch (err) {
      console.error("Erreur lors de l'upload:", (err as Error).message);
      notify(fr ? "Échec du téléchargement de l'image." : 'Image upload failed.', 'error');
    } finally {
      setUploadingIdx(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function removeImage(idx: number) {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function makeCover(idx: number) {
    setForm(f => {
      const imgs = [...f.images];
      const [chosen] = imgs.splice(idx, 1);
      return { ...f, images: [chosen, ...imgs] };
    });
  }

  /* ── Génération de la fiche produit par IA ── */

  async function runAiGeneration(imageBase64: string | null, hint: string) {
    setAiLoading(true);
    try {
      const result = await generateProductSheet(imageBase64, hint, lang as 'fr' | 'en');
      setForm(f => ({
        ...f,
        name: result.name || f.name,
        description: result.description || f.description,
        price: result.suggested_price_fcfa > 0 ? String(result.suggested_price_fcfa) : f.price,
        currency: f.currency || 'FCFA',
      }));

      if (result._source === 'fallback') {
        notify(
          fr
            ? "L'IA n'a pas pu générer la fiche. Un texte par défaut a été inséré — modifiez-le."
            : 'AI could not generate the sheet. A default text was inserted — edit it.',
          'error',
        );
      } else {
        if (isFreePlan) bumpFreeAiUsage();
        const src = result._source === 'gemini' ? 'Gemini' : 'Groq';
        notify(
          fr ? `Fiche générée avec l'IA (${src}). Ajustez si besoin.` : `Sheet generated with AI (${src}). Adjust as needed.`,
          'success',
        );
      }
    } catch (e) {
      // generateProductSheet ne lève pas d'erreur ; filet de sécurité
      console.error('[Products] AI generation error:', e);
      notify(fr ? 'Erreur inattendue lors de la génération IA.' : 'Unexpected AI generation error.', 'error');
    } finally {
      setAiLoading(false);
      pendingAiFileRef.current = null;
      if (aiImageInputRef.current) aiImageInputRef.current.value = '';
    }
  }

  async function handleGenerateWithAi() {
    if (aiLoading) return;

    // Quota (forfait gratuit uniquement)
    if (isFreePlan && getFreeAiRemaining() <= 0) {
      notify(
        fr
          ? `Quota IA atteint ce mois-ci (${FREE_AI_QUOTA} générations gratuites). Passez à un plan supérieur pour des générations illimitées.`
          : `AI quota reached this month (${FREE_AI_QUOTA} free generations). Upgrade for unlimited generations.`,
        'error',
      );
      return;
    }

    // 1) Une image est déjà envoyée : on l'utilise
    if (form.images[0]) {
      const b64 = await urlToBase64(form.images[0]);
      if (!b64) {
        notify(fr ? "Impossible de charger l'image du produit." : 'Could not load the product image.', 'error');
        return;
      }
      await runAiGeneration(b64, form.name.trim());
      return;
    }

    // 2) Pas d'image : on ouvre la fenêtre d'indice (avec image facultative)
    setAiHint(form.name.trim());
    setAiHintOpen(true);
  }

  async function handleAiHintSubmit() {
    const hint = aiHint.trim();
    const file = pendingAiFileRef.current;

    if (!hint && !file) {
      notify(fr ? 'Ajoutez au moins une image ou un indice texte.' : 'Add at least an image or a text hint.', 'info');
      return;
    }

    setAiHintOpen(false);
    let b64: string | null = null;
    if (file) {
      try {
        b64 = await fileToBase64(file);
      } catch {
        notify(fr ? "Lecture de l'image impossible." : 'Failed to read image.', 'error');
        return;
      }
    }
    await runAiGeneration(b64, hint);
  }

  function handleAiFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify(fr ? 'Fichier image invalide.' : 'Invalid image file.', 'error');
      return;
    }
    pendingAiFileRef.current = file;
    notify(fr ? "Image prête pour l'analyse IA." : 'Image ready for AI analysis.', 'info');
  }

  function cancelAiHint() {
    setAiHintOpen(false);
    pendingAiFileRef.current = null;
  }

  /* ── Enregistrement / suppression ── */

  async function handleSave() {
    setSaving(true);
    const payload = {
      user_id: profile.user_id,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      quantity: parseInt(form.quantity, 10) || 0,
      image_url: form.images[0] || '',
      images: form.images,
      currency: form.currency,
      is_active: form.is_active,
      location_address: form.location.address,
      location_lat: form.location.lat,
      location_lng: form.location.lng,
      category: form.category.trim(),
      updated_at: new Date().toISOString(),
    };

    if (!editingId) {
      const { data, error } = await createProduct(payload);
      if (!error && data) {
        onUpdate([...products, data]);
        // Nouveau produit visible : le vendeur peut prévenir ses abonnés (sur confirmation)
        if (data.is_active) void offerNotify('product', data.name, data.description ?? '');
      }
    } else {
      const { data, error } = await updateProduct(editingId, payload);
      if (!error && data) onUpdate(products.map(p => p.id === editingId ? data : p));
    }
    setSaving(false);
    closeForm();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    await deleteProduct(deleteId);
    onUpdate(products.filter(p => p.id !== deleteId));
    setSaving(false);
    setDeleteId(null);
  }

  return {
    // navigation
    view, openAdd, openEdit, closeForm, editingId,
    // formulaire
    form, setForm, categorySuggestions, saving, handleSave,
    // photos
    fileInputRef, uploadingIdx, handleFileChange, removeImage, makeCover,
    // IA
    aiLoading, aiHintOpen, aiHint, setAiHint, aiImageInputRef, pendingAiFileRef,
    isFreePlan, aiRemaining, handleGenerateWithAi, handleAiHintSubmit, handleAiFilePick, cancelAiHint,
    // suppression
    deleteId, setDeleteId, handleDelete,
    // plan
    planConfig: PLAN_CONFIGS[plan],
  };
}

export type ProductFormState = ReturnType<typeof useProductForm>;
