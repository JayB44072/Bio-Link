// import React, { useState } from 'react';
// import { Product, Profile } from '../../../lib/types';
// import { PLAN_CONFIGS, canAddProduct, getNextPlan } from '../../../lib/planLimits';
// import { useLang } from '../../../lib/LanguageContext';
// import { supabase } from '../../../lib/supabase';
// import {
//   Plus, Edit2, Trash2, Lock, ShoppingBag, X, Check, Package, ArrowUp
// } from 'lucide-react';

// interface ProductsProps {
//   profile: Profile;
//   products: Product[];
//   onUpdate: (products: Product[]) => void;
// }

// interface ProductFormData {
//   name: string;
//   description: string;
//   price: string;
//   image_url: string;
//   currency: string;
//   is_active: boolean;
// }

// const emptyForm: ProductFormData = {
//   name: '',
//   description: '',
//   price: '',
//   image_url: '',
//   currency: 'FCFA',
//   is_active: true,
// };

// export default function Products({ profile, products, onUpdate }: ProductsProps) {
//   const { t } = useLang();
//   const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [form, setForm] = useState<ProductFormData>(emptyForm);
//   const [saving, setSaving] = useState(false);
//   const [deletingId, setDeletingId] = useState<string | null>(null);

//   const plan = profile.plan_type;
//   const planConfig = PLAN_CONFIGS[plan];
//   const maxProducts = planConfig.max_products;
//   const canAdd = canAddProduct(plan, products.length);
//   const nextPlan = getNextPlan(plan);

//   function openAdd() {
//     setForm(emptyForm);
//     setEditingId(null);
//     setModal('add');
//   }

//   function openEdit(p: Product) {
//     setForm({
//       name: p.name,
//       description: p.description,
//       price: String(p.price),
//       image_url: p.image_url,
//       currency: p.currency,
//       is_active: p.is_active,
//     });
//     setEditingId(p.id);
//     setModal('edit');
//   }

//   function openDelete(id: string) {
//     setDeletingId(id);
//     setModal('delete');
//   }

//   async function handleSave() {
//     setSaving(true);
//     const payload = {
//       user_id: profile.user_id,
//       name: form.name,
//       description: form.description,
//       price: parseFloat(form.price) || 0,
//       image_url: form.image_url,
//       currency: form.currency,
//       is_active: form.is_active,
//       updated_at: new Date().toISOString(),
//     };

//     if (modal === 'add') {
//       const { data, error } = await supabase.from('products').insert(payload).select().maybeSingle();
//       if (!error && data) onUpdate([...products, data]);
//     } else if (modal === 'edit' && editingId) {
//       const { data, error } = await supabase
//         .from('products').update(payload).eq('id', editingId).select().maybeSingle();
//       if (!error && data) onUpdate(products.map(p => p.id === editingId ? data : p));
//     }
//     setSaving(false);
//     setModal(null);
//   }

//   async function handleDelete() {
//     if (!deletingId) return;
//     setSaving(true);
//     await supabase.from('products').delete().eq('id', deletingId);
//     onUpdate(products.filter(p => p.id !== deletingId));
//     setSaving(false);
//     setModal(null);
//     setDeletingId(null);
//   }

//   return (
//     <div>
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div>
//           <h2 className="text-white text-xl font-bold">{t.myProducts}</h2>
//           <p className="text-gray-400 text-sm mt-0.5">
//             {t.productsCount(products.length, maxProducts)}
//           </p>
//         </div>
//         {canAdd ? (
//           <button
//             onClick={openAdd}
//             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20"
//           >
//             <Plus size={16} />
//             {t.addProduct}
//           </button>
//         ) : (
//           <div className="flex items-center gap-2">
//             <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
//               <Lock size={14} className="text-amber-400" />
//               <span className="text-amber-400 text-xs font-medium">{t.productLimitReached}</span>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Limit reached banner */}
//       {!canAdd && nextPlan && (
//         <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
//               <ArrowUp size={18} className="text-amber-400" />
//             </div>
//             <div>
//               <p className="text-amber-300 text-sm font-semibold">{t.productLimitReached}</p>
//               <p className="text-amber-400/70 text-xs">{t.upgradeToAdd(PLAN_CONFIGS[nextPlan].name.fr)}</p>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Progress bar */}
//       {maxProducts && (
//         <div className="mb-6">
//           <div className="flex justify-between text-xs text-gray-500 mb-1.5">
//             <span>{products.length} produits</span>
//             <span>{maxProducts} max</span>
//           </div>
//           <div className="w-full bg-gray-800 rounded-full h-1.5">
//             <div
//               className={`h-1.5 rounded-full transition-all ${
//                 products.length >= maxProducts ? 'bg-red-500' :
//                 products.length >= maxProducts * 0.8 ? 'bg-amber-500' : 'bg-blue-500'
//               }`}
//               style={{ width: `${Math.min((products.length / maxProducts) * 100, 100)}%` }}
//             />
//           </div>
//         </div>
//       )}

