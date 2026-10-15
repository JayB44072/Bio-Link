import React from 'react';
import { Check, Loader2, Pencil, Save, X } from 'lucide-react';
import { BRAND, GRADIENTS } from '../../../../lib/theme';
import type { BioLinkState, SectionKey } from './useBioLinkForm';
import { useBioTheme } from './bioTheme';

/** Boutons « Modifier » / « Annuler » + « Enregistrer » d'une section. */
export function SectionActions({ state, section }: { state: BioLinkState; section: SectionKey }) {
  const { fr, fieldBg, txtSub, btnEdit } = useBioTheme();
  const { editing, secSaving, secSaved, startEdit, cancelEdit, saveSection } = state;

  if (!editing[section]) {
    return (
      <button onClick={() => startEdit(section)}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl shrink-0"
        style={{ background: btnEdit, color: BRAND.violet }}>
        <Pencil size={12} aria-hidden />
        {fr ? 'Modifier' : 'Edit'}
      </button>
    );
  }
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={() => cancelEdit(section)}
        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-xl"
        style={{ background: fieldBg, color: txtSub }}>
        <X size={12} aria-hidden />
        {fr ? 'Annuler' : 'Cancel'}
      </button>
      <button onClick={() => saveSection(section)} disabled={secSaving[section]}
        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white disabled:opacity-50"
        style={{ background: GRADIENTS.brand }}>
        {secSaving[section]
          ? <Loader2 size={11} className="animate-spin" />
          : secSaved[section] ? <Check size={11} aria-hidden /> : <Save size={11} aria-hidden />}
        {secSaving[section]
          ? (fr ? 'Enregistrement…' : 'Saving…')
          : secSaved[section] ? (fr ? 'Enregistré !' : 'Saved!') : (fr ? 'Enregistrer' : 'Save')}
      </button>
    </div>
  );
}

/** En-tête d'une section : pastille d'icône, titre et actions. */
export function SectionHeader({ state, icon, label, section, iconBg, iconColor }: {
  state: BioLinkState; icon: React.ReactNode; label: string; section: SectionKey; iconBg: string; iconColor: string;
}) {
  const { txtPrim } = useBioTheme();
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2.5">
        <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>
          {React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties; 'aria-hidden'?: boolean }>, { style: { color: iconColor }, 'aria-hidden': true })}
        </span>
        <h2 className="font-black text-base leading-tight" style={{ color: txtPrim }}>{label}</h2>
      </div>
      <SectionActions state={state} section={section} />
    </div>
  );
}

/** Valeur en lecture seule. */
export function FieldView({ label, value }: { label: string; value?: string | null }) {
  const { fr, fieldBg, txtSub, txtPrim } = useBioTheme();
  return (
    <div className="px-3 py-2.5 rounded-xl" style={{ background: fieldBg }}>
      <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: txtSub }}>{label}</p>
      <p className="text-sm" style={{ color: value ? txtPrim : txtSub }}>
        {value || (fr ? 'Non renseigné' : 'Not set')}
      </p>
    </div>
  );
}

/** Pastille « actif / inactif ». */
export function ToggleView({ active, labelOn, labelOff }: { active: boolean; labelOn: string; labelOff: string }) {
  const { dk, txtSub } = useBioTheme();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
      style={{ background: active ? 'rgba(34,197,94,0.12)' : (dk ? 'rgba(255,255,255,0.06)' : '#f3f4f6'), color: active ? '#16a34a' : txtSub }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? '#16a34a' : txtSub }} />
      {active ? labelOn : labelOff}
    </span>
  );
}

/** Interrupteur accessible (rôle « switch »). */
export function Switch({ checked, onChange, color, disabled, label }: {
  checked: boolean; onChange: () => void; color: string; disabled?: boolean; label?: string;
}) {
  const { dk } = useBioTheme();
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange}
      className="relative shrink-0 w-11 h-6 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: checked ? color : (dk ? 'rgba(255,255,255,0.14)' : '#e5e7eb') }}>
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: checked ? '22px' : '2px' }} />
    </button>
  );
}
