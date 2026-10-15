interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
  label: string;
  /** Couleurs du contexte (tableau de bord) */
  accent: string;
  txtPrim: string;
  txtSub: string;
  border: string;
  surface: string;
}

/** Choix exclusif entre quelques options, présenté en boutons côte à côte (radiogroup accessible). */
export default function Segmented<T extends string>({ value, options, onChange, label, accent, txtPrim, txtSub, border, surface }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className="text-left rounded-xl px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2"
            style={{ background: surface, border: `2px solid ${on ? accent : border}`, ['--tw-ring-color' as string]: accent }}
          >
            <span className="block text-xs font-bold" style={{ color: on ? accent : txtPrim }}>{o.label}</span>
            {o.hint && <span className="block text-[11px] mt-0.5 leading-snug" style={{ color: txtSub }}>{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
