import { Camera, DollarSign, Image as ImageIcon, Info, Loader2, Play, Plus, Star, Video as VideoIcon, X } from 'lucide-react';
import { BRAND, GRADIENTS } from '../../../../lib/theme';
import { dashPalette } from '../../../../lib/dashPalette';
import { useLang } from '../../../../lib/LanguageContext';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';
import Field from '../../../ui/Field';
import { MAX_IMAGES, isVideoLink, type ServiceFormState } from './useServiceForm';

const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25';
const labelCls = 'block text-[11px] font-bold uppercase tracking-wide mb-1.5';

/** Palette + langue communes aux trois étapes. */
function useStepTheme() {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  return { t, fr: lang === 'fr', dk, ...dashPalette(dk) };
}

function StepHeading({ icon: Icon, tint, color, title, subtitle }: {
  icon: typeof Info; tint: string; color: string; title: string; subtitle: string;
}) {
  const { txtPrim, txtSub } = useStepTheme();
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: tint }}>
        <Icon size={16} aria-hidden style={{ color }} />
      </div>
      <div>
        <h3 className="font-black text-base" style={{ color: txtPrim }}>{title}</h3>
        <p className="text-xs" style={{ color: txtSub }}>{subtitle}</p>
      </div>
    </div>
  );
}

/* ───────── Étape 1 : informations générales ───────── */
export function InfoStep({ state }: { state: ServiceFormState }) {
  const { t, fr, dk, surfaceAlt, border, txtPrim, txtLabel, txtSub, inputBg, inputBorder } = useStepTheme();
  const { form, setForm } = state;

  return (
    <div className="space-y-5">
      <StepHeading icon={Info} tint="rgba(255,107,157,0.12)" color={BRAND.pink}
        title={fr ? 'Informations générales' : 'General information'}
        subtitle={fr ? 'Donnez un nom clair et précis à votre prestation' : 'Give your service a clear, precise name'} />

      <Field labelClassName={labelCls} labelStyle={{ color: txtLabel }}
        label={<>{t.serviceName} <span style={{ color: BRAND.pink }}>*</span></>}
        aside={<span className="text-[10px]" style={{ color: form.name.length > 80 ? BRAND.pink : txtSub }}>{form.name.length}/100</span>}>
        {({ id }) => (
          <>
            <input id={id} type="text" value={form.name} maxLength={100} required aria-required
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={fr
                ? 'Ex : Création de logo professionnel, Montage vidéo YouTube…'
                : 'Ex: Professional logo design, YouTube video editing…'}
              className={inputCls}
              style={{ background: inputBg, border: `1px solid ${form.name ? BRAND.pink : inputBorder}`, color: txtPrim }} />
            {!form.name.trim() && (
              <p className="text-[10px] mt-1" style={{ color: txtSub }}>
                {fr ? 'Le nom est obligatoire pour continuer.' : 'Name is required to continue.'}
              </p>
            )}
          </>
        )}
      </Field>

      <Field labelClassName={labelCls} labelStyle={{ color: txtLabel }}
        label={fr ? 'Durée / Délai de livraison' : 'Duration / Delivery time'}>
        {({ id }) => (
          <input id={id} type="text" value={form.duration}
            onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
            placeholder={fr ? 'Ex : 1h, 3 jours, Sur devis…' : 'Ex: 1h, 3 days, On request…'}
            className={inputCls}
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
        )}
      </Field>

      {/* Publication immédiate */}
      <div className="flex items-center justify-between rounded-2xl px-4 py-3.5"
        style={{ background: surfaceAlt, border: `1px solid ${border}` }}>
        <div>
          <p id="service-publish-label" className="text-sm font-bold" style={{ color: txtPrim }}>
            {fr ? 'Publier immédiatement' : 'Publish immediately'}
          </p>
          <p className="text-xs mt-0.5" style={{ color: txtSub }}>
            {form.is_active
              ? (fr ? 'Visible sur votre page publique' : 'Visible on your public page')
              : (fr ? 'Masqué — mode brouillon' : 'Hidden — draft mode')}
          </p>
        </div>
        <button type="button" role="switch" aria-checked={form.is_active} aria-labelledby="service-publish-label"
          onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
          className="relative w-11 h-6 rounded-full transition-all shrink-0"
          style={{ background: form.is_active ? GRADIENTS.pinkViolet : dk ? 'rgba(139,124,255,0.15)' : '#e6e1fb' }}>
          <div className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
            style={{ left: form.is_active ? 'calc(100% - 20px)' : '4px' }} />
        </button>
      </div>
    </div>
  );
}

