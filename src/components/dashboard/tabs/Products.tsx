import React, { useState, useRef } from 'react';
import { Product, Profile } from '../../../lib/types';
import { PLAN_CONFIGS, canAddProduct, getNextPlan } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { useAppPrefs } from '../../../lib/AppPrefsContext';
import { supabase } from '../../../lib/supabase';
import LocationAutocomplete, { LocationValue } from '../../ui/LocationAutocomplete';
import {
  Plus, Edit2, Trash2, Lock, ShoppingBag, X, Check, Package, ArrowUp, Upload, Loader2, ArrowLeft, Star,
} from 'lucide-react';

interface ProductsProps {
  profile: Profile;
  products: Product[];
  onUpdate: (products: Product[]) => void;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  images: string[];
  currency: string;
  is_active: boolean;
  location: LocationValue;
}

const emptyForm: ProductFormData = {
  name: '', description: '', price: '', quantity: '', images: [], currency: 'FCFA', is_active: true,
  location: { address: '', lat: null, lng: null },
};

const MAX_IMAGES = 8;

export default function Products({ profile, products, onUpdate }: ProductsProps) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const plan = profile.plan_type;
  const planConfig = PLAN_CONFIGS[plan];
  const maxProducts = planConfig.max_products;
  const canAdd = canAddProduct(plan, products.length);
  const nextPlan = getNextPlan(plan);

  /* ── Theme tokens ── */
  const surface     = dk ? '#12122b' : '#ffffff';
  const surfaceAlt  = dk ? '#191938' : '#faf9ff';
  const border      = dk ? 'rgba(139,124,255,0.16)' : '#eeebfb';
  const txtPrim     = dk ? '#f2f1ff' : '#16162e';
  const txtLabel    = dk ? '#c7c5e8' : '#2d2b45';
  const txtSub      = dk ? '#8c8ab0' : '#8a87a3';
  const inputBg     = dk ? '#0d0d22' : '#faf9ff';
  const inputBorder = dk ? 'rgba(139,124,255,0.18)' : '#e6e1fb';
  const inputCls    = 'w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25';
  const labelCls    = 'block text-sm font-semibold mb-1.5';

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
    });
    setEditingId(p.id);
    setView('form');
  }

  function closeForm() {
    setView('list');
    setEditingId(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'fr' ? 'Veuillez sélectionner un fichier image valide.' : 'Please select a valid image file.');
      return;
    }
    if (form.images.length >= MAX_IMAGES) return;

    const slotIdx = form.images.length;
    setUploadingIdx(slotIdx);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setForm(f => ({ ...f, images: [...f.images, publicUrl] }));
    } catch (err: any) {
      console.error("Erreur lors de l'upload:", err.message);
      alert(lang === 'fr' ? "Échec du téléchargement de l'image." : "Image upload failed.");
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
      updated_at: new Date().toISOString(),
    };

    if (!editingId) {
      const { data, error } = await supabase.from('products').insert(payload).select().maybeSingle();
      if (!error && data) onUpdate([...products, data]);
    } else {
      const { data, error } = await supabase.from('products').update(payload).eq('id', editingId).select().maybeSingle();
      if (!error && data) onUpdate(products.map(p => p.id === editingId ? data : p));
    }
    setSaving(false);
    closeForm();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setSaving(true);
    await supabase.from('products').delete().eq('id', deleteId);
    onUpdate(products.filter(p => p.id !== deleteId));
    setSaving(false);
    setDeleteId(null);
  }

  const progressPct = maxProducts ? Math.min((products.length / maxProducts) * 100, 100) : 0;
  const progressColor = !maxProducts ? '#6C63FF'
    : products.length >= maxProducts ? '#ef4444'
    : products.length >= maxProducts * 0.8 ? '#f59e0b' : '#6C63FF';

  /* ══════════════════ FORM VIEW — pleine page façon Amazon / Alibaba ══════════════════ */
  if (view === 'form') {
    return (
      <div>
        {/* Header du formulaire — connecté visuellement à l'onglet */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={closeForm}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0"
            style={{ background: surfaceAlt, color: txtSub }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="font-black text-xl" style={{ color: txtPrim }}>
              {editingId ? t.editProduct : t.addProduct}
            </h2>
            <p className="text-xs" style={{ color: txtSub }}>
              {lang === 'fr' ? 'Renseignez les informations et photos de votre article' : 'Fill in your item details and photos'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">

          {/* ── Colonne galerie photos ── */}
          <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-1">
              <label className={labelCls} style={{ color: txtLabel, marginBottom: 0 }}>
                {lang === 'fr' ? 'Photos du produit' : 'Product photos'}
              </label>
              <span className="text-xs font-medium" style={{ color: txtSub }}>{form.images.length}/{MAX_IMAGES}</span>
            </div>
            <p className="text-xs mb-4" style={{ color: txtSub }}>
              {lang === 'fr'
                ? 'La première photo est la photo principale. Cliquez sur une autre photo pour la définir comme principale.'
                : 'The first photo is the cover photo. Click another photo to make it the cover.'}
            </p>

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            {/* Grande zone photo principale */}
            <div className="relative rounded-2xl overflow-hidden h-64 mb-3 flex items-center justify-center"
              style={{ background: surfaceAlt, border: `1px solid ${inputBorder}` }}>
              {form.images[0] ? (
                <>
                  <img src={form.images[0]} alt="Cover" className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <Star size={10} fill="#FFD166" color="#FFD166" />
                    {lang === 'fr' ? 'Principale' : 'Cover'}
                  </span>
                  <button onClick={() => removeImage(0)}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white transition"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <ShoppingBag size={36} style={{ color: txtSub }} />
                  <span className="text-xs font-medium" style={{ color: txtSub }}>
                    {lang === 'fr' ? 'Aucune photo' : 'No photo yet'}
                  </span>
                </div>
              )}
            </div>

            {/* Miniatures */}
            <div className="grid grid-cols-4 gap-2.5">
              {form.images.slice(1).map((img, i) => {
                const idx = i + 1;
                return (
                  <div key={img} className="relative rounded-xl overflow-hidden h-20 group cursor-pointer"
                    style={{ background: surfaceAlt, border: `1px solid ${inputBorder}` }}
                    onClick={() => makeCover(idx)}>
                    <img src={img} alt={`photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button onClick={e => { e.stopPropagation(); removeImage(idx); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                      style={{ background: 'rgba(0,0,0,0.55)' }}>
                      <X size={11} />
                    </button>
                  </div>
                );
              })}

              {form.images.length < MAX_IMAGES && (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingIdx !== null}
                  className="rounded-xl h-20 flex flex-col items-center justify-center gap-1 transition disabled:opacity-60"
                  style={{ background: surfaceAlt, border: `2px dashed ${inputBorder}` }}>
                  {uploadingIdx !== null ? (
                    <Loader2 size={16} className="animate-spin" style={{ color: '#6C63FF' }} />
                  ) : (
                    <>
                      <Upload size={15} style={{ color: '#6C63FF' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#6C63FF' }}>
                        {lang === 'fr' ? 'Ajouter' : 'Add'}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* ── Colonne informations ── */}
          <div className="rounded-3xl p-5 space-y-4" style={{ background: surface, border: `1px solid ${border}` }}>
            <div>
              <label className={labelCls} style={{ color: txtLabel }}>{t.productName}</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
            </div>
            <div>
              <label className={labelCls} style={{ color: txtLabel }}>{t.productDesc}</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4} className={`${inputCls} resize-none`}
                style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className={labelCls} style={{ color: txtLabel }}>{t.productPrice}</label>
                <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
              </div>
              <div className="w-28">
                <label className={labelCls} style={{ color: txtLabel }}>{t.currency}</label>
                <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}>
                  <option value="FCFA">FCFA</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls} style={{ color: txtLabel }}>{t.productQuantity}</label>
              <input type="number" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className={inputCls} style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
            </div>

            <LocationAutocomplete
              label={lang === 'fr' ? 'Emplacement du produit' : 'Product location'}
              placeholder={lang === 'fr' ? 'Ville, quartier, adresse...' : 'City, area, address...'}
              myLocationLabel={lang === 'fr' ? 'Utiliser ma position actuelle' : 'Use my current location'}
              value={form.location}
              onChange={loc => setForm(f => ({ ...f, location: loc }))}
              isDark={dk}
            />

            {/* Info commission */}
            <div className="flex items-start gap-2.5 rounded-2xl p-3.5"
              style={{ background: dk ? 'rgba(251,191,36,0.08)' : '#fffbeb', border: '1px solid rgba(251,191,36,0.3)' }}>
              <span className="text-amber-500 shrink-0 mt-0.5">ℹ</span>
              <p className="text-xs leading-relaxed" style={{ color: dk ? 'rgba(251,191,36,0.85)' : '#92400e' }}>
                {lang === 'fr'
                  ? `Des frais de ${Math.round(planConfig.commission_rate * 100)}% sont prélevés sur chaque vente lors de la confirmation de livraison. Ces frais sont utilisés pour sécuriser les échanges monétaires entre le client et vous.`
                  : `A ${Math.round(planConfig.commission_rate * 100)}% fee is deducted from each sale upon delivery confirmation. These fees secure monetary exchanges between the buyer and you.`}
              </p>
            </div>

            <div className="flex gap-3 pt-3">
              <button onClick={closeForm} className="flex-1 text-sm font-semibold py-3 rounded-xl transition"
                style={{ background: surfaceAlt, color: txtSub }}>{t.cancel}</button>
              <button onClick={handleSave} disabled={saving || uploadingIdx !== null || !form.name}
                className="flex-1 text-white text-sm font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)' }}>
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════ LIST VIEW ══════════════════ */
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h2 className="font-black text-xl" style={{ color: txtPrim }}>{t.myProducts}</h2>
          <p className="text-sm mt-0.5" style={{ color: txtSub }}>{t.productsCount(products.length, maxProducts)}</p>
        </div>
        {canAdd ? (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition shadow-lg"
            style={{ background: 'linear-gradient(135deg,#6C63FF,#00C2FF)', boxShadow: '0 8px 20px rgba(108,99,255,0.3)' }}
          >
            <Plus size={16} />{t.addProduct}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-2xl px-3 py-2.5"
            style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Lock size={14} className="text-amber-500" />
            <span className="text-amber-500 text-xs font-semibold">{t.productLimitReached}</span>
          </div>
        )}
      </div>

      {/* Limit reached banner */}
      {!canAdd && nextPlan && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.18)' }}>
            <ArrowUp size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-500">{t.productLimitReached}</p>
            <p className="text-xs" style={{ color: dk ? 'rgba(251,191,36,0.7)' : '#b45309' }}>
              {t.upgradeToAdd(PLAN_CONFIGS[nextPlan].name.fr)}
            </p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {maxProducts && (
        <div className="mb-6">
          <div className="flex justify-between text-xs font-medium mb-1.5" style={{ color: txtSub }}>
            <span>{products.length} produits</span>
            <span>{maxProducts} max</span>
          </div>
          <div className="w-full rounded-full h-1.5" style={{ background: surfaceAlt }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${progressPct}%`, background: progressColor }} />
          </div>
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 rounded-3xl" style={{ background: surfaceAlt, border: `1px dashed ${border}` }}>
          <Package size={40} className="mx-auto mb-3 opacity-40" style={{ color: txtSub }} />
          <p className="text-sm font-medium" style={{ color: txtSub }}>{t.noProducts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="rounded-3xl overflow-hidden transition-all group hover:-translate-y-1"
              style={{ background: surface, border: `1px solid ${border}`, boxShadow: dk ? 'none' : '0 2px 16px rgba(108,99,255,0.06)' }}>
              {/* Image */}
              <div className="h-40 relative overflow-hidden" style={{ background: surfaceAlt }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={32} style={{ color: txtSub }} />
                  </div>
                )}
                {product.images?.length > 1 && (
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: 'rgba(0,0,0,0.5)' }}>
                    +{product.images.length - 1}
                  </span>
                )}
                <span className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                  style={product.quantity > 0
                    ? { background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
                    : { background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {product.quantity > 0 ? `${t.inStock} (${product.quantity})` : t.outOfStock}
                </span>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-sm truncate" style={{ color: txtPrim }}>{product.name}</h3>
                <p className="text-xs mt-0.5 line-clamp-2" style={{ color: txtSub }}>{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-black text-sm" style={{ color: '#6C63FF' }}>
                    {product.price.toLocaleString()} {product.currency}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg transition"
                      style={{ color: txtSub, background: surfaceAlt }}>
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => setDeleteId(product.id)} className="p-1.5 rounded-lg transition"
                      style={{ color: '#FF6B9D', background: dk ? 'rgba(255,107,157,0.1)' : '#fff1f6' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl shadow-2xl p-6 text-center" style={{ background: surface }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: dk ? 'rgba(255,107,157,0.12)' : '#fff1f6' }}>
              <Trash2 size={20} style={{ color: '#FF6B9D' }} />
            </div>
            <h3 className="font-bold mb-2" style={{ color: txtPrim }}>{t.confirmDelete}</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteId(null)} className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition"
                style={{ background: surfaceAlt, color: txtSub }}>{t.cancel}</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B9D,#e94f85)' }}>
                {saving ? '...' : t.deleteProduct}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
