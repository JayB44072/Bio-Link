import { ArrowLeft, Check, Loader2, ShoppingBag, Sparkles, Star, Upload, X } from 'lucide-react';
import { BRAND, GRADIENTS } from '../../../../lib/theme';
import { dashPalette } from '../../../../lib/dashPalette';
import { useLang } from '../../../../lib/LanguageContext';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';
import { FREE_AI_QUOTA } from '../../../../lib/aiProductGenerator';
import LocationAutocomplete from '../../../ui/LocationAutocomplete';
import { ButtonSpinner } from '../../../ui/Spinner';
import Field from '../../../ui/Field';
import { MAX_IMAGES, type ProductFormState } from './useProductForm';

/** Formulaire pleine page d'ajout / modification d'un produit (colonne photos + colonne informations). */
export default function ProductFormView({ state }: { state: ProductFormState }) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const { surface, surfaceAlt, border, txtPrim, txtLabel, txtSub, inputBg, inputBorder } = dashPalette(dk);
  const fr = lang === 'fr';

  const {
    form, setForm, editingId, closeForm, saving, handleSave, categorySuggestions, planConfig,
    fileInputRef, uploadingIdx, handleFileChange, removeImage, makeCover,
    aiLoading, isFreePlan, aiRemaining, handleGenerateWithAi,
  } = state;

  const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25';
  const inputStyle = { background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim };
  const labelStyle = { color: txtLabel };

  return (
    <div>
      {/* En-tête du formulaire — connecté visuellement à l'onglet */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={closeForm} aria-label={fr ? 'Retour à la liste des produits' : 'Back to products'}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0"
          style={{ background: surfaceAlt, color: txtSub }}>
          <ArrowLeft size={16} aria-hidden />
        </button>
        <div>
          <h2 className="font-black text-xl" style={{ color: txtPrim }}>
            {editingId ? t.editProduct : t.addProduct}
          </h2>
          <p className="text-xs" style={{ color: txtSub }}>
            {fr ? 'Renseignez les informations et photos de votre article' : 'Fill in your item details and photos'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">

        {/* ── Colonne galerie photos ── */}
        <div className="rounded-3xl p-5" style={{ background: surface, border: `1px solid ${border}` }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="block text-sm font-semibold" style={labelStyle}>
              {fr ? 'Photos du produit' : 'Product photos'}
            </h3>
            <span className="text-xs font-medium" style={{ color: txtSub }}>{form.images.length}/{MAX_IMAGES}</span>
          </div>
          <p className="text-xs mb-4" style={{ color: txtSub }}>
            {fr
              ? 'La première photo est la photo principale. Cliquez sur une autre photo pour la définir comme principale.'
              : 'The first photo is the cover photo. Click another photo to make it the cover.'}
          </p>

          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden"
            aria-label={fr ? 'Ajouter une photo' : 'Add a photo'} />

          {/* Grande zone photo principale */}
          <div className="relative rounded-2xl overflow-hidden h-64 mb-3 flex items-center justify-center"
            style={{ background: surfaceAlt, border: `1px solid ${inputBorder}` }}>
            {form.images[0] ? (
              <>
                <img src={form.images[0]} alt={fr ? 'Photo principale' : 'Cover photo'} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <Star size={10} fill="#FFD166" color="#FFD166" aria-hidden />
                  {fr ? 'Principale' : 'Cover'}
                </span>
                <button onClick={() => removeImage(0)} aria-label={fr ? 'Retirer la photo principale' : 'Remove cover photo'}
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white transition"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <X size={14} aria-hidden />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ShoppingBag size={36} aria-hidden style={{ color: txtSub }} />
                <span className="text-xs font-medium" style={{ color: txtSub }}>
                  {fr ? 'Aucune photo' : 'No photo yet'}
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
                    aria-label={fr ? `Retirer la photo ${idx + 1}` : `Remove photo ${idx + 1}`}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition"
                    style={{ background: 'rgba(0,0,0,0.55)' }}>
                    <X size={11} aria-hidden />
                  </button>
                </div>
              );
            })}

            {form.images.length < MAX_IMAGES && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingIdx !== null}
                className="rounded-xl h-20 flex flex-col items-center justify-center gap-1 transition disabled:opacity-60"
                style={{ background: surfaceAlt, border: `2px dashed ${inputBorder}` }}>
                {uploadingIdx !== null ? (
                  <Loader2 size={16} className="animate-spin" style={{ color: BRAND.violet }} />
                ) : (
                  <>
                    <Upload size={15} aria-hidden style={{ color: BRAND.violet }} />
                    <span className="text-[10px] font-semibold" style={{ color: BRAND.violet }}>
                      {fr ? 'Ajouter' : 'Add'}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Colonne informations ── */}
        <div className="rounded-3xl p-5 space-y-4" style={{ background: surface, border: `1px solid ${border}` }}>

          {/* Bandeau de génération par IA */}
          <div className="rounded-2xl p-3 flex items-center gap-3"
            style={{
              background: dk ? 'rgba(139,92,246,0.10)' : 'linear-gradient(135deg,#f5f0ff,#fef0f7)',
              border: `1px solid ${dk ? 'rgba(139,92,246,0.28)' : 'rgba(139,92,246,0.22)'}`,
            }}>
            <button type="button" onClick={handleGenerateWithAi} disabled={aiLoading}
              className="flex items-center gap-2 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-lg disabled:opacity-60 shrink-0"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#EC4899)', boxShadow: '0 6px 18px rgba(139,92,246,0.35)' }}>
              {aiLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  {fr ? "L'IA analyse..." : 'AI analysing...'}
                </>
              ) : (
                <>
                  <Sparkles size={14} aria-hidden />
                  {fr ? "Générer avec l'IA" : 'Generate with AI'}
                </>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold" style={{ color: dk ? '#e9d5ff' : '#6d28d9' }}>
                <Sparkles size={10} aria-hidden className="inline -mt-0.5 mr-1" />
                Powered by AI
              </p>
              <p className="text-[10.5px] leading-tight mt-0.5" style={{ color: txtSub }}>
                {isFreePlan
                  ? (fr
                      ? `${aiRemaining}/${FREE_AI_QUOTA} générations gratuites restantes ce mois-ci.`
                      : `${aiRemaining}/${FREE_AI_QUOTA} free generations left this month.`)
                  : (fr
                      ? 'Générations illimitées incluses dans votre plan.'
                      : 'Unlimited generations included in your plan.')}
              </p>
            </div>
          </div>

          <Field label={t.productName} labelStyle={labelStyle}>
            {({ id }) => (
              <input id={id} type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} style={inputStyle} />
            )}
          </Field>
          <Field label={t.productDesc} labelStyle={labelStyle}>
            {({ id }) => (
              <textarea id={id} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4} className={`${inputCls} resize-none`} style={inputStyle} />
            )}
          </Field>
          <div className="flex gap-3">
            <Field className="flex-1" label={t.productPrice} labelStyle={labelStyle}>
              {({ id }) => (
                <input id={id} type="number" inputMode="decimal" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className={inputCls} style={inputStyle} />
              )}
            </Field>
            <Field className="w-28" label={t.currency} labelStyle={labelStyle}>
              {({ id }) => (
                <select id={id} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
                  className={inputCls} style={inputStyle}>
                  <option value="FCFA">FCFA</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              )}
            </Field>
          </div>

          <Field label={t.productQuantity} labelStyle={labelStyle}>
            {({ id }) => (
              <input id={id} type="number" inputMode="numeric" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                className={inputCls} style={inputStyle} />
            )}
          </Field>

          <Field label={fr ? 'Catégorie' : 'Category'} labelStyle={labelStyle}>
            {({ id }) => (
              <>
                <input id={id} type="text" list="product-category-suggestions" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  placeholder={fr ? 'ex: Vêtements, Électronique...' : 'e.g. Clothing, Electronics...'}
                  className={inputCls} style={inputStyle} />
                <datalist id="product-category-suggestions">
                  {categorySuggestions.map(c => <option key={c} value={c} />)}
                </datalist>
                {categorySuggestions.length > 0 && (
                  <p className="text-[11px] mt-1.5" style={{ color: txtSub }}>
                    {fr
                      ? 'Choisissez parmi vos catégories existantes ou saisissez une nouvelle.'
                      : 'Pick from your existing categories or enter a new one.'}
                  </p>
                )}
              </>
            )}
          </Field>

          <LocationAutocomplete
            label={fr ? 'Emplacement du produit' : 'Product location'}
            placeholder={fr ? 'Ville, quartier, adresse...' : 'City, area, address...'}
            myLocationLabel={fr ? 'Utiliser ma position actuelle' : 'Use my current location'}
            value={form.location}
            onChange={loc => setForm(f => ({ ...f, location: loc }))}
            isDark={dk}
          />

          {/* Info commission */}
          <div className="flex items-start gap-2.5 rounded-2xl p-3.5"
            style={{ background: dk ? 'rgba(251,191,36,0.08)' : '#fffbeb', border: '1px solid rgba(251,191,36,0.3)' }}>
            <span aria-hidden className="text-amber-500 shrink-0 mt-0.5">ℹ</span>
            <p className="text-xs leading-relaxed" style={{ color: dk ? 'rgba(251,191,36,0.85)' : '#92400e' }}>
              {fr
                ? `Des frais de ${Math.round(planConfig.commission_rate * 100)}% sont prélevés sur chaque vente lors de la confirmation de livraison. Ces frais sont utilisés pour sécuriser les échanges monétaires entre le client et vous.`
                : `A ${Math.round(planConfig.commission_rate * 100)}% fee is deducted from each sale upon delivery confirmation. These fees secure monetary exchanges between the buyer and you.`}
            </p>
          </div>

          <div className="flex gap-3 pt-3">
            <button onClick={closeForm} className="flex-1 text-sm font-semibold py-3 rounded-xl transition"
              style={{ background: surfaceAlt, color: txtSub }}>{t.cancel}</button>
            <button onClick={handleSave} disabled={saving || uploadingIdx !== null || !form.name}
              className="flex-1 text-white text-sm font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: GRADIENTS.brand }}>
              {saving ? <ButtonSpinner /> : <Check size={16} aria-hidden />}
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