//       {/* Products grid */}
//       {products.length === 0 ? (
//         <div className="text-center py-16 text-gray-500">
//           <Package size={40} className="mx-auto mb-3 opacity-40" />
//           <p className="text-sm">{t.noProducts}</p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
//           {products.map(product => (
//             <div key={product.id} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-600 transition-all group">
//               {/* Image */}
//               <div className="h-40 bg-gray-700 relative overflow-hidden">
//                 {product.image_url ? (
//                   <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
//                 ) : (
//                   <div className="w-full h-full flex items-center justify-center">
//                     <ShoppingBag size={32} className="text-gray-600" />
//                   </div>
//                 )}
//                 <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${
//                   product.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/50 text-gray-400'
//                 }`}>
//                   {product.is_active ? t.active : t.inactive}
//                 </div>
//               </div>
//               {/* Info */}
//               <div className="p-4">
//                 <h3 className="text-white font-semibold text-sm truncate">{product.name}</h3>
//                 <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{product.description}</p>
//                 <div className="flex items-center justify-between mt-3">
//                   <span className="text-blue-400 font-bold text-sm">
//                     {product.price.toLocaleString()} {product.currency}
//                   </span>
//                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                     <button
//                       onClick={() => openEdit(product)}
//                       className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition"
//                     >
//                       <Edit2 size={14} />
//                     </button>
//                     <button
//                       onClick={() => openDelete(product.id)}
//                       className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
//                     >
//                       <Trash2 size={14} />
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Modal */}
//       {(modal === 'add' || modal === 'edit') && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
//             <div className="flex items-center justify-between p-6 border-b border-gray-800">
//               <h3 className="text-white font-bold">{modal === 'add' ? t.addProduct : t.editProduct}</h3>
//               <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
//             </div>
//             <div className="p-6 space-y-4">
//               <div>
//                 <label className="block text-gray-300 text-sm mb-1.5">{t.productName}</label>
//                 <input
//                   type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
//                   className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
//                 />
//               </div>
//               <div>
//                 <label className="block text-gray-300 text-sm mb-1.5">{t.productDesc}</label>
//                 <textarea
//                   value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
//                   rows={2}
//                   className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
//                 />
//               </div>
//               <div className="flex gap-3">
//                 <div className="flex-1">
//                   <label className="block text-gray-300 text-sm mb-1.5">{t.productPrice}</label>
//                   <input
//                     type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
//                     className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
//                   />
//                 </div>
//                 <div className="w-28">
//                   <label className="block text-gray-300 text-sm mb-1.5">{t.currency}</label>
//                   <select
//                     value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
//                     className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
//                   >
//                     <option value="FCFA">FCFA</option>
//                     <option value="USD">USD</option>
//                     <option value="EUR">EUR</option>
//                   </select>
//                 </div>
//               </div>
//               <div>
//                 <label className="block text-gray-300 text-sm mb-1.5">{t.productImage}</label>
//                 <input
//                   type="url" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
//                   placeholder="https://images.pexels.com/..."
//                   className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
//                 />
//               </div>
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
//                   className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}
//                 >
//                   <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} style={{ transform: form.is_active ? 'translateX(20px)' : 'translateX(0)' }} />
//                 </button>
//                 <span className="text-gray-300 text-sm">{form.is_active ? t.active : t.inactive}</span>
//               </div>
//             </div>
//             <div className="flex gap-3 p-6 border-t border-gray-800">
//               <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition">{t.cancel}</button>
//               <button
//                 onClick={handleSave}
//                 disabled={saving || !form.name}
//                 className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
//               >
//                 {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></> : <Check size={16} />}
//                 {t.save}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Delete modal */}
//       {modal === 'delete' && (
//         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
//           <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
//             <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Trash2 size={20} className="text-red-400" />
//             </div>
//             <h3 className="text-white font-bold mb-2">{t.confirmDelete}</h3>
//             <div className="flex gap-3 mt-6">
//               <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition">{t.cancel}</button>
//               <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
//                 {saving ? '...' : t.deleteProduct}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }



