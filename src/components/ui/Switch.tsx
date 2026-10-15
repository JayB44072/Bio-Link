import { Loader2 } from 'lucide-react';
import { STATUS } from '../../lib/theme';

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  /** Nom accessible (lu par les lecteurs d'écran). */
  label: string;
  busy?: boolean;
  disabled?: boolean;
  /** Couleur de la piste quand l'interrupteur est actif. */
  onColor?: string;
  /** Couleur de la piste quand il est inactif. */
  offColor: string;
}

/** Interrupteur accessible (role="switch") ; zone tactile élargie à 44 px. */
export default function Switch({ checked, onChange, label, busy = false, disabled = false, onColor = STATUS.success, offColor }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={busy}
      disabled={disabled || busy}
      onClick={onChange}
      className="relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-60 after:absolute after:-inset-2 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ background: checked ? onColor : offColor, ['--tw-ring-color' as string]: onColor }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center transition-all duration-200"
        style={{ left: checked ? 22 : 2 }}
      >
        {busy && <Loader2 size={11} className="animate-spin" style={{ color: onColor }} aria-hidden />}
      </span>
    </button>
  );
}
