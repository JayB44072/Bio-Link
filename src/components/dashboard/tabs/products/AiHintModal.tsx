import { Sparkles, Upload } from 'lucide-react';
import { dashPalette } from '../../../../lib/dashPalette';
import { useLang } from '../../../../lib/LanguageContext';
import { useAppPrefs } from '../../../../lib/AppPrefsContext';
import Modal from '../../../ui/Modal';
import Field from '../../../ui/Field';
import type { ProductFormState } from './useProductForm';

const AI_GRADIENT = 'linear-gradient(135deg,#8B5CF6,#EC4899)';

type Props = Pick<ProductFormState, 'aiHint' | 'setAiHint' | 'aiImageInputRef' | 'pendingAiFileRef' | 'handleAiFilePick' | 'handleAiHintSubmit' | 'cancelAiHint'>;

/** Fenêtre « Décrivez votre produit » : image et/ou indice avant la génération par IA. */
export default function AiHintModal({ aiHint, setAiHint, aiImageInputRef, pendingAiFileRef, handleAiFilePick, handleAiHintSubmit, cancelAiHint }: Props) {
  const { t, lang } = useLang();
  const { isDark: dk } = useAppPrefs();
  const { surface, surfaceAlt, txtPrim, txtLabel, txtSub, inputBg, inputBorder } = dashPalette(dk);
  const fr = lang === 'fr';
  const inputCls = 'w-full rounded-xl px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-brand-violet/25';
  const picked = pendingAiFileRef.current;

  return (
    <Modal onClose={cancelAiHint} labelledBy="ai-hint-title">
      <div className="w-full max-w-md rounded-3xl shadow-2xl p-6" style={{ background: surface }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: AI_GRADIENT }}>
            <Sparkles size={18} aria-hidden className="text-white" />
          </div>
          <div>
            <h3 id="ai-hint-title" className="font-bold" style={{ color: txtPrim }}>
              {fr ? 'Décrivez votre produit' : 'Describe your product'}
            </h3>
            <p className="text-xs" style={{ color: txtSub }}>
              {fr ? 'Une image OU un court indice suffit.' : 'An image OR a short hint is enough.'}
            </p>
          </div>
        </div>

        <input type="file" accept="image/*" ref={aiImageInputRef} onChange={handleAiFilePick} className="hidden"
          aria-label={fr ? 'Image du produit' : 'Product image'} />

        <button type="button" onClick={() => aiImageInputRef.current?.click()}
          className="w-full rounded-xl h-16 flex items-center justify-center gap-2 mb-3 transition"
          style={{ background: surfaceAlt, border: `2px dashed ${inputBorder}`, color: '#8B5CF6' }}>
          <Upload size={16} aria-hidden />
          <span className="text-xs font-semibold">
            {picked
              ? (fr ? `Image sélectionnée : ${picked.name}` : `Selected: ${picked.name}`)
              : (fr ? 'Ajouter une image (optionnel)' : 'Add an image (optional)')}
          </span>
        </button>

        <Field label={fr ? 'Indice (optionnel)' : 'Hint (optional)'} labelStyle={{ color: txtLabel }}>
          {({ id }) => (
            <textarea id={id} value={aiHint} onChange={e => setAiHint(e.target.value)} rows={3}
              placeholder={fr ? 'ex: sac à main en cuir noir pour femme' : 'e.g. black leather handbag for women'}
              className={`${inputCls} resize-none`}
              style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: txtPrim }} />
          )}
        </Field>

        <div className="flex gap-3 mt-5">
          <button onClick={cancelAiHint}
            className="flex-1 text-sm font-semibold py-2.5 rounded-xl transition"
            style={{ background: surfaceAlt, color: txtSub }}>
            {t.cancel}
          </button>
          <button onClick={handleAiHintSubmit}
            className="flex-1 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
            style={{ background: AI_GRADIENT }}>
            <Sparkles size={14} aria-hidden />
            {fr ? 'Générer' : 'Generate'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
