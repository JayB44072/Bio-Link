import { Briefcase, CheckCircle2, PauseCircle } from 'lucide-react';
import { BRAND, STATUS } from '../../../../lib/theme';
import StatTile from '../../../ui/StatTile';
import { useServiceTheme } from './useServiceTheme';

interface ServicesSummaryProps {
  total: number;
  active: number;
  paused: number;
  /** Nombre maximal de services du forfait (null = illimité). */
  max: number | null;
}

/** Trois chiffres clés au-dessus de la liste : total (avec le quota du forfait), actifs, en pause. */
export default function ServicesSummary({ total, active, paused, max }: ServicesSummaryProps) {
  const { fr, dk, surface, border, txtPrim, txtSub, cardShadow } = useServiceTheme();
  const palette = { surface, border, txtPrim, txtSub, shadow: cardShadow };
  const full = !!max && total >= max;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
      <StatTile icon={Briefcase} tone={BRAND.violet} palette={palette}
        label={max ? (fr ? 'Services (quota du forfait)' : 'Services (plan quota)') : 'Services'}
        value={max ? `${total}/${max}` : total}
        footer={max ? (
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: dk ? 'rgba(139,124,255,0.15)' : '#ede9ff' }}
            role="progressbar" aria-label={fr ? 'Quota de services' : 'Services quota'} aria-valuemin={0} aria-valuemax={max} aria-valuenow={total}>
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((total / max) * 100, 100)}%`, background: full ? STATUS.danger : `linear-gradient(90deg,${BRAND.pink},${BRAND.violet})` }} />
          </div>
        ) : undefined} />
      <StatTile icon={CheckCircle2} tone={STATUS.success} palette={palette} label={fr ? 'Visibles sur votre page' : 'Visible on your page'} value={active} />
      <StatTile icon={PauseCircle} tone={STATUS.warning} palette={palette} label={fr ? 'En pause (masqués)' : 'Paused (hidden)'} value={paused} />
    </div>
  );
}
