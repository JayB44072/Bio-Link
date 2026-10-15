import { MagnifyingGlass, X } from '@phosphor-icons/react';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Libellé lu par les lecteurs d'écran. */
  label: string;
  clearLabel: string;
  /** Couleurs de l'écran qui l'utilise (voir dashPalette). */
  palette: { surfaceAlt: string; border: string; txtPrim: string; txtSub: string };
  className?: string;
}

/** Champ de recherche du tableau de bord : filtre à chaque lettre tapée (aucun bouton « valider »). */
export default function SearchField({ value, onChange, placeholder, label, clearLabel, palette, className = '' }: SearchFieldProps) {
  return (
    <div role="search" className={`relative ${className}`}>
      <MagnifyingGlass size={16} weight="light" aria-hidden className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: palette.txtSub }} />
      <input type="search" value={value} onChange={e => onChange(e.target.value)} aria-label={label} placeholder={placeholder}
        autoComplete="off" spellCheck={false}
        className="w-full h-11 pl-10 pr-10 rounded-full text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-violet/30 [&::-webkit-search-cancel-button]:hidden"
        style={{ background: palette.surfaceAlt, border: `1px solid ${palette.border}`, color: palette.txtPrim }} />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label={clearLabel}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet"
          style={{ color: palette.txtSub }}>
          <X size={14} weight="light" aria-hidden />
        </button>
      )}
    </div>
  );
}
