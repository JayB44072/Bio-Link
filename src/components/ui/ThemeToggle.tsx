import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  /** Libellé accessible, ex. t.darkOn / t.darkOff. */
  label?: string;
  iconSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Bouton clair / sombre partagé (l'apparence vient de l'écran appelant). */
export default function ThemeToggle({
  isDark, onToggle, label, iconSize = 16, className = '', style,
}: ThemeToggleProps) {
  return (
    <button type="button" onClick={onToggle} aria-label={label ?? (isDark ? 'Light mode' : 'Dark mode')}
      title={label} className={className} style={style}>
      {isDark ? <Sun size={iconSize} aria-hidden /> : <Moon size={iconSize} aria-hidden />}
    </button>
  );
}
