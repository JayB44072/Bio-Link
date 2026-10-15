import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  /** Couleur d'accent de l'icône. */
  tone: string;
  /** Contenu complémentaire sous la valeur (barre de progression, détail…). */
  footer?: ReactNode;
  palette: { surface: string; border: string; txtPrim: string; txtSub: string; shadow?: string };
}

/** Tuile de chiffre clé : icône teintée, valeur lisible, libellé. */
export default function StatTile({ icon: Icon, label, value, tone, footer, palette }: StatTileProps) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3.5 min-w-0"
      style={{ background: palette.surface, border: `1px solid ${palette.border}`, boxShadow: palette.shadow }}>
      <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)` }}>
        <Icon size={20} aria-hidden style={{ color: tone }} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-black leading-none tabular-nums" style={{ color: palette.txtPrim }}>{value}</p>
        <p className="text-xs font-semibold mt-1 truncate" style={{ color: palette.txtSub }}>{label}</p>
        {footer}
      </div>
    </div>
  );
}
