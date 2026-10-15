import React from 'react';
import { ArrowLeft, Briefcase, Check, ChevronRight, Clock, DollarSign, Eye, Image as ImageIcon, Info, Loader2 } from 'lucide-react';
import { BRAND, GRADIENTS } from '../../../../lib/theme';
import { dashPalette } from '../../../../lib/dashPalette';
import { useLang } from '../../../../lib/LanguageContext';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';
import ImageCropModal from '../../../ui/ImageCropModal';
import { InfoStep, MediaStep, PricingStep } from './ServiceFormSteps';
import type { FormStep, ServiceFormData, ServiceFormState } from './useServiceForm';

interface StepDef { id: FormStep; label: string; icon: typeof Info }

/** Pastilles « 1 – 2 – 3 » en haut du formulaire. */
function StepIndicator({ steps, step }: { steps: StepDef[]; step: FormStep }) {
  const { isDark: dk } = useAppPrefs();
  const { txtSub } = dashPalette(dk);
  return (
    <ol className="flex items-center justify-center gap-0 mb-8" aria-label="Étapes">
      {steps.map((s, i) => {
        const isCompleted = step > s.id;
        const isCurrent = step === s.id;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && (
              <li aria-hidden className="flex-1 h-px mx-2 max-w-[52px] transition-all list-none"
                style={{ background: isCompleted ? BRAND.pink : dk ? 'rgba(139,124,255,0.2)' : '#e6e1fb' }} />
            )}
            <li className="flex flex-col items-center gap-1.5 list-none" aria-current={isCurrent ? 'step' : undefined}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                style={{
                  background: isCurrent ? GRADIENTS.pinkViolet : isCompleted ? 'rgba(255,107,157,0.15)' : dk ? 'rgba(139,124,255,0.1)' : '#f0eeff',
                  color: isCurrent ? '#fff' : isCompleted ? BRAND.pink : txtSub,
                  boxShadow: isCurrent ? '0 4px 16px rgba(255,107,157,0.4)' : 'none',
                }}>
                {isCompleted ? <Check size={14} aria-hidden /> : String(s.id)}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: isCurrent ? BRAND.pink : txtSub }}>
                {s.label}
              </span>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}

/** Carte « aperçu en direct » du service en cours de saisie. */
function LivePreview({ form }: { form: ServiceFormData }) {
  const { lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const { surfaceAlt, border, txtPrim, txtSub } = dashPalette(dk);
  const fr = lang === 'fr';

  return (
    <div className="sticky top-4 rounded-3xl overflow-hidden" style={{ background: surfaceAlt, border: `1px solid ${border}` }}>
      <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ borderColor: border }}>
        <Eye size={12} aria-hidden style={{ color: BRAND.pink }} />
        <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: BRAND.pink }}>
          {fr ? 'Aperçu en direct' : 'Live preview'}
        </span>
      </div>
      <div className="h-40 relative overflow-hidden" style={{ background: dk ? '#0d0d22' : '#ede9ff' }}>
        {form.images[0] ? (
          <img src={form.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Briefcase size={30} aria-hidden style={{ color: txtSub, opacity: 0.3 }} />
          </div>
        )}
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={form.is_active
            ? { background: 'rgba(34,197,94,0.2)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }
            : { background: 'rgba(0,0,0,0.35)', color: '#fff' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: form.is_active ? '#22c55e' : '#aaa' }} />
          {form.is_active ? (fr ? 'Actif' : 'Active') : (fr ? 'En pause' : 'Paused')}
        </span>
        {form.images.length > 1 && (
          <span className="absolute bottom-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
            +{form.images.length - 1}
          </span>
        )}
      </div>
      <div className="p-4">
        <h4 className="font-black text-sm truncate" style={{ color: txtPrim }}>
          {form.name || <span style={{ opacity: 0.35 }}>{fr ? 'Nom du service…' : 'Service name…'}</span>}
        </h4>
        <p className="text-xs mt-1 line-clamp-2 min-h-[2em]" style={{ color: txtSub }}>
          {form.description || (fr ? 'Votre description apparaîtra ici.' : 'Your description will appear here.')}
        </p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: border }}>
          <span className="font-black text-base" style={{ color: BRAND.pink }}>
            {form.price
              ? `${parseFloat(form.price).toLocaleString()} ${form.currency}`
              : <span style={{ opacity: 0.4, fontWeight: 500, fontSize: '0.8rem' }}>—</span>}
          </span>
          {form.duration && (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,107,157,0.1)', color: BRAND.pink }}>
              <Clock size={9} aria-hidden />{form.duration}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Formulaire de création / modification d'un service, en 3 étapes avec aperçu. */
export default function ServiceFormView({ state }: { state: ServiceFormState }) {
  const { lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const { surface, surfaceAlt, border, txtPrim, txtSub } = dashPalette(dk);
  const fr = lang === 'fr';
  const {
    step, canAdvance, nextStep, prevStep, closeForm, editingId, form, saving, handleSave, uploadingIdx,
    cropFile, setCropFile, handleCropConfirm,
  } = state;

  const steps: StepDef[] = [
    { id: 1, label: fr ? 'Infos' : 'Info', icon: Info },
    { id: 2, label: fr ? 'Médias' : 'Media', icon: ImageIcon },
    { id: 3, label: fr ? 'Tarifs' : 'Pricing', icon: DollarSign },
  ];

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={closeForm} aria-label={fr ? 'Retour à la liste des services' : 'Back to services'}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0"
            style={{ background: surfaceAlt, color: txtSub, border: `1px solid ${border}` }}>
            <ArrowLeft size={16} aria-hidden />
          </button>
          <div>
            <h2 className="font-black text-lg leading-tight" style={{ color: txtPrim }}>
              {editingId ? (fr ? 'Modifier le service' : 'Edit service') : (fr ? 'Créer un service' : 'Create a service')}
            </h2>
            <p className="text-xs" style={{ color: txtSub }}>{fr ? `Étape ${step} sur 3` : `Step ${step} of 3`}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || !form.name.trim() || uploadingIdx !== null}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition disabled:opacity-40"
          style={{ background: surfaceAlt, color: txtSub, border: `1px solid ${border}` }}>
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} aria-hidden />}
          {fr ? 'Sauvegarder' : 'Save draft'}
        </button>
      </div>

      <StepIndicator steps={steps} step={step} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        <div className="rounded-3xl p-5 md:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
          {step === 1 && <InfoStep state={state} />}
          {step === 2 && <MediaStep state={state} />}
          {step === 3 && <PricingStep state={state} />}
        </div>
        <div className="hidden lg:block"><LivePreview form={form} /></div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-5 gap-3">
        <button onClick={step === 1 ? closeForm : prevStep}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-2xl transition"
          style={{ background: surfaceAlt, color: txtSub, border: `1px solid ${border}` }}>
          <ArrowLeft size={14} aria-hidden />
          {step === 1 ? (fr ? 'Annuler' : 'Cancel') : steps[step - 2].label}
        </button>

        {step < 3 ? (
          <button onClick={nextStep} disabled={!canAdvance}
            className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition"
            style={{
              background: GRADIENTS.pinkViolet,
              boxShadow: canAdvance ? '0 8px 20px rgba(255,107,157,0.3)' : 'none',
              opacity: canAdvance ? 1 : 0.45,
            }}>
            {`${steps[step].label} →`}
            <ChevronRight size={14} aria-hidden />
          </button>
        ) : (
          <button onClick={handleSave} disabled={saving || !form.name.trim() || uploadingIdx !== null}
            className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-2xl transition disabled:opacity-45"
            style={{ background: GRADIENTS.pinkViolet, boxShadow: '0 8px 20px rgba(255,107,157,0.3)' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} aria-hidden />}
            {editingId ? (fr ? 'Enregistrer' : 'Save changes') : (fr ? 'Publier le service' : 'Publish service')}
          </button>
        )}
      </div>

      {cropFile && (
        <ImageCropModal file={cropFile} aspectRatio={4 / 3} onConfirm={handleCropConfirm} onCancel={() => setCropFile(null)} />
      )}
    </div>
  );
}
