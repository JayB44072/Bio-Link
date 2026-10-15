import { Briefcase, Clock, Edit2, Pause, Trash2 } from 'lucide-react';
import type { Service } from '../../../../lib/types';
import { BRAND, GRADIENTS, STATUS } from '../../../../lib/theme';
import { useServiceTheme } from './useServiceTheme';
import Switch from '../../../ui/Switch';

/** Visuel d'un service : sa photo, ou à défaut un dégradé de la marque avec l'initiale. */
export function ServiceThumb({ service, className = '', iconSize = 28 }: { service: Service; className?: string; iconSize?: number }) {
  const { dk } = useServiceTheme();
  const paused = !service.is_active;
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: dk ? 'rgba(139,124,255,0.1)' : '#f1eeff' }}>
      {service.image_url ? (
        <img src={service.image_url} alt="" loading="lazy" draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition duration-300"
          style={paused ? { filter: 'grayscale(0.85)', opacity: 0.7 } : undefined} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: GRADIENTS.soft, opacity: dk ? 0.18 : 1 }}>
          <Briefcase size={iconSize} aria-hidden style={{ color: BRAND.violet, opacity: 0.55 }} />
        </div>
      )}
      {service.images?.length > 1 && (
        <span className="absolute bottom-1.5 right-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'rgba(0,0,0,0.6)' }}>
          +{service.images.length - 1}
        </span>
      )}
    </div>
  );
}

/** Pastille de statut : point + texte (le statut ne repose jamais sur la couleur seule). */
export function StatusPill({ active, overlay = false }: { active: boolean; overlay?: boolean }) {
  const { fr, dk, txtSub, border } = useServiceTheme();
  const base = 'inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full';
  if (overlay) {
    // Sur une photo : fond opaque pour rester lisible quelle que soit l'image
    return (
      <span className={base} style={{ background: 'rgba(15,15,35,0.72)', color: '#fff', backdropFilter: 'blur(6px)' }}>
        {active ? <span className="w-2 h-2 rounded-full" style={{ background: STATUS.success }} /> : <Pause size={11} aria-hidden />}
        {active ? (fr ? 'Actif' : 'Active') : (fr ? 'En pause' : 'Paused')}
      </span>
    );
  }
  return (
    <span className={base} style={active
      ? { background: 'rgba(34,197,94,0.12)', color: dk ? STATUS.success : '#15803d' }
      : { background: dk ? 'rgba(139,124,255,0.1)' : '#f5f3ff', color: txtSub, border: `1px solid ${border}` }}>
      {active ? <span className="w-2 h-2 rounded-full" style={{ background: STATUS.success }} /> : <Pause size={11} aria-hidden />}
      {active ? (fr ? 'Actif' : 'Active') : (fr ? 'En pause' : 'Paused')}
    </span>
  );
}

export function DurationChip({ duration, overlay = false }: { duration: string; overlay?: boolean }) {
  const { dk } = useServiceTheme();
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
      style={overlay
        ? { background: 'rgba(255,255,255,0.9)', color: '#16162e' }
        : { background: dk ? 'rgba(0,194,255,0.1)' : '#e8f7ff', color: dk ? BRAND.cyan : '#0369a1' }}>
      <Clock size={12} aria-hidden />{duration}
    </span>
  );
}

interface ServiceControlsProps {
  service: Service;
  toggling: boolean;
  onToggle: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (id: string) => void;
}

/** Interrupteur actif/pause, bouton « Modifier » explicite et suppression (cibles tactiles de 40 px). */
export function ServiceControls({ service, toggling, onToggle, onEdit, onDelete }: ServiceControlsProps) {
  const { fr, dk, txtSub, txtPrim, border, hoverBg } = useServiceTheme();
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="inline-flex items-center gap-2 cursor-pointer select-none mr-auto">
        <Switch
          checked={service.is_active}
          busy={toggling}
          onChange={() => onToggle(service)}
          offColor={dk ? 'rgba(255,255,255,0.18)' : '#d4d4dc'}
          label={service.is_active
            ? (fr ? `Mettre ${service.name} en pause` : `Pause ${service.name}`)
            : (fr ? `Activer ${service.name}` : `Activate ${service.name}`)}
        />
        <span className="text-xs font-semibold" style={{ color: service.is_active ? txtPrim : txtSub }}>
          {service.is_active ? (fr ? 'Visible' : 'Visible') : (fr ? 'Masqué' : 'Hidden')}
        </span>
      </label>
      <button type="button" onClick={() => onEdit(service)}
        aria-label={fr ? `Modifier ${service.name}` : `Edit ${service.name}`}
        className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-bold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C63FF]"
        style={{ color: txtPrim, border: `1px solid ${border}`, background: 'transparent' }}
        onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
        <Edit2 size={14} aria-hidden />{fr ? 'Modifier' : 'Edit'}
      </button>
      <button type="button" onClick={() => onDelete(service.id)}
        aria-label={fr ? `Supprimer ${service.name}` : `Delete ${service.name}`}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B9D]"
        style={{ color: BRAND.pink, background: dk ? 'rgba(255,107,157,0.1)' : '#fff1f6' }}>
        <Trash2 size={16} aria-hidden />
      </button>
    </div>
  );
}
