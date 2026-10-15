import type { Service } from '../../../../lib/types';
import { BRAND } from '../../../../lib/theme';
import { DurationChip, ServiceControls, ServiceThumb, StatusPill } from './serviceParts';
import { useServiceTheme } from './useServiceTheme';

interface ServiceRowProps {
  service: Service;
  toggling: boolean;
  onToggle: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

/** Ligne d'un service (vue liste) : vignette, infos principales, prix et actions. */
export default function ServiceRow({ service, toggling, onToggle, onEdit, onDelete }: ServiceRowProps) {
  const { surface, border, txtPrim, txtSub, cardShadow } = useServiceTheme();
  const paused = !service.is_active;

  return (
    <article className="rounded-2xl p-3 sm:p-3.5 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4 transition-shadow hover:shadow-md"
      style={{ background: surface, border: `1px solid ${border}`, boxShadow: cardShadow }}>
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <ServiceThumb service={service} className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl shrink-0" iconSize={22} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <StatusPill active={service.is_active} />
            {service.duration && <DurationChip duration={service.duration} />}
          </div>
          <h3 className="font-bold text-[15px] leading-snug truncate" style={{ color: paused ? txtSub : txtPrim }} title={service.name}>{service.name}</h3>
          <p className="text-[13px] truncate" style={{ color: txtSub }}>{service.description}</p>
        </div>
        <p className="shrink-0 text-right leading-tight">
          <span className="block text-lg font-black tabular-nums" style={{ color: paused ? txtSub : BRAND.violet }}>{service.price.toLocaleString()}</span>
          <span className="block text-xs font-bold" style={{ color: txtSub }}>{service.currency}</span>
        </p>
      </div>
      <div className="lg:w-[330px] shrink-0 lg:pl-4 lg:border-l pt-2.5 lg:pt-0 border-t lg:border-t-0" style={{ borderColor: border }}>
        <ServiceControls service={service} toggling={toggling} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </article>
  );
}
