import React, { useEffect, useRef, useState } from 'react';
import { Check, Globe } from 'lucide-react';
import type { LandingLang } from '../../lib/landingTranslations';
import { LANG_OPTIONS, type LangOption } from '../../lib/languages';

interface LanguageMenuProps {
  value: LandingLang;
  onChange: (lang: LandingLang) => void;
  options?: LangOption[];
  /** Style du bouton déclencheur (chaque écran garde son apparence). */
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  iconSize?: number;
  /** Style du panneau déroulant. */
  menuClassName?: string;
  menuStyle?: React.CSSProperties;
  /** Style d'une entrée ; `active` vaut true pour la langue courante. */
  itemClassName?: string;
  itemStyle?: (active: boolean) => React.CSSProperties;
  checkSize?: number;
  checkClassName?: string;
  checkStyle?: React.CSSProperties;
  className?: string;
}

/**
 * Sélecteur de langue partagé : gère l'ouverture, la fermeture au clic
 * extérieur / touche Échap et l'accessibilité. L'apparence est fournie par
 * l'écran appelant via les props de style.
 */
export default function LanguageMenu({
  value, onChange, options = LANG_OPTIONS,
  buttonClassName = '', buttonStyle, iconSize = 14,
  menuClassName = 'absolute right-0 top-full mt-2 rounded-xl shadow-xl border py-1 min-w-[144px] z-50',
  menuStyle,
  itemClassName = 'w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors',
  itemStyle, checkSize = 12, checkClassName = 'ml-auto', checkStyle, className = '',
}: LanguageMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => setOpen(v => !v)}
        aria-expanded={open} aria-label={`Language: ${value.toUpperCase()}`}
        className={buttonClassName} style={buttonStyle}>
        <Globe size={iconSize} aria-hidden />{value.toUpperCase()}
      </button>
      {open && (
        <div className={menuClassName} style={menuStyle}>
          {options.map(({ code, label }) => (
            <button key={code} type="button"
              onClick={() => { onChange(code); setOpen(false); }}
              aria-current={value === code}
              className={itemClassName} style={itemStyle?.(value === code)}>
              {label}
              {value === code && <Check size={checkSize} aria-hidden className={checkClassName} style={checkStyle} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
