import type { LucideIcon } from 'lucide-react';

interface Option<T extends string> {
  value: T;
  icon: LucideIcon;
  label: string;
}

interface ViewToggleProps<T extends string> {
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
  label: string;
  accent: string;
  palette: { surface: string; border: string; txtSub: string };
}

/** Choix du mode d'affichage (grille / liste) : boutons-icônes avec libellé accessible. */
export default function ViewToggle<T extends string>({ value, options, onChange, label, accent, palette }: ViewToggleProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex p-1 rounded-xl gap-0.5 shrink-0"
      style={{ background: palette.surface, border: `1px solid ${palette.border}` }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} aria-label={o.label} title={o.label}
            onClick={() => onChange(o.value)}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition focus-visible:outline-none focus-visible:ring-2"
            style={{ background: on ? `color-mix(in srgb, ${accent} 16%, transparent)` : 'transparent', color: on ? accent : palette.txtSub, ['--tw-ring-color' as string]: accent }}>
            <o.icon size={17} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
