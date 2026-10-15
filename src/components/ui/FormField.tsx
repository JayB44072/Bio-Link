import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/** Couleurs d'un champ de formulaire (clair / sombre). */
export interface FieldPalette {
  label: string;
  helper: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  toggle: string;
}

interface BaseProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'style' | 'onChange'> {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  palette: FieldPalette;
  helper?: string;
  /** Libellé affiché à droite du label (ex. « Mot de passe oublié ? »). */
  labelAction?: React.ReactNode;
  /** Texte placé à gauche dans le champ (ex. « @ »). */
  prefix?: string;
  invalid?: boolean;
  describedBy?: string;
  className?: string;
}

const INPUT_CLS =
  'w-full rounded-xl px-4 py-3 text-sm transition-all border focus:outline-none focus:ring-2 focus:ring-brand-violet/25 focus:border-brand-violet';

export function TextField({
  id, label, value, onChange, palette, helper, labelAction, prefix, invalid, describedBy, className = '', ...input
}: BaseProps) {
  const helpId = helper ? `${id}-help` : undefined;
  const described = [describedBy, helpId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium" style={{ color: palette.label }}>{label}</label>
        {labelAction}
      </div>
      <div className="relative">
        {prefix && (
          <span aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: palette.helper }}>
            {prefix}
          </span>
        )}
        <input id={id} value={value} onChange={e => onChange(e.target.value)}
          aria-invalid={invalid || undefined} aria-describedby={described}
          className={`${INPUT_CLS} ${prefix ? 'pl-8' : ''}`}
          style={{ background: palette.inputBg, borderColor: palette.inputBorder, color: palette.inputText }}
          {...input} />
      </div>
      {helper && <p id={helpId} className="text-xs mt-1.5" style={{ color: palette.helper }}>{helper}</p>}
    </div>
  );
}

interface PasswordFieldProps extends Omit<BaseProps, 'type' | 'prefix'> {
  showLabel: string;
  hideLabel: string;
  /** Contenu sous le champ (ex. barre de force). */
  footer?: React.ReactNode;
}

export function PasswordField({ showLabel, hideLabel, footer, helper, id, label, value, onChange, palette, labelAction, invalid, describedBy, className = '', ...input }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium" style={{ color: palette.label }}>{label}</label>
        {labelAction}
      </div>
      <div className="relative">
        <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, helper ? `${id}-help` : undefined].filter(Boolean).join(' ') || undefined}
          className={`${INPUT_CLS} pr-11`}
          style={{ background: palette.inputBg, borderColor: palette.inputBorder, color: palette.inputText }}
          {...input} />
        <button type="button" onClick={() => setVisible(v => !v)}
          aria-label={visible ? hideLabel : showLabel} aria-pressed={visible}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 inline-flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
          style={{ color: palette.toggle }}>
          {visible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {helper && <p id={`${id}-help`} className="text-xs mt-1.5" style={{ color: palette.helper }}>{helper}</p>}
      {footer}
    </div>
  );
}

/** Barre de force du mot de passe (purement visuelle). */
export function StrengthBar({ length, emptyColor }: { length: number; emptyColor: string }) {
  if (length === 0) return null;
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
  return (
    <div className="mt-2 flex gap-1" aria-hidden>
      {[4, 6, 8, 10].map((threshold, i) => (
        <div key={threshold} className="h-1 flex-1 rounded-full transition-all duration-300"
          style={{ background: length >= threshold ? colors[i] : emptyColor }} />
      ))}
    </div>
  );
}