import React, { useState, useRef } from 'react';
import { Product, Profile } from '../../../lib/types';
import { PLAN_CONFIGS, canAddProduct, getNextPlan } from '../../../lib/planLimits';
import { useLang } from '../../../lib/LanguageContext';
import { supabase } from '../../../lib/supabase';
import {
  Plus, Edit2, Trash2, Lock, ShoppingBag, X, Check, Package, ArrowUp, Upload, Image as ImageIcon, Loader2
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
  image_url: string;
  currency: string;
  is_active: boolean;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  currency: 'FCFA',
  is_active: true,
};

export default function Products({ profile, products, onUpdate }: ProductsProps) {
  const { t, lang } = useLang();
  const [modal, setModal] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plan = profile.plan_type;
  const planConfig = PLAN_CONFIGS[plan];
  const maxProducts = planConfig.max_products;
  const canAdd = canAddProduct(plan, products.length);
  const nextPlan = getNextPlan(plan);

  function openAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setModal('add');
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      image_url: p.image_url,
      currency: p.currency,
      is_active: p.is_active,
    });
    setEditingId(p.id);
    setModal('edit');
  }

  function openDelete(id: string) {
    setDeletingId(id);
    setModal('delete');
  }

  // --- LOGIQUE D'UPLOAD VERS SUPABASE STORAGE ---
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optionnel : Validation de type ou de taille (ex: max 3 Mo)
    if (!file.type.startsWith('image/')) {
      alert(lang === 'fr' ? 'Veuillez sélectionner un fichier image valide.' : 'Please select a valid image file.');
      return;
    }

    setUploading(true);
    try {
      // Génération d' un nom de fichier unique basé sur le timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload du fichier dans le bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 2. Récupération de l'URL publique du fichier stocké
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      // 3. Mise à jour de l'état du formulaire avec le lien obtenu
      setForm(f => ({ ...f, image_url: publicUrl }));
    } catch (err: any) {
      console.error("Erreur lors de l'upload:", err.message);
      alert(lang === 'fr' ? "Échec du téléchargement de l'image." : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    const payload = {
      user_id: profile.user_id,
      name: form.name,
      description: form.description,
      price: parseFloat(form.price) || 0,
      image_url: form.image_url,
      currency: form.currency,
      is_active: form.is_active,
      updated_at: new Date().toISOString(),
    };

    if (modal === 'add') {
      const { data, error } = await supabase.from('products').insert(payload).select().maybeSingle();
      if (!error && data) onUpdate([...products, data]);
    } else if (modal === 'edit' && editingId) {
      const { data, error } = await supabase
        .from('products').update(payload).eq('id', editingId).select().maybeSingle();
      if (!error && data) onUpdate(products.map(p => p.id === editingId ? data : p));
    }
    setSaving(false);
    setModal(null);
  }

  async function handleDelete() {
    if (!deletingId) return;
    setSaving(true);
    await supabase.from('products').delete().eq('id', deletingId);
    onUpdate(products.filter(p => p.id !== deletingId));
    setSaving(false);
    setModal(null);
    setDeletingId(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-xl font-bold">{t.myProducts}</h2>
          <p className="text-gray-400 text-sm mt-0.5">
            {t.productsCount(products.length, maxProducts)}
          </p>
        </div>
        {canAdd ? (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            <Plus size={16} />
            {t.addProduct}
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
              <Lock size={14} className="text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">{t.productLimitReached}</span>
            </div>
          </div>
        )}
      </div>

      {/* Limit reached banner */}
      {!canAdd && nextPlan && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <ArrowUp size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-amber-300 text-sm font-semibold">{t.productLimitReached}</p>
              <p className="text-amber-400/70 text-xs">{t.upgradeToAdd(PLAN_CONFIGS[nextPlan].name.fr)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {maxProducts && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{products.length} produits</span>
            <span>{maxProducts} max</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                products.length >= maxProducts ? 'bg-red-500' :
                products.length >= maxProducts * 0.8 ? 'bg-amber-500' : 'bg-blue-500'
              }`}
              style={{ width: `${Math.min((products.length / maxProducts) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Products grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t.noProducts}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map(product => (
            <div key={product.id} className="bg-gray-800/60 border border-gray-700/50 rounded-2xl overflow-hidden hover:border-gray-600 transition-all group">
              {/* Image */}
              <div className="h-40 bg-gray-700 relative overflow-hidden">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag size={32} className="text-gray-600" />
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-medium ${
                  product.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-gray-600/50 text-gray-400'
                }`}>
                  {product.is_active ? t.active : t.inactive}
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-semibold text-sm truncate">{product.name}</h3>
                <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-blue-400 font-bold text-sm">
                    {product.price.toLocaleString()} {product.currency}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(product)}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded-lg transition"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => openDelete(product.id)}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {(modal === 'add' || modal === 'edit') && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-800">
              <h3 className="text-white font-bold">{modal === 'add' ? t.addProduct : t.editProduct}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">{t.productName}</label>
                <input
                  type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">{t.productDesc}</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-gray-300 text-sm mb-1.5">{t.productPrice}</label>
                  <input
                    type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-gray-300 text-sm mb-1.5">{t.currency}</label>
                  <select
                    value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              {/* SECTION ZONE DE TELEVERSEMENT D'IMAGE UNIQUE */}
              <div>
                <label className="block text-gray-300 text-sm mb-1.5">{t.productImage}</label>
                
                {/* Input caché, déclenché par clic sur le conteneur personnalisé */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {form.image_url ? (
                  // Aperçu si l'image existe déjà ou vient d'être uploadée
                  <div className="relative group border border-gray-700 rounded-xl overflow-hidden bg-gray-800 h-36 flex items-center justify-center">
                    <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white font-semibold text-xs px-3 py-2 rounded-lg border border-white/20 transition"
                      >
                        <Edit2 size={12} />
                        {lang === 'fr' ? 'Changer l\'image' : 'Change Image'}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Zone de dépôt si aucune image n'est liée
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-700 hover:border-gray-500 bg-gray-800/40 hover:bg-gray-800/80 rounded-xl p-6 flex flex-col items-center justify-center gap-2 group transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="text-blue-500 animate-spin" />
                        <span className="text-xs text-gray-400 font-medium">{lang === 'fr' ? 'Envoi de l\'image...' : 'Uploading image...'}</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 bg-gray-800 border border-gray-700 group-hover:border-gray-600 rounded-xl flex items-center justify-center transition-colors">
                          <Upload size={16} className="text-gray-400 group-hover:text-gray-200" />
                        </div>
                        <div>
                          <p className="text-gray-200 text-xs font-semibold">{lang === 'fr' ? 'Sélectionner une photo' : 'Select a photo'}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">PNG, JPG ou WEBP</p>
                        </div>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-blue-600' : 'bg-gray-600'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.is_active ? 'translate-x-5.5 left-0.5' : 'left-0.5'}`} style={{ transform: form.is_active ? 'translateX(20px)' : 'translateX(0)' }} />
                </button>
                <span className="text-gray-300 text-sm">{form.is_active ? t.active : t.inactive}</span>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-gray-800">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition">{t.cancel}</button>
              <button
                onClick={handleSave}
                disabled={saving || uploading || !form.name}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /></> : <Check size={16} />}
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modal === 'delete' && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-white font-bold mb-2">{t.confirmDelete}</h3>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium py-2.5 rounded-xl transition">{t.cancel}</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                {saving ? '...' : t.deleteProduct}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}