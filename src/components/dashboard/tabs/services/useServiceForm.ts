import React, { useEffect, useRef, useState } from 'react';
import type { Profile, Service, Transaction } from '../../../../lib/types';
import { createService, updateService, setServiceActive, deleteService } from '../../../../lib/api/services';
import { listSellerTransactions } from '../../../../lib/api/transactions';
import { uploadPublicFile } from '../../../../lib/api/storage';
import { useFeedback } from '../../../../lib/feedbackContext';
import { useOfferNotify } from '../../../../lib/useOfferNotify';

export interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  duration: string;
  images: string[];
  video_url: string;
  currency: string;
  is_active: boolean;
}

export type FormStep = 1 | 2 | 3;

export const emptyForm: ServiceFormData = {
  name: '', description: '', price: '', duration: '', images: [], video_url: '', currency: 'FCFA', is_active: true,
};

export const MAX_IMAGES = 8;

const isVideoLink = (u: string) => u.includes('youtube') || u.includes('youtu.be') || u.includes('vimeo');
export { isVideoLink };

/**
 * État et actions de l'onglet Services : formulaire en 3 étapes (création / édition),
 * envoi des photos et de la vidéo, activation, suppression, et ventes pour les statistiques.
 */
export function useServiceForm(
  profile: Profile,
  services: Service[],
  onUpdate: (services: Service[]) => void,
  lang: string,
) {
  const { notify } = useFeedback();
  const offerNotify = useOfferNotify(profile.username, lang);
  const fr = lang === 'fr';

  const [view, setView] = useState<'list' | 'form'>('list');
  const [step, setStep] = useState<FormStep>(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [videoTab, setVideoTab] = useState<'upload' | 'link'>('link');
  const [videoUploading, setVideoUploading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileVideoRef = useRef<HTMLInputElement>(null);

  /* Ventes récentes, pour les graphiques d'analyse */
  useEffect(() => {
    listSellerTransactions(profile.user_id, 300).then(({ data }) => setTransactions(data || []));
  }, [profile.user_id]);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setStep(1);
    setView('form');
  }

  function openEdit(s: Service) {
    const allImgs = s.images?.length ? s.images : (s.image_url ? [s.image_url] : []);
    const vidUrl = allImgs.find(isVideoLink) || '';
    const photoImgs = allImgs.filter(u => !isVideoLink(u));
    setForm({
      name: s.name, description: s.description, price: String(s.price), duration: s.duration,
      images: photoImgs, video_url: vidUrl,
      currency: s.currency, is_active: s.is_active,
    });
    setEditingId(s.id);
    setStep(1);
    setView('form');
  }

  function closeForm() {
    setView('list');
    setEditingId(null);
    setStep(1);
  }

  const canAdvance = step === 1 ? form.name.trim().length > 0 : true;

  function nextStep() {
    if (step < 3 && canAdvance) setStep(s => (s + 1) as FormStep);
  }

  function prevStep() {
    if (step > 1) setStep(s => (s - 1) as FormStep);
  }

  /* ── Photos : sélection → recadrage → envoi ── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/') || form.images.length >= MAX_IMAGES) return;
    setCropFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleCropConfirm(blob: Blob) {
    setCropFile(null);
    setUploadingIdx(form.images.length);
    try {
      const publicUrl = await uploadPublicFile('product-images', `${profile.user_id}/${Date.now()}.jpg`, blob, { contentType: 'image/jpeg' });
      setForm(f => ({ ...f, images: [...f.images, publicUrl] }));
    } catch (err) {
      console.error('Upload error:', (err as Error).message);
      notify(fr ? "Échec du téléchargement de l'image." : 'Image upload failed.', 'error');
    } finally {
      setUploadingIdx(null);
    }
  }

  async function handleVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('video/')) return;
    setVideoUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const publicUrl = await uploadPublicFile('product-images', `${profile.user_id}/video_${Date.now()}.${ext}`, file, { contentType: file.type });
      setForm(f => ({ ...f, video_url: publicUrl }));
    } catch (err) {
      console.error('Video upload error:', (err as Error).message);
      notify(fr ? 'Échec du téléchargement de la vidéo.' : 'Video upload failed.', 'error');
    } finally {
      setVideoUploading(false);
      if (fileVideoRef.current) fileVideoRef.current.value = '';
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

  /* ── Enregistrement / activation / suppression ── */
  async function handleSave() {
    setSaving(true);
    const allImages = [
      ...form.images,
      ...(form.video_url.trim() ? [form.video_url.trim()] : []),
    ];
    const payload = {
      user_id: profile.user_id,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      duration: form.duration,
      image_url: form.images[0] || '',
      images: allImages,
      currency: form.currency,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };
    if (!editingId) {
      const { data, error } = await createService(payload);
      if (!error && data) {
        onUpdate([...services, data]);
        // Nouveau service visible : le vendeur peut prévenir ses abonnés (sur confirmation)
        if (data.is_active) void offerNotify('service', data.name, data.description ?? '');
      }
    } else {
      const { data, error } = await updateService(editingId, payload);
      if (!error && data) onUpdate(services.map(s => s.id === editingId ? data : s));
    }
    setSaving(false);
    closeForm();
  }

  async function toggleActive(service: Service) {
    setTogglingId(service.id);
    const { data, error } = await setServiceActive(service.id, !service.is_active);
    if (!error && data) onUpdate(services.map(s => s.id === service.id ? data : s));
    setTogglingId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    await deleteService(deleteId);
    onUpdate(services.filter(s => s.id !== deleteId));
    setSaving(false);
    setDeleteId(null);
  }

  return {
    view, step, canAdvance, nextStep, prevStep, openAdd, openEdit, closeForm, editingId,
    form, setForm, saving, handleSave,
    fileInputRef, fileVideoRef, uploadingIdx, cropFile, setCropFile,
    handleFileChange, handleCropConfirm, handleVideoFileChange, removeImage, makeCover,
    videoTab, setVideoTab, videoUploading,
    togglingId, toggleActive, deleteId, setDeleteId, handleDelete,
    transactions,
  };
}

export type ServiceFormState = ReturnType<typeof useServiceForm>;