/* ───────── Étape 2 : médias et description ───────── */
export function MediaStep({ state }: { state: ServiceFormState }) {
  const { t, fr, surfaceAlt, txtPrim, txtLabel, txtSub, inputBg, inputBorder } = useStepTheme();
  const {
    form, setForm, fileInputRef, fileVideoRef, uploadingIdx, handleFileChange, handleVideoFileChange,
    removeImage, makeCover, videoTab, setVideoTab, videoUploading,
  } = state;
  const hostedVideo = form.video_url && !isVideoLink(form.video_url);

  return (
    <div className="space-y-5">
      <StepHeading icon={ImageIcon} tint="rgba(108,99,255,0.12)" color={BRAND.violet}
        title={fr ? 'Présentation visuelle' : 'Visual presentation'}
        subtitle={fr ? 'Ajoutez des photos et une description détaillée' : 'Add photos and a detailed description'} />

      {/* Galerie */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className={labelCls} style={{ color: txtLabel, marginBottom: 0 }}>
            {fr ? 'Photos du service' : 'Service photos'}
          </h4>
          <span className="text-xs font-medium" style={{ color: txtSub }}>{form.images.length}/{MAX_IMAGES}</span>
        </div>

        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden"
          aria-label={fr ? 'Ajouter une photo' : 'Add a photo'} />

        {/* Photo principale */}
        <div className="relative rounded-2xl overflow-hidden mb-3"
          style={{ height: '180px', background: surfaceAlt, border: `2px dashed ${form.images[0] ? 'transparent' : inputBorder}` }}>
          {form.images[0] ? (
            <>
              <img src={form.images[0]} alt={fr ? 'Photo principale' : 'Cover photo'} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-white z-10"
                style={{ background: 'rgba(0,0,0,0.5)' }}>
                <Star size={9} fill="#FFD166" color="#FFD166" aria-hidden />
                {fr ? 'Principale' : 'Cover'}
              </span>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                aria-label={fr ? 'Changer la photo principale' : 'Change cover photo'}
                className="absolute inset-0 flex items-center justify-center group z-[5]"
                style={{ background: 'rgba(0,0,0,0)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.45)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0)')}>
                <div className="flex flex-col items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <Camera size={26} aria-hidden className="text-white drop-shadow-lg" />
                  <span className="text-xs font-bold text-white drop-shadow">{fr ? 'Changer la photo' : 'Change photo'}</span>
                </div>
              </button>
              <button onClick={() => removeImage(0)} aria-label={fr ? 'Retirer la photo principale' : 'Remove cover photo'}
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-white z-10"
                style={{ background: 'rgba(0,0,0,0.55)' }}>
                <X size={13} aria-hidden />
              </button>
            </>
          ) : (
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-2 transition hover:opacity-80">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,157,0.1)' }}>
                <Camera size={22} aria-hidden style={{ color: BRAND.pink }} />
              </div>
              <span className="text-sm font-semibold" style={{ color: BRAND.pink }}>
                {fr ? 'Ajouter une photo principale' : 'Add a cover photo'}
              </span>
              <span className="text-xs" style={{ color: txtSub }}>PNG, JPG, WebP</span>
            </button>
          )}
        </div>

        {/* Miniatures */}
        <div className="grid grid-cols-4 gap-2">
          {form.images.slice(1).map((img, i) => {
            const idx = i + 1;
            return (
              <div key={img} className="relative rounded-xl overflow-hidden group cursor-pointer"
                style={{ height: '64px', background: surfaceAlt, border: `1px solid ${inputBorder}` }}
                onClick={() => makeCover(idx)}>
                <img src={img} alt={`photo ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                <button onClick={e => { e.stopPropagation(); removeImage(idx); }}
                  aria-label={fr ? `Retirer la photo ${idx + 1}` : `Remove photo ${idx + 1}`}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100 transition"
                  style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <X size={10} aria-hidden />
                </button>
              </div>
            );
          })}
          {form.images.length < MAX_IMAGES && (
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadingIdx !== null}
              className="rounded-xl flex flex-col items-center justify-center gap-1 transition disabled:opacity-50"
              style={{ height: '64px', background: surfaceAlt, border: `2px dashed ${inputBorder}` }}>
              {uploadingIdx !== null
                ? <Loader2 size={14} className="animate-spin" style={{ color: BRAND.pink }} />
                : <>
                    <Plus size={14} aria-hidden style={{ color: BRAND.pink }} />
                    <span className="text-[9px] font-bold" style={{ color: BRAND.pink }}>{fr ? 'Ajouter' : 'Add'}</span>
                  </>}
            </button>
          )}
        </div>
        {form.images.length > 1 && (
          <p className="text-[10px] mt-2" style={{ color: txtSub }}>
            {fr ? 'Cliquez sur une miniature pour en faire la photo principale.' : 'Click a thumbnail to make it the cover photo.'}
          </p>
        )}
      </div>

      {/* Vidéo : fichier OU lien */}
      <div>
        <h4 className={labelCls} style={{ color: txtLabel }}>
          {fr ? 'Vidéo de présentation (optionnel)' : 'Presentation video (optional)'}
        </h4>
        <div role="tablist" className="flex rounded-xl overflow-hidden mb-2.5" style={{ border: `1px solid ${inputBorder}` }}>
          {(['upload', 'link'] as const).map(tab => (
            <button key={tab} type="button" role="tab" aria-selected={videoTab === tab} onClick={() => setVideoTab(tab)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold transition"
              style={{
                background: videoTab === tab ? 'linear-gradient(135deg,rgba(108,99,255,0.14),rgba(255,107,157,0.08))' : 'transparent',
                color: videoTab === tab ? BRAND.violet : txtSub,
                borderRight: tab === 'upload' ? `1px solid ${inputBorder}` : 'none',
              }}>
              {tab === 'upload' ? <VideoIcon size={11} aria-hidden /> : <Play size={11} aria-hidden />}
              {tab === 'upload'
                ? (fr ? 'Fichier vidéo' : 'Video file')
                : (fr ? 'Lien YouTube / Vimeo' : 'YouTube / Vimeo link')}
            </button>
          ))}
        </div>

        <input type="file" accept="video/*" ref={fileVideoRef} onChange={handleVideoFileChange} className="hidden"
          aria-label={fr ? 'Choisir une vidéo' : 'Choose a video'} />

        {videoTab === 'upload' ? (
          <div>
            {hostedVideo ? (
              <div className="relative rounded-2xl overflow-hidden" style={{ background: '#000', border: `1px solid ${inputBorder}` }}>
                <video src={form.video_url} controls className="w-full rounded-2xl" style={{ maxHeight: '150px', display: 'block' }} />
                <button type="button" onClick={() => setForm(f => ({ ...f, video_url: '' }))}
                  aria-label={fr ? 'Retirer la vidéo' : 'Remove video'}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{ background: 'rgba(0,0,0,0.65)' }}>
                  <X size={12} aria-hidden />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileVideoRef.current?.click()} disabled={videoUploading}
                className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl transition disabled:opacity-60 hover:opacity-80"
                style={{ height: '90px', background: surfaceAlt, border: `2px dashed ${inputBorder}` }}>
                {videoUploading ? (
                  <Loader2 size={20} className="animate-spin" style={{ color: BRAND.violet }} />
                ) : (
                  <>
                    <VideoIcon size={22} aria-hidden style={{ color: BRAND.violet }} />
                    <span className="text-sm font-semibold" style={{ color: BRAND.violet }}>{fr ? 'Choisir une vidéo' : 'Choose a video'}</span>
                    <span className="text-[10px]" style={{ color: txtSub }}>MP4, MOV, WebM</span>
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="relative">
              <Play size={13} aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: BRAND.violet }} />
              <input type="url" inputMode="url" aria-label={fr ? 'Lien de la vidéo' : 'Video link'}
                value={form.video_url && isVideoLink(form.video_url) ? form.video_url : ''}
                onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
                placeholder="https://www.youtube.com/watch?v=..."
                className={inputCls}
                style={{ background: inputBg, border: `1px solid ${form.video_url ? BRAND.violet : inputBorder}`, color: txtPrim, paddingLeft: '2.25rem' }} />
            </div>
            <p className="text-[10px] mt-1" style={{ color: txtSub }}>
              {fr ? 'Collez le lien de votre vidéo YouTube ou Vimeo.' : 'Paste your YouTube or Vimeo link.'}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <Field labelClassName={labelCls} labelStyle={{ color: txtLabel }} label={t.serviceDesc}
        aside={<span className="text-[10px]" style={{ color: form.description.length > 900 ? BRAND.pink : txtSub }}>{form.description.length}/1000</span>}>
        {({ id }) => (
          <textarea id={id} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value.slice(0, 1000) }))}
            rows={7}
            placeholder={fr
              ? 'Décrivez précisément votre prestation : ce que vous offrez, votre expertise, les livrables, vos délais…'
              : 'Describe precisely what you offer: services included, expertise, deliverables, timelines…'}
            className={`${inputCls} resize-none`}
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
        )}
      </Field>
    </div>
  );
}

/* ───────── Étape 3 : tarification ───────── */
export function PricingStep({ state }: { state: ServiceFormState }) {
  const { t, fr, surfaceAlt, border, txtPrim, txtLabel, txtSub, inputBg, inputBorder } = useStepTheme();
  const { form, setForm } = state;
  const summary = [
    { label: 'Service',                       value: form.name || '—' },
    { label: fr ? 'Prix' : 'Price',           value: form.price ? `${parseFloat(form.price).toLocaleString()} ${form.currency}` : '—' },
    { label: fr ? 'Délai' : 'Duration',       value: form.duration || '—' },
    { label: 'Photos',                        value: String(form.images.length) },
    { label: fr ? 'Statut' : 'Status',        value: form.is_active ? (fr ? '✓ Actif' : '✓ Active') : (fr ? '— Brouillon' : '— Draft') },
  ];

  return (
    <div className="space-y-5">
      <StepHeading icon={DollarSign} tint="rgba(255,107,157,0.12)" color={BRAND.pink}
        title={fr ? 'Tarification' : 'Pricing'}
        subtitle={fr ? 'Définissez le prix de votre prestation' : 'Set your service price'} />

      <div className="flex gap-3">
        <Field className="flex-1" labelClassName={labelCls} labelStyle={{ color: txtLabel }}
          label={<>{t.servicePrice} <span className="text-[10px] font-normal" style={{ color: txtSub }}>{fr ? '(optionnel)' : '(optional)'}</span></>}>
          {({ id }) => (
            <div className="relative">
              <input id={id} type="number" inputMode="decimal" min="0" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0"
                className={inputCls}
                style={{
                  background: inputBg, border: `1px solid ${form.price ? BRAND.pink : inputBorder}`,
                  color: txtPrim, fontSize: '1.1rem', fontWeight: 700, paddingRight: '70px',
                }} />
              <span aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none" style={{ color: txtSub }}>
                {form.currency}
              </span>
            </div>
          )}
        </Field>
        <Field className="w-28" labelClassName={labelCls} labelStyle={{ color: txtLabel }} label={t.currency}>
          {({ id }) => (
            <select id={id} value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className={inputCls}
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }}>
              {['FCFA', 'XOF', 'GNF', 'EUR', 'USD'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </Field>
      </div>

      {/* Récapitulatif */}
      <div className="rounded-2xl p-4" style={{ background: surfaceAlt, border: `1px solid ${border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: txtSub }}>
          {fr ? 'Récapitulatif' : 'Summary'}
        </p>
        <div className="space-y-2.5">
          {summary.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span style={{ color: txtSub }}>{label}</span>
              <span className="font-semibold truncate max-w-[55%] text-right" style={{ color: txtPrim }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
